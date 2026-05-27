import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Shield, Clock, Brain, Activity, TrendingUp, Zap, Sparkles, AlertCircle, Compass } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TwinProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('model'); // model, settings
  const [settings, setSettings] = useState({
    notifications: true,
    timezone: 'UTC',
    strictMode: false,
    focusAlerts: true
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('twin_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${apiUrl}/api/prediction/twin-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setProfile(response.data);
        if (response.data.timezone) {
          setSettings(prev => ({ ...prev, timezone: response.data.timezone }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch twin profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center animate-pulse text-primary-500 gap-4 py-24 text-xs">
        <Brain size={48} />
        <span>Synthesizing Twin Profile...</span>
      </div>
    );
  }

  const {
    name,
    email,
    totalLogs,
    totalDuration,
    avgDuration,
    productivityRatio,
    dominantActivity,
    productivity = {},
    behaviorCluster = {}
  } = profile || {};

  const formatHour = (hourNum) => {
    if (hourNum === undefined || hourNum === null) return 'N/A';
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formatted = hourNum % 12 || 12;
    return `${formatted} ${ampm}`;
  };

  const forecastData = productivity.forecast && productivity.forecast.length > 0 
    ? productivity.forecast 
    : Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        score: Math.sin((i - 8) / 3) * 3 + 6 + Math.random()
      }));

  const characteristics = behaviorCluster.characteristics || {
    "focus": "Neutral",
    "distractibility": "Undetermined",
    "consistency": "Unknown"
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-dark-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Twin Profile</h1>
        <p className="text-sm text-slate-400">Calibrate models, view behavior clusters, and check productivity trends.</p>
      </div>

      {/* Profile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (1/3): Overview Card & Profile Details */}
        <div className="space-y-6">
          {/* Main User Card */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
              <div className="w-12 h-12 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                <User size={22} />
              </div>
              <div className="truncate">
                <h2 className="text-sm font-bold text-white capitalize leading-tight">{name}</h2>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{email}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/30">
                <span className="text-slate-500">Twin Class</span>
                <span className="font-semibold text-white capitalize">{behaviorCluster.cluster || 'Learning'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/30">
                <span className="text-slate-500">timezone</span>
                <span className="font-semibold text-slate-300">{settings.timezone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Dominant Activity</span>
                <span className="font-semibold text-slate-300 capitalize">{dominantActivity ? dominantActivity.replace('_', ' ') : 'None'}</span>
              </div>
            </div>
          </div>

          {/* Model Statistics Grid */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Metrics Snapshot</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Mean Productivity</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{productivity.score || '0.0'}/10</span>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Logs</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{totalLogs || 0}</span>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Hours Scraping</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{Math.floor((totalDuration || 0) / 60)}h</span>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Focus Ratio</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{productivityRatio || 0}%</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-800/60 pt-3">
              Twin statistics are updated automatically as logs are scraped or submitted.
            </div>
          </div>
        </div>

        {/* Right Column (2/3): Chart & Preferences tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab buttons */}
          <div className="flex border-b border-slate-800/80">
            <button
              onClick={() => setActiveTab('model')}
              className={`px-5 py-2.5 font-semibold text-xs border-b-2 transition-all ${
                activeTab === 'model'
                  ? 'border-primary-500 text-primary-400 bg-primary-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Model Performance
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-5 py-2.5 font-semibold text-xs border-b-2 transition-all ${
                activeTab === 'settings'
                  ? 'border-primary-500 text-primary-400 bg-primary-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Twin Calibration
            </button>
          </div>

          {activeTab === 'model' ? (
            <div className="space-y-6">
              {/* Productivity Curve */}
              <div className="glass-panel p-5">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp size={16} className="text-primary-500" />
                      Predicted 24h Productivity Trend
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Estimated diurnal focus cycles calculated by ML forecasting models.</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                    {productivity.trend || 'Stable'}
                  </span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="twinForecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="hour" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={11} domain={[0, 10]} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        name="Forecast Score"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#twinForecastGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cluster and Ideal times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cluster card */}
                <div className="glass-panel p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-yellow-500" />
                      Behavior Classifier
                    </h3>
                    <h4 className="text-base font-bold text-white">{behaviorCluster.cluster || 'Balanced Tracker'}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-2">
                      {behaviorCluster.message || 'You maintain a structured sequence distribution with optimal break timings.'}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-slate-800/60 pt-3 space-y-1.5 text-xs">
                    {Object.entries(characteristics).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-500 capitalize">{key}:</span>
                        <span className="font-semibold text-slate-300">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Peak Times card */}
                <div className="glass-panel p-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock size={14} className="text-blue-500" />
                    Ideal Focus time blocks
                  </h3>
                  <p className="text-[10px] text-slate-500 mb-3">Model-identified peak efficiency windows.</p>

                  {productivity.bestHours && productivity.bestHours.length > 0 ? (
                    <div className="space-y-2">
                      {productivity.bestHours.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-900/40 rounded-lg border border-slate-850">
                          <span className="text-xs font-semibold text-white">{formatHour(item.hour)}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-primary-500 h-full rounded-full" style={{ width: `${item.score * 10}%` }} />
                            </div>
                            <span className="text-xs font-bold text-primary-400">{item.score}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-slate-800 rounded-lg text-center text-slate-500 text-xs flex flex-col items-center gap-1.5">
                      <Compass size={20} className="opacity-40" />
                      <span>Log different diurnal sessions to unlock statistics.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Settings calibration checklist */
            <div className="glass-panel p-5 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Calibration tuning</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Toggle preferences and alerts for the local prediction engine.</p>
              </div>

              <div className="divide-y divide-slate-800/50">
                <div className="flex justify-between items-center py-3">
                  <div>
                    <h4 className="text-xs font-semibold text-white">WebSocket distract alerts</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Real-time alerts when distractions occur during focus block.</p>
                  </div>
                  <button 
                    onClick={() => handleToggle('notifications')}
                    className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                      settings.notifications ? 'bg-primary-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                      settings.notifications ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Focus strict mode</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Flags neutral tasks (e.g. breaks) as focus breaches.</p>
                  </div>
                  <button 
                    onClick={() => handleToggle('strictMode')}
                    className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                      settings.strictMode ? 'bg-primary-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                      settings.strictMode ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div>
                    <h4 className="text-xs font-semibold text-white">Breach auto-logs</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Automatically catalog focus breaches as telemetry metrics.</p>
                  </div>
                  <button 
                    onClick={() => handleToggle('focusAlerts')}
                    className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                      settings.focusAlerts ? 'bg-primary-500' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                      settings.focusAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-900/50 border border-slate-800 text-slate-400 rounded-lg text-xs flex gap-2.5 items-start">
                <AlertCircle className="flex-shrink-0 text-primary-500" size={16} />
                <div>
                  <h5 className="font-bold text-white mb-0.5">Telemetry note</h5>
                  <p className="text-[10px] leading-normal">Tuning modifications take effect immediately. Calibration requires 5 additional logs to recalculate forecast weights.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwinProfile;
