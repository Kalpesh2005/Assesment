import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Search, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  X, 
  Smile,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStores, setTotalStores] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Rating Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [submitLoading, setSubmitLoading] = useState(false);

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

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to page 1 on search
  };

  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortBy(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
    setPage(1);
  };

  const openRatingModal = (store) => {
    setSelectedStore(store);
    setRatingValue(store.myRating || 5);
    setIsModalOpen(true);
  };

  const handleRatingSubmit = async () => {
    setSubmitLoading(true);
    try {
      if (selectedStore.myRating) {
        // Find existing rating ID to update
        // Let's fetch store details to get rating ID, or we can just send rating update to backend.
        // Wait, the rating API has PUT /ratings/:id. But we don't have the rating ID in the list, just the rating value.
        // Let's make sure the backend supports updating rating easily. We can fetch store details or backend will return rating details.
        // Wait, let's look at the backend rating controller. We wrote PUT /ratings/:id which requires rating ID.
        // How do we get the rating ID? We can fetch store details `/stores/:id` which returns the list of ratings, 
        // OR let's look at the `myRating` object in store details.
        // Let's fetch store details first to retrieve the rating ID!
        const storeRes = await api.get(`/stores/${selectedStore.id}`);
        // Find rating where user equals current user
        const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
        const myRatingObj = storeRes.data.ratings.find(r => r.user.id === currentUserId);
        
        if (myRatingObj) {
          await api.put(`/ratings/${myRatingObj.id}`, { rating: ratingValue });
          toast.success(`Updated rating for ${selectedStore.name}!`);
        } else {
          // Fallback if not found, submit new
          await api.post('/ratings', { storeId: selectedStore.id, rating: ratingValue });
          toast.success(`Submitted rating for ${selectedStore.name}!`);
        }
      } else {
        await api.post('/ratings', { storeId: selectedStore.id, rating: ratingValue });
        toast.success(`Submitted rating for ${selectedStore.name}!`);
      }
      setIsModalOpen(false);
      fetchStores();
    } catch (err) {
      toast.error(err || 'Failed to submit rating');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2.5 p-0 m-0">
              <div className="bg-indigo-600/15 p-2 rounded-lg text-indigo-400 animate-pulse">
                <Star className="h-5 w-5 fill-indigo-400" />
              </div>
              <span>Browse & Rate Stores</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Submit and update your reviews for registered storefronts</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute inset-y-0 left-3 h-5 w-5 text-slate-500 flex items-center my-auto" />
            <input
              type="text"
              placeholder="Search by store name or address..."
              value={search}
              onChange={handleSearch}
              className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-xl placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Stores List Table */}
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
                      onClick={() => handleSort('address')} 
                      className="flex items-center space-x-1.5 hover:text-white cursor-pointer"
                    >
                      <span>Address</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="py-4 px-6">
                    <button 
                      onClick={() => handleSort('averageRating')} 
                      className="flex items-center space-x-1.5 hover:text-white cursor-pointer"
                    >
                      <span>Average Rating</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="py-4 px-6">
                    <button 
                      onClick={() => handleSort('myRating')} 
                      className="flex items-center space-x-1.5 hover:text-white cursor-pointer"
                    >
                      <span>My Rating</span>
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
                        <span>Loading stores...</span>
                      </div>
                    </td>
                  </tr>
                ) : stores.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Smile className="h-10 w-10 text-slate-500" />
                        <p className="font-medium text-slate-350">No stores found</p>
                        <p className="text-xs text-slate-500">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => (
                    <tr key={store.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4.5 px-6 font-semibold text-white">{store.name}</td>
                      <td className="py-4.5 px-6 text-slate-350 max-w-xs truncate">{store.address}</td>
                      <td className="py-4.5 px-6">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-white font-medium">{store.averageRating || 'N/A'}</span>
                          <span className="text-xs text-slate-500">({store.totalRatings})</span>
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        {store.myRating ? (
                          <div className="flex items-center space-x-1 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 w-fit">
                            <Star className="h-3.5 w-3.5 fill-indigo-400 text-indigo-400" />
                            <span className="text-indigo-300 font-semibold text-xs">{store.myRating}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Not rated</span>
                        )}
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <button
                          onClick={() => openRatingModal(store)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer shadow-md shadow-indigo-600/10"
                        >
                          {store.myRating ? 'Update Rating' : 'Submit Rating'}
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

      {/* Rating Submit Modal */}
      {isModalOpen && selectedStore && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2">
              {selectedStore.myRating ? 'Update Rating' : 'Submit Rating'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              How would you rate your experience with <span className="text-indigo-400 font-semibold">{selectedStore.name}</span>?
            </p>

            {/* Interactive Stars */}
            <div className="flex justify-center space-x-3.5 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className="text-slate-650 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star 
                    className={`h-10 w-10 ${
                      star <= ratingValue 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-slate-600'
                    }`} 
                  />
                </button>
              ))}
            </div>

            <div className="bg-slate-950/50 border border-slate-850 p-3.5 rounded-xl flex items-start space-x-2.5 mb-6 text-xs text-slate-400">
              <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span>You can modify your submitted score at any time from this dashboard interface.</span>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={submitLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm shadow-md shadow-indigo-600/10 transition-colors cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UserDashboard;
