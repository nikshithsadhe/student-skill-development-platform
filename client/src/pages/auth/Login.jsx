import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Shield,
  GraduationCap,
  Users,
  Check,
  Target,
  Lightbulb,
  MessageSquare,
  Clock,
  TrendingUp,
  Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState(null);
  const brandTapRef = useRef({ count: 0, startedAt: 0 });

  const handleBrandTap = (event) => {
    event.preventDefault();
    const now = Date.now();
    const previous = brandTapRef.current;
    const count = now - previous.startedAt <= 2500 ? previous.count + 1 : 1;

    if (count === 4) {
      brandTapRef.current = { count: 0, startedAt: 0 };
      navigate('/admin-signup');
      return;
    }

    brandTapRef.current = {
      count,
      startedAt: previous.count ? previous.startedAt : now,
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    if (location.state?.from?.pathname?.startsWith('/student')) {
      toast('Please sign in to access the Student Workspace.', {
        id: 'auth-required-student',
        icon: '🎓',
        duration: 3500,
      });
    }
  }, [location.state]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    const identifier = data.username.trim();
    const result = await login(identifier, data.password);
    setSubmitting(false);

    if (result.success) {
      const role = result.user.role;
      const redirectPath =
        location.state?.from?.pathname ||
        (role === 'admin' ? '/admin' : '/student');
      navigate(redirectPath, { replace: true });
    }
  };

  const handleQuickDemo = (role, defaultIdentifier, password) => {
    setActiveDemoRole(role);
    setValue('username', defaultIdentifier);
    setValue('password', password);
    toast.success(`Loaded ${role} credentials! Click Login or press Enter.`);
  };

  return (
    <div className="login-page min-h-screen bg-[#05100B] text-white flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      {/* Background Animated Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      {/* Breathing Ambient Emerald Glow Orbs */}
      <div className="absolute -top-20 -left-20 w-[480px] h-[480px] bg-emerald-600/15 rounded-full blur-[150px] animate-pulse-glow pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] bg-teal-500/15 rounded-full blur-[160px] animate-pulse-glow pointer-events-none delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-950/30 rounded-full blur-[180px] pointer-events-none" />

      {/* Floating Sparkle Dust Effect */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-emerald-400/40 blur-[1px] animate-float-slow" />
      <div className="absolute bottom-1/3 left-1/5 w-2.5 h-2.5 rounded-full bg-teal-300/40 blur-[1px] animate-float-reverse" />

      {/* ================= MAIN SPLIT CARD (ANIMATED ENTRANCE) ================= */}
      <div className="w-full max-w-5xl rounded-[28px] overflow-hidden bg-[#07150F]/95 border border-emerald-800/40 shadow-2xl shadow-emerald-950/90 grid grid-cols-1 lg:grid-cols-12 min-h-[640px] relative z-10 animate-card-entrance backdrop-blur-xl">
        {/* ================= LEFT PANEL: LOGIN FORM ================= */}
        <div className="lg:col-span-6 p-7 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#06120D]/90 relative">
          {/* Top Logo and Branding */}
          <div>
            <div className="animate-stagger-1">
              <div className="inline-flex items-center gap-3">
                {/* Stylized layered S-logo with glowing hover micro-interaction */}
                <Link to="/" aria-label="Student Skill Development Platform home" className="group flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-300 via-emerald-500 to-emerald-700 flex items-center justify-center p-2 shadow-lg shadow-emerald-500/30 group-hover:scale-105 group-hover:shadow-emerald-400/50 transition-all duration-300">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-full h-full text-white"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19 8.5C19 6.01472 16.9853 4 14.5 4H8C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12H15C17.2091 12 19 13.7909 19 16C19 18.2091 17.2091 20 15 20H8.5C6.01472 20 4 17.9853 4 15.5"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={handleBrandTap}
                  title="Tap four times to open administrator sign up"
                  aria-label="Student Skill Development Platform. Tap four times to open administrator sign up."
                  className="max-w-[270px] text-left font-bold text-white text-xs sm:text-sm tracking-tight leading-tight hover:text-emerald-300 transition-colors"
                >
                  Student Skill Development Platform
                </button>
              </div>
            </div>

            {/* Login Titles */}
            <div className="mt-8 mb-6 animate-stagger-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Login
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Enter your account details
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Identifier Input with glowing micro-interaction */}
              <div className="animate-stagger-3">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email, Student ID, or Name
                </label>
                <div
                  className={`group relative rounded-xl bg-[#063B2C] border transition-all duration-200 ${
                    errors.username
                      ? 'border-rose-500/80 ring-2 ring-rose-500/30'
                      : 'border-emerald-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25'
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-400/80 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-300 group-focus-within:scale-110 transition-all" />
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your email, student ID, or name"
                    {...register('username', {
                      required: 'Email, student ID, or name is required',
                    })}
                  className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs text-emerald-100 placeholder-emerald-300 focus:outline-none"
                  />
                </div>
                {errors.username && (
                  <p className="text-rose-400 text-[11px] mt-1 pl-1">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Input with eye toggle */}
              <div className="animate-stagger-4">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div
                  className={`group relative rounded-xl bg-[#063B2C] border transition-all duration-200 ${
                    errors.password
                      ? 'border-rose-500/80 ring-2 ring-rose-500/30'
                      : 'border-emerald-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25'
                  }`}
                >
                  <Lock className="w-4 h-4 text-emerald-400/80 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-300 group-focus-within:scale-110 transition-all" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...register('password', {
                      required: 'Password is required',
                    })}
                    className="w-full bg-transparent pl-10 pr-10 py-2.5 text-xs text-emerald-100 placeholder-emerald-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-rose-400 text-[11px] mt-1 pl-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="pt-0.5 animate-stagger-4">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors inline-block hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Shimmer Submit Button */}
              <div className="animate-stagger-5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="shimmer-button w-full py-3 px-6 rounded-xl font-bold text-sm text-[#041F16] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 hover:from-emerald-400 hover:to-teal-200 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/60 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-emerald-950 border-t-white rounded-full animate-spin" />
                      <span className="text-emerald-950 font-bold">Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-black text-emerald-950">Login</span>
                      <ArrowRight className="w-4 h-4 text-emerald-950 group-hover:translate-x-1.5 transition-transform duration-200" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Actions & Animated Demo Fast-Fill */}
          <div className="mt-6 pt-5 border-t border-emerald-950/70 animate-stagger-5">
            <p className="text-xs text-slate-400 text-center mb-3.5">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
                Sign Up
              </Link>
            </p>

            {/* Quick Demo Credentials with Interactive Pill Animation */}
            <div className="bg-[#091811]/90 rounded-2xl p-3 border border-emerald-900/30">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-2">
                <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" style={{ animationDuration: '6s' }} />
                  1-Click Demo Fill:
                </span>
                <span className="text-[10px] text-slate-500">Auto-loads credentials</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('Student', 'student@college.edu', 'Password123!')}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-200 flex items-center justify-center gap-1 hover:-translate-y-0.5 active:scale-95 ${
                    activeDemoRole === 'Student'
                      ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-600/15 hover:bg-emerald-600/30 border-emerald-500/30 text-emerald-200'
                  }`}
                >
                  {activeDemoRole === 'Student' ? (
                    <Check className="w-3 h-3 text-emerald-300" />
                  ) : (
                    <GraduationCap className="w-3 h-3 text-teal-400" />
                  )}
                  <span>Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('Admin', 'admin@ssp.edu', 'AdminPass123!')}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-200 flex items-center justify-center gap-1 hover:-translate-y-0.5 active:scale-95 ${
                    activeDemoRole === 'Admin'
                      ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-700/20 hover:bg-emerald-700/35 border-emerald-500/40 text-emerald-100'
                  }`}
                >
                  {activeDemoRole === 'Admin' ? (
                    <Check className="w-3 h-3 text-emerald-300" />
                  ) : (
                    <Shield className="w-3 h-3 text-emerald-400" />
                  )}
                  <span>Admin</span>
                </button>
              </div>
            </div>
          </div>

          {/* Decorative ambient glowing circle in bottom-left */}
          <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
        </div>

        {/* ================= RIGHT PANEL: 1080P HERO WITH FLOATING BADGES & ANIMATIONS ================= */}
        <div className="login-hero-panel lg:col-span-6 relative bg-gradient-to-br from-[#064E3B] via-[#043E2E] to-[#022C20] flex flex-col items-center justify-center overflow-hidden min-h-[460px] lg:min-h-full group">
          {/* High-definition 1080p green hero image with subtle hover zoom */}
          <img
            src="/login-green-hero.png"
            alt="Welcome to Student Skill Development Platform"
            className="login-hero-image w-full h-full object-cover object-center select-none"
            draggable={false}
          />

          {/* Subtle light shimmer sweep over image on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Vignette depth overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-emerald-950/20 pointer-events-none" />

          {/* Floating Glass Badges (Professional SaaS Parallax Effect) */}
          <div className="absolute top-6 right-6 glass-pill px-3 py-1.5 rounded-full flex items-center gap-2 animate-float-slow pointer-events-none">
            <span className="relative flex w-2 h-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.95)]" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-200">🎯 STAR Method Ready</span>
          </div>

          <div className="absolute bottom-16 left-6 glass-pill px-3 py-1.5 rounded-full flex items-center gap-2 animate-float-reverse pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span className="text-[11px] font-semibold text-emerald-100">✨ 12 Soft-Skill Tracks</span>
          </div>

          <div className="absolute bottom-6 right-6 glass-pill px-3 py-1.5 rounded-full flex items-center gap-2 animate-float-subtle pointer-events-none">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] font-semibold text-emerald-200">🏆 Verified Certifications</span>
          </div>
        </div>
      </div>
    </div>
  );
}
