import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

export default function AssessmentTake() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60);

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAnswers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const fetchAssessment = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assessments/${id}`);
      if (res.data?.success) {
        setAssessment(res.data.data);
        if (res.data.data.duration_minutes) {
          setTimeLeft(res.data.data.duration_minutes * 60);
        }
      }
    } catch (err) {
      toast.error('Failed to load assessment questions');
      navigate('/student/assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionIdx, optionIdx) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }));
  };

  const handleSubmitAnswers = async () => {
    if (submitting) return;

    const questions = assessment?.questions || [];
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount < questions.length) {
      const confirmIncomplete = window.confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to submit?`
      );
      if (!confirmIncomplete) return;
    }

    setSubmitting(true);
    try {
      // Build answers payload matching AssessmentSubmissionRequest
      const answersPayload = questions.map((_, idx) => ({
        question_index: idx,
        selected_option_index: selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1,
      }));

      // Unique idempotency key to prevent double-charging or duplicate submissions
      const idempotencyKey = `asm_${id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await api.post(`/assessments/${id}/attempts`, {
        answers: answersPayload,
        idempotency_key: idempotencyKey,
      });

      if (res.data?.success) {
        toast.success('Assessment evaluated successfully!');
        navigate(`/student/assessments/${id}/results`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Preparing assessment environment..." />
      </div>
    );
  }

  const questions = assessment?.questions || [];
  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar with Timer and Progress */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
        <div>
          <span className="text-xs text-text-dim block">{assessment?.title}</span>
          <span className="text-sm font-bold text-text-heading">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="fixed top-20 right-4 sm:right-6 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-light border border-border font-mono text-sm text-text-heading shadow-lg shadow-black/10">
          <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-accent-rose animate-pulse' : 'text-primary-light'}`} />
          <span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-lighter h-2 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      {currentQ && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <span className="px-2.5 py-1 rounded-md bg-primary/15 text-primary-light text-xs font-semibold uppercase tracking-wider">
              {currentQ.category_slug ? currentQ.category_slug.replace('-', ' ') : 'Soft-Skill Scenario'}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-text-heading leading-snug">
              {currentQ.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {(currentQ.options || []).map((optionText, optIdx) => {
              const isSelected = selectedAnswers[currentIndex] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentIndex, optIdx)}
                  className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-text-heading shadow-md'
                      : 'bg-surface-light border-border text-text-muted hover:border-text-dim hover:text-text'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border text-xs font-bold ${
                      isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-border text-text-dim'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="leading-relaxed">{optionText}</span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Bottom Navigation & Submission */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="secondary"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((c) => c - 1)}
          icon={ArrowLeft}
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {currentIndex < questions.length - 1 ? (
            <Button
              variant="primary"
              onClick={() => setCurrentIndex((c) => c + 1)}
            >
              Next Question
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              isLoading={submitting}
              onClick={handleSubmitAnswers}
              icon={Send}
            >
              Submit & Score Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Question Grid Navigator */}
      <Card className="p-4">
        <h4 className="text-xs font-semibold text-text-muted mb-3">Jump to Question:</h4>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, idx) => {
            const isAnswered = selectedAnswers[idx] !== undefined;
            const isCurrent = currentIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                  isCurrent
                    ? 'ring-2 ring-primary border-primary bg-primary text-white'
                    : isAnswered
                    ? 'bg-accent-emerald/20 border-accent-emerald/40 text-accent-emerald'
                    : 'bg-surface-light border-border text-text-dim hover:bg-surface-lighter'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
