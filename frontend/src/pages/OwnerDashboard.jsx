import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Star, 
  MessageSquare, 
  Store, 
  TrendingUp,
  Mail,
  User as UserIcon,
  Smile,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const OwnerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/store-owner');
        setStats(response.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard statistics');
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
              <TrendingUp className="h-5 w-5" />
            </div>
            <span>Store Performance Analytics</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Monitor reviews and rating metrics for your registered stores</p>
        </div>

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Avg Rating Card */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 p-6 rounded-2xl shadow-xl flex items-center space-x-5">
                <div className="bg-amber-500/10 p-4 rounded-xl text-amber-400 border border-amber-500/20">
                  <Star className="h-7 w-7 fill-amber-400" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Rating</span>
                  <div className="flex items-baseline space-x-1.5 mt-1.5">
                    <span className="text-3xl font-extrabold text-white">{stats?.averageRating || '0.00'}</span>
                    <span className="text-xs text-slate-500">/ 5.0</span>
                  </div>
                </div>
              </div>

              {/* Total Reviews Card */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 p-6 rounded-2xl shadow-xl flex items-center space-x-5">
                <div className="bg-indigo-500/10 p-4 rounded-xl text-indigo-400 border border-indigo-500/20">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reviews</span>
                  <span className="block text-3xl font-extrabold text-white mt-1.5">{stats?.totalReviews || 0}</span>
                </div>
              </div>

              {/* Stores Owned Card */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 p-6 rounded-2xl shadow-xl flex items-center space-x-5">
                <div className="bg-emerald-500/10 p-4 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Store className="h-7 w-7" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Stores</span>
                  <span className="block text-3xl font-extrabold text-white mt-1.5">{stats?.storesCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white p-0 m-0">Recent Customer Reviews</h2>
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Customer</th>
                        <th className="py-4 px-6">Store Name</th>
                        <th className="py-4 px-6">Rating</th>
                        <th className="py-4 px-6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-sm">
                      {stats?.reviews.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-16 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Smile className="h-10 w-10 text-slate-500" />
                              <p className="font-medium text-slate-350">No reviews yet</p>
                              <p className="text-xs text-slate-500">Reviews will appear here once users rate your stores</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        stats?.reviews.map((review) => (
                          <tr key={review.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="py-4.5 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="bg-slate-800/85 p-2 rounded-lg text-slate-400">
                                  <UserIcon className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <div className="font-semibold text-white">{review.userName}</div>
                                  <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                                    <Mail className="h-3 w-3" />
                                    <span>{review.userEmail}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4.5 px-6 text-slate-350 font-medium">{review.storeName}</td>
                            <td className="py-4.5 px-6">
                              <div className="flex items-center space-x-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star}
                                    className={`h-4.5 w-4.5 ${
                                      star <= review.rating 
                                        ? 'fill-amber-400 text-amber-400' 
                                        : 'text-slate-700'
                                    }`} 
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="py-4.5 px-6 text-slate-400">
                              <div className="flex items-center space-x-1.5">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <span>{new Date(review.date).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboard;
