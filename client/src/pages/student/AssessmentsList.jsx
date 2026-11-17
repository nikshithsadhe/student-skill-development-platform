import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Play,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

export default function AssessmentsList() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assessments');
      if (res.data?.success) {
        setAssessments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Skill Assessments & Diagnostics</h1>
        <p className="text-sm text-text-muted mt-1">
          Objective behavioral situational tests designed to evaluate soft-skill competencies.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" label="Loading assessments..." />
        </div>
      ) : assessments.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No assessments published yet"
          description="Assessments will appear here once faculty or administrators release them."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((asm) => {
            const hasAttempt = Boolean(asm.latest_attempt);
            const score = asm.latest_attempt?.score;
            const isDiagnostic = asm.type === 'diagnostic';

            return (
              <Card
                key={asm.id}
                hover
                className={`flex flex-col justify-between group border transition-all ${
                  isDiagnostic ? 'border-primary/40 bg-surface/90' : 'border-border'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant={isDiagnostic ? 'primary' : 'purple'} size="sm">
                      {isDiagnostic ? 'Baseline Diagnostic' : 'Skill Assessment'}
                    </Badge>
                    {hasAttempt && (
                      <Badge variant="emerald" size="sm">
                        Scored {score}%
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-text-heading group-hover:text-primary-light transition-colors mb-2">
                    {asm.title}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-4">
                    {asm.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-text-dim mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {asm.duration_minutes || 20} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {asm.questions_count || 20} questions
                    </span>
                    <span className="flex items-center gap-1 text-accent-amber font-medium">
                      <Award className="w-3.5 h-3.5" />
                      +75 pts
                    </span>
                  </div>

                  {hasAttempt && (
                    <div className="p-3 rounded-xl bg-surface-light border border-border/70 mb-4 text-xs">
                      <div className="flex items-center justify-between text-text-muted mb-1">
                        <span>Last Attempted:</span>
                        <span className="text-text-heading font-medium">
                          {new Date(asm.latest_attempt.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-text-muted">
                        <span>Top Strengths:</span>
                        <span className="text-accent-emerald font-semibold">
                          {asm.latest_attempt.strengths_count || 2} identified
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {hasAttempt ? (
                    <>
                      <Link
                        to={`/student/assessments/${asm.id}/results`}
                        className="flex-1 py-2 px-3 rounded-xl bg-surface-light hover:bg-surface-lighter text-text text-xs font-semibold text-center border border-border transition-all flex items-center justify-center gap-1.5"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>View Results</span>
                      </Link>
                      <Link
                        to={`/student/assessments/${asm.id}/take`}
                        className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold text-center shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      to={`/student/assessments/${asm.id}/take`}
                      className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold text-center shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Assessment</span>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
