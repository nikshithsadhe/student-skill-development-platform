import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: '',
      confirm_password: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Reset token missing from URL');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        password: data.password,
        confirm_password: data.confirm_password,
      });

      if (res.data?.success) {
        setCompleted(true);
        toast.success('Password successfully reset! Please sign in.');
      }
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Failed to reset password. The link may have expired.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent-blue flex items-center justify-center font-black text-white text-lg shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              SSDP
            </div>
            <span className="font-bold text-text-heading text-xl">Student Skill Platform</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-heading">Set New Password</h1>
          <p className="text-text-muted text-sm mt-1">Enter your new secure password below</p>
        </div>

        <div className="bg-surface p-7 rounded-2xl border border-border shadow-2xl">
          {!token ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-accent-rose/20 text-accent-rose flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-text-heading">Invalid Reset Link</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                This reset URL is missing a valid security token. Please request a new password reset.
              </p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-all"
              >
                Request New Link
              </Link>
            </div>
          ) : completed ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-accent-emerald/20 text-accent-emerald flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-text-heading">Password Updated</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Your password has been securely updated. You can now log into your account.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all mt-2"
              >
                Sign In Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Minimum 8 characters' },
                      maxLength: { value: 72, message: 'Maximum 72 characters' },
                    })}
                    className={`w-full bg-surface-card border rounded-xl pl-10 pr-10 py-2.5 text-sm text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      errors.password ? 'border-accent-rose' : 'border-border'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-accent-rose text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirm_password', {
                      required: 'Please confirm password',
                      validate: (v) => v === passwordValue || 'Passwords do not match',
                    })}
                    className={`w-full bg-surface-card border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      errors.confirm_password ? 'border-accent-rose' : 'border-border'
                    }`}
                  />
                </div>
                {errors.confirm_password && (
                  <p className="text-accent-rose text-xs mt-1">{errors.confirm_password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Set New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
