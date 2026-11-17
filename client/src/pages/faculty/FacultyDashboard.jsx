import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/faculty/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Loading faculty cohort overview..." />
      </div>
    );
  }

  const assignedCount = data?.assigned_students_count || 0;
  const pendingCount = data?.pending_submissions_count || 0;
  const reviewedCount = data?.reviewed_submissions_count || 0;
  const avgScore = data?.average_skill_score || 0;
  const recentSubs = data?.recent_submissions || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Faculty Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/30 via-surface-card to-accent-purple/20 border border-primary/20 p-6 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <Badge variant="purple" size="sm">Faculty Portal</Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-text-heading">
            Welcome, Professor {user?.full_name?.split(' ').pop() || user?.full_name}!
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Manage your assigned mentee cohorts, evaluate practical behavioral submissions with rubrics, and author soft-skill modules.
          </p>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Students"
          value={assignedCount}
          changeLabel="Mentee Cohort"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Pending Reviews"
          value={pendingCount}
          changeLabel={pendingCount > 0 ? 'Requires attention' : 'All caught up'}
          trend={pendingCount > 0 ? 'up' : 'neutral'}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Reviewed Submissions"
          value={reviewedCount}
          changeLabel="Feedback Provided"
          icon={FileCheck}
          color="emerald"
        />
        <StatCard
          title="Average Cohort Score"
          value={`${avgScore}%`}
          changeLabel="Soft-Skills Proficiency"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Action shortcuts & Pending submissions queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Submissions Queue */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-heading">Submissions Awaiting Grading</h3>
              <p className="text-xs text-text-muted">Student exercises waiting for faculty evaluation</p>
            </div>
            <Link to="/faculty/submissions" className="text-xs text-primary-light hover:underline flex items-center gap-1">
              View All Queue <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentSubs.length > 0 ? (
              recentSubs.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-surface-light border border-border flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-text-heading">{sub.student_name || 'Student'}</span>
                      <Badge variant="amber" size="sm">
                        {sub.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted">{sub.activity_title}</p>
                    <span className="text-[10px] text-text-dim block">
                      Submitted on {new Date(sub.updated_at || sub.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <Link to="/faculty/submissions">
                    <Button variant="primary" size="sm">
                      Review & Grade
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-text-muted">
                No submissions currently waiting for review. Great job!
              </div>
            )}
          </div>
        </Card>

        {/* Quick Management Links */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-text-heading">Faculty Quick Links</h3>
          <div className="space-y-3">
            <Link
              to="/faculty/students"
              className="p-3.5 rounded-2xl bg-surface-light hover:bg-surface-lighter border border-border transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-primary-light" />
                <div>
                  <h4 className="text-xs font-bold text-text-heading">Student Directory</h4>
                  <p className="text-[11px] text-text-dim">View assigned cohort & progress</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-text transition-colors" />
            </Link>

            <Link
              to="/faculty/modules"
              className="p-3.5 rounded-2xl bg-surface-light hover:bg-surface-lighter border border-border transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-accent-purple" />
                <div>
                  <h4 className="text-xs font-bold text-text-heading">Module Authoring</h4>
                  <p className="text-[11px] text-text-dim">Create & publish soft-skill lessons</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-text transition-colors" />
            </Link>

            <Link
              to="/faculty/reports"
              className="p-3.5 rounded-2xl bg-surface-light hover:bg-surface-lighter border border-border transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-accent-emerald" />
                <div>
                  <h4 className="text-xs font-bold text-text-heading">Cohort Reports</h4>
                  <p className="text-[11px] text-text-dim">Class performance distributions</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-text transition-colors" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
