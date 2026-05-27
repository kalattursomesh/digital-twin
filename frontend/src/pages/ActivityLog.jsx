import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Clock, Search, Filter, Calendar, ArrowUpDown, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, duration-high, duration-low
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('twin_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/api/activity/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setActivities(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch activity history', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Search & Sort logic
  const filteredActivities = activities
    .filter((act) => {
      const matchesSearch = act.activityType.toLowerCase().replace('_', ' ').includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || act.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      if (sortBy === 'newest') return timeB - timeA;
      if (sortBy === 'oldest') return timeA - timeB;
      if (sortBy === 'duration-high') return b.duration - a.duration;
      if (sortBy === 'duration-low') return a.duration - b.duration;
      return 0;
    });

  // Pagination logic
  const totalItems = filteredActivities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredActivities.slice(indexOfFirstItem, indexOfLastItem);

  // Statistics calculations
  const totalMinutes = activities.reduce((sum, act) => sum + act.duration, 0);
  const productiveCount = activities.filter((act) => act.category === 'productive').length;
  const productiveMinutes = activities.filter((act) => act.category === 'productive').reduce((sum, act) => sum + act.duration, 0);
  const productivePct = activities.length > 0 ? Math.round((productiveCount / activities.length) * 100) : 0;

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-dark-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Activity History</h1>
        <p className="text-sm text-slate-400">Search, filter, and audit your logged behavior sequences.</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Total Logs</span>
            <Activity size={16} className="text-primary-500" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{activities.length}</span>
            <span className="text-slate-500 text-xs ml-1">logged items</span>
          </div>
        </div>

        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Time Logged</span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{Math.floor(totalMinutes / 60)}</span>
            <span className="text-slate-500 text-xs mx-0.5">h</span>
            <span className="text-3xl font-extrabold text-white ml-2">{totalMinutes % 60}</span>
            <span className="text-slate-500 text-xs mx-0.5">m</span>
          </div>
        </div>

        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Productive focus</span>
            <BookOpen size={16} className="text-teal-500" />
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-extrabold text-white">{productivePct}%</span>
            <span className="text-slate-500 text-xs ml-1.5">({Math.floor(productiveMinutes / 60)}h focus)</span>
          </div>
        </div>
      </div>

      {/* Filtering and Search Controls */}
      <div className="glass-panel p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="input-field pl-9 text-xs py-2 w-full"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="input-field pl-9 text-xs py-2 w-full appearance-none bg-dark-800"
            >
              <option value="all">All Categories</option>
              <option value="productive">Productive</option>
              <option value="distraction">Distraction</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="input-field pl-9 text-xs py-2 w-full appearance-none bg-dark-800"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="duration-high">Duration (High-Low)</option>
              <option value="duration-low">Duration (Low-High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-primary-500 animate-pulse text-xs">
            Loading activity log...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No activity matches found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Logged Date</th>
                  <th className="px-6 py-4">Logged Time</th>
                  <th className="px-6 py-4 text-right">Telemetry Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {currentItems.map((act) => (
                  <tr key={act.id || act._id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white capitalize">
                      {act.activityType.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        act.category === 'productive' ? 'bg-primary-500/10 text-primary-400' :
                        act.category === 'distraction' ? 'bg-red-500/10 text-red-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {act.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-200">
                      {act.duration} minutes
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {formatDate(act.startTime)}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {formatTime(act.startTime)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {act.metadata?.productivityScore ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          act.metadata.productivityScore >= 7
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : act.metadata.productivityScore >= 4
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          Score: {act.metadata.productivityScore}/10
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600">Uncalculated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-3 border-t border-slate-800/60 bg-slate-900/10">
                <span className="text-[10px] text-slate-500">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} logs
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-30 transition-all text-slate-400 hover:text-white"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 bg-dark-900/50 rounded border border-slate-800">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-30 transition-all text-slate-400 hover:text-white"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
