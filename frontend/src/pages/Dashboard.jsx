import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import { Activity, Brain, TrendingUp, AlertTriangle, Clock, Plus, Target, Timer, Play, Square, Zap, Terminal, ToggleLeft, ToggleRight, Sparkles, ChevronDown, ChevronUp, Pause } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ==================== Simulator Config ====================
const SIMULATED_APPS = [
  { name: 'VS Code', type: 'coding', category: 'productive', icon: '💻' },
  { name: 'IntelliJ IDEA', type: 'coding', category: 'productive', icon: '☕' },
  { name: 'GitHub', type: 'work', category: 'productive', icon: '🐙' },
  { name: 'Stack Overflow', type: 'study', category: 'productive', icon: '📚' },
  { name: 'Google Docs', type: 'work', category: 'productive', icon: '📄' },
  { name: 'Notion', type: 'work', category: 'productive', icon: '📝' },
  { name: 'YouTube', type: 'entertainment', category: 'distraction', icon: '📺' },
  { name: 'Instagram', type: 'social_media', category: 'distraction', icon: '📸' },
  { name: 'Twitter / X', type: 'social_media', category: 'distraction', icon: '🐦' },
  { name: 'Netflix', type: 'entertainment', category: 'distraction', icon: '🎬' },
  { name: 'Discord Gaming', type: 'gaming', category: 'distraction', icon: '🎮' },
  { name: 'Reddit', type: 'social_media', category: 'distraction', icon: '🔴' },
];

const NEURAL_NODES = [
  { id: 1, cx: 30, cy: 60, name: 'Cognitive Core' },
  { id: 2, cx: 75, cy: 25, name: 'Analytics Lobe' },
  { id: 3, cx: 75, cy: 95, name: 'Memory Lobe' },
  { id: 4, cx: 125, cy: 25, name: 'Focus Center' },
  { id: 5, cx: 125, cy: 95, name: 'Anomalies Filter' },
  { id: 6, cx: 170, cy: 60, name: 'Prediction Node' }
];

const NEURAL_CONNECTIONS = [
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 6 },
  { from: 5, to: 6 },
  { from: 2, to: 3 },
  { from: 4, to: 5 }
];

const Dashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('twin_user') || '{}'));
  const [summary, setSummary] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logModal, setLogModal] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [activityForm, setActivityForm] = useState({ type: 'work', duration: 30 });

  // ==================== Focus Mode State ====================
  const [focusActive, setFocusActive] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [focusLabel, setFocusLabel] = useState('Deep Work');
  const [focusDuration, setFocusDuration] = useState(25);
  const [focusTimeLeft, setFocusTimeLeft] = useState(0);
  const [focusStartModal, setFocusStartModal] = useState(false);
  const focusTimerRef = useRef(null);

  // ==================== Simulator State ====================
  const [simEnabled, setSimEnabled] = useState(false);
  const [simLogs, setSimLogs] = useState([]);
  const [simExpanded, setSimExpanded] = useState(false);
  const simTimerRef = useRef(null);
  const simLogsEndRef = useRef(null);

  // Setup Axios Auth Header
  useEffect(() => {
    const token = localStorage.getItem('twin_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('twin_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const [sumRes, predRes] = await Promise.all([
        axios.get(`${apiUrl}/api/activity/today`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: null })),
        axios.get(`${apiUrl}/api/prediction/next-action`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: null }))
      ]);
      if (sumRes.data) setSummary(sumRes.data);
      if (predRes.data) setPrediction(predRes.data);
    } catch (err) {
      console.error("Failed fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch focus session status on load
  const fetchFocusStatus = async () => {
    try {
      const token = localStorage.getItem('twin_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/activity/focus/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.active) {
        const endTime = new Date(res.data.endTime).getTime();
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        if (remaining > 0) {
          setFocusActive(true);
          setFocusLabel(res.data.label || 'Focus');
          setFocusTimeLeft(remaining);
        }
      }
    } catch (err) {
      // Not critical
    }
  };

  // Fetch Data & Socket
  useEffect(() => {
    fetchData();
    fetchFocusStatus();

    const token = localStorage.getItem('twin_token');
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';
    const stompClient = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    stompClient.onConnect = () => {
      stompClient.subscribe('/user/topic/activity', () => {
        fetchData();
      });

      stompClient.subscribe('/user/topic/alerts', (message) => {
        try {
          const alert = JSON.parse(message.body);
          setAlerts(prev => [alert, ...prev].slice(0, 4));
        } catch (e) {
          console.error("Failed to parse alert", e);
        }
      });
    };

    stompClient.activate();
    return () => stompClient.deactivate();
  }, [user._id]);

  // ==================== Focus Timer Countdown ====================
  useEffect(() => {
    if (focusActive && !focusPaused && focusTimeLeft > 0) {
      focusTimerRef.current = setInterval(() => {
        setFocusTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(focusTimerRef.current);
            setFocusActive(false);
            setAlerts(a => [{ type: 'info', title: '✅ Focus Session Complete!', message: `Great job! Your "${focusLabel}" session is finished.` }, ...a].slice(0, 4));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (focusTimerRef.current) clearInterval(focusTimerRef.current); };
  }, [focusActive, focusPaused, focusTimeLeft > 0]);

  // ==================== Simulator Auto-Log ====================
  useEffect(() => {
    if (simEnabled) {
      simulateOneEvent();
      simTimerRef.current = setInterval(() => {
        simulateOneEvent();
      }, 30000);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }
    return () => { if (simTimerRef.current) clearInterval(simTimerRef.current); };
  }, [simEnabled]);

  useEffect(() => {
    if (simLogsEndRef.current) {
      simLogsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simLogs, simExpanded]);

  const simulateOneEvent = async () => {
    const app = SIMULATED_APPS[Math.floor(Math.random() * SIMULATED_APPS.length)];
    const duration = Math.floor(Math.random() * 15) + 3;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const logEntry = { time: now, app: app.name, icon: app.icon, type: app.type, category: app.category, duration };
    setSimLogs(prev => [...prev, logEntry].slice(-15));

    try {
      const token = localStorage.getItem('twin_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${apiUrl}/api/activity/log`, {
        activityType: app.type,
        duration: duration
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Simulator log failed", err);
    }
  };

  const handleStartFocus = async () => {
    try {
      const token = localStorage.getItem('twin_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${apiUrl}/api/activity/focus/start`, {
        duration: focusDuration,
        label: focusLabel
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFocusActive(true);
      setFocusPaused(false);
      setFocusTimeLeft(focusDuration * 60);
      setFocusStartModal(false);
    } catch (err) {
      alert("Failed to start focus: " + (err.response?.data?.error || err.message));
    }
  };

  const handleStopFocus = async () => {
    try {
      const token = localStorage.getItem('twin_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${apiUrl}/api/activity/focus/stop`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFocusActive(false);
      setFocusPaused(false);
      setFocusTimeLeft(0);
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogActivity = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('twin_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${apiUrl}/api/activity/log`, {
        activityType: activityForm.type,
        duration: activityForm.duration
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to log activity: " + (err.response?.data?.error || err.message));
    }
  };

  const formatTimeSeconds = (totalSecs) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const focusProgress = focusActive && focusDuration > 0
    ? ((focusDuration * 60 - focusTimeLeft) / (focusDuration * 60)) * 100
    : 0;

  const chartData = summary?.timeline?.map(a => {
    let timeStr = '00:00';
    try {
      if (a.startTime) {
        const d = new Date(a.startTime);
        if (!isNaN(d.getTime())) {
          timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }
    } catch (e) {
      console.error(e);
    }
    return {
      time: timeStr,
      duration: a.duration,
      productive: a.category === 'productive' ? a.duration : 0,
      distraction: a.category === 'distraction' ? a.duration : 0
    };
  }) || [];

  // ==================== Sparkline Path Generator ====================
  const generateSparkline = (dataPoints, width = 100, height = 30) => {
    if (!dataPoints || dataPoints.length < 2) {
      // Mock straight line
      return `M 0 ${height/2} L ${width} ${height/2}`;
    }
    const maxVal = Math.max(...dataPoints);
    const minVal = Math.min(...dataPoints);
    const range = maxVal - minVal || 1;

    return dataPoints.map((val, idx) => {
      const x = (idx / (dataPoints.length - 1)) * width;
      const y = height - 2 - ((val - minVal) / range) * (height - 4);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Sparkline data mappings
  const todayTimeline = summary?.timeline || [];
  const prodSparklineData = todayTimeline.map(a => a.category === 'productive' ? a.duration : 0).slice(-10);
  const timeSparklineData = todayTimeline.map(a => a.duration).slice(-10);

  // Twin Core State determination
  const score = summary?.productivityScore || 0;
  let twinCoreColor = '#6366f1'; // Indigo (Idle/Neutral)
  let twinCoreStatus = 'Synchronizing...';
  let twinCoreDesc = 'AI is syncing telemetry logs and analyzing behavior patterns.';
  
  if (score >= 7.0) {
    twinCoreColor = '#10b981'; // Green (Sync/High Focus)
    twinCoreStatus = 'Core Synchronized';
    twinCoreDesc = 'High focus alignment detected. Twin neural network state is fully optimized.';
  } else if (score > 0 && score <= 3.5) {
    twinCoreColor = '#f43f5e'; // Crimson/Red (De-sync/Distracted)
    twinCoreStatus = 'De-synchronization Warning';
    twinCoreDesc = 'Multiple distraction events captured. AI core neural alignment is decaying.';
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center animate-pulse text-primary-500 gap-4 py-24 text-xs">
        <Brain size={48} className="text-primary-500" />
        <span>Syncing behavioral telemetry network...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto bg-mesh-grid min-h-screen pb-12 pr-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Digital Twin Network</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Behavior Engine</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFocusStartModal(true)} 
            disabled={focusActive}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              focusActive 
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 cursor-not-allowed'
                : 'bg-dark-800 text-orange-400 border-orange-500/20 hover:bg-orange-500/10'
            }`}
          >
            <Timer size={14} />
            {focusActive ? 'Focus Active' : 'Start Focus'}
          </button>
          <button onClick={() => setLogModal(true)} className="btn-primary text-xs flex items-center gap-1.5">
            <Plus size={14} />
            Log Activity
          </button>
        </div>
      </div>

      {/* Real-time Toast Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`p-4 rounded-lg border flex items-start gap-3 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
              alert.type === 'focus_breach' ? 'bg-red-950/20 border-red-500/30 text-red-200 shadow-lg shadow-red-500/5' :
              alert.type === 'warning' ? 'bg-orange-950/20 border-orange-500/20 text-orange-200' : 
              'bg-slate-900/60 border-slate-800 text-slate-200'
            }`}>
              <AlertTriangle size={18} className={`flex-shrink-0 mt-0.5 ${alert.type === 'focus_breach' ? 'text-red-400 animate-pulse' : 'text-orange-400'}`} />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider">{alert.title}</h4>
                  <button onClick={() => setAlerts(prev => prev.filter((_, idx) => idx !== i))} className="text-[10px] text-slate-500 hover:text-slate-300">Dismiss</button>
                </div>
                <p className="text-xs mt-1 opacity-90 leading-relaxed">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sparkline Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="glass-panel p-5 flex items-center justify-between group hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Productivity Score</span>
            <div className="flex items-baseline mt-1.5">
              <span className="text-3xl font-extrabold text-white leading-none">{summary?.productivityScore || 0}</span>
              <span className="text-slate-600 text-xs ml-1 font-semibold">/ 10</span>
            </div>
          </div>
          {/* Embedded Sparkline */}
          <div className="w-24 h-10 flex flex-col justify-end">
            <svg className="w-full h-8 overflow-visible">
              <path
                d={generateSparkline(prodSparklineData, 96, 28)}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[9px] text-slate-500 text-right mt-1 font-semibold">Productivity flow</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-5 flex items-center justify-between group hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Time Logged</span>
            <div className="flex items-baseline mt-1.5">
              <span className="text-3xl font-extrabold text-white leading-none">{Math.floor((summary?.totalMinutes || 0)/60)}</span>
              <span className="text-slate-600 text-xs mx-0.5 font-bold">h</span>
              <span className="text-3xl font-extrabold text-white leading-none ml-1">{(summary?.totalMinutes || 0)%60}</span>
              <span className="text-slate-600 text-xs mx-0.5 font-bold">m</span>
            </div>
          </div>
          {/* Embedded Sparkline */}
          <div className="w-24 h-10 flex flex-col justify-end">
            <svg className="w-full h-8 overflow-visible">
              <path
                d={generateSparkline(timeSparklineData, 96, 28)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[9px] text-slate-500 text-right mt-1 font-semibold">Logs duration</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-5 flex items-center justify-between group hover:border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-500/5 transition-all duration-300">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">AI Forecast Confidence</span>
            <div className="flex items-baseline mt-1.5">
              <span className="text-3xl font-extrabold text-white leading-none">
                {prediction?.confidence ? `${Math.round(prediction.confidence * 100)}` : '0'}
              </span>
              <span className="text-slate-600 text-xs ml-0.5 font-bold">%</span>
            </div>
          </div>
          <div className="w-24 h-10 flex flex-col justify-end">
            <svg className="w-full h-8 overflow-visible">
              <path
                d={generateSparkline(chartData.map(c => c.productive).slice(-10), 96, 28)}
                fill="none"
                stroke="#eab308"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[9px] text-slate-500 text-right mt-1 font-semibold">Predictive variance</span>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Grid (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Glowing Area Chart */}
          <div className="glass-panel p-5 group hover:border-slate-700/80 transition-all duration-300">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Activity size={16} className="text-primary-500" />
              Productivity Timeline Distribution
            </h3>
            <div className="h-72 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                      <filter id="areaGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0c0f19', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Area type="monotone" dataKey="productive" name="Productive (min)" stroke="#10b981" strokeWidth={2.5} filter="url(#areaGlow)" fillOpacity={1} fill="url(#colorProd)" />
                    <Area type="monotone" dataKey="distraction" name="Distraction (min)" stroke="#f43f5e" strokeWidth={2} filter="url(#areaGlow)" fillOpacity={1} fill="url(#colorDist)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/10 gap-2">
                  <Brain size={24} className="text-slate-700 mb-1"/>
                  <p>Behavioral timeline empty.</p>
                  <button onClick={() => setLogModal(true)} className="text-primary-500 font-semibold hover:text-primary-400 transition-colors">
                    + Log active log item
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Simple Recent Logs Table */}
          {summary?.timeline?.length > 0 && (
            <div className="glass-panel p-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                Recent Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="pb-3">Activity</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3 text-right">Logged At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40">
                    {[...summary.timeline].reverse().slice(0, 5).map((act, idx) => (
                      <tr key={idx} className="text-slate-300 hover:bg-slate-800/10 transition-colors">
                        <td className="py-3 font-semibold text-white capitalize">{act.activityType.replace('_', ' ')}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                            act.category === 'productive' ? 'bg-emerald-500/10 text-emerald-400' :
                            act.category === 'distraction' ? 'bg-red-500/10 text-red-400' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {act.category}
                          </span>
                        </td>
                        <td className="py-3">{act.duration} mins</td>
                        <td className="py-3 text-right text-slate-500 font-medium">
                          {new Date(act.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Grid (1/3 width): Holograms, Circular Focus timer, AI predictions */}
        <div className="space-y-6">
          
          {/* Animated SVG Neural Twin Core Visualizer */}
          <div className="glass-panel p-5 relative overflow-hidden bg-gradient-to-b from-dark-900/60 to-dark-950/60">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles size={14} className="text-yellow-500 animate-pulse" />
              Digital Twin Neural Core
            </h3>

            {/* Glowing SVG Network */}
            <div className="w-full h-36 bg-black/35 rounded-lg border border-slate-850 flex items-center justify-center p-2 relative">
              <svg className="w-full h-full" viewBox="0 0 200 120">
                {/* Connective synapses */}
                {NEURAL_CONNECTIONS.map((conn, idx) => {
                  const nodeFrom = NEURAL_NODES.find(n => n.id === conn.from);
                  const nodeTo = NEURAL_NODES.find(n => n.id === conn.to);
                  return (
                    <line
                      key={idx}
                      x1={nodeFrom.cx}
                      y1={nodeFrom.cy}
                      x2={nodeTo.cx}
                      y2={nodeTo.cy}
                      className="neural-connection"
                      stroke={twinCoreColor}
                      strokeWidth="1.2"
                      strokeOpacity="0.35"
                    />
                  );
                })}
                {/* Nodes */}
                {NEURAL_NODES.map((node) => (
                  <g key={node.id}>
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r="4.5"
                      className="neural-node"
                      style={{ '--glow-color': twinCoreColor }}
                      fill={twinCoreColor}
                    />
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r="7.5"
                      fill="none"
                      stroke={twinCoreColor}
                      strokeWidth="0.5"
                      strokeOpacity="0.4"
                      className="animate-ping"
                      style={{ animationDuration: score >= 7.0 ? '1.5s' : '3.5s' }}
                    />
                  </g>
                ))}
              </svg>
              <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: twinCoreColor }} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{twinCoreStatus}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              {twinCoreDesc}
            </p>
          </div>

          {/* Premium Circular Neon Focus Assistant */}
          <div className="glass-panel p-5 bg-gradient-to-b from-dark-900/60 to-dark-950/60 border-orange-500/20">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Timer size={14} className="text-orange-500" />
              Focus Assistant Block
            </h3>

            {focusActive ? (
              <div className="flex flex-col items-center py-2 space-y-4">
                {/* Circular Neon Timer */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="5.5" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke="url(#focusOrangeGrad)" strokeWidth="6" fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - focusProgress / 100)}`}
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.5))' }}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="focusOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm text-slate-500 font-extrabold uppercase tracking-widest text-[9px] mb-0.5">Time Left</span>
                    <span className="text-xl font-extrabold text-white font-mono leading-none tracking-tight">{formatTimeSeconds(focusTimeLeft)}</span>
                    <span className="text-[9px] text-orange-400/80 font-bold truncate max-w-[80px] mt-1.5">{focusLabel}</span>
                  </div>
                </div>

                {/* Control Action Buttons */}
                <div className="flex gap-2 w-full pt-2">
                  <button 
                    onClick={() => setFocusPaused(!focusPaused)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-750 text-slate-300 hover:text-white hover:bg-slate-800/30 text-[10px] font-bold uppercase transition-all"
                  >
                    {focusPaused ? <Play size={11} /> : <Pause size={11} />}
                    {focusPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button 
                    onClick={handleStopFocus}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[10px] font-bold uppercase transition-all"
                  >
                    <Square size={11} />
                    Stop
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">Silences alert feeds and logs distraction events as critical focus breaches.</p>
                <button 
                  onClick={() => setFocusStartModal(true)} 
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all font-bold text-xs"
                >
                  <Play size={12} />
                  Configure Focus Block
                </button>
              </div>
            )}
          </div>

          {/* AI Behavioral hub */}
          <div className="glass-panel p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Brain size={14} className="text-primary-500" />
              AI Core Predictor
            </h3>
            
            {prediction?.prediction ? (
              <div className="space-y-4">
                <div className="bg-dark-950/40 p-4 rounded-lg border border-slate-850">
                  <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-extrabold">Next Action Prediction</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Target size={16} className="text-primary-400" />
                    <span className="text-sm font-bold text-white capitalize">{prediction.prediction.replace('_', ' ')}</span>
                  </div>
                  {prediction.confidence && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[9px] text-slate-500 font-extrabold mb-1">
                        <span>CONFIDENCE RATE</span>
                        <span>{Math.round(prediction.confidence * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden border border-slate-800">
                        <div className="bg-primary-500 h-full rounded-full" style={{ width: `${prediction.confidence * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-slate-850 rounded-lg text-slate-500 text-xs text-center">
                Log 5+ activities to activate future behavior predictions.
              </div>
            )}
          </div>

          {/* AI Insights Recommendations */}
          <div className="glass-panel p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles size={14} className="text-yellow-500" />
              AI Recommendations
            </h3>
            <div className="space-y-3">
              {prediction?.recommendations?.length > 0 ? (
                prediction.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 rounded-lg bg-dark-950/40 border border-slate-850 text-xs text-slate-350 leading-relaxed font-medium">
                    {rec.message}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No recommendations calculated. Submit logs to analyze.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ==================== Low-Profile Collapsible Simulator Drawer ==================== */}
      <div className="glass-panel border-slate-850">
        <div 
          onClick={() => setSimExpanded(!simExpanded)}
          className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-800/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Terminal size={18} className="text-slate-400" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                System Scraper Simulator
                {simEnabled && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />}
              </h3>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {simEnabled ? 'Background scrapers active and pushing logs' : 'Scraper engine idle'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSimEnabled(!simEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded border text-[9px] font-bold uppercase transition-all ${
                simEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-dark-700 text-slate-400 border-dark-650 hover:text-white'
              }`}
            >
              {simEnabled ? 'Active' : 'Idle'}
            </button>
            <button 
              onClick={() => setSimExpanded(!simExpanded)}
              className="text-slate-500 hover:text-slate-300"
            >
              {simExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {simExpanded && (
          <div className="border-t border-slate-850 p-4 bg-black/40 font-mono text-[9px] max-h-40 overflow-y-auto">
            {simLogs.length === 0 ? (
              <div className="text-slate-600">No events simulated yet. Toggle active to run.</div>
            ) : (
              simLogs.map((log, i) => (
                <div key={i} className="py-0.5 flex items-start gap-1">
                  <span className="text-slate-650">[{log.time}]</span>
                  <span className="text-emerald-500">Scraper:</span>
                  <span className="text-slate-400">
                    Switch detected to <strong className="text-white">{log.app}</strong> ({log.category}) for {log.duration}m. Telemetry frame dispatched.
                  </span>
                </div>
              ))
            )}
            <div ref={simLogsEndRef} />
          </div>
        )}
      </div>

      {/* ==================== Focus Configure Modal ==================== */}
      {focusStartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Timer size={18} className="text-orange-400" />
              Configure Focus block
            </h2>
            <p className="text-[11px] text-slate-500 mb-5">Distractions logged during this block trigger WebSocket alerts.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Session Target</label>
                <input
                  type="text"
                  className="input-field text-xs"
                  value={focusLabel}
                  onChange={e => setFocusLabel(e.target.value)}
                  placeholder="e.g. Write backend code"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Duration</label>
                <div className="flex gap-2">
                  {[15, 25, 45, 60].map(d => (
                    <button 
                      key={d} 
                      onClick={() => setFocusDuration(d)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        focusDuration === d 
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                          : 'bg-dark-700 text-slate-400 border-dark-600 hover:text-white'
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setFocusStartModal(false)} className="btn-secondary text-xs flex-1">
                  Cancel
                </button>
                <button onClick={handleStartFocus} className="btn-primary text-xs flex-1 bg-orange-600 hover:bg-orange-500 flex items-center justify-center gap-1">
                  <Play size={12} />
                  Start Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Activity Modal */}
      {logModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white mb-4">Log Activity</h2>
            <form onSubmit={handleLogActivity} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Activity Type</label>
                <select 
                  className="input-field text-xs appearance-none bg-dark-800"
                  value={activityForm.type}
                  onChange={e => setActivityForm({...activityForm, type: e.target.value})}
                >
                  <optgroup label="Productive">
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="coding">Coding</option>
                    <option value="reading">Reading</option>
                  </optgroup>
                  <optgroup label="Neutral / Distraction">
                    <option value="social_media">Social Media</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="gaming">Gaming</option>
                    <option value="break">Break</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Duration (minutes)</label>
                <input 
                  type="number" 
                  min="1"
                  className="input-field text-xs" 
                  value={activityForm.duration}
                  onChange={e => setActivityForm({...activityForm, duration: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setLogModal(false)} className="btn-secondary text-xs flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs flex-1">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
