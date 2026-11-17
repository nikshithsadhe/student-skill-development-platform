import React, { useState, useEffect } from 'react';
import {
  Mic,
  Clock,
  Award,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Send,
  Eye,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

export default function MockInterview() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // STAR state inputs
  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');
  const [fullResponse, setFullResponse] = useState('');
  const [selfEval, setSelfEval] = useState([]);

  useEffect(() => {
    fetchQuestions();
  }, [selectedCategory]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      const res = await api.get('/interviews/questions', { params });
      if (res.data?.success) {
        setQuestions(res.data.data);
        if (res.data.data.length > 0) {
          setActiveQuestion(res.data.data[0]);
          resetForm();
        }
      }
    } catch (err) {
      console.error('Failed to load interview questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSituation('');
    setTask('');
    setAction('');
    setResult('');
    setFullResponse('');
    setSelfEval([]);
    setShowModelAnswer(false);
  };

  const toggleSelfEval = (item) => {
    setSelfEval((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async () => {
    const combined = fullResponse.trim() ||
      `SITUATION: ${situation}\nTASK: ${task}\nACTION: ${action}\nRESULT: ${result}`;

    if (combined.length < 20) {
      toast.error('Please draft a complete behavioral answer of at least 20 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/interviews/submissions', {
        question_id: activeQuestion.id,
        response_text: combined,
        situation,
        task,
        action,
        result,
        self_eval_checked: selfEval,
      });

      if (res.data?.success) {
        toast.success('Interview rehearsal recorded! +20 points earned.');
        setShowModelAnswer(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit interview response');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Interview Themes' },
    { id: 'Behavioral', label: 'Behavioral' },
    { id: 'Conflict Resolution', label: 'Conflict Resolution' },
    { id: 'Leadership', label: 'Leadership & Teamwork' },
    { id: 'Campus Placement', label: 'Campus Placement' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Mock Interview Practice Lab</h1>
        <p className="text-sm text-text-muted mt-1">
          Master behavioral job interviews with structured STAR method responses (Situation, Task, Action, Result).
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === cat.id
                ? 'bg-primary border-primary text-white shadow-md'
                : 'bg-surface border-border text-text-muted hover:text-text hover:bg-surface-light'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" label="Loading interview questions..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question List Sidebar */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Practice Question Bank ({questions.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {questions.map((q) => {
                const isSelected = activeQuestion?.id === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setActiveQuestion(q);
                      resetForm();
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-text-heading shadow-md'
                        : 'bg-surface border-border text-text-muted hover:bg-surface-light hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-semibold text-primary-light capitalize">
                        {q.category}
                      </span>
                      <span className="text-[10px] text-text-dim">{q.difficulty}</span>
                    </div>
                    <p className="line-clamp-2 leading-relaxed font-medium">{q.question}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Rehearsal Area */}
          <div className="lg:col-span-2 space-y-6">
            {activeQuestion ? (
              <Card className="p-6 sm:p-8 space-y-6">
                {/* Active Question Box */}
                <div className="space-y-2 border-b border-border pb-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="purple" size="sm">
                      {activeQuestion.category} Question
                    </Badge>
                    <span className="text-xs text-accent-amber font-mono font-bold">
                      +20 pts reward
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-text-heading">
                    "{activeQuestion.question}"
                  </h2>
                  <p className="text-xs text-text-muted">
                    {activeQuestion.guidance_tip ||
                      'Interviewers look for evidence of self-awareness, active listening, and measurable positive outcomes.'}
                  </p>
                </div>

                {/* STAR Structured Inputs */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-text-heading flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary-light" />
                      STAR Method Framework
                    </h3>
                    <span className="text-xs text-text-dim">Structure each quadrant</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">
                        Situation (What was the context?)
                      </label>
                      <textarea
                        rows={2}
                        value={situation}
                        onChange={(e) => setSituation(e.target.value)}
                        placeholder="During my junior year group presentation project..."
                        className="w-full bg-surface-light border border-border rounded-xl p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">
                        Task (What was your specific goal/role?)
                      </label>
                      <textarea
                        rows={2}
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        placeholder="I was tasked with resolving differing opinions on our slide deck..."
                        className="w-full bg-surface-light border border-border rounded-xl p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">
                        Action (What concrete steps did you take?)
                      </label>
                      <textarea
                        rows={3}
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        placeholder="I initiated an active listening session, validated both viewpoints, and proposed a compromise..."
                        className="w-full bg-surface-light border border-border rounded-xl p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">
                        Result (What was the positive measurable outcome?)
                      </label>
                      <textarea
                        rows={3}
                        value={result}
                        onChange={(e) => setResult(e.target.value)}
                        placeholder="Our team submitted on time, received an 'A' grade, and teammates praised the collaborative tone..."
                        className="w-full bg-surface-light border border-border rounded-xl p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Self-Evaluation Checklist */}
                <div className="p-4 rounded-2xl bg-surface-light border border-border space-y-2">
                  <h4 className="text-xs font-bold text-text-heading">Behavioral Self-Evaluation:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      'Used "I" instead of vague "We"',
                      'Kept delivery concise & under 2 minutes',
                      'Quantified outcome or learning',
                      'Maintained constructive and positive tone',
                    ].map((crit) => (
                      <label
                        key={crit}
                        onClick={() => toggleSelfEval(crit)}
                        className="flex items-center gap-2 cursor-pointer select-none text-text-muted hover:text-text"
                      >
                        <input
                          type="checkbox"
                          checked={selfEval.includes(crit)}
                          readOnly
                          className="rounded text-primary focus:ring-0 bg-surface border-border"
                        />
                        <span>{crit}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                    className="text-xs font-semibold text-primary-light hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showModelAnswer ? 'Hide Model Answer' : 'Peek Model STAR Answer'}</span>
                  </button>

                  <Button
                    variant="primary"
                    isLoading={submitting}
                    onClick={handleSubmit}
                    icon={Send}
                  >
                    Record Rehearsal (+20 Pts)
                  </Button>
                </div>

                {/* Model STAR Answer Accordion */}
                {showModelAnswer && activeQuestion.model_answer && (
                  <div className="p-4 rounded-2xl bg-accent-blue/10 border border-accent-blue/30 space-y-2 text-xs">
                    <span className="font-bold text-accent-blue flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Exemplary Model STAR Response:
                    </span>
                    <p className="text-text leading-relaxed whitespace-pre-line">
                      {activeQuestion.model_answer}
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-12 text-center text-text-muted">
                Select an interview question to start practicing.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
