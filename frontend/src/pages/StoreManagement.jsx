import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Store, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  X, 
  AlertCircle,
  Star,
  User as UserIcon,
  Smile
} from 'lucide-react';
import toast from 'react-hot-toast';

const storeFormSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(1, 'Store address is required'),
  ownerId: z.string().min(1, 'Please select a store owner')
});

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [owners, setOwners] = useState([]); // List of store owners for select dropdown
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStores, setTotalStores] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // ADD or EDIT
  const [editingStore, setEditingStore] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(storeFormSchema)
  });

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/stores', {
        params: {
          page,
          limit: 10,
          search,
          sortBy,
          sortOrder
        }
      });
      setStores(response.data.data);
      setTotalPages(response.data.meta.totalPages);
      setTotalStores(response.data.meta.total);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  const fetchOwners = async () => {
    try {
      // Fetch users with role STORE_OWNER
      const response = await api.get('/users', {
        params: { limit: 100, role: 'STORE_OWNER' }
      });
      setOwners(response.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load store owners list');
    }
  };

  useEffect(() => {
    fetchStores();
    fetchOwners();
  }, [fetchStores]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortBy(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
    setPage(1);
  };

  const openAddModal = () => {
    setModalMode('ADD');
    setEditingStore(null);
    reset({
      name: '',
      email: '',
      address: '',
      ownerId: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (store) => {
    setModalMode('EDIT');
    setEditingStore(store);
    reset({
      name: store.name,
      email: store.email,
      address: store.address,
      ownerId: store.ownerId
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitLoading(true);
    try {
      if (modalMode === 'ADD') {
        await api.post('/stores', data);
        toast.success('Store created successfully');
      } else {
        await api.put(`/stores/${editingStore.id}`, data);
        toast.success('Store updated successfully');
      }
      setIsModalOpen(false);
      fetchStores();
    } catch (err) {
      toast.error(err || 'Operation failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this store? This will delete all its rating scores.')) {
      return;
    }
    try {
      await api.delete(`/stores/${id}`);
      toast.success('Store deleted successfully');
      fetchStores();
    } catch (err) {
      toast.error(err || 'Failed to delete store');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2.5 p-0 m-0">
              <div className="bg-emerald-600/15 p-2 rounded-lg text-emerald-400">
                <Store className="h-5 w-5" />
              </div>
              <span>Store Management</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Register, update, or delete storefront details and reassign owners</p>
          </div>

          <button
            onClick={openAddModal}
            className="w-full md:w-fit bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Store</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-900/20 p-4 border border-slate-850 rounded-2xl">
          <div className="relative">
            <Search className="absolute inset-y-0 left-3 h-5 w-5 text-slate-500 flex items-center my-auto" />
            <input
              type="text"
              placeholder="Search stores by name or address..."
              value={search}
              onChange={handleSearch}
              className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-2 rounded-xl placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Store Table Grid */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">
                    <button 
                      onClick={() => handleSort('name')} 
                      className="flex items-center space-x-1.5 hover:text-white cursor-pointer"
                    >
                      <span>Store Name</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="py-4 px-6">
                    <button 
                      onClick={() => handleSort('email')} 
                      className="flex items-center space-x-1.5 hover:text-white cursor-pointer"
                    >
                      <span>Email</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="py-4 px-6">Address</th>
                  <th className="py-4 px-6">
                    <button 
                      onClick={() => handleSort('averageRating')} 
                      className="flex items-center space-x-1.5 hover:text-white cursor-pointer"
                    >
                      <span>Avg Rating</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="py-4 px-6">Store Owner</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        <span>Loading storefront list...</span>
                      </div>
                    </td>
                  </tr>
                ) : stores.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Smile className="h-10 w-10 text-slate-500" />
                        <p className="font-medium text-slate-350">No stores found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stores.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4.5 px-6 font-semibold text-white">{item.name}</td>
                      <td className="py-4.5 px-6 text-slate-350">{item.email}</td>
                      <td className="py-4.5 px-6 text-slate-400 max-w-xs truncate">{item.address}</td>
                      <td className="py-4.5 px-6">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-white font-semibold">{item.averageRating || '0.0'}</span>
                          <span className="text-xs text-slate-505">({item.totalRatings})</span>
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex items-center space-x-2">
                          <div className="bg-teal-500/10 p-1.5 rounded text-teal-400 border border-teal-500/15">
                            <UserIcon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-white font-medium block truncate max-w-[120px]">{item.ownerName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4.5 px-6 text-right space-x-2.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(item)}
                          className="inline-flex bg-slate-800 hover:bg-slate-750 p-1.5 rounded-lg text-slate-450 hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex bg-slate-800 hover:bg-rose-500/10 p-1.5 rounded-lg text-slate-450 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-slate-900/80 px-6 py-4.5 flex justify-between items-center border-t border-slate-800 text-xs text-slate-400">
              <div>
                Showing <span className="text-white font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                <span className="text-white font-medium">
                  {Math.min(page * 10, totalStores)}
                </span>{' '}
                of <span className="text-white font-medium">{totalStores}</span> stores
              </div>

              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-850 hover:text-white cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-semibold text-white">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-850 hover:text-white cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Store Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-6">
              {modalMode === 'ADD' ? 'Register New Store' : 'Edit Store Details'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Store Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Store Name</label>
                <input
                  type="text"
                  placeholder="e.g. BestBuy Electronics"
                  className={`w-full bg-slate-950/60 border ${errors.name ? 'border-rose-500/80' : 'border-slate-800'} py-2.5 px-4 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors text-sm`}
                  {...register('name')}
                />
                {errors.name && (
                  <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.name.message}
                  </span>
                )}
              </div>

              {/* Store Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Store Contact Email</label>
                <input
                  type="email"
                  placeholder="contact@store.com"
                  className={`w-full bg-slate-950/60 border ${errors.email ? 'border-rose-500/80' : 'border-slate-800'} py-2.5 px-4 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors text-sm`}
                  {...register('email')}
                />
                {errors.email && (
                  <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.email.message}
                  </span>
                )}
              </div>

              {/* Store Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Store Address</label>
                <textarea
                  placeholder="Physical street address..."
                  rows="3"
                  className={`w-full bg-slate-950/60 border ${errors.address ? 'border-rose-500/80' : 'border-slate-800'} py-2.5 px-4 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors resize-none text-sm`}
                  {...register('address')}
                ></textarea>
                {errors.address && (
                  <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.address.message}
                  </span>
                )}
              </div>

              {/* Owner Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Store Owner</label>
                <select
                  className={`w-full bg-slate-950/60 border ${errors.ownerId ? 'border-rose-500/80' : 'border-slate-800'} py-2.5 px-4 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm`}
                  {...register('ownerId')}
                >
                  <option value="">-- Select Store Owner --</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
                </select>
                {errors.ownerId && (
                  <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.ownerId.message}
                  </span>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm shadow-md shadow-indigo-600/10 transition-colors cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {submitLoading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Save Store</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StoreManagement;
