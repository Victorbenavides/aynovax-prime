import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  Activity, Server, CheckCircle, Database, Trash2, FileText, Wrench, Play, Pause, DollarSign, 
  AlertOctagon, X, Layers, CheckSquare, Zap, AlertTriangle,
  ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const THEME = {
  bg: "bg-[#050505]", 
  card: "bg-[#0a0a0a] border border-[#222] shadow-2xl",
  accent: "text-cyan-400",
  success: "text-emerald-400",
  danger: "text-rose-500",
  warning: "text-amber-400",
  gridPattern: "radial-gradient(circle, #151515 1px, transparent 1px)",
};


const KPICards = React.memo(({ stats, history }) => {
  const latestImpact = history && history.length > 0 ? history[0].financial_impact : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* KPI 1: NET PROFIT TOTAL (Backend Data) */}
        <div className={`md:col-span-3 ${THEME.card} p-6 rounded-xl relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-16 h-16 text-emerald-500"/></div>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">NET PROFIT (TOTAL)</p>
            <div className={`text-4xl font-mono font-bold tracking-tight ${stats.netProfit >= 0 ? THEME.success : THEME.danger}`}>
                ${Number(stats.netProfit).toFixed(2)}
            </div>
            <div className="w-full bg-[#151515] h-1.5 mt-4 rounded-full overflow-hidden">
                <div className={`h-full ${stats.netProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} w-1/2`}></div>
            </div>
        </div>

        <div className={`md:col-span-3 ${THEME.card} p-6 rounded-xl relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-4 opacity-10"><Wrench className="w-16 h-16 text-amber-500"/></div>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">PENDING TICKETS</p>
            <div className="text-4xl font-mono font-bold tracking-tight text-amber-400">
                {stats.openTickets}
            </div>
            <div className="w-full bg-[#151515] h-1.5 mt-4 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-1/3"></div>
            </div>
        </div>

        <div className={`md:col-span-6 ${THEME.card} p-0 rounded-xl relative flex flex-col overflow-hidden`}>
             <div className="p-5 pb-0 flex justify-between items-end z-10 bg-gradient-to-b from-[#0a0a0a] to-transparent">
                  <div>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Activity className="w-3 h-3 text-cyan-500"/> FINANCIAL VELOCITY
                      </p>
                  </div>
                  <div className="text-right bg-[#111] px-3 py-1 rounded border border-[#222]">
                      <span className={`text-lg font-bold font-mono ${latestImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          LATEST: {latestImpact > 0 ? '+' : ''}{latestImpact} USD
                      </span>
                  </div>
             </div>
             
             <div className="flex-1 w-full min-h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history && history.length ? [...history].reverse().slice(0, 50) : []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ display: 'none' }} />
                        <Area 
                          type="monotone" 
                          dataKey="financial_impact" 
                          stroke="#2dd4bf" 
                          strokeWidth={3}
                          fill="url(#profitGradient)"
                          isAnimationActive={false} 
                        />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </div>
    </div>
  );
});

const ControlsSection = React.memo(({ formData, isAutoMode, onChange, onManualScan, loading }) => (
  <section className={`${THEME.card} p-8 rounded-xl h-full flex flex-col justify-center`}>
     <div className="flex justify-between items-center mb-8 border-b border-[#222] pb-4">
        <h2 className="font-bold text-lg text-white flex items-center gap-2 tracking-wide">
            <Server className="w-4 h-4 text-cyan-500"/> SENSOR INPUTS
        </h2>
     </div>
     <div className="space-y-10">
        {['temperature_c', 'pressure_bar', 'vibration_hz'].map(field => (
            <div key={field} className="relative group">
                <div className="flex justify-between text-xs mb-3 text-gray-400 uppercase tracking-wider font-bold">
                    <span>{field.split('_')[0]}</span>
                    <span className="font-mono text-white text-sm bg-[#111] px-2 py-0.5 rounded border border-[#222]">
                        {formData[field]?.toFixed(1) || "0.0"}
                    </span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                   <div className="absolute w-full h-1.5 bg-[#151515] rounded-full overflow-hidden border border-[#222]">
                       <div 
                          className="h-full bg-gradient-to-r from-cyan-900 to-cyan-400"
                          style={{width: `${Math.min(100, (formData[field] / (field.includes('press')?250:200))*100)}%`}}
                       ></div>
                   </div>
                   <input 
                    type="range" name={field} min="0" max={field.includes('press')?250:200} step="0.1" 
                    value={formData[field]} onChange={onChange} disabled={isAutoMode}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                   />
                   <div 
                        className="absolute w-5 h-5 bg-[#050505] border-2 border-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.4)] pointer-events-none transition-all duration-75 z-10"
                        style={{left: `calc(${ (formData[field] / (field.includes('press')?250:200)) * 100 }% - 10px)`}}
                   ></div>
                </div>
            </div>
        ))}
        {!isAutoMode && (
            <button onClick={onManualScan} disabled={loading} className="w-full py-4 mt-4 bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold uppercase tracking-widest text-xs rounded transition-all shadow-lg active:scale-[0.98]">
                {loading ? 'PROCESSING...' : 'INITIATE SCAN'}
            </button>
        )}
        {isAutoMode && (
            <div className="w-full py-4 mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold uppercase tracking-widest text-xs rounded flex items-center justify-center gap-2 animate-pulse">
                <Activity className="w-4 h-4"/> AUTO-PILOT RUNNING
            </div>
        )}
     </div>
  </section>
));

const VisualizerSection = React.memo(({ prediction, consecutiveFailures }) => {
  return (
    <section className={`${THEME.card} p-10 rounded-xl flex flex-col justify-center relative overflow-hidden min-h-[450px]`}>
       <div className="absolute inset-0 opacity-20" style={{ backgroundImage: THEME.gridPattern, backgroundSize: '24px 24px' }}></div>
       
       {prediction ? (
           <div className="z-10 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 mb-8">
                  <span className={`w-3 h-3 rounded-full animate-pulse ${prediction.status === 'Approved' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">SYSTEM DIAGNOSTICS</span>
              </div>
              
              <h2 className={`text-7xl md:text-8xl font-black tracking-tighter mb-10 ${prediction.status === 'Approved' ? 'text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-700' : prediction.status.includes('Critical') ? 'text-transparent bg-clip-text bg-gradient-to-br from-rose-400 to-rose-700' : 'text-amber-500'} drop-shadow-2xl`}>
                  {prediction.status.toUpperCase()}
              </h2>
              
              <div className="p-6 bg-[#080808] border border-[#222] rounded-lg relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${prediction.status === 'Approved' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <h3 className="text-cyan-500 font-bold flex items-center gap-2 mb-2 text-xs uppercase tracking-wider"><CheckCircle className="w-4 h-4"/> AI Logic</h3>
                  <p className="text-lg text-gray-300 font-light leading-relaxed">{prediction.recommendation}</p>
              </div>

              <div className="mt-8 flex items-center gap-4">
                 <div className={`px-4 py-2 border text-xs font-mono font-bold flex items-center gap-2 uppercase tracking-wide rounded ${consecutiveFailures > 0 ? 'border-rose-900 bg-rose-500/10 text-rose-400' : 'border-[#222] bg-[#111] text-gray-500'}`}>
                    <Zap className={`w-3 h-3 ${consecutiveFailures > 0 ? 'text-rose-500' : 'text-gray-600'}`}/>
                    Interlock Counter: {consecutiveFailures}/4
                 </div>
              </div>
           </div>
       ) : (
          <div className="flex flex-col items-center justify-center opacity-20">
              <Activity className="w-32 h-32 mb-6 text-gray-600 animate-pulse"/>
              <p className="text-2xl font-bold tracking-[0.5em] text-gray-600 uppercase">AWAITING INPUT</p>
          </div>
       )}
    </section>
  );
});


function App() {
  const [formData, setFormData] = useState({ temperature_c: 70.0, pressure_bar: 120.0, vibration_hz: 50.0 });
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]); 
  const [realStats, setRealStats] = useState({ netProfit: 0, openTickets: 0 });
  const [loading, setLoading] = useState(false);
  
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [allLogs, setAllLogs] = useState([]); 
  const [selectedIds, setSelectedIds] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50; 
  
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [emergencyLockdown, setEmergencyLockdown] = useState(false); 
  
  const timerRef = useRef(null);
  const consecutiveFailuresRef = useRef(0); 
  const simulationDataRef = useRef(formData); 

  const fetchDashboardData = useCallback(async () => {
    try {
      const histRes = await axios.get('http://127.0.0.1:8000/api/v1/history');
      setHistory(histRes.data || []);
      
      const kpiRes = await axios.get('http://127.0.0.1:8000/api/v1/kpi');
      setRealStats(kpiRes.data || { netProfit: 0, openTickets: 0 });
      
    } catch (err) { console.error(err); }
  }, []);

  const fetchAllLogs = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/v1/history/all');
      setAllLogs(res.data || []);
    } catch (err) { alert("Failed to load history"); }
  };

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const runPrediction = async (data = null, isAuto = false) => {
    const payload = data || formData; 
    if (!isAuto) setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/v1/predict', payload);
      setPrediction(response.data);
      await fetchDashboardData(); 
      return response.data; 
    } catch (err) { console.error("API Error"); return null; } finally { if (!isAuto) setLoading(false); }
  };

  // DATA MANAGER
  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return allLogs.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, allLogs]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
        const currentIds = currentTableData.map(log => log.id);
        setSelectedIds([...new Set([...selectedIds, ...currentIds])]);
    } else {
        const currentIds = currentTableData.map(log => log.id);
        setSelectedIds(selectedIds.filter(id => !currentIds.includes(id)));
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedIds.length} records?`)) return;
    try {
      await axios.post('http://127.0.0.1:8000/api/v1/history/batch/delete', { ids: selectedIds });
      await fetchAllLogs(); await fetchDashboardData(); setSelectedIds([]); 
      alert("Deleted.");
    } catch (err) { alert("Error."); }
  };

  const handlePurgeAll = async () => {
      if(!window.confirm("⚠️ DANGER: PURGE ALL DATABASE?")) return;
      try {
        await axios.delete('http://127.0.0.1:8000/api/v1/history/advanced/prune', { params: { delete_all: true } });
        await fetchAllLogs(); await fetchDashboardData(); alert("Purged.");
      } catch (err) { alert("Error."); }
  };

  const handleBatchCSV = () => {
    if (selectedIds.length === 0) return;
    const logsToExport = allLogs.filter(log => selectedIds.includes(log.id));
    const headers = "ID,Timestamp,Status,Temperature,Pressure,Vibration,Financial_Impact,Ticket\n";
    const rows = logsToExport.map(log => 
        `${log.id},"${new Date(log.timestamp).toLocaleString()}",${log.prediction},${log.temperature},${log.pressure},${log.vibration},${log.financial_impact},${log.maintenance_ticket || ''}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "AynovaX_Selection.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchPDF = async () => {
    if (selectedIds.length === 0) return;
    try {
        const response = await axios.post('http://127.0.0.1:8000/api/v1/reports/batch/pdf', { ids: selectedIds }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `AynovaX_Selection.pdf`);
        document.body.appendChild(link);
        link.click();
    } catch (err) { alert("Error generating PDF."); }
  };

  // AUTO PILOT
  const toggleAutoMode = () => {
    if (isAutoMode) {
      clearInterval(timerRef.current);
      setIsAutoMode(false);
      consecutiveFailuresRef.current = 0;
    } else {
      setIsAutoMode(true);
      setEmergencyLockdown(false);
      consecutiveFailuresRef.current = 0;
      simulationDataRef.current = formData;

      timerRef.current = setInterval(async () => {
        const prevData = simulationDataRef.current;
        const isChaosMoment = Math.random() > 0.85; 
        const tempDrift = isChaosMoment ? (Math.random() * 25) : (Math.random() * 6 - 3);
        const pressDrift = isChaosMoment ? (Math.random() * 20) : (Math.random() * 4 - 2);
        const vibDrift = isChaosMoment ? (Math.random() * 15) : (Math.random() * 2 - 1);

        let newTemp = Math.min(200, Math.max(20, prevData.temperature_c + tempDrift));
        let newPress = Math.min(250, Math.max(50, prevData.pressure_bar + pressDrift));
        let newVib = Math.min(150, Math.max(0, prevData.vibration_hz + vibDrift));
        if (Math.random() > 0.9) { newTemp -= 15; newPress -= 10; }

        const newData = { temperature_c: parseFloat(newTemp.toFixed(1)), pressure_bar: parseFloat(newPress.toFixed(1)), vibration_hz: parseFloat(newVib.toFixed(1)) };
        simulationDataRef.current = newData;
        setFormData(newData);

        runPrediction(newData, true).then((res) => {
           if (res && (res.status.includes("Critical") || res.status.includes("Defective"))) {
              consecutiveFailuresRef.current += 1;
           } else {
              consecutiveFailuresRef.current = 0; 
           }
           if (consecutiveFailuresRef.current >= 4) {
              clearInterval(timerRef.current);
              setIsAutoMode(false);
              setEmergencyLockdown(true);
           }
        });
      }, 2000); 
    }
  };

  const getStatusColor = (s) => s === 'Approved' ? 'text-emerald-400' : s.includes('Critical') ? 'text-rose-500' : 'text-amber-400';
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) });

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 p-8 font-sans relative selection:bg-cyan-500/30 overflow-x-hidden" 
         style={{ width: '100vw', maxWidth: 'none', margin: 0, padding: '2rem', textAlign: 'left' }}>
      
      {/* DATA MANAGER */}
      {isDataManagerOpen && (
        <div className="fixed inset-0 z-50 bg-[#050505]/95 flex flex-col p-8 animate-in fade-in duration-200">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col border border-[#222] rounded-xl bg-[#0a0a0a] shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-[#222]">
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2"><Database className="w-5 h-5 text-cyan-500"/> ARCHIVE</h2>
                    <div className="flex gap-4">
                        <button onClick={handlePurgeAll} className="bg-red-900/20 text-red-500 border border-red-900 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-900/40">Purge DB</button>
                        <button onClick={() => setIsDataManagerOpen(false)}><X className="text-gray-500 hover:text-white"/></button>
                    </div>
                </div>
                <div className="p-4 bg-[#0f0f0f] border-b border-[#222] flex justify-between">
                    <span className="text-xs text-gray-500 font-mono self-center">{selectedIds.length} SELECTED</span>
                    <div className="flex gap-2">
                        <button onClick={handleBatchDelete} disabled={selectedIds.length === 0} className="px-3 py-1 border border-[#333] text-gray-400 text-xs hover:text-white hover:border-white disabled:opacity-20"><Trash2 className="w-4 h-4 inline mr-1"/> DEL</button>
                        <button onClick={handleBatchCSV} disabled={selectedIds.length === 0} className="px-3 py-1 border border-[#333] text-gray-400 text-xs hover:text-white hover:border-white disabled:opacity-20"><FileText className="w-4 h-4 inline mr-1"/> CSV</button>
                        <button onClick={handleBatchPDF} disabled={selectedIds.length === 0} className="px-3 py-1 border border-[#333] text-gray-400 text-xs hover:text-white hover:border-white disabled:opacity-20"><FileText className="w-4 h-4 inline mr-1"/> PDF</button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-[#050505]">
                    <table className="w-full text-left text-xs font-mono text-gray-400">
                        <thead className="bg-[#111] text-gray-500 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 w-10"><input type="checkbox" onChange={handleSelectAll} checked={currentTableData.length > 0 && currentTableData.every(log => selectedIds.includes(log.id))} className="accent-cyan-500 bg-transparent border-gray-700"/></th>
                                <th className="px-6 py-3">TIMESTAMP</th>
                                <th className="px-6 py-3">STATUS</th>
                                <th className="px-6 py-3">IMPACT</th>
                                <th className="px-6 py-3">TICKET</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                            {currentTableData.map(log => (
                                <tr key={log.id} className="hover:bg-[#111]">
                                    <td className="px-6 py-3"><input type="checkbox" checked={selectedIds.includes(log.id)} onChange={() => handleSelectOne(log.id)} className="accent-cyan-500 bg-transparent border-gray-700"/></td>
                                    <td className="px-6 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className={`px-6 py-3 font-bold ${getStatusColor(log.prediction)}`}>{log.prediction}</td>
                                    <td className="px-6 py-3">{log.financial_impact} USD</td>
                                    <td className="px-6 py-3">{log.maintenance_ticket || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-[#222] bg-[#0a0a0a] flex justify-between items-center text-xs text-gray-500">
                    <span>Page {currentPage}</span>
                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2 py-1 border border-[#333] hover:bg-[#222] disabled:opacity-20"><ChevronLeft className="w-3 h-3"/></button>
                        <button disabled={currentPage * ITEMS_PER_PAGE >= allLogs.length} onClick={() => setCurrentPage(p => p + 1)} className="px-2 py-1 border border-[#333] hover:bg-[#222] disabled:opacity-20"><ChevronRight className="w-3 h-3"/></button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* SCRAM SCREEN */}
      {emergencyLockdown && (
        <div className="fixed inset-0 z-50 bg-red-950/90 flex items-center justify-center animate-pulse">
            <div className="text-center">
                <AlertOctagon className="w-32 h-32 text-red-500 mx-auto mb-4"/>
                <h1 className="text-6xl font-black text-white tracking-tighter mb-2">SCRAM</h1>
                <p className="text-red-400 font-mono text-xl mb-8">EMERGENCY SHUTDOWN PROTOCOL</p>
                <button onClick={() => setEmergencyLockdown(false)} className="bg-white text-red-900 font-black px-8 py-4 text-xl hover:bg-gray-200">SYSTEM RESET</button>
            </div>
        </div>
      )}

      {/* HEADER */}
      <header className="max-w-[1600px] mx-auto mb-10 flex flex-wrap items-center justify-between py-6 border-b border-[#222]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#111] border border-[#333] rounded-lg">
              <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-white">AYNOVA<span className="text-cyan-500">X</span> PRIME</h1>
            <p className="text-gray-600 text-[10px] font-mono tracking-widest uppercase">Ind. Controller v4.0</p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); toggleAutoMode(); }}
            className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border transition-all rounded ${isAutoMode ? 'bg-amber-500/20 text-amber-500 border-amber-500 animate-pulse' : 'bg-transparent text-white border-white hover:bg-white hover:text-black'}`}>
            {isAutoMode ? 'SIMULATION ACTIVE' : 'Auto Pilot'}
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto space-y-8">
        <KPICards stats={realStats} history={history} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <ControlsSection 
                formData={formData} 
                isAutoMode={isAutoMode} 
                onChange={handleChange} 
                onManualScan={() => runPrediction(null, false)}
                loading={loading}
            />
          </div>
          <div className="lg:col-span-8">
            <VisualizerSection 
                prediction={prediction} 
                consecutiveFailures={consecutiveFailuresRef.current} 
            />
          </div>
        </div>

        {/* LOGS TABLE (LIVE) */}
        <div className={`${THEME.card} p-0 overflow-hidden rounded-xl`}>
            <div className="p-4 border-b border-[#222] flex justify-between bg-[#0f0f0f]">
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2"><Database className="w-4 h-4"/> Live Feed</h3>
                <button onClick={() => { fetchAllLogs(); setIsDataManagerOpen(true); }} className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 hover:text-white transition-colors border border-cyan-900 px-3 py-1 hover:border-cyan-500 rounded">
                    Open Data Archive
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-gray-400">
                    <thead className="bg-[#0a0a0a] text-gray-600 border-b border-[#222]">
                        <tr>
                            <th className="px-6 py-3">TIMESTAMP</th>
                            <th className="px-6 py-3">STATUS</th>
                            <th className="px-6 py-3">IMPACT</th>
                            <th className="px-6 py-3">TICKET</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                        {history.map(log => (
                            <tr key={log.id} className="hover:bg-[#111] transition-colors">
                                <td className="px-6 py-3 text-white">
                                    {new Date(log.timestamp).toLocaleTimeString()} <span className="text-gray-600 ml-2">{new Date(log.timestamp).toLocaleDateString()}</span>
                                </td>
                                <td className={`px-6 py-3 font-bold uppercase ${getStatusColor(log.prediction)}`}>{log.prediction.split('(')[0]}</td>
                                <td className={`px-6 py-3 ${log.financial_impact >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {log.financial_impact > 0 ? '+' : ''}{log.financial_impact} USD
                                </td>
                                <td className="px-6 py-3 text-gray-600">{log.maintenance_ticket || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;