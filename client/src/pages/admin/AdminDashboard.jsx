import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  Activity,
  FolderKanban,
  FileCheck,
  TrendingUp,
  FileText,
  Sliders,
  ArrowRight,
  UserCheck,
  Award,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

export default function AdminDashboard() {
  const { user } = useAuth();
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
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Loading platform control panel..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/30 via-surface-card to-accent-rose/15 border border-primary/20 p-6 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <Badge variant="danger" size="sm">System Administration</Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-text-heading">
            SSDP Control Tower
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Manage system-wide user credentials, assign students to faculty mentors, monitor security audit logs, and oversee curriculum publishing.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={data?.total_students || 0}
          changeLabel={`${data?.active_students || 0} Active`}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Faculty Mentors"
          value={data?.total_faculty || 0}
          changeLabel="Assigned Instructors"
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          title="Published Modules"
          value={data?.published_modules || 0}
          changeLabel="Curriculum Content"
          icon={FolderKanban}
          color="emerald"
        />
        <StatCard
          title="Assessments Taken"
          value={data?.total_assessments_taken || 0}
          changeLabel={`${data?.pending_reviews || 0} Pending Reviews`}
          icon={Activity}
          color="amber"
        />
      </div>

      {/* Action shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hover className="p-6 space-y-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-heading">User Directory & Status</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Search, filter, activate/deactivate student or faculty accounts, and provision new instructors.
          </p>
          <Link
            to="/admin/users"
            className="text-xs font-semibold text-primary-light hover:underline flex items-center gap-1 pt-2"
          >
            <span>Manage Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card hover className="p-6 space-y-3 group">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/20 text-accent-purple flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-heading">Faculty Mentee Assignments</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Assign students to faculty mentors for 1-on-1 practical roleplay review and tracking.
          </p>
          <Link
            to="/admin/assignments"
            className="text-xs font-semibold text-primary-light hover:underline flex items-center gap-1 pt-2"
          >
            <span>Configure Assignments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card hover className="p-6 space-y-3 group">
          <div className="w-10 h-10 rounded-xl bg-accent-emerald/20 text-accent-emerald flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-heading">Platform Analytics</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Deep-dive into student engagement patterns, skill score improvements, and pass rates.
          </p>
          <Link
            to="/admin/analytics"
            className="text-xs font-semibold text-primary-light hover:underline flex items-center gap-1 pt-2"
          >
            <span>View Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card hover className="p-6 space-y-3 group">
          <div className="w-10 h-10 rounded-xl bg-accent-amber/20 text-accent-amber flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-heading">Security Audit Logs</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Inspect immutable administrative actions, role assignments, and authentication events.
          </p>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-primary-light hover:underline flex items-center gap-1 pt-2"
          >
            <span>Review Audit Trail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card hover className="p-6 space-y-3 group">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/20 text-accent-blue flex items-center justify-center font-bold">
            <FolderKanban className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-heading">Curriculum Authoring</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Directly create, update, and publish soft-skill modules across 12 behavioral categories.
          </p>
          <Link
            to="/admin/modules"
            className="text-xs font-semibold text-primary-light hover:underline flex items-center gap-1 pt-2"
          >
            <span>Manage Modules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card hover className="p-6 space-y-3 group">
          <div className="w-10 h-10 rounded-xl bg-surface-lighter text-text flex items-center justify-center font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-text-heading">Platform Settings</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            System thresholds, scoring weights, notification configuration, and database connection.
          </p>
          <Link
            to="/admin/settings"
            className="text-xs font-semibold text-primary-light hover:underline flex items-center gap-1 pt-2"
          >
            <span>Configure Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>
    </div>
  );
}
