import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Compass,
  MessageSquare,
  Users,
  Clock,
  Award,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  BookOpen,
  Mic,
  FileCheck,
  TrendingUp,
  Sliders,
  FileText,
  UserCheck,
  ExternalLink,
  ChevronRight,
  Shield,
  GraduationCap,
  Play,
  Flame,
  Check,
  HelpCircle,
  Eye,
  Download,
  Layers,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Landing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loggingInRole, setLoggingInRole] = useState(null);
  const [activeTab, setActiveTab] = useState('curriculum');
  const [sampleAnswerRevealed, setSampleAnswerRevealed] = useState(false);
  const [activeStarTab, setActiveStarTab] = useState('situation');

  // Auto-authenticate & jump directly into any feature
  const handleLaunchFeature = async (targetRoute, requiredRole = 'student') => {
    // If already logged in with right role, go directly
    if (user && (user.role === requiredRole || user.role === 'admin')) {
      navigate(targetRoute);
      return;
    }

    // Otherwise, fast-authenticate demo user for seamless exploration
    setLoggingInRole(requiredRole);
    try {
      const creds =
        requiredRole === 'admin'
          ? { user: 'admin', pass: 'AdminPass123!' }
          : { user: 'student', pass: 'Password123!' };

      const res = await login(creds.user, creds.pass);
      if (res.success) {
        navigate(targetRoute);
      }
    } catch (err) {
      navigate('/login');
    } finally {
      setLoggingInRole(null);
    }
  };

  const categories = [
    {
      name: 'Interpersonal Communication',
      desc: 'Active listening, articulation, brevity, and non-defensive dialogue.',
      modules: 2,
      hours: '3.5 hrs',
      points: 120,
      icon: MessageSquare,
      color: 'blue',
    },
    {
      name: 'Leadership & Initiative',
      desc: 'Situational decision-making, team motivation, and ethical leadership.',
      modules: 2,
      hours: '4.0 hrs',
      points: 150,
      icon: Award,
      color: 'purple',
    },
    {
      name: 'Teamwork & Collaboration',
      desc: 'Cross-functional synergy, collaborative problem-solving, and shared accountability.',
      modules: 2,
      hours: '3.0 hrs',
      points: 110,
      icon: Users,
      color: 'emerald',
    },
    {
      name: 'Time & Energy Management',
      desc: 'Eisenhower prioritization, focus sprints, and boundary setting for high productivity.',
      modules: 2,
      hours: '2.5 hrs',
      points: 90,
      icon: Clock,
      color: 'amber',
    },
    {
      name: 'Emotional Intelligence (EQ)',
      desc: 'Self-regulation under pressure, empathy, social perceptiveness, and poise.',
      modules: 2,
      hours: '3.5 hrs',
      points: 130,
      icon: Sparkles,
      color: 'cyan',
    },
    {
      name: 'Placement & STAR Interviews',
      desc: 'Mastering high-stakes campus placement behavioral interviews using STAR method.',
      modules: 2,
      hours: '4.5 hrs',
      points: 160,
      icon: Mic,
      color: 'rose',
    },
    {
      name: 'Negotiation & Conflict Resolution',
      desc: 'De-escalating workplace friction, interest-based bargaining, and win-win consensus.',
      modules: 2,
      hours: '3.5 hrs',
      points: 140,
      icon: ShieldCheck,
      color: 'blue',
    },
    {
      name: 'Problem Solving & Critical Thinking',
      desc: 'Root-cause analysis, first-principles thinking, and sound workplace judgment.',
      modules: 2,
      hours: '3.0 hrs',
      points: 110,
      icon: Compass,
      color: 'purple',
    },
    {
      name: 'Public Speaking & Executive Presence',
      desc: 'Vocal modulation, stage composure, impromptu presentations, and rhetoric.',
      modules: 2,
      hours: '4.0 hrs',
      points: 150,
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      name: 'Non-Verbal & Body Language',
      desc: 'Posture, micro-expressions, eye contact, and decoding client non-verbal cues.',
      modules: 2,
      hours: '2.5 hrs',
      points: 95,
      icon: Eye,
      color: 'amber',
    },
    {
      name: 'Professional Workplace Etiquette',
      desc: 'Corporate email communication, meeting diplomacy, and cross-cultural awareness.',
      modules: 2,
      hours: '2.5 hrs',
      points: 100,
      icon: FileCheck,
      color: 'cyan',
    },
    {
      name: 'Stress Resilience & Adaptability',
      desc: 'Cognitive reframing, agile adaptability, and maintaining composure during crises.',
      modules: 2,
      hours: '3.0 hrs',
      points: 115,
      icon: Flame,
      color: 'rose',
    },
  ];

  return (
    <div className="min-h-screen bg-[#05100B] text-text flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* ================= STICKY TOPBAR WITH BRAND & QUICK ACCESS ================= */}
      <nav className="border-b border-[#164E37] bg-[#071811]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-300 via-emerald-500 to-emerald-700 flex items-center justify-center p-2 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
                <path
                  d="M19 8.5C19 6.01472 16.9853 4 14.5 4H8C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12H15C17.2091 12 19 13.7909 19 16C19 18.2091 17.2091 20 15 20H8.5C6.01472 20 4 17.9853 4 15.5"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight block leading-tight">
                Student Skill Development Platform
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 tracking-[0.25em] uppercase block">
                SOFT SKILLS ONLY • FASTAPI + REACT + MONGODB
              </span>
            </div>
          </Link>

          {/* Quick Jump Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 text-xs text-text-muted font-medium">
            <a href="#features" className="hover:text-white transition-colors">
              Features Explorer
            </a>
            <a href="#disciplines" className="hover:text-white transition-colors">
              12 Disciplines
            </a>
            <a href="#star-lab" className="hover:text-white transition-colors">
              STAR Lab
            </a>
            <a href="#portals" className="hover:text-white transition-colors">
              Merged Directory
            </a>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-teal-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              API Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-[#0C2D20] hover:bg-[#123C2B] border border-[#164E37] text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>Sign In</span>
            </Link>
            <button
              onClick={() => handleLaunchFeature('/student', 'student')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 space-y-24 pb-24">
        {/* ================= HERO SECTION WITH FAST LAUNCH BAR ================= */}
        <section className="relative overflow-hidden pt-12 pb-14 lg:pt-20 lg:pb-20">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-600/15 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute top-40 right-10 w-[400px] h-[300px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B281D] border border-emerald-500/30 text-xs text-emerald-300 font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Dedicated Collegiate Soft-Skills Platform • Zero Technical Courses</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none mb-6">
              Master the Human Skills That <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-400">
                Launch Modern Careers
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              All platform features merged into a single interactive website: 12 behavioral disciplines,
              20-question situational diagnostics, STAR mock
              interview simulations, and verifiable PDF transcripts.
            </p>

            {/* Quick 1-Click Launch Bar for All 3 Portals */}
            <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-[#081E15]/95 border border-emerald-900/50 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-teal-400 fill-current" />
                  Instant 1-Click Feature Exploration (No Typing Required):
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">Active Localhost Session</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleLaunchFeature('/student', 'student')}
                  disabled={loggingInRole !== null}
                  className="p-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-200 text-xs font-semibold transition-all flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-teal-400 flex items-center justify-center font-bold">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-white leading-tight">Student Portal</span>
                      <span className="text-[10px] text-slate-400">24 Modules • STAR Lab</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-teal-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleLaunchFeature('/admin', 'admin')}
                  disabled={loggingInRole !== null}
                  className="p-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-200 text-xs font-semibold transition-all flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-white leading-tight">Admin Tower</span>
                      <span className="text-[10px] text-slate-400">KPIs • User Control</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= INTERACTIVE FEATURES SHOWCASE & EXPLORER ================= */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-teal-400 font-semibold mb-3">
              <Layers className="w-3.5 h-3.5" /> All Features In One Place
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Interactive Platform Feature Explorer
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
              Explore the core components of the platform right here, or click to test-drive them live on localhost.
            </p>
          </div>

          {/* Feature Tabs Header */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            {[
              { id: 'curriculum', label: '📚 12 Soft-Skill Tracks', route: '/student/modules', role: 'student' },
              { id: 'diagnostic', label: '📝 Situational Diagnostic', route: '/student/assessments', role: 'student' },
              { id: 'star', label: '🎙️ STAR Mock Interview', route: '/student/interviews', role: 'student' },
              { id: 'transcripts', label: '📊 PDF Transcripts', route: '/student/progress', role: 'student' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-blue-400'
                    : 'bg-[#092319] border border-[#164E37] text-slate-400 hover:text-white hover:bg-[#0D3123]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Curriculum & Modules Explorer */}
          {activeTab === 'curriculum' && (
            <div className="rounded-3xl bg-[#081E15] border border-blue-900/40 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">24+ Structured Soft-Skill Modules</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Each module features micro-lessons, reflective exercises, and automatic progress saving.
                  </p>
                </div>
                <button
                  onClick={() => handleLaunchFeature('/student/modules', 'student')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                  <span>Open Full Module Browser</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#06140E] border border-emerald-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-400">Module 01</span>
                    <span className="text-amber-400 font-mono font-bold">+50 pts</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Active Listening & Empathetic Inquiry</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Master non-verbal mirroring, clarifying paraphrases, and eliminating cognitive distractions.
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 flex justify-between">
                    <span>3 Lessons • 45 Mins</span>
                    <span className="text-emerald-400 font-semibold">Intermediate</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#06140E] border border-emerald-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-400">Module 02</span>
                    <span className="text-amber-400 font-mono font-bold">+60 pts</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">De-escalating Workplace Friction</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Frameworks for addressing tense interpersonal disagreements with objective behavioral scripts.
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 flex justify-between">
                    <span>4 Lessons • 60 Mins</span>
                    <span className="text-rose-400 font-semibold">Advanced</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#06140E] border border-emerald-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">Module 03</span>
                    <span className="text-amber-400 font-mono font-bold">+45 pts</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Executive Presentation & Delivery</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Vocal pacing, slide economy, and framing project milestones for leadership review.
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 flex justify-between">
                    <span>3 Lessons • 40 Mins</span>
                    <span className="text-teal-400 font-semibold">Beginner</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Situational Diagnostic Assessment */}
          {activeTab === 'diagnostic' && (
            <div className="rounded-3xl bg-[#081E15] border border-blue-900/40 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">20-Question Situational Diagnostic</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluates interpersonal judgment using workplace scenarios with transparent scoring.
                  </p>
                </div>
                <button
                  onClick={() => handleLaunchFeature('/student/assessments', 'student')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                  <span>Take Assessment Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sample Question Preview Card */}
              <div className="p-5 rounded-2xl bg-[#06140E] border border-blue-900/40 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-teal-400 uppercase tracking-wider text-[11px]">
                    Sample Scenario #04: Team Communication Under Pressure
                  </span>
                  <span className="text-amber-400 font-mono font-bold">+75 pts</span>
                </div>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  "Your team is 48 hours away from a key semester presentation. A teammate informs you they haven't started their portion due to personal stress. What is your most constructive first response?"
                </p>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-[#081E15] border border-blue-900/40 text-slate-300">
                    A) Privately listen to their situation, assess what can be trimmed, and redistribute tasks collaboratively.
                  </div>
                  <div className="p-3 rounded-xl bg-[#081E15] border border-blue-900/40 text-slate-300">
                    B) Immediately notify the professor so your personal grading isn't penalized.
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  *Answers and explanations are dynamically stripped on the client until submission to guarantee assessment integrity.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: STAR Mock Interview Lab */}
          {activeTab === 'star' && (
            <div className="rounded-3xl bg-[#081E15] border border-blue-900/40 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">STAR Behavioral Mock Interview Lab</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Rehearse placement interview responses with structured Situation, Task, Action, Result quadrants.
                  </p>
                </div>
                <button
                  onClick={() => handleLaunchFeature('/student/interviews', 'student')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                  <span>Open Mock Interview Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* STAR Quadrants Interactive Demo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { key: 'situation', title: 'S • Situation', hint: 'Set the context & team challenge' },
                  { key: 'task', title: 'T • Task', hint: 'Define your specific accountability' },
                  { key: 'action', title: 'A • Action', hint: 'Concrete empathetic steps taken' },
                  { key: 'result', title: 'R • Result', hint: 'Quantifiable positive outcome' },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setActiveStarTab(item.key)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      activeStarTab === item.key
                        ? 'bg-emerald-600/20 border-blue-500 text-white shadow-md'
                        : 'bg-[#06140E] border-emerald-900/30 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-teal-400 block mb-1">{item.title}</span>
                    <span className="text-[11px] text-slate-400">{item.hint}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-[#06140E] border border-blue-900/40 text-xs">
                <span className="font-bold text-slate-300 block mb-1">
                  Active STAR Rehearsal Guide ({activeStarTab.toUpperCase()}):
                </span>
                <p className="text-slate-400 leading-relaxed">
                  {activeStarTab === 'situation' &&
                    'Start with 1-2 sentences identifying the project, setting, and interpersonal challenge.'}
                  {activeStarTab === 'task' &&
                    'State what needed resolution, clearly establishing what was expected of you as an individual.'}
                  {activeStarTab === 'action' &&
                    'Highlight specific leadership, active listening, or mediation techniques you deployed.'}
                  {activeStarTab === 'result' &&
                    'Conclude with the measurable result, teammate feedback, and key behavioral learnings.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 4: PDF Transcripts */}
          {activeTab === 'transcripts' && (
            <div className="rounded-3xl bg-[#081E15] border border-blue-900/40 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">ReportLab PDF Portfolio & Transcripts</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Generate tamper-proof, placement-ready PDF credentials with faculty endorsements.
                  </p>
                </div>
                <button
                  onClick={() => handleLaunchFeature('/student/progress', 'student')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                  <span>Download Sample PDF</span>
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#06140E] border border-emerald-900/30 text-xs space-y-3">
                <div className="flex items-center gap-2 text-teal-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Documented Transparent Readiness Formula</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-mono bg-[#081E15] p-3 rounded-xl border border-emerald-900/30">
                  Readiness Index = Assessment Score
                </p>
                <p className="text-slate-400 text-[11px]">
                  Includes your diagnostic breakdown, completed learning milestones, and report generation date.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ================= 12 CORE SOFT-SKILL DISCIPLINES ================= */}
        <section id="disciplines" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-teal-400 font-semibold mb-3">
              <BookOpen className="w-3.5 h-3.5" /> Behavioral Curriculum
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              12 Behavioral Soft-Skills Disciplines
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Every course is structured around workplace psychology, non-defensive communication,
              teamwork, and leadership dynamics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#081D14] border border-[#164E37] hover:border-blue-500/50 p-5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-teal-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/20">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-400 font-mono">
                      +{cat.points} pts
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors mb-1.5">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{cat.desc}</p>
                </div>

                <div className="pt-3 border-t border-[#164E37]/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" /> {cat.hours}
                  </span>
                  <button
                    onClick={() => handleLaunchFeature('/student/modules', 'student')}
                    className="text-emerald-400 hover:text-sky-300 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Launch Module</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= MERGED MASTER DIRECTORY (ALL FEATURES) ================= */}
        <section id="portals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Merged Master Platform Directory
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
              Direct live links to every feature in your application. Click any card to launch immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Suite */}
            <div className="rounded-2xl bg-[#081E15] border border-blue-900/40 p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-xl">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-teal-400 flex items-center justify-center font-bold mb-4 border border-emerald-500/30">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Student Learning Suite</h3>
                <p className="text-xs text-slate-400 mb-5">
                  6 features for self-paced soft-skills mastery, diagnostics, and interview prep.
                </p>

                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Soft-Skill Modules & Lessons', path: '/student/modules', badge: '24 Modules' },
                    { label: 'Situational Diagnostic Test', path: '/student/assessments', badge: '20 Qs' },
                    { label: 'STAR Mock Interview Lab', path: '/student/interviews', badge: 'Placement' },
                    { label: 'Personalized Learning Roadmap', path: '/student/learning-path', badge: 'Smart AI' },
                    { label: 'Progress Analytics & PDF Transcripts', path: '/student/progress', badge: 'ReportLab' },
                    { label: 'Achievements & Leaderboard', path: '/student/achievements', badge: 'Gamified' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLaunchFeature(item.path, 'student')}
                      className="w-full p-2.5 rounded-xl bg-[#0B281D] hover:bg-emerald-600/20 border border-[#164E37] hover:border-emerald-500/40 transition-all flex items-center justify-between text-slate-300 hover:text-white"
                    >
                      <span className="font-medium truncate">{item.label}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-sky-300 border border-emerald-500/20 shrink-0">
                        {item.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleLaunchFeature('/student', 'student')}
                className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/25 transition-all"
              >
                <span>Launch Student Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Admin Control Tower */}
            <div className="rounded-2xl bg-[#081E15] border border-emerald-900/40 p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-xl">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold mb-4 border border-emerald-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Administrative Control Tower</h3>
                <p className="text-xs text-slate-400 mb-5">
                  6 features for platform administration, user provisioning, and security logs.
                </p>

                <div className="space-y-2 text-xs">
                  {[
                    { label: 'System Overview & Control Tower', path: '/admin', badge: 'KPIs' },
                    { label: 'User Directory & Permissions', path: '/admin/users', badge: 'RBAC' },
                    { label: 'Faculty Mentee Assignments', path: '/admin/assignments', badge: 'Pairing' },
                    { label: 'Macro Platform Analytics', path: '/admin/analytics', badge: 'Telemetry' },
                    { label: 'Security & Action Audit Logs', path: '/admin/audit-logs', badge: 'Auditing' },
                    { label: 'Platform Settings & Scoring Formula', path: '/admin/settings', badge: 'Weights' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLaunchFeature(item.path, 'admin')}
                      className="w-full p-2.5 rounded-xl bg-[#0B281D] hover:bg-emerald-600/20 border border-[#164E37] hover:border-emerald-500/40 transition-all flex items-center justify-between text-slate-300 hover:text-white"
                    >
                      <span className="font-medium truncate">{item.label}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                        {item.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleLaunchFeature('/admin', 'admin')}
                className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all"
              >
                <span>Launch Admin Control Tower</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ================= UNIFIED FOOTER WITH TECH STACK & LINKS ================= */}
      <footer className="border-t border-[#164E37] bg-[#071811] py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center font-black text-white text-sm">
                SSDP
              </div>
              <div>
                <p className="font-bold text-white text-sm">Student Skill Development Platform</p>
                <p className="text-[11px] text-slate-500">
                  Collegiate Soft Skills • FastAPI + Motor + React 18 + Vite + Tailwind v3.4
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <Link to="/login" className="text-teal-400 font-semibold hover:underline">
                Custom Login Page
              </Link>
              <button onClick={() => handleLaunchFeature('/student/modules', 'student')} className="hover:text-white">
                Curriculum
              </button>
              <button onClick={() => handleLaunchFeature('/student/assessments', 'student')} className="hover:text-white">
                Diagnostic
              </button>
              <button onClick={() => handleLaunchFeature('/student/interviews', 'student')} className="hover:text-white">
                STAR Lab
              </button>
              <button onClick={() => handleLaunchFeature('/admin', 'admin')} className="hover:text-white">
                Admin Tower
              </button>
              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="text-teal-400 hover:underline flex items-center gap-1"
              >
                Swagger API <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-[#164E37]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 Student Skill Development Platform (SSP). All rights reserved.</p>
            <p>12 Human-Centric Behavioral Soft Skills Tracks • Live on Localhost</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
