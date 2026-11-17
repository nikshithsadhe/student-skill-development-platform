import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Trophy,
  Compass,
  AlertCircle,
  Play,
  Flame,
  Mic,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressSummary, setProgressSummary] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [recentBadges, setRecentBadges] = useState([]);
  const [diagnosticStatus, setDiagnosticStatus] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [progRes, recRes, badgeRes, assessRes] = await Promise.allSettled([
        api.get('/progress/summary'),
        api.get('/recommendations'),
        api.get('/achievements/badges'),
        api.get('/assessments'),
      ]);

      if (progRes.status === 'fulfilled' && progRes.value.data?.success) {
        setProgressSummary(progRes.value.data.data);
      }
      if (recRes.status === 'fulfilled' && recRes.value.data?.success) {
        setRecommendations(recRes.value.data.data);
      }
      if (badgeRes.status === 'fulfilled' && badgeRes.value.data?.success) {
        const earned = (badgeRes.value.data.data.badges || []).filter((b) => b.is_earned);
        setRecentBadges(earned.slice(0, 4));
      }
      if (assessRes.status === 'fulfilled' && assessRes.value.data?.success) {
        const diagnostic = assessRes.value.data.data.find((a) => a.type === 'diagnostic');
        setDiagnosticStatus(diagnostic);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Loading student skill workspace..." />
      </div>
    );
  }

  // Competency radar data formatted for Recharts
  const skillScores = progressSummary?.latest_assessment?.skill_wise_scores || {};
  const competencyData = Object.entries(skillScores).slice(0, 6).map(([skill, score]) => ({
    subject: skill.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    score: Math.round(Number(score) || 0),
    fullMark: 100,
  }));

        const overallReadiness = progressSummary?.profile?.overall_skill_score ?? 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/30 via-surface-card to-accent-blue/15 border border-primary/20 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-light text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Collegiate Soft-Skills Development</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-text-heading tracking-tight">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Scholar'}!
            </h1>
            <p className="text-sm text-text-muted mt-2 leading-relaxed">
              Track your behavioral competencies, complete skill assessments, and build career-ready soft skills.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/modules"
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/25 transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Modules</span>
            </Link>
            <Link
              to="/student/progress"
              className="px-5 py-2.5 rounded-xl bg-surface-light hover:bg-surface-lighter text-text text-xs font-semibold border border-border transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Portfolio & PDF</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Diagnostic Assessment Reminder if not taken */}
      {diagnosticStatus && !diagnosticStatus.student_attempt && (
        <div className="p-4 rounded-2xl bg-accent-amber/10 border border-accent-amber/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-amber/20 text-accent-amber flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-heading">Baseline Diagnostic Assessment Pending</h3>
              <p className="text-xs text-text-muted">
                Take the 20-question soft-skills diagnostic to calibrate your personalized curriculum.
              </p>
            </div>
          </div>
          <Link
            to={`/student/assessments/${diagnosticStatus.id}/take`}
            className="px-4 py-2 rounded-xl bg-accent-amber hover:bg-accent-amber/90 text-background font-bold text-xs shrink-0 flex items-center gap-1.5 justify-center shadow"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Diagnostic</span>
          </Link>
        </div>
      )}

      {/* High-level KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Overall Readiness"
          value={`${overallReadiness}%`}
          changeLabel="Employability Index"
          trend="up"
          change="Baseline"
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          title="Skill Points"
          value={progressSummary?.profile?.total_points ?? 0}
          subtext="Earn points as you learn"
          icon={Trophy}
          color="amber"
        />
        <StatCard
          title="Modules Completed"
          value={`${progressSummary?.completed_modules_count ?? progressSummary?.profile?.completed_modules_count ?? 0} / ${progressSummary?.total_modules_published ?? 0}`}
          changeLabel="Coursework Progress"
          icon={BookOpen}
          color="emerald"
        />
      </div>

      {/* Visual Analytics & Recommended Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competency Radar Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-text-heading">Soft-Skill Competency Profile</h3>
              <p className="text-xs text-text-muted">Direct behavioral scores across core human disciplines</p>
            </div>
            <Link
              to="/student/progress"
              className="text-xs text-primary-light hover:underline flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {competencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={competencyData}>
                  <PolarGrid stroke="#164E37" />
                  <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <PolarRadiusAxis stroke="#164E37" angle={30} domain={[0, 100]} />
                  <Radar
                    name="Proficiency"
                    dataKey="score"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center max-w-sm px-6">
                <p className="text-sm font-semibold text-text-heading">Your skill profile is empty for now</p>
                <p className="text-xs text-text-muted mt-2">
                  Complete your first assessment to see your real competency scores here.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Personalized Recommendations */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary-light" />
                <h3 className="text-base font-bold text-text-heading">Recommended Path</h3>
              </div>
              <Badge variant="blue" size="sm">Smart AI</Badge>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Prioritized modules targeting your lowest-scoring competency areas.
            </p>

            <div className="space-y-3">
              {(recommendations?.prioritized_modules || []).slice(0, 3).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl bg-surface-light border border-border hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-text-heading line-clamp-1">{item.title}</h4>
                    <span className="text-[10px] text-accent-amber font-mono font-bold shrink-0">
                      +{item.points_reward} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-text-dim mt-1 line-clamp-1">{item.category_name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.estimated_minutes} min
                    </span>
                    <Link
                      to={`/student/modules/${item.id}`}
                      className="text-xs font-semibold text-primary-light hover:underline flex items-center gap-0.5"
                    >
                      Start <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
              {(!recommendations?.prioritized_modules || recommendations.prioritized_modules.length === 0) && (
                <div className="p-4 text-center rounded-xl bg-surface-light text-xs text-text-muted">
                  Explore modules to generate tailored recommendations.
                </div>
              )}
            </div>
          </div>

          <Link
            to="/student/learning-path"
            className="w-full mt-4 py-2 text-center rounded-xl bg-surface-lighter hover:bg-surface text-xs font-semibold text-text transition-all border border-border"
          >
            View Full Learning Roadmap
          </Link>
        </Card>
      </div>

      {/* Quick Launchpad & Earned Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mock Interview Lab Card */}
        <Card hover className="group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/15 text-accent-blue flex items-center justify-center font-bold">
              STAR
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-heading">Mock Interview Practice</h3>
              <p className="text-xs text-text-muted">STAR Method Behavioral Simulation</p>
            </div>
          </div>
          <p className="text-xs text-text-muted mb-4 leading-relaxed">
            Practice answering high-frequency campus placement interview questions with structured STAR guidelines and instant model answers.
          </p>
          <Link
            to="/student/interviews"
            className="w-full py-2 px-3 rounded-xl bg-surface-light group-hover:bg-primary group-hover:text-white text-xs font-semibold text-text transition-all border border-border group-hover:border-primary flex items-center justify-center gap-1.5"
          >
            <span>Enter Interview Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>

        {/* Earned Badges Showcase */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent-amber" />
              <h3 className="text-sm font-bold text-text-heading">Recent Badges</h3>
            </div>
            <Link to="/student/achievements" className="text-xs text-primary-light hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {recentBadges.length > 0 ? (
              recentBadges.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-xl bg-surface-light border border-border text-center flex flex-col items-center"
                >
                  <span className="text-2xl mb-1">{b.icon || '🏅'}</span>
                  <span className="text-xs font-semibold text-text-heading line-clamp-1">{b.title}</span>
                  <span className="text-[10px] text-accent-amber font-mono mt-0.5">+{b.points} pts</span>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-6 text-center text-xs text-text-muted">
                Complete modules and assessments to earn your first badges!
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
