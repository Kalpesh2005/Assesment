import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  X, 
  AlertCircle,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;

const userFormSchema = z.object({
  name: z.string()
    .min(20, 'Name must be at least 20 characters')
    .max(60, 'Name must not exceed 60 characters'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string()
    .min(1, 'Address is required')
    .max(400, 'Address must not exceed 400 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must not exceed 16 characters')
    .regex(PASSWORD_REGEX, 'Password must include one uppercase and one special character')
    .optional().or(z.literal('')), // Optional for edit
  role: z.enum(['ADMIN', 'USER', 'STORE_OWNER'])
});

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // ADD or EDIT
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(userFormSchema)
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/users', {
        params: {
          page,
          limit: 10,
          search,
          role: roleFilter || undefined,
          sortBy,
          sortOrder
        }
      });
      setUsers(response.data.data);
      setTotalPages(response.data.meta.totalPages);
      setTotalUsers(response.data.meta.total);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
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
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      address: '',
      password: '',
      role: 'USER'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode('EDIT');
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      address: user.address,
      password: '', // Kept empty unless changed
      role: user.role
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitLoading(true);
    try {
      if (modalMode === 'ADD') {
        if (!data.password) {
          toast.error('Password is required when creating a new user');
          setSubmitLoading(false);
          return;
        }
        await api.post('/users', data);
        toast.success('User created successfully');
      } else {
        // In EDIT mode, exclude password if empty
        const payload = { ...data };
        if (!payload.password) {
          delete payload.password;
        }
        await api.put(`/users/${editingUser.id}`, payload);
        toast.success('User updated successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err || 'Operation failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err || 'Failed to delete user');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2.5 p-0 m-0">
              <div className="bg-indigo-600/15 p-2 rounded-lg text-indigo-400">
                <Users className="h-5 w-5" />
              </div>
              <span>User Management</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Add, update, or remove administrative, user, or store owner credentials</p>
          </div>

          <button
            onClick={openAddModal}
            className="w-full md:w-fit bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add User</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 bg-slate-900/20 p-4 border border-slate-850 rounded-2xl">
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 left-3 h-5 w-5 text-slate-500 flex items-center my-auto" />
            <input
              type="text"
              placeholder="Search users by name, email, or address..."
              value={search}
              onChange={handleSearch}
              className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-2 rounded-xl placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={handleRoleFilter}
              className="w-full bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">System Admin</option>
              <option value="USER">Normal User</option>
              <option value="STORE_OWNER">Store Owner</option>
            </select>
          </div>
        </div>

        {/* User Table Grid */}
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
                      <span>Name</span>
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
                      onClick={() => handleSort('role')} 
                      className="flex items-center space-x-1.5 hover:text-white cursor-pointer"
                    >
                      <span>Role</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        <span>Loading user list...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="h-10 w-10 text-slate-500" />
                        <p className="font-medium text-slate-350">No users found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4.5 px-6 font-semibold text-white">{item.name}</td>
                      <td className="py-4.5 px-6 text-slate-350">{item.email}</td>
                      <td className="py-4.5 px-6 text-slate-400 max-w-xs truncate">{item.address}</td>
                      <td className="py-4.5 px-6">
                        <span className={`
                          px-2.5 py-1 rounded-full text-xs font-semibold
                          ${item.role === 'ADMIN' && 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}
                          ${item.role === 'STORE_OWNER' && 'bg-teal-500/10 text-teal-400 border border-teal-500/20'}
                          ${item.role === 'USER' && 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}
                        `}>
                          {item.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-right space-x-2.5 whitespace-nowrap">
                        <Link
                          to={`/admin/users/${item.id}`}
                          className="inline-flex bg-slate-800 hover:bg-slate-750 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
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
                  {Math.min(page * 10, totalUsers)}
                </span>{' '}
                of <span className="text-white font-medium">{totalUsers}</span> users
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

      {/* User Form Modal (Add / Edit) */}
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
              {modalMode === 'ADD' ? 'Create New User' : 'Edit User Profile'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">User Role</label>
                <select
                  className="w-full bg-slate-950/60 border border-slate-800 py-2.5 px-4 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  {...register('role')}
                >
                  <option value="USER">Normal User</option>
                  <option value="STORE_OWNER">Store Owner</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
                {errors.role && (
                  <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.role.message}
                  </span>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name (20-60 characters)</label>
                <input
                  type="text"
                  placeholder="e.g. Johnathan Smith Robinson Jr."
                  className={`w-full bg-slate-950/60 border ${errors.name ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'} py-2.5 px-4 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:ring-4 transition-all text-sm`}
                  {...register('name')}
                />
                {errors.name && (
                  <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.name.message}
                  </span>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  className={`w-full bg-slate-950/60 border ${errors.email ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'} py-2.5 px-4 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:ring-4 transition-all text-sm`}
                  {...register('email')}
                />
                {errors.email && (
                  <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.email.message}
                  </span>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address (Max 400 characters)</label>
                <textarea
                  placeholder="Physical street address..."
                  rows="3"
                  className={`w-full bg-slate-950/60 border ${errors.address ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'} py-2.5 px-4 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:ring-4 transition-all resize-none text-sm`}
                  {...register('address')}
                ></textarea>
                {errors.address && (
                  <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.address.message}
                  </span>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Password {modalMode === 'EDIT' && '(Leave blank to keep current)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full bg-slate-950/60 border ${errors.password ? 'border-rose-500/80 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'} py-2.5 px-4 pr-11 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:ring-4 transition-all text-sm`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-550 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="flex items-center text-rose-400 text-xs mt-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {errors.password.message}
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
                    <span>Save User</span>
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

export default UserManagement;
