import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Users, 
  Store, 
  Star, 
  ShieldAlert, 
  TrendingUp,
  Settings,
  ShieldCheck,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/admin');
        setStats(response.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load admin dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2.5 p-0 m-0">
            <div className="bg-indigo-600/15 p-2 rounded-lg text-indigo-400">
              <Settings className="h-5 w-5" />
            </div>
            <span>System Administrator Console</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Overview of system-wide records, storefronts, and rating submissions</p>
        </div>

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Users */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 p-6 rounded-2xl shadow-xl flex items-center space-x-5">
                <div className="bg-indigo-500/10 p-4 rounded-xl text-indigo-400 border border-indigo-500/20 animate-pulse">
                  <Users className="h-7 w-7" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
                  <span className="block text-3xl font-extrabold text-white mt-1.5">{stats?.totalUsers || 0}</span>
                </div>
              </div>

              {/* Total Stores */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 p-6 rounded-2xl shadow-xl flex items-center space-x-5">
                <div className="bg-emerald-500/10 p-4 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Store className="h-7 w-7" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Stores</span>
                  <span className="block text-3xl font-extrabold text-white mt-1.5">{stats?.totalStores || 0}</span>
                </div>
              </div>

              {/* Total Ratings */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 p-6 rounded-2xl shadow-xl flex items-center space-x-5">
                <div className="bg-amber-500/10 p-4 rounded-xl text-amber-400 border border-amber-500/20">
                  <Star className="h-7 w-7 fill-amber-400" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ratings</span>
                  <span className="block text-3xl font-extrabold text-white mt-1.5">{stats?.totalRatings || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Breakdown Cards */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white p-0 m-0">User Accounts Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Admin Accounts */}
                <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-purple-500/10 p-2.5 rounded-lg text-purple-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-bold text-white">{stats?.roleCounts?.admin || 0}</span>
                  </div>
                  <h4 className="font-semibold text-white text-sm">System Administrators</h4>
                  <p className="text-xs text-slate-500 mt-1">Full privileges to manage users and view stores</p>
                </div>

                {/* Store Owner Accounts */}
                <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-teal-500/10 p-2.5 rounded-lg text-teal-400">
                      <Building className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-bold text-white">{stats?.roleCounts?.storeOwner || 0}</span>
                  </div>
                  <h4 className="font-semibold text-white text-sm">Store Owners</h4>
                  <p className="text-xs text-slate-500 mt-1">Manage single/multiple storefront reviews</p>
                </div>

                {/* Normal Users */}
                <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-500/10 p-2.5 rounded-lg text-indigo-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-bold text-white">{stats?.roleCounts?.user || 0}</span>
                  </div>
                  <h4 className="font-semibold text-white text-sm">Normal Users</h4>
                  <p className="text-xs text-slate-500 mt-1">Submit rating scores and review stores</p>
                </div>
              </div>
            </div>

            {/* Quick Guidelines */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl flex items-start space-x-3.5">
              <ShieldAlert className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-indigo-300 text-sm">Administrative Authority Note</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  As a System Administrator, you possess permissions to create, view, edit, and delete all user records (Administrators, Store Owners, Normal Users) and storefront registrations. Use the navigation sidebar to access user management, store management, or detail screens.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
