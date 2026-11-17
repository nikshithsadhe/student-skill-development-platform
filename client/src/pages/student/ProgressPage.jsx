import React, { useState, useEffect } from 'react';
    
import {
  Download,
  CheckCircle2,
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
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

export default function ProgressPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const res = await api.get('/progress/me');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load progress analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setDownloadStatus('');
    try {
      const res = await api.get('/progress/report.pdf', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const pdfHeader = await blob.slice(0, 5).text();
      if (!blob.size || pdfHeader !== '%PDF-') {
        throw new Error('The report response was not a valid PDF.');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'SSP_Official_Skill_Report.pdf';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      setDownloadStatus('Download started: SSP_Official_Skill_Report.pdf. Check your device’s Downloads.');
      toast.success('PDF download started. Check your device’s Downloads.');
    } catch (err) {
      setDownloadStatus('');
      toast.error(err.message || 'Failed to generate PDF progress report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Aggregating soft-skills metrics & transcripts..." />
      </div>
    );
  }

  const profile = data?.profile;
  const latestAttempt = data?.latest_assessment;
  const initialAttempt = data?.initial_assessment;
  const weeklyChartData = data?.weekly_chart || [];
  const hasWeeklyPoints = weeklyChartData.some((day) => Number(day.points) > 0);

  const overallScore = profile?.overall_skill_score ?? latestAttempt?.total_score ?? 0;
  const scoreDelta =
    initialAttempt && latestAttempt
      ? latestAttempt.total_score - initialAttempt.total_score
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header with PDF Download CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Skill Progress & Transcripts</h1>
          <p className="text-sm text-text-muted mt-1">
            Track your assessment results, module completion, and earned points.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <Button
            variant="primary"
            isLoading={downloadingPdf}
            onClick={handleDownloadPdf}
            icon={Download}
          >
            Download Official PDF Portfolio
          </Button>
          {downloadStatus && (
            <p className="text-xs text-accent-emerald" role="status" aria-live="polite">
              {downloadStatus}
            </p>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Overall Readiness"
          value={`${overallScore}%`}
          changeLabel="Employability Index"
          trend={scoreDelta >= 0 ? 'up' : 'down'}
          change={scoreDelta !== 0 ? `${scoreDelta > 0 ? '+' : ''}${scoreDelta}% vs baseline` : 'Baseline'}
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          title="Curriculum Completion"
          value={`${data?.module_completion_rate ?? 0}%`}
          subtext={`${data?.completed_modules_count ?? 0} of ${data?.total_modules_published ?? 0} modules`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Total Points Earned"
          value={profile?.total_points ?? 0}
          subtext="Earn points as you learn"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Weekly points earned */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-text-heading">Points Earned This Week</h3>
            <p className="text-xs text-text-muted">Points from completed learning milestones</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-3 h-3 rounded-sm bg-accent-amber inline-block" /> Points
          </div>
        </div>

        <div className="h-64 w-full">
          {hasWeeklyPoints ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#164E37" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#081E15',
                    borderColor: '#164E37',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="points" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Points" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-center px-6">
              <p className="text-sm text-text-muted">No points earned this week yet. Your chart will appear as you learn.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Assessment History Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-heading">Assessment Performance History</h3>
          <span className="text-xs text-text-dim">Recorded Situational Evaluations</span>
        </div>

        {latestAttempt ? (
          <div className="divide-y divide-border text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-text-heading block">{latestAttempt.assessment_title || 'Diagnostic Assessment'}</span>
                <span className="text-text-dim">
                  Taken {new Date(latestAttempt.completed_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-sm text-text-heading">
                  {latestAttempt.total_score}%
                </span>
                <Badge variant={latestAttempt.total_score >= 60 ? 'emerald' : 'amber'} size="sm">
                  {latestAttempt.total_score >= 60 ? 'Proficient' : 'Needs Practice'}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted py-4">No assessment attempts recorded yet.</p>
        )}
      </Card>
    </div>
  );
}
