import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: data.email });
      if (res.data?.success) {
        setSubmitted(true);
        toast.success('Instructions dispatched if email exists.');
      }
    } catch (err) {
      // Always treat gracefully
      setSubmitted(true);
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
          <h1 className="text-2xl font-bold text-text-heading">Reset Password</h1>
          <p className="text-text-muted text-sm mt-1">Enter your registered email to receive recovery instructions</p>
        </div>

        <div className="bg-surface p-7 rounded-2xl border border-border shadow-2xl">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-accent-emerald/20 text-accent-emerald flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-text-heading">Request Received</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                If an account with that email exists, password recovery instructions and a secure reset link have been issued.
              </p>
              <div className="p-3 bg-surface-card border border-border rounded-xl text-xs text-text-dim text-left">
                <strong>Development Note:</strong> In local development mode without an SMTP server configured, check the backend console/terminal to view the generated reset link.
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-surface-light hover:bg-surface-lighter text-sm font-medium border border-border text-text transition-all mt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Valid email required',
                      },
                    })}
                    className={`w-full bg-surface-card border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      errors.email ? 'border-accent-rose' : 'border-border'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-accent-rose text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Sending instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
