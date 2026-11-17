import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSignup() {
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    setSubmitError('');
    const result = await registerAdmin(data);
    setSubmitting(false);

    if (result.success) {
      navigate('/admin', { replace: true });
    } else {
      setSubmitError(result.message || 'Administrator registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-lg relative z-10">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Link to="/" aria-label="SSDP home" className="group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent-blue flex items-center justify-center font-black text-white text-lg shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                SSDP
              </div>
            </Link>
            <span className="text-left font-bold text-text-heading text-sm sm:text-xl">
              Student Skill Development Platform
            </span>
          </div>
          <h1 className="text-2xl font-bold text-text-heading">Administrator Registration</h1>
          <p className="text-text-muted text-sm mt-1">Create your platform administrator account</p>
        </header>

        <section className="bg-surface p-7 rounded-2xl border border-border shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="admin-full-name" className="block text-xs font-medium text-text-muted mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-full-name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Alex Sharma"
                  {...register('full_name', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Minimum 2 characters' },
                    maxLength: { value: 100, message: 'Maximum 100 characters' },
                  })}
                  className={`w-full bg-[#12345B] border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                    errors.full_name ? 'border-accent-rose' : 'border-border'
                  }`}
                />
              </div>
              {errors.full_name && <p className="text-accent-rose text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium text-text-muted mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@organization.edu"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Valid email required',
                    },
                  })}
                  className={`w-full bg-[#12345B] border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                    errors.email ? 'border-accent-rose' : 'border-border'
                  }`}
                />
              </div>
              {errors.email && <p className="text-accent-rose text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="admin-password" className="block text-xs font-medium text-text-muted mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Minimum 8 characters' },
                      maxLength: { value: 72, message: 'Maximum 72 characters' },
                    })}
                    className={`w-full bg-[#12345B] border rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      errors.password ? 'border-accent-rose' : 'border-border'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-accent-rose text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="admin-confirm-password" className="block text-xs font-medium text-text-muted mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    {...register('confirm_password', {
                      required: 'Please confirm password',
                      validate: (value) => value === passwordValue || 'Passwords do not match',
                    })}
                    className={`w-full bg-[#12345B] border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      errors.confirm_password ? 'border-accent-rose' : 'border-border'
                    }`}
                  />
                </div>
                {errors.confirm_password && <p className="text-accent-rose text-xs mt-1">{errors.confirm_password.message}</p>}
              </div>
            </div>

            {submitError && (
              <p className="rounded-lg border border-accent-rose/30 bg-accent-rose/10 px-3 py-2 text-xs text-accent-rose" role="alert">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {submitting ? 'Creating Account...' : 'Complete Administrator Registration'}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </section>

        <p className="text-center text-xs text-text-muted mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-primary-light font-medium hover:underline">
            Sign In here
          </Link>
        </p>
      </main>
    </div>
  );
}
