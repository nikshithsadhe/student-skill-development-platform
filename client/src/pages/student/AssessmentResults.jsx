import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Info,
  Compass,
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

export default function AssessmentResults() {
  const { id } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assessments/${id}/results`);
      if (res.data?.success) {
        setResults(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load assessment results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Computing behavioral competency score..." />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-text-heading">No results found</h2>
        <p className="text-sm text-text-muted">You have not completed this assessment yet.</p>
        <Link to={`/student/assessments/${id}/take`}>
          <Button variant="primary">Take Assessment Now</Button>
        </Link>
      </div>
    );
  }

  const score = results.total_score || 0;
  const passed = score >= 60;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Score Header Card */}
      <Card className="text-center p-8 bg-gradient-to-b from-surface-card to-surface relative overflow-hidden border border-border">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 border border-primary/20 text-primary-light mb-4">
          <Award className="w-12 h-12" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-text-heading mb-1">
          {results.assessment_title || 'Assessment Performance'}
        </h1>
        <p className="text-xs text-text-muted mb-6">
          Evaluated on {new Date(results.completed_at).toLocaleDateString()}
        </p>

        {/* Big Score Display */}
        <div className="inline-block p-6 rounded-3xl bg-surface-light border border-border mb-6">
          <div className="text-5xl sm:text-6xl font-black text-text-heading tracking-tight">
            {score}
            <span className="text-2xl sm:text-3xl text-text-dim font-bold">%</span>
          </div>
          <span className="text-xs text-text-muted uppercase tracking-wider font-semibold mt-1 block">
            {results.total_earned} of {results.total_max} Total Points Earned
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Badge variant={passed ? 'emerald' : 'amber'} size="lg">
            {passed ? 'Proficient Mastery' : 'Foundational Mastery'}
          </Badge>
          <Badge variant="purple" size="lg">
            +75 Skill Points Awarded
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Link to="/student/learning-path">
            <Button variant="primary" icon={Compass}>
              View Recommended Curriculum
            </Button>
          </Link>
          <Link to={`/student/assessments/${id}/take`}>
            <Button variant="secondary" icon={RotateCcw}>
              Retake Assessment
            </Button>
          </Link>
        </div>
      </Card>

      {/* Strengths & Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identified Strengths */}
        <Card className="border border-accent-emerald/30 bg-accent-emerald/5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-accent-emerald" />
            <h3 className="text-base font-bold text-text-heading">Identified Strengths</h3>
          </div>
          <div className="space-y-2">
            {(results.strengths || []).length > 0 ? (
              results.strengths.map((str, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface/80 border border-border text-xs flex items-center justify-between">
                  <span className="font-semibold text-text-heading capitalize">
                    {str.replace('-', ' ')}
                  </span>
                  <Badge variant="emerald" size="sm">High Aptitude</Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-muted">No high-scoring competencies detected yet.</p>
            )}
          </div>
        </Card>

        {/* Growth & Improvement Areas */}
        <Card className="border border-accent-amber/30 bg-accent-amber/5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-accent-amber" />
            <h3 className="text-base font-bold text-text-heading">Growth & Focus Areas</h3>
          </div>
          <div className="space-y-2">
            {(results.improvement_areas || []).length > 0 ? (
              results.improvement_areas.map((imp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface/80 border border-border text-xs flex items-center justify-between">
                  <span className="font-semibold text-text-heading capitalize">
                    {imp.replace('-', ' ')}
                  </span>
                  <Badge variant="amber" size="sm">Recommended Focus</Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-muted">Exceptional performance across all assessed areas!</p>
            )}
          </div>
        </Card>
      </div>

      {/* Detailed Question Review */}
      {results.detailed_breakdown && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-text-heading">Detailed Question Evaluation</h3>
            <span className="text-xs text-text-muted">
              {results.detailed_breakdown.filter((q) => q.is_correct).length} of{' '}
              {results.detailed_breakdown.length} questions correct
            </span>
          </div>

          <div className="space-y-4">
            {results.detailed_breakdown.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  item.is_correct
                    ? 'border-accent-emerald/30 bg-accent-emerald/5'
                    : 'border-accent-rose/30 bg-accent-rose/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {item.is_correct ? (
                      <CheckCircle2 className="w-4 h-4 text-accent-emerald shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-accent-rose shrink-0" />
                    )}
                    <span className="font-bold text-text-heading">Question {idx + 1}</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-dim">
                    Weight: {item.score_weight || 5} pts
                  </span>
                </div>

                <p className="text-text-muted font-medium pl-6">{item.question}</p>

                {item.explanation && (
                  <div className="mt-2 pl-6 pt-2 border-t border-border/50 text-[11px] text-text-dim">
                    <span className="font-semibold text-text-heading">Behavioral Rationale: </span>
                    {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transparent Scoring Formula Documentation */}
      {results.formula_documentation && (
        <div className="p-4 rounded-2xl bg-surface-light border border-border text-xs text-text-muted flex items-start gap-3">
          <Info className="w-4 h-4 text-primary-light shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-heading block mb-1">
              Documented Transparent Scoring Formula
            </span>
            <p className="leading-relaxed">{results.formula_documentation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
