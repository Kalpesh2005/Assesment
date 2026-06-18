import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { 
  User as UserIcon, 
  ArrowLeft, 
  Mail, 
  MapPin, 
  Shield, 
  Store, 
  Star, 
  Calendar,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await api.get(`/users/${id}`);
        setUserDetails(response.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load user details');
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id, navigate]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Back Link & Header */}
        <div>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white uppercase tracking-wider mb-4 transition-colors cursor-pointer bg-transparent border-0 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Users</span>
          </button>

          <h1 className="text-2xl font-bold text-white flex items-center space-x-2.5 p-0 m-0">
            <div className="bg-indigo-600/15 p-2 rounded-lg text-indigo-400">
              <UserIcon className="h-5 w-5" />
            </div>
            <span>User Details Profile</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Detailed configuration profile and connected storefront resources</p>
        </div>

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Basic Information */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 p-6 rounded-2xl shadow-xl space-y-6 lg:col-span-1">
              <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-850">
                <div className="bg-indigo-600/10 border-2 border-indigo-500/20 p-5 rounded-2xl text-indigo-400">
                  <UserIcon className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">{userDetails?.name}</h3>
                  <span className={`
                    inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2.5
                    ${userDetails?.role === 'ADMIN' && 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}
                    ${userDetails?.role === 'STORE_OWNER' && 'bg-teal-500/10 text-teal-400 border border-teal-500/20'}
                    ${userDetails?.role === 'USER' && 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}
                  `}>
                    {userDetails?.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-4 text-sm">
                {/* Email */}
                <div className="flex items-start space-x-3 text-slate-350">
                  <Mail className="h-4.5 w-4.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Email Address</span>
                    <span className="text-white font-medium break-all">{userDetails?.email}</span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-3 text-slate-350">
                  <MapPin className="h-4.5 w-4.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Physical Address</span>
                    <span className="text-slate-300 leading-relaxed">{userDetails?.address}</span>
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-start space-x-3 text-slate-350">
                  <Calendar className="h-4.5 w-4.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Member Since</span>
                    <span className="text-white font-medium">
                      {new Date(userDetails?.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Connected Stores (Only for Store Owners) */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-white p-0 m-0 flex items-center space-x-2">
                <Store className="h-5 w-5 text-indigo-400" />
                <span>Connected Storefront Details</span>
              </h2>

              {userDetails?.role !== 'STORE_OWNER' ? (
                <div className="bg-slate-900/10 border border-slate-850 p-10 rounded-2xl text-center text-slate-400 text-sm">
                  <Shield className="h-10 w-10 text-slate-600 mx-auto mb-2.5" />
                  <span>Store Details are only available for user accounts registered as Store Owners.</span>
                </div>
              ) : !userDetails?.stores || userDetails.stores.length === 0 ? (
                <div className="bg-slate-900/10 border border-slate-850 p-10 rounded-2xl text-center text-slate-400 text-sm">
                  <Building className="h-10 w-10 text-slate-600 mx-auto mb-2.5" />
                  <span>No stores currently assigned to this store owner account.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userDetails.stores.map((store) => (
                    <div 
                      key={store.id} 
                      className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl shadow-xl flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-white text-base leading-tight">{store.name}</h4>
                          <div className="flex items-center space-x-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-xs">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-amber-300 font-bold">{store.averageRating || '0.0'}</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-400">
                          <div className="flex items-start space-x-2">
                            <Mail className="h-3.5 w-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                            <span className="break-all">{store.email}</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{store.address}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-850 text-right text-xs text-slate-500">
                        Total Reviews Received: <span className="text-white font-bold">{store.totalRatings}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserDetails;
