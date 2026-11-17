import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Mail, Hash, BookOpen, Layers, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const brandTapRef = useRef({ count: 0, startedAt: 0 });

  const handleBrandTap = () => {
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
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
      student_id: '',
      branch: 'Computer Engineering',
      semester: 1,
      password: '',
      confirm_password: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    const result = await registerUser({
      ...data,
      semester: parseInt(data.semester, 10),
    });
    setSubmitting(false);

    if (result.success) {
      navigate('/student', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Link to="/" aria-label="SSDP home" className="group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent-blue flex items-center justify-center font-black text-white text-lg shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              SSDP
            </div>
            </Link>
            <button
              type="button"
              onClick={handleBrandTap}
              title="Tap four times to open administrator sign up"
              aria-label="Student Skill Development Platform. Tap four times to open administrator sign up."
              className="text-left font-bold text-text-heading text-sm sm:text-xl hover:text-primary transition-colors"
            >
              Student Skill Development Platform
            </button>
          </div>
          <h1 className="text-2xl font-bold text-text-heading">Student Registration</h1>
          <p className="text-text-muted text-sm mt-1">Join the collegiate soft-skills development ecosystem</p>
        </div>

        {/* Form Card */}
        <div className="bg-surface p-7 rounded-2xl border border-border shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
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
              {errors.full_name && (
                <p className="text-accent-rose text-xs mt-1">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email & Student ID Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">College Email</label>
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
                    className={`w-full bg-[#12345B] border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      errors.email ? 'border-accent-rose' : 'border-border'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-accent-rose text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">USN / Student ID</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. 1CS21CS042"
                    {...register('student_id', {
                      required: 'Student ID / USN is required',
                      minLength: { value: 3, message: 'Minimum 3 characters' },
                    })}
                    className={`w-full bg-[#12345B] border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      errors.student_id ? 'border-accent-rose' : 'border-border'
                    }`}
                  />
                </div>
                {errors.student_id && (
                  <p className="text-accent-rose text-xs mt-1">{errors.student_id.message}</p>
                )}
              </div>
            </div>

            {/* Branch & Semester Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Academic Branch</label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    {...register('branch', { required: 'Branch is required' })}
                    className="w-full bg-[#12345B] border border-[#2D4F78] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option className="bg-[#12345B] text-white" value="Computer Engineering">Computer Engineering</option>
                    <option className="bg-[#12345B] text-white" value="Information Science">Information Science</option>
                    <option className="bg-[#12345B] text-white" value="Electronics">Electronics</option>
                    <option className="bg-[#12345B] text-white" value="Mechanical">Mechanical</option>
                    <option className="bg-[#12345B] text-white" value="Civil">Civil</option>
                    <option className="bg-[#12345B] text-white" value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Current Semester</label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    {...register('semester', { required: 'Semester is required' })}
                    className="w-full bg-[#12345B] border border-[#2D4F78] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option className="bg-[#12345B] text-white" key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Min 8 chars' },
                      maxLength: { value: 72, message: 'Max 72 chars' },
                    })}
                    className={`w-full bg-[#12345B] border rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
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
                <label className="block text-xs font-medium text-text-muted mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirm_password', {
                      required: 'Please confirm password',
                      validate: (value) => value === passwordValue || 'Passwords do not match',
                    })}
                    className={`w-full bg-[#12345B] border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                      errors.confirm_password ? 'border-accent-rose' : 'border-border'
                    }`}
                  />
                </div>
                {errors.confirm_password && (
                  <p className="text-accent-rose text-xs mt-1">{errors.confirm_password.message}</p>
                )}
              </div>
            </div>

            {/* Terms note */}
            <p className="text-[11px] text-text-dim leading-relaxed">
              By creating an account, you agree to participate in constructive soft-skills practice and adhere to respectful peer/faculty communication standards.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Student Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-text-muted mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-primary-light font-medium hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
