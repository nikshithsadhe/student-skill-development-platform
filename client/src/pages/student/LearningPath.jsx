import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  ArrowRight,
  BookOpen,
  Clock,
  Award,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

export default function LearningPath() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recommendations');
      if (res.data?.success) {
        setRecommendations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load personalized learning path:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Generating personalized soft-skills curriculum..." />
      </div>
    );
  }

  const hasTakenAssessment = recommendations?.assessment_taken;
  const recommendedMods = recommendations?.recommended_modules || [];
  const milestones = recommendations?.weekly_milestones || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/30 via-surface-card to-accent-blue/15 border border-primary/20 p-6 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-light text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Personalized Path</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-heading">
            Your Tailored Soft-Skills Roadmap
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Curriculum tailored specifically to close your identified competency gaps, strengthen active listening and negotiation, and maximize career placement success.
          </p>
        </div>
      </div>

      {!hasTakenAssessment && (
        <div className="p-4 rounded-2xl bg-accent-amber/10 border border-accent-amber/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-accent-amber shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-text-heading">Take Baseline Diagnostic for Hyper-Personalization</h4>
              <p className="text-xs text-text-muted">
                Complete the 20-question diagnostic to unlock precision-targeted recommendations.
              </p>
            </div>
          </div>
          <Link to="/student/assessments">
            <Button variant="primary" size="sm">
              Open Assessments
            </Button>
          </Link>
        </div>
      )}

      {/* Recommended Modules (Roadmap Milestones) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-heading">Prioritized Learning Milestones</h2>
            <p className="text-xs text-text-muted">Targeted coursework to boost your lowest competency scores</p>
          </div>
          <Link to="/student/modules" className="text-xs text-primary-light hover:underline flex items-center gap-1">
            Browse All Modules <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-4">
          {recommendedMods.map((item, idx) => {
            const mod = item.module;
            const isHighPriority = item.priority === 'High';

            return (
              <Card
                key={mod.id || idx}
                hover
                className={`p-5 sm:p-6 border transition-all ${
                  isHighPriority ? 'border-primary/40 bg-surface/90' : 'border-border'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary-light font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <Badge variant={isHighPriority ? 'danger' : 'purple'} size="sm">
                        {isHighPriority ? 'High Priority Growth Area' : 'Foundational Step'}
                      </Badge>
                      <span className="text-xs text-text-dim">{mod.category_name}</span>
                    </div>

                    <h3 className="text-base font-bold text-text-heading">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      {item.reason}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-text-dim pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {mod.estimated_minutes} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {mod.lessons?.length ?? 0} lessons
                      </span>
                      <span className="flex items-center gap-1 text-accent-amber font-semibold">
                        <Award className="w-3.5 h-3.5" />
                        +{mod.points_reward} pts
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/student/modules/${mod.id}`}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shrink-0 flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all"
                  >
                    <span>Start Milestone</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Weekly learning plan */}
      <div className="max-w-3xl">
        {/* Weekly Goals & Habit Formation */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent-blue" />
            <div>
              <h3 className="text-base font-bold text-text-heading">Weekly Action Plan</h3>
              <p className="text-xs text-text-muted">Recommended sprint milestones for continuous progression</p>
            </div>
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-surface-light border border-border flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary-light flex items-center justify-center font-bold text-xs shrink-0">
                    D{m.target_days}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-heading">{m.title}</h4>
                    <span className="text-[10px] text-text-dim">
                      Suggested completion within {m.target_days} days
                    </span>
                  </div>
                </div>

                <Badge variant="amber" size="sm">
                  +{m.reward_points} pts
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
