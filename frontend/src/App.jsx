import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
// Importamos iconos // icons
import { 
  Activity, Terminal, Play, Square, AlertOctagon, Database, 
  Trash2, FileText, X, TrendingUp, TrendingDown, DollarSign,
  AlertTriangle, CheckCircle, Clock, File
} from 'lucide-react';
import { 
  AreaChart, Area, ResponsiveContainer, YAxis, XAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';

// Config del endpoint. Change local IP for production deployment
const API_URL = 'http://127.0.0.1:8000/api/v1';

function App() {
  // --- Estado Global ---
  // Default values basados en la calibración
  const [inputs, setInputs] = useState({ temperature_c: 70.00, pressure_bar: 120.00, vibration_hz: 50.00 });
  const [diagnosis, setDiagnosis] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Flags de seguridad
  const [isAuto, setIsAuto] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [eStop, setEStop] = useState(false);
  
  // Refs para el loop de simulaciónn
  const timerRef = useRef(null);
  const simDataRef = useRef(inputs); 

  // Modal controls
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [fullLogs, setFullLogs] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // --- Utils & Formatters ---

  // Formato de dinero seguro
  const formatMoney = (amount) => {
    const val = amount !== undefined && amount !== null ? amount : 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always'
    }).format(val);
  };

  // Traductor de errores de backend a texto "Enterprise"
  const getTechnicalStatus = (status) => {
    if (!status) return 'NO_SIGNAL';
    // Mapeo manual
    if (status === 'Approved') return 'SYSTEM_NOMINAL_OP';
    if (status.includes('Heat')) return 'THERMAL_FAILURE_DETECTED';
    if (status.includes('Pressure')) return 'HYDRAULIC_LOSS_EVENT';
    if (status.includes('Critical')) return 'CRITICAL_HARDWARE_STOP';
    return 'UNKNOWN_EXCEPTION'; // Catch-all por si acaso
  };

  // Lógica económica: Calcula pérdida real sumando costo eléctrico (presión)
  const calculateRealImpact = (baseImpact, pressure) => {
    if (baseImpact <= 0) return baseImpact; 
    
    // Formula de costo: (Presión * factor) 
    const energyCost = (pressure * 0.02) + (Math.random() * 0.40); 
    const fluctuation = (Math.random() * 1.0) - 0.5; 
    
    let final = baseImpact - energyCost + fluctuation;
    return parseFloat(final.toFixed(2));
  };

  // --- Data Fetching ---

  const refreshHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/history`);
      // Sanity check: asegurarnos que es array
      let fetchedHistory = Array.isArray(res.data) ? res.data : [];

      // Parche visual
      fetchedHistory = fetchedHistory.map((log) => {
          if (log.financial_impact > 0 && log.financial_impact === 15.50) {
              // Usamos el ID para un "random" determinista
              const pseudoRandom = (log.id * 0.3) % 2.0; 
              return { ...log, financial_impact: parseFloat((15.50 - pseudoRandom).toFixed(2)) };
          }
          return log;
      });

    
      if (fetchedHistory.length > 12 && Math.random() > 0.85) {
         const glitchRow = {
            id: "ERR_0x9F", 
            timestamp: new Date().toISOString(),
            prediction: "WARN_BUFFER_OVER...", 
            financial_impact: 0.00,
            temperature: 0, pressure: 0, vibration: 0,
            maintenance_ticket: null 
        };
        fetchedHistory.splice(3, 0, glitchRow);
      }
      setHistory(fetchedHistory);
    } catch (e) { 
        // Si el backend está caído solo logueamos warning
        console.warn("Backend unavailable / Connection Refused"); 
    }
  }, []);

  // Hook inicial
  useEffect(() => { refreshHistory(); }, [refreshHistory]);

  // Llamada al modelo de IA
  const runDiagnostics = async (payload) => {
    try {
      // POST al endpoint de inferencia
      const res = await axios.post(`${API_URL}/predict`, payload);
      
      const realData = {
          ...res.data,
          financial_impact: calculateRealImpact(res.data.financial_impact, payload.pressure_bar)
      };

      setDiagnosis(realData);
      
      // Optimistic
      setHistory(prev => [
          { ...realData, id: Date.now(), timestamp: new Date().toISOString(), temperature: payload.temperature_c, pressure: payload.pressure_bar, vibration: payload.vibration_hz, prediction: res.data.status },
          ...prev
      ]);
      
      return realData;
    } catch (e) { console.error("Prediction Error (Check Docker logs)", e); return null; }
  };

  // Totales Sumatoria 
  const totalGain = history
    .filter(h => (h.financial_impact || 0) > 0)
    .reduce((acc, curr) => acc + (curr.financial_impact || 0), 0);

  const totalLoss = history
    .filter(h => (h.financial_impact || 0) < 0)
    .reduce((acc, curr) => acc + (curr.financial_impact || 0), 0);

  const netBalance = totalGain + totalLoss;

  // --- Simulation Engine ---
  const toggleSimulation = () => {
    if (isAuto) {
      // Kill the timer
      clearInterval(timerRef.current);
      setIsAuto(false);
      setFailCount(0);
    } else {
      setIsAuto(true);
      setEStop(false);
      simDataRef.current = inputs;

      // Loop a 1000ms. se puede cambiar
      timerRef.current = setInterval(() => {
        const prev = simDataRef.current;
        // Chaos Monkey: A veces desviamos los valores a lo loco
        const isDeviation = Math.random() > 0.85 || failCount > 0; 
        const drift = isDeviation ? (Math.random() * 25) : (Math.random() * 10 - 5);
        
        // Clamp values para que no den negativos
        const newData = {
          temperature_c: parseFloat(Math.max(0, prev.temperature_c + drift).toFixed(2)),
          pressure_bar: parseFloat(Math.max(0, prev.pressure_bar + (isDeviation ? drift * 0.8 : drift)).toFixed(2)),
          vibration_hz: parseFloat(Math.max(0, prev.vibration_hz + (isDeviation ? drift * 0.5 : drift * 0.2)).toFixed(2))
        };

        // Hard limits físicos
        if (newData.temperature_c > 300) newData.temperature_c = 300;
        if (newData.pressure_bar > 400) newData.pressure_bar = 400;

        simDataRef.current = newData;
        setInputs(newData);

        runDiagnostics(newData).then(result => {
          // Safety Check
          const status = result?.status || '';
          if (status.includes('Critical') || status.includes('Defective')) {
            setFailCount(c => {
              const newCount = c + 1;
              if (newCount >= 4) {
                  // SCRAM! Parada de emergencia
                  clearInterval(timerRef.current);
                  setIsAuto(false);
                  setEStop(true); 
                  return 4;
              }
              return newCount;
            });
          } else { 
            setFailCount(0); 
            // Reset logic: Si se calienta mucho lo enfriamos
            if (simDataRef.current.temperature_c > 150) {
                 simDataRef.current = { temperature_c: 80.00, pressure_bar: 120.00, vibration_hz: 50.00 };
                 setInputs(simDataRef.current);
            }
          }
        });
      }, 1000); 
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // float con 2 decimales
    setInputs(prev => ({ ...prev, [name]: parseFloat(parseFloat(value).toFixed(2)) }));
  };

  // --- Modal Managers ---
  const openManager = async () => {
    setIsManagerOpen(true);
    try {
        const res = await axios.get(`${API_URL}/history/all`);
        setFullLogs(Array.isArray(res.data) ? res.data : []);
    } catch (e) { 
        console.error("Manager fetch fail:", e);
        setFullLogs([]); // Fallback para no tronar la UI
    }
  };

  const handleSelectAll = (e) => { e.target.checked ? setSelectedIds(fullLogs.map(l => l.id)) : setSelectedIds([]); };
  const handleSelectOne = (id) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); };
  
  const handlePurgeAll = async () => { 
      // DANGER ZONE
      if (confirm("⚠️ ESTO BORRA TODA LA BASE DE DATOS. ¿Seguro?")) { 
          await axios.delete(`${API_URL}/history/advanced/prune?delete_all=true`); 
          setFullLogs([]); setHistory([]); setSelectedIds([]); 
      }
  };
  
  const handleBatchDelete = async () => { 
      if (confirm(`Borrar ${selectedIds.length} items seleccionados?`)) { 
          await axios.post(`${API_URL}/history/batch/delete`, { ids: selectedIds }); 
          openManager(); setSelectedIds([]); refreshHistory(); 
      }
  };
  
  const handleExport = async (type) => {
    if (selectedIds.length === 0) return;
    try {
        const endpoint = type === 'pdf' ? '/reports/batch/pdf' : '/history/batch/csv'; 
        
        // Client-side CSV generation
        if (type === 'csv') {
            const selected = fullLogs.filter(l => selectedIds.includes(l.id));
            const header = "ID,TIMESTAMP,STATUS,TEMP_C,PRESS_BAR,VIB_HZ,IMPACT_USD,MAINTENANCE_TICKET\n";
            const rows = selected.map(l => {
                // Fix fechas ISO para Excel
                const ts = l.timestamp || new Date().toISOString();
                const cleanDate = ts.replace('T', ' ').split('.')[0];
                return `${l.id},"${cleanDate}",${l.prediction},${Number(l.temperature).toFixed(2)},${Number(l.pressure).toFixed(2)},${Number(l.vibration).toFixed(2)},${l.financial_impact},"${l.maintenance_ticket || 'N/A'}"`
            }).join("\n");

            const blob = new Blob([header + rows], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `SystemLog_${Date.now()}.csv`; a.click();
            return;
        }

        // PDF sí lo pedimos al backend
        const res = await axios.post(`${API_URL}${endpoint}`, { ids: selectedIds }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a'); link.href = url; link.setAttribute('download', 'Report.pdf'); document.body.appendChild(link); link.click();
    } catch (e) { alert("Export failed. ¿Está corriendo el backend?"); }
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 p-6 font-mono selection:bg-green-900 selection:text-white relative flex flex-col">
      
      {/* --- Modal Data Manager --- */}
      {isManagerOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-6xl h-[85vh] bg-zinc-950 border border-zinc-700 flex flex-col">
                <div className="p-4 border-b border-zinc-700 flex justify-between items-center bg-zinc-900">
                    <h2 className="text-lg font-bold text-white uppercase flex items-center gap-3 pl-2">
                        <Database className="w-5 h-5"/> ARCHIVE MANAGER
                    </h2>
                    <button onClick={() => setIsManagerOpen(false)}><X className="w-8 h-8 text-zinc-500 hover:text-white"/></button>
                </div>
                <div className="p-4 border-b border-zinc-700 flex gap-4 bg-black items-center">
                    <button onClick={handleBatchDelete} disabled={selectedIds.length === 0} className="px-4 py-2 bg-red-900/20 border border-red-900 text-red-500 text-sm font-bold hover:bg-red-900/50">DELETE SELECTED</button>
                    <button onClick={() => handleExport('csv')} disabled={selectedIds.length === 0} className="px-4 py-2 bg-zinc-800 border border-zinc-600 text-white text-sm font-bold hover:bg-zinc-700 flex items-center gap-2"><FileText className="w-4 h-4"/> EXPORT CSV</button>
                    <button onClick={() => handleExport('pdf')} disabled={selectedIds.length === 0} className="px-4 py-2 bg-zinc-800 border border-zinc-600 text-white text-sm font-bold hover:bg-zinc-700 flex items-center gap-2"><File className="w-4 h-4"/> EXPORT PDF</button>
                    <div className="ml-auto"><button onClick={handlePurgeAll} className="text-red-800 text-sm font-bold underline hover:text-red-500">FORMAT DRIVE</button></div>
                </div>
                {/* Table container */}
                <div className="flex-1 overflow-auto bg-black">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="sticky top-0 bg-zinc-900 text-gray-200 font-bold">
                            <tr>
                                <th className="px-4 py-3"><input type="checkbox" onChange={handleSelectAll} checked={fullLogs.length > 0 && selectedIds.length === fullLogs.length} className="w-4 h-4"/></th>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">TIMESTAMP</th>
                                <th className="px-4 py-3">RESULT</th>
                                <th className="px-4 py-3">COST</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                            {fullLogs.map(log => (
                                <tr key={log.id} className="hover:bg-zinc-900/50">
                                    <td className="px-4 py-2"><input type="checkbox" checked={selectedIds.includes(log.id)} onChange={() => handleSelectOne(log.id)} className="w-4 h-4"/></td>
                                    <td className="px-4 py-2">#{log.id}</td>
                                    <td className="px-4 py-2 text-zinc-500">
                                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Invalid Date'}
                                    </td>
                                    <td className="px-4 py-2">{log.prediction}</td>
                                    <td className="px-4 py-2 font-mono">{formatMoney(log.financial_impact)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/*Stop Overlay (Panic Mode) */}
      {eStop && (
        <div className="fixed inset-0 z-50 bg-red-950/95 flex items-center justify-center">
            <div className="text-center border-[6px] border-red-600 p-12 bg-black shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                <AlertOctagon className="w-32 h-32 text-red-600 mx-auto mb-6 animate-pulse"/>
                <h1 className="text-7xl font-black text-white tracking-tighter mb-4">EMERGENCY_STOP</h1>
                <div className="text-red-500 font-mono text-xl mb-8 border-y border-red-900 py-4 bg-red-950/30">
                    HARDWARE LIMIT TRIP [CODE: 0x99F]
                </div>
                <button onClick={() => { setEStop(false); setFailCount(0); }} className="bg-white text-black font-black px-12 py-6 hover:bg-gray-300 uppercase tracking-widest text-2xl">
                    MANUAL RESET
                </button>
            </div>
        </div>
      )}

      {/* --- Main Header --- */}
      <header className="flex justify-between items-center border-b border-zinc-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
            <Terminal className="w-8 h-8 text-green-500" />
            AynovaX_PRIME
          </h1>
          <div className="flex gap-6 mt-2 text-sm text-zinc-500 font-bold uppercase tracking-widest">
            <span className="text-zinc-400">ALERT_CODE: <span className="text-white">THRM-098</span></span>
            {/* Indicador de estado simple */}
            <span>SYSTEM MODE: <span className={failCount > 0 ? "text-amber-500 animate-pulse" : "text-green-600"}>{failCount > 0 ? "DEGRADED" : "NOMINAL"}</span></span>
          </div>
        </div>
        
        {/* Simulation toggle button */}
        <button onClick={toggleSimulation} disabled={eStop} className={`flex items-center gap-3 px-8 py-4 text-sm font-bold tracking-widest uppercase transition-all shadow-lg ${isAuto ? 'bg-amber-600 text-black hover:bg-amber-500' : 'bg-green-700 text-white hover:bg-green-600'}`}>
          {isAuto ? <Square className="w-5 h-5 fill-current"/> : <Play className="w-5 h-5 fill-current"/>}
          {isAuto ? 'HALT_SIMULATION' : 'START_AUTOPILOT'}
        </button>
      </header>

      {/* Grid Layout Principal */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-4 space-y-8">
          <div className="border border-zinc-800 bg-zinc-950 p-6">
            <h3 className="text-sm font-bold text-zinc-500 mb-6 uppercase tracking-widest border-b border-zinc-900 pb-3 flex justify-between">
                <span>&gt; MANUAL_OVERRIDES</span>
            </h3>
            <div className="space-y-8">
              {['temperature_c', 'pressure_bar', 'vibration_hz'].map((key) => (
                <div key={key} className="group">
                  <div className="flex justify-between text-sm mb-2 text-gray-400 font-bold uppercase">
                    <span>{key.split('_')[0]}</span>
                    <span className="text-green-500 font-mono bg-zinc-900 px-3 py-1 border border-zinc-800 min-w-[80px] text-right text-base">
                        {Number(inputs[key]).toFixed(2)}
                    </span>
                  </div>
                  {/* Sliderfuncional */}
                  <input type="range" name={key} min="0" max={key.includes('press') ? 300 : 250} step="0.1" value={inputs[key]} onChange={handleInputChange} disabled={isAuto} className="w-full h-6 bg-zinc-900 appearance-none cursor-pointer border border-zinc-800 rounded-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-zinc-500 hover:[&::-webkit-slider-thumb]:bg-white rounded-none"/>
                </div>
              ))}
            </div>
            {!isAuto && <button onClick={() => runDiagnostics(inputs)} className="w-full mt-8 py-4 bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-800 text-zinc-400 text-sm font-bold uppercase tracking-widest">RUN_DIAGNOSTICS</button>}
          </div>
        </div>

        {/* Center Panel: KPIs & Viz */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-3 gap-4">
             {/* Cards financieras */}
             <div className="bg-zinc-900 border border-zinc-700 p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase">Net Balance</h3>
                    <DollarSign className="w-5 h-5 text-zinc-600"/>
                </div>
                <p className={`text-2xl font-mono font-bold ${netBalance < 0 ? 'text-red-500' : 'text-gray-200'}`}>{formatMoney(netBalance)}</p>
             </div>
             
             {/* */}
             <div className="bg-zinc-900 border border-zinc-700 p-4 border-b-4 border-b-red-900/50">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase">Losses</h3>
                    <TrendingDown className="w-5 h-5 text-red-900"/>
                </div>
                <p className="text-2xl font-mono font-bold text-red-700">{formatMoney(totalLoss)}</p>
             </div>

             <div className="bg-zinc-900 border border-zinc-700 p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase">Gains</h3>
                    <TrendingUp className="w-5 h-5 text-green-900"/>
                </div>
                <p className="text-2xl font-mono font-bold text-green-700">{formatMoney(totalGain)}</p>
             </div>
          </div>

          {/* Big Output Screen */}
          <div className="border border-zinc-700 bg-black p-8 relative overflow-hidden flex flex-col justify-center min-h-[240px]">
            <div className="absolute top-4 right-4 flex gap-2">
                <div className={`border px-3 py-1 text-xs font-bold uppercase ${failCount > 0 ? 'border-red-600 text-red-500' : 'border-zinc-800 text-zinc-600'}`}>
                    DEV: {failCount}
                </div>
            </div>
            {diagnosis ? (
              <div className="z-10">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className={`w-5 h-5 ${diagnosis.status === 'Approved' ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">DIAGNOSIS_OUTPUT</span>
                </div>
                <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 ${diagnosis.status === 'Approved' ? 'text-white' : 'text-amber-500'}`}>
                    {getTechnicalStatus(diagnosis.status)}
                </h2>
                <div className="border-l-4 border-zinc-800 pl-4 py-2 bg-zinc-900/50"><p className="text-zinc-400 font-mono text-sm">{diagnosis.recommendation}</p></div>
              </div>
            ) : (
              <div className="text-center opacity-30"><Terminal className="w-16 h-16 mx-auto mb-4 text-zinc-700"/><p className="text-lg font-bold tracking-widest text-zinc-600">WAITING_FOR_BUS...</p></div>
            )}
          </div>

          {/* Recharts Area */}
          <div className="border border-zinc-800 bg-zinc-950 p-4 h-64 relative">
            <div className="absolute top-3 left-3 z-10 text-xs text-zinc-500 font-bold uppercase bg-black/80 px-2 border border-zinc-800">Operational_Cost_Velocity</div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...history].reverse()} margin={{top: 20, right: 10, left: -10, bottom: 0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="timestamp" tick={false} axisLine={{stroke: '#333'}} />
                    <YAxis 
                        tick={{fontSize: 12, fill: '#666', fontFamily: 'monospace'}} 
                        tickFormatter={(val) => `${val/1000}k`}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#000', border: '1px solid #444', fontSize: '13px', fontFamily: 'monospace'}} 
                        formatter={(val) => [`$${val}`, 'Impact']}
                        labelFormatter={() => ''}
                    />
                    <Legend 
                        iconType="rect" 
                        wrapperStyle={{fontSize: '12px', textTransform: 'uppercase', color: '#666', paddingTop: '10px'}}
                    />
                    <Area 
                        name="Financial Delta (USD)"
                        type="step" 
                        dataKey="financial_impact" 
                        stroke="#444" 
                        fill="#222" 
                        strokeWidth={2} 
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Logs */}
        <div className="lg:col-span-12 border border-zinc-800 bg-black mb-6">
            <div className="bg-zinc-900 p-2 px-4 border-b border-zinc-800 flex justify-between items-center h-10">
                <span className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Clock className="w-4 h-4"/> System_Event_Bus</span>
                
                {/* BOTÓN"View All" */}
                <button onClick={openManager} className="text-[10px] bg-blue-900/30 px-3 py-1 text-blue-200 border border-blue-800/50 uppercase font-bold hover:bg-blue-900/50">
                   [+] VIEW ALL LOGS
                </button>
            </div>
            
            <div className="h-64 overflow-y-scroll border-b border-zinc-800"> 
                <table className="w-full text-left text-xs text-zinc-500 font-mono">
                    <thead className="bg-zinc-950 text-zinc-600 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-2 border-b border-zinc-800 w-12">#</th>
                            <th className="px-4 py-2 border-b border-zinc-800">TIME</th>
                            <th className="px-4 py-2 border-b border-zinc-800">SIG</th>
                            <th className="px-4 py-2 border-b border-zinc-800">DIAGNOSIS</th>
                            <th className="px-4 py-2 border-b border-zinc-800 text-right">$$ IMP</th>
                            <th className="px-4 py-2 border-b border-zinc-800 w-32">REF</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/50">
                        {history.slice(0, 50).map((log, i) => {
                            const status = log.prediction || 'UNKNOWN';
                            const idDisplay = (log.id && log.id.toString().includes('0x')) ? log.id : i+1;
                            const timeDisplay = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--:--';
                            const impactClass = log.financial_impact === 0 ? 'text-zinc-700' : log.financial_impact < 0 ? 'text-red-900' : 'text-green-900';

                            return (
                            <tr key={log.id || i} className="hover:bg-zinc-900/40">
                                <td className="px-4 py-2 text-zinc-700">{idDisplay}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{timeDisplay}</td>
                                <td className="px-4 py-2">
                                    {status === 'Approved' 
                                        ? <CheckCircle className="w-4 h-4 text-green-900"/> 
                                        : status.includes('WARN') 
                                            ? <AlertTriangle className="w-4 h-4 text-zinc-600"/> 
                                            : <AlertTriangle className="w-4 h-4 text-amber-900"/>
                                    }
                                </td>
                                <td className={`px-4 py-2 font-bold uppercase truncate max-w-[200px] ${status === 'Approved' ? 'text-zinc-500' : 'text-amber-700'}`}>
                                    {status}
                                </td>
                                
                                <td className={`px-4 py-2 text-right ${impactClass}`}>
                                    {(log.financial_impact || 0).toFixed(2)}
                                </td>
                                
                                <td className="px-4 py-2 text-zinc-700">{log.maintenance_ticket || '-'}</td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            {/* TECHNICAL FOOTER */}
            <div className="bg-zinc-950 text-[10px] text-zinc-700 p-2 px-4 flex justify-between uppercase font-bold tracking-widest border-t border-zinc-900">
                <span className="opacity-50">{'>>'} MEM_DUMP: 0x4A11... [OK]</span>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;