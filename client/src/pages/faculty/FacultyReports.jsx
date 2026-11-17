import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Users,
  FileCheck,
  TrendingUp,
  Download,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../../services/api';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Spinner from '../../components/Spinner';

export default function FacultyReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/faculty/reports');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load faculty cohort reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Computing cohort skill distributions..." />
      </div>
    );
  }

  const distribution = data?.score_distribution || [
    { range: '0-40%', count: 0 },
    { range: '40-60%', count: 2 },
    { range: '60-80%', count: 5 },
    { range: '80-100%', count: 3 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Cohort Progress & Skill Analytics</h1>
        <p className="text-sm text-text-muted mt-1">
          Macro metrics evaluating overall behavioral aptitude across your assigned students.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Students"
          value={data?.cohort_size || 0}
          changeLabel="Total Mentees"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Total Submissions"
          value={data?.total_submissions || 0}
          changeLabel="Practical Exercises"
          icon={FileCheck}
          color="purple"
        />
        <StatCard
          title="Reviewed Submissions"
          value={data?.reviewed_submissions || 0}
          changeLabel="Graded with Rubrics"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Pending Reviews"
          value={data?.pending_reviews || 0}
          changeLabel="Awaiting Faculty Input"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Cohort Score Distribution BarChart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-text-heading">Cohort Skill Score Distribution</h3>
            <p className="text-xs text-text-muted">Student breakdown across performance tiers</p>
          </div>
          <span className="text-xs text-text-dim">Score Brackets</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#164E37" />
              <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#081E15',
                  borderColor: '#164E37',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
