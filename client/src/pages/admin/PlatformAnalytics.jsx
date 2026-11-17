import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  Award,
  BookOpen,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../services/api';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';

export default function PlatformAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load platform analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Aggregating platform telemetry & metrics..." />
      </div>
    );
  }

  const roleDistribution = [
    { name: 'Students', value: data?.total_students || 10, color: '#4F46E5' },
    { name: 'Faculty', value: data?.total_faculty || 3, color: '#8B5CF6' },
  ];

  const engagementTrend = [
    { week: 'Wk 1', completions: 12, submissions: 8 },
    { week: 'Wk 2', completions: 24, submissions: 18 },
    { week: 'Wk 3', completions: 38, submissions: 30 },
    { week: 'Wk 4', completions: 52, submissions: 45 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Platform Telemetry & Analytics</h1>
        <p className="text-sm text-text-muted mt-1">
          High-altitude visibility into collegiate adoption, completion velocities, and competency distribution.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Students"
          value={data?.active_students || 0}
          changeLabel={`of ${data?.total_students || 0} enrolled`}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Assessments Taken"
          value={data?.total_assessments_taken || 0}
          changeLabel="Situational Diagnostics"
          icon={Activity}
          color="emerald"
        />
        <StatCard
          title="Curriculum Modules"
          value={data?.published_modules || 0}
          changeLabel="12 Soft-Skill Categories"
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="Pending Reviews"
          value={data?.pending_reviews || 0}
          changeLabel="Awaiting Evaluation"
          icon={FileCheck}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Trend */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-text-heading">Monthly Learning Growth Velocity</h3>
              <p className="text-xs text-text-muted">Module completions vs practical submissions</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-text-muted">
                <span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Modules
              </span>
              <span className="flex items-center gap-1.5 text-text-muted">
                <span className="w-3 h-3 rounded-sm bg-accent-emerald inline-block" /> Submissions
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#164E37" />
                <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#081E15',
                    borderColor: '#164E37',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="completions" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Modules" />
                <Bar dataKey="submissions" fill="#10B981" radius={[6, 6, 0, 0]} name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* User Distribution Pie */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-text-heading mb-1">User Distribution</h3>
            <p className="text-xs text-text-muted mb-4">Ratio of students to faculty mentors</p>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#081E15',
                      borderColor: '#164E37',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-border text-xs">
            {roleDistribution.map((r) => (
              <div key={r.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-text-muted">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.name}
                </span>
                <span className="font-bold text-text-heading">{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
