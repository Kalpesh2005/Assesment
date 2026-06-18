import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { KeyRound, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(16, 'New password must not exceed 16 characters')
    .regex(PASSWORD_REGEX, 'Password must include at least one uppercase letter and one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

const ChangePassword = () => {
  const { changePassword } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(changePasswordSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast.success('Password updated successfully!');
      reset();
    } catch (err) {
      toast.error(err || 'Failed to update password. Current password may be incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2.5 p-0 m-0">
            <div className="bg-indigo-600/15 p-2 rounded-lg text-indigo-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <span>Change Password</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Update your account security settings</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 p-6 rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full bg-slate-950/60 border ${errors.currentPassword ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'} py-2.5 pl-11 pr-4 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-4 transition-all`}
                  {...register('currentPassword')}
                />
              </div>
              {errors.currentPassword && (
                <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {errors.currentPassword.message}
                </span>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full bg-slate-950/60 border ${errors.newPassword ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'} py-2.5 pl-11 pr-4 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-4 transition-all`}
                  {...register('newPassword')}
                />
              </div>
              {errors.newPassword && (
                <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {errors.newPassword.message}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full bg-slate-950/60 border ${errors.confirmPassword ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'} py-2.5 pl-11 pr-4 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-4 transition-all`}
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChangePassword;
