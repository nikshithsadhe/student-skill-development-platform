import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Paperclip,
  Send,
  Eye,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';

export default function SubmissionsReview() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Review modal state
  const [activeSub, setActiveSub] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [decision, setDecision] = useState('reviewed');
  const [rubricScores, setRubricScores] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.submission_status = filter;
      const res = await api.get('/activities/submissions/queue', { params });
      if (res.data?.success) {
        setSubmissions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load submissions queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (sub) => {
    setActiveSub(sub);
    setFeedback(sub.faculty_feedback || '');
    setDecision('reviewed');

    // Default rubric criteria if not defined
    const defaultRubric = sub.rubric_scores?.length
      ? sub.rubric_scores
      : [
          { criterion: 'Communication Clarity', score: 20, max_points: 25 },
          { criterion: 'Behavioral Maturity', score: 20, max_points: 25 },
          { criterion: 'Empathy & Active Listening', score: 20, max_points: 25 },
          { criterion: 'Actionable Problem Solving', score: 20, max_points: 25 },
        ];
    setRubricScores(defaultRubric);
  };

  const handleScoreChange = (index, value) => {
    const val = Number(value);
    setRubricScores((prev) =>
      prev.map((r, i) => (i === index ? { ...r, score: val } : r))
    );
  };

  const handleSubmitReview = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter constructive feedback for the student.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.patch(`/activities/submissions/${activeSub.id}/review`, {
        status: decision,
        feedback: feedback.trim(),
        rubric_scores: rubricScores,
      });

      if (res.data?.success) {
        toast.success('Submission evaluation saved successfully!');
        setActiveSub(null);
        fetchQueue();
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const totalCalculated = rubricScores.reduce((sum, r) => sum + (r.score || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Submissions Evaluation Queue</h1>
          <p className="text-sm text-text-muted mt-1">
            Grade practical soft-skill roleplay responses using standardized collegiate rubrics.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {['all', 'submitted', 'under_review', 'reviewed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all border ${
                filter === st
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-surface border-border text-text-muted hover:text-text'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Queue List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" label="Loading submissions queue..." />
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs">
            No submissions in this status category.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {submissions.map((sub) => {
              const isReviewed = sub.status === 'reviewed';

              return (
                <div
                  key={sub.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-light/40 transition-colors"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-text-heading">
                        {sub.student_name || 'Scholar'}
                      </span>
                      <Badge
                        variant={
                          isReviewed ? 'emerald' : sub.status === 'revision_required' ? 'amber' : 'blue'
                        }
                        size="sm"
                      >
                        {sub.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-semibold text-primary-light">
                      {sub.activity_title}
                    </h4>

                    <p className="text-xs text-text-muted line-clamp-1">
                      "{sub.text_response}"
                    </p>

                    <span className="text-[10px] text-text-dim block">
                      Submitted on {new Date(sub.updated_at || sub.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isReviewed && (
                      <span className="font-mono font-bold text-accent-emerald text-xs">
                        Scored {sub.total_score} pts
                      </span>
                    )}

                    <Button
                      variant={isReviewed ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleOpenReview(sub)}
                    >
                      {isReviewed ? 'Modify Grade' : 'Grade & Evaluate'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Grading Modal */}
      {activeSub && (
        <Modal
          isOpen={Boolean(activeSub)}
          onClose={() => setActiveSub(null)}
          title={`Evaluate: ${activeSub.activity_title}`}
          size="lg"
        >
          <div className="space-y-6 text-xs">
            {/* Student Info & Submission Text */}
            <div className="p-4 rounded-2xl bg-surface-light border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-heading">Student: {activeSub.student_name}</span>
                <span className="text-text-dim font-mono">{activeSub.student_id}</span>
              </div>
              <p className="text-text whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto pr-2">
                {activeSub.text_response || 'No written response provided.'}
              </p>
              {activeSub.attachment_url && (
                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-primary-light" />
                  <a
                    href={activeSub.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-light underline font-medium"
                  >
                    Open Student File Attachment
                  </a>
                </div>
              )}
            </div>

            {/* Rubric Evaluation Sliders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-text-heading">Rubric Criteria Scores</h4>
                <Badge variant="purple" size="sm">
                  Total: {totalCalculated} / 100 Points
                </Badge>
              </div>

              <div className="space-y-3">
                {rubricScores.map((r, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-surface border border-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-heading">{r.criterion}</span>
                      <span className="font-mono font-bold text-primary-light">
                        {r.score} / {r.max_points}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={r.max_points}
                      value={r.score}
                      onChange={(e) => handleScoreChange(idx, e.target.value)}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Constructive Qualitative Feedback */}
            <div className="space-y-1.5">
              <label className="font-bold text-text-heading">Constructive Feedback to Student</label>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Explain the student's behavioral strengths and concrete areas for improvement..."
                className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Decision Status */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-text-muted hover:text-text">
                <input
                  type="radio"
                  name="decision"
                  checked={decision === 'reviewed'}
                  onChange={() => setDecision('reviewed')}
                  className="text-primary"
                />
                <span>Approve & Finalize Grade</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-text-muted hover:text-text">
                <input
                  type="radio"
                  name="decision"
                  checked={decision === 'revision_required'}
                  onChange={() => setDecision('revision_required')}
                  className="text-primary"
                />
                <span>Request Revision from Student</span>
              </label>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setActiveSub(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={submittingReview}
                onClick={handleSubmitReview}
                icon={Send}
              >
                Submit Evaluation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
