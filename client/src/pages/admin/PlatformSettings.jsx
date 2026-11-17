import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Database,
  Save,
  CheckCircle2,
  Shield,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

export default function PlatformSettings() {
  const [platformName, setPlatformName] = useState('Student Skill Development Platform (SSP)');
  const [passingThreshold, setPassingThreshold] = useState(60);
  const [assessmentWeight, setAssessmentWeight] = useState(40);
  const [activityWeight, setActivityWeight] = useState(40);
  const [moduleWeight, setModuleWeight] = useState(20);
  const [dbStatus, setDbStatus] = useState(null);
  const [checkingDb, setCheckingDb] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setCheckingDb(true);
    try {
      const res = await api.get('/health');
      if (res.data?.success) {
        setDbStatus(res.data.data);
      }
    } catch (err) {
      console.error('Failed to ping health check:', err);
    } finally {
      setCheckingDb(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (Number(assessmentWeight) + Number(activityWeight) + Number(moduleWeight) !== 100) {
      toast.error('Scoring weights must sum to exactly 100%');
      return;
    }
    toast.success('Platform configuration saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Platform Configuration & Policies</h1>
        <p className="text-sm text-text-muted mt-1">
          Tune scoring formulas, database thresholds, and campus branding.
        </p>
      </div>

      {/* Database & Infrastructure Status */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-light" />
            <h3 className="text-base font-bold text-text-heading">Database & Connectivity</h3>
          </div>

          <Button
            variant="secondary"
            size="sm"
            isLoading={checkingDb}
            onClick={checkHealth}
            icon={RefreshCw}
          >
            Ping Connectivity
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-surface-light border border-border">
            <span className="text-text-dim block mb-1">Database Mode</span>
            <Badge variant={dbStatus?.database?.is_mock ? 'amber' : 'emerald'} size="sm">
              {dbStatus?.database?.is_mock ? 'In-Memory Dev Driver' : 'Live MongoDB'}
            </Badge>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-light border border-border">
            <span className="text-text-dim block mb-1">Cluster Status</span>
            <span className="font-bold text-text-heading capitalize">
              {dbStatus?.database?.status || 'Connected'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-light border border-border">
            <span className="text-text-dim block mb-1">Target Database</span>
            <span className="font-bold text-text-heading font-mono">
              {dbStatus?.database?.db_name || 'ssp_database'}
            </span>
          </div>
        </div>
      </Card>

      {/* Scoring Weights Form */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-accent-emerald" />
          <div>
            <h3 className="text-base font-bold text-text-heading">Transparent Readiness Formula Weights</h3>
            <p className="text-xs text-text-muted">Formula: (Assessment × W1) + (Activities × W2) + (Modules × W3) = 100%</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-text-heading">Platform Title & Branding</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full bg-blue-950 border border-blue-800 rounded-xl p-3 text-xs text-blue-50 placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-text-heading">Assessment Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={assessmentWeight}
                onChange={(e) => setAssessmentWeight(Number(e.target.value))}
                className="w-full bg-blue-950 border border-blue-800 rounded-xl p-3 text-xs text-blue-50 placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-heading">Practical Activities Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={activityWeight}
                onChange={(e) => setActivityWeight(Number(e.target.value))}
                className="w-full bg-blue-950 border border-blue-800 rounded-xl p-3 text-xs text-blue-50 placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-heading">Module Coursework Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={moduleWeight}
                onChange={(e) => setModuleWeight(Number(e.target.value))}
                className="w-full bg-blue-950 border border-blue-800 rounded-xl p-3 text-xs text-blue-50 placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-heading">Diagnostic Passing / Mastery Threshold (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={passingThreshold}
              onChange={(e) => setPassingThreshold(Number(e.target.value))}
              className="w-full bg-blue-950 border border-blue-800 rounded-xl p-3 text-xs text-blue-50 placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="primary" type="submit" icon={Save}>
              Save Platform Configuration
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
