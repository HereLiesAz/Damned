/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef, useMemo, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Activity, 
  Database, 
  Globe, 
  Layers, 
  Terminal, 
  Zap,
  Server,
  ChevronRight,
  Search,
  Settings,
  Bell,
  Cpu as CpuIcon,
  RefreshCcw,
  Loader2,
  Trash2,
  Upload,
  FileCode,
  Lock,
  Eye,
  ShieldAlert,
  HelpCircle,
  X
} from 'lucide-react';
import { IntelTask, DATA_SOURCES, ANALYSIS_STEPS, DashboardMode, AttackCampaign, AttackOperation, ATTACK_STEPS } from './types.ts';

// --- Gemini Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Sub-components ---

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string; icon: any; trend?: string }) {
  return (
    <div className="bg-surface-nav border border-surface-border p-4 rounded-xl flex flex-col items-start gap-1">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{label}</span>
      <div className="flex items-end justify-between w-full">
        <h3 className="text-xl font-mono text-white leading-none">{value}</h3>
        {trend && <span className="text-[10px] text-brand-primary font-mono">{trend}</span>}
      </div>
    </div>
  );
}

function PipelineNode({ name, active, completed, load, mode = 'DEFENSIVE' }: { name: string; active?: boolean; completed?: boolean; load?: number; mode?: DashboardMode; key?: any }) {
  const primaryColor = mode === 'DEFENSIVE' ? 'var(--color-brand-primary)' : 'var(--color-attack-primary)';
  const shadowColor = mode === 'DEFENSIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)';

  return (
    <div className="flex flex-col items-center gap-3 relative min-w-[120px]">
      <motion.div 
        animate={{ 
          borderColor: active ? primaryColor : 'var(--color-surface-border)',
          boxShadow: active ? `0 0 15px ${shadowColor}` : 'none'
        }}
        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-surface-nav z-10 transition-colors ${completed ? (mode === 'DEFENSIVE' ? 'bg-brand-primary/20 border-brand-primary' : 'bg-attack-primary/20 border-attack-primary') : ''}`}
      >
        {completed ? <Zap className={`w-5 h-5 ${mode === 'DEFENSIVE' ? 'text-brand-primary' : 'text-attack-primary'}`} /> : <Activity className={`w-5 h-5 ${active ? (mode === 'DEFENSIVE' ? 'text-brand-primary' : 'text-attack-primary') + ' animate-pulse' : 'text-slate-600'}`} />}
      </motion.div>
      <div className="text-center">
        <p className={`text-[10px] font-bold uppercase tracking-tighter ${active ? (mode === 'DEFENSIVE' ? 'text-brand-primary' : 'text-attack-primary') : 'text-slate-500'}`}>{name}</p>
        {load !== undefined && (
          <div className="w-full bg-surface-border h-1 mt-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${load}%` }}
              className={`h-full ${mode === 'DEFENSIVE' ? 'bg-brand-primary' : 'bg-attack-primary'}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, onSelect }: { task: IntelTask; key?: any; onSelect: (t: IntelTask) => void }) {
  return (
    <motion.div 
      layout
      onClick={() => onSelect(task)}
      className="flex items-center justify-between p-3 border-b border-surface-border/50 hover:bg-slate-800/30 transition-colors group cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${task.status === 'processing' ? 'bg-brand-primary animate-pulse' : task.status === 'completed' ? 'bg-brand-primary' : 'bg-slate-600'}`} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase">ID: {task.id}</span>
            <span className="px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary text-[9px] rounded uppercase font-bold tracking-wider">{task.type}</span>
          </div>
          <p className="text-sm font-medium text-slate-200 truncate max-w-[300px]">{task.target || task.source}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-mono">{task.timestamp}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-20 bg-surface-border h-1 rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary rounded-full transition-all duration-300" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="text-[9px] text-brand-primary font-mono">{task.progress}%</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-primary transition-colors" />
      </div>
    </motion.div>
  );
}

import { AzNavRail, AzLoad, AzRoller, AzTextBox } from './components/AzNavRail.tsx';

// --- Main App ---

export default function App() {
  const [activeNavId, setActiveNavId] = useState('map');
  const [helpMode, setHelpMode] = useState(false);
  const [tickerMessages] = useState([
    "HEARTBEAT: 14.2ms // PULSE: STEADY",
    "WARNING: 12.3k EXPOSURES DETECTED IN SECTOR 7",
    "ADVISORY: REALITY IS A CONCEPT SUBJECT TO NEGOTIATION",
    "SYSTEM: ENTROPY INCREASING AT EXPECTED RATE",
    "NOTICE: YOUR DESPAIR IS LOGGED AND ENCRYPTED"
  ]);

  const navItems = useMemo(() => [
    { id: 'map', icon: Globe, label: 'Map' },
    { id: 'nodes', icon: Terminal, label: 'Nodes' },
    { id: 'sec', icon: ShieldAlert, label: 'Sec', subItems: [
      { id: 'firewall', icon: Lock, label: 'Walls' },
      { id: 'ids', icon: Activity, label: 'Sensors' }
    ]},
    { id: 'pipe', icon: Zap, label: 'Pipe' },
    { id: 'audit', icon: Database, label: 'Audit' },
  ], []);

  const [mode, setMode] = useState<DashboardMode>('DEFENSIVE');
  const [tasks, setTasks] = useState<IntelTask[]>([]);
  const [campaigns, setCampaigns] = useState<AttackCampaign[]>([]);
  const [operations, setOperations] = useState<AttackOperation[]>([]);
  
  const [activeStep, setActiveStep] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<IntelTask | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isAnalyzingTarget, setIsAnalyzingTarget] = useState(false);
  const [targetIntel, setTargetIntel] = useState<any>(null);
  const analysisQueue = useRef<string[]>([]);

  // Exfiltration Config
  const [exfilDest, setExfilDest] = useState('192.168.1.100');
  const [exfilProtocol, setExfilProtocol] = useState('HTTPS');
  const [exfilChunking, setExfilChunking] = useState('64KB');

  // Exploit Config
  const [exploitCVE, setExploitCVE] = useState('CVE-2024-XXXX');
  const [exploitPayload, setExploitPayload] = useState('reverse_tcp');

  const [selectedOpType, setSelectedOpType] = useState<'Phishing' | 'Exploit' | 'Exfiltration' | 'Scan'>('Phishing');
  const [selectedTechnique, setSelectedTechnique] = useState<string>('Spear Phishing');
  const [targetVal, setTargetVal] = useState('+1234567890');
  const [stagedPayloads, setStagedPayloads] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPayloadId, setSelectedPayloadId] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const [viewingPayload, setViewingPayload] = useState<any | null>(null);

  const TECHNIQUES = useMemo(() => ({
    Phishing: ['Spear Phishing', 'Smishing', 'Pretexting'],
    Exploit: ['RCE', 'Buffer Overflow', 'Privilege Escalation', 'LPE'],
    Exfiltration: ['DNS Tunneling', 'FTP', 'HTTPS POST', 'ICMP Exfil'],
    Scan: ['Port Scan', 'Service Enumeration', 'Vulnerability Scan']
  }), []);

  // Update technique when op type changes
  useEffect(() => {
    setSelectedTechnique(TECHNIQUES[selectedOpType][0]);
  }, [selectedOpType, TECHNIQUES]);

  // Fetch campaigns and operations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, oRes, pRes] = await Promise.all([
          fetch('/api/campaigns'),
          fetch('/api/operations'),
          fetch('/api/payloads')
        ]);

        if (!cRes.ok || !oRes.ok || !pRes.ok) {
          throw new Error('Failed to fetch initial application state');
        }

        const [cData, oData, pData] = await Promise.all([cRes.json(), oRes.json(), pRes.json()]);
        setCampaigns(cData);
        setOperations(oData);
        setStagedPayloads(pData);
      } catch (err) {
        console.error("Failed to fetch state:", err);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePayloadUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const type = file.name.endsWith('.exe') ? 'C2' : 
                   file.name.endsWith('.ps1') || file.name.endsWith('.js') ? 'Loader' : 
                   'Support';
      
      const res = await fetch('/api/payloads/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)}KB`,
          type,
          encrypted: !!encryptionKey
        })
      });
      const newPayload = await res.json();
      setStagedPayloads(prev => [newPayload, ...prev]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const deletePayload = async (id: string) => {
    try {
      await fetch(`/api/payloads/${id}`, { method: 'DELETE' });
      setStagedPayloads(prev => prev.filter(p => p.id !== id));
      if (selectedPayloadId === id) setSelectedPayloadId(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const analyzeTargetIntel = async () => {
    if (!targetVal || isAnalyzingTarget) return;
    setIsAnalyzingTarget(true);
    try {
      const prompt = `Perform a deep offensive intelligence analysis on the following target: "${targetVal}".
      
      Objectives:
      1. Create a "Target Profile" (likely business role, technologies used, online presence).
      2. Identify 3 "Personalized Attack Vectors" (phishing lures, specific exploits based on likely tech stack).
      3. Suggest a "Recommended Payload" type.
      
      Return the data in a clear, structured JSON format with keys: "profile", "vectors" (array of {title, description, platform}), and "recommendation".`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              profile: { type: Type.STRING },
              vectors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    platform: { type: Type.STRING }
                  },
                  required: ["title", "description", "platform"]
                }
              },
              recommendation: { type: Type.STRING }
            },
            required: ["profile", "vectors", "recommendation"]
          }
        }
      });

      const intel = JSON.parse(result.text || "{}");
      setTargetIntel(intel);
    } catch (err) {
      console.error("Target analysis failed:", err);
    } finally {
      setIsAnalyzingTarget(false);
    }
  };
 
   const dispatchAttack = async (platform: 'whatsapp' | 'sms' | 'facebook' | 'network', target: string, type: 'Phishing' | 'Exploit' | 'Exfiltration' | 'Scan' = 'Phishing', technique?: string) => {
    setIsDispatching(true);
    try {
      const payloadObj = stagedPayloads.find(p => p.id === selectedPayloadId);
      const res = await fetch('/api/operations/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          platform,
          type,
          technique: technique || selectedTechnique,
          payload_id: selectedPayloadId,
          config: type === 'Exfiltration' 
            ? { destination: exfilDest, protocol: exfilProtocol, chunking: exfilChunking }
            : type === 'Exploit'
            ? { cve: exploitCVE, payload_type: exploitPayload }
            : undefined,
          payload: type === 'Phishing' 
            ? "ACTION REQUIRED: Security update for your account. Please visit: https://secure-auth.net/update"
            : (payloadObj ? `Artifact ${payloadObj.name} deployment started.` : undefined)
        })
      });
      const data = await res.json();
      // Update local state immediately for better UX
      if (data.operation) {
        setOperations(prev => [data.operation, ...prev]);
      }
    } catch (err) {
      console.error("Dispatch failed:", err);
    } finally {
      setIsDispatching(false);
    }
  };

  // 1. Collector: Fetch from Backend CTI Proxy
  const collectIntel = useCallback(async () => {
    if (isCollecting) return;
    setIsCollecting(true);
    try {
      const res = await fetch('/api/collect');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Network response was not ok' }));
        throw new Error(errData.error || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.tasks) {
        setTasks(prev => {
          // Merge and avoid duplicates (both from existing state and incoming payload)
          const seenIds = new Set(prev.map(t => t.id));
          const uniqueNewTasks: IntelTask[] = [];
          
          for (const task of (data.tasks as IntelTask[])) {
            if (!seenIds.has(task.id)) {
              uniqueNewTasks.push(task);
              seenIds.add(task.id);
            }
          }
          
          return [...uniqueNewTasks, ...prev].slice(0, 50);
        });
      }
    } catch (err) {
      console.error("Collection failed:", err);
    } finally {
      setIsCollecting(false);
    }
  }, [isCollecting]);

  // 2. Analyzer: Use Gemini to enrich threat data
  const analyzeTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === 'completed') return;

    // Update to processing
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'processing', progress: 25 } : t));

    try {
      // Step 2: "Reasoning" phase (Gemini)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 50 } : t));
      
      const prompt = `Analyze this Cyber Threat Intelligence (CTI) entry from URLhaus. 
      URL: ${task.target}
      Reported Threat: ${task.threat_type}
      
      Tasks:
      1. Explain what this threat likely is based on the reported type.
      2. Identify potential business impact (Low, Medium, High).
      3. Assign a numeric risk score (0-100).
      
      Return as JSON with keys: "summary", "impact", "risk_score".`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              impact: { type: Type.STRING },
              risk_score: { type: Type.NUMBER }
            },
            required: ["summary", "impact", "risk_score"]
          }
        }
      });

      const analysis = JSON.parse(result.text || "{}");

      // Finalize
      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        status: 'completed', 
        progress: 100,
        analysis_summary: analysis.summary,
        severity_score: analysis.risk_score,
        threat_type: `${task.threat_type} (${analysis.impact})`
      } : t));

    } catch (err) {
      console.error("Analysis failed for task", taskId, err);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed', progress: 100 } : t));
    }
  }, [tasks]);

  // Auto-collect and Auto-analyze Loop
  useEffect(() => {
    collectIntel();
    const interval = setInterval(collectIntel, 30000); // Collect every 30s
    return () => clearInterval(interval);
  }, [collectIntel]);

  // Process pending tasks one by one
  useEffect(() => {
    const pending = tasks.filter(t => t.status === 'pending').slice(0, 1);
    if (pending.length > 0) {
      analyzeTask(pending[0].id);
    }
  }, [tasks, analyzeTask]);

  // Update active pipeline step based on real progress
  useEffect(() => {
    const activeTask = tasks.find(t => t.status === 'processing');
    const activeOp = operations.find(o => o.status === 'processing');
    
    if (mode === 'DEFENSIVE') {
      if (activeTask) {
        const step = Math.min(Math.floor((activeTask.progress || 0) / 25), ANALYSIS_STEPS.length - 1);
        setActiveStep(step);
      } else {
        setActiveStep(-1);
      }
    } else {
      if (activeOp) {
        const step = Math.min(Math.floor((activeOp.progress || 0) / 25), ATTACK_STEPS.length - 1);
        setActiveStep(step);
      } else {
        setActiveStep(-1);
      }
    }
  }, [tasks, operations, mode]);

  const extractedIOCs = useMemo(() => {
    return tasks
      .filter(t => t.status === 'completed' && t.severity_score)
      .map(t => ({
        type: 'Domain',
        val: new URL(t.target || '').hostname,
        severity: (t.severity_score || 0) > 80 ? 'Critical' : (t.severity_score || 0) > 50 ? 'High' : 'Medium'
      }))
      .slice(0, 10);
  }, [tasks]);

  return (
    <div className="h-screen bg-surface-base flex overflow-hidden font-sans gap-4 p-4">
      {/* AzNavRail Implementation */}
      <AzNavRail 
        items={navItems}
        activeId={activeNavId}
        onSelect={setActiveNavId}
        header={
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => setMode(m => m === 'DEFENSIVE' ? 'OFFENSIVE' : 'DEFENSIVE')}
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold font-mono transition-all shadow-lg hover:scale-110 active:scale-95 ${mode === 'DEFENSIVE' ? 'bg-white text-black' : 'bg-zinc-800 text-white border border-white/20'}`}
            >
              {mode === 'DEFENSIVE' ? 'DM' : 'SP'}
            </button>
            <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-zinc-500">{mode === 'DEFENSIVE' ? 'Damned' : 'Specter'}</span>
          </div>
        }
        footer={
          <div className="flex flex-col items-center gap-4 w-full px-2">
            <button 
              onClick={() => setHelpMode(!helpMode)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${helpMode ? 'bg-white text-black' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/5 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_white] ${mode === 'DEFENSIVE' ? 'bg-white' : 'bg-white/40'}`} />
          </div>
        }
      />

      {/* Help Overlay (Az Feature) */}
      <AnimatePresence>
        {helpMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHelpMode(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-8 cursor-pointer"
          >
            <div className="max-w-xl space-y-6 text-center border border-white/10 p-12 bg-zinc-950 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <HelpCircle className="w-12 h-12 text-white mx-auto opacity-20" />
              <h2 className="text-2xl font-bold uppercase tracking-[0.4em] text-white">System Guidance</h2>
              <div className="space-y-4 text-zinc-400 font-mono text-sm leading-relaxed">
                <p>Welcome to the threshold. Every icon you click represents a choice. Every choosing is a loss of alternate futures.</p>
                <p><span className="text-white">DAMNED</span> is for the desperate defense of what remains. <span className="text-white">SPECTER</span> is for the clinical dismantling of those who think they are safe.</p>
                <p className="border-t border-white/10 pt-4 text-[10px] uppercase italic">"In the end, all bits return to the void."</p>
              </div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest animate-pulse">Click anywhere to return to the simulation</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-surface-nav/30 backdrop-blur-sm border border-surface-border rounded-2xl shadow-xl">
        {/* AzRoller: Global Ticker */}
        <AzRoller messages={tickerMessages} />
        
        {/* Top Header Metrics Bar */}
        <header className="h-16 bg-surface-nav border-b border-surface-border flex items-center justify-between px-8 shrink-0">
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{mode === 'DEFENSIVE' ? 'Total Analyzed' : 'Nodes Compromised'}</span>
              <span className="text-lg font-mono text-white leading-none">
                {mode === 'DEFENSIVE' 
                  ? `${tasks.filter(t=>t.status==='completed').length} / ${tasks.length}`
                  : campaigns.reduce((acc, c) => acc + c.targets_compromised, 0)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{mode === 'DEFENSIVE' ? 'Throughput' : 'Exfiltration'}</span>
              <span className={`text-lg font-mono leading-none ${mode === 'DEFENSIVE' ? 'text-brand-primary' : 'text-attack-primary'}`}>
                {mode === 'DEFENSIVE' ? '4.8 GB/s' : '1.2 TB'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{mode === 'DEFENSIVE' ? 'Latency' : 'Dwell Time'}</span>
              <span className="text-lg font-mono text-white leading-none">
                {mode === 'DEFENSIVE' ? '1.4ms' : '14.2d'}
              </span>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button 
              onClick={collectIntel}
              disabled={isCollecting}
              className="p-2 hover:bg-slate-900 border border-transparent hover:border-white/10 rounded-lg transition-all text-slate-600 hover:text-white disabled:opacity-50"
            >
              {isCollecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
            </button>
            <div className="h-6 w-px bg-surface-border mx-2" />
            <button className="px-4 py-1.5 border border-white/10 rounded text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">Export</button>
            <button className="px-4 py-1.5 bg-white text-black font-bold rounded text-xs uppercase tracking-[0.2em] hover:opacity-80 transition-all">Sync</button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Center Main: Pipeline & Queue */}
            <div className="col-span-12 xl:col-span-8 space-y-6">
              {/* Pipeline Visualizer */}
              <div className="bg-surface-nav border border-surface-border rounded-xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300">
                      {mode === 'DEFENSIVE' ? 'Automated Intelligence Pipeline' : 'Adversary Emulation Cycle'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                      {mode === 'DEFENSIVE' ? 'Sec 2.3.2 Infrastructure Implementation' : 'Red-Team Simulation Engine'}
                    </p>
                  </div>
                  <div className={`text-xs font-mono bg-opacity-10 px-2 py-1 rounded ${mode === 'DEFENSIVE' ? 'text-brand-primary bg-brand-primary' : 'text-attack-primary bg-attack-primary'}`}>
                    {mode === 'DEFENSIVE' ? 'Autonomous Process Active' : 'Campaign Execution in Progress'}
                  </div>
                </div>

                <div className="relative flex items-center justify-between px-6 mb-4">
                  <div className="absolute top-6 left-12 right-12 h-px bg-surface-border z-0" />
                  {(mode === 'DEFENSIVE' ? ANALYSIS_STEPS : ATTACK_STEPS).map((step, i) => (
                    <PipelineNode 
                      key={step} 
                      name={step} 
                      active={activeStep === i} 
                      completed={i < activeStep}
                      load={Math.floor(Math.random() * 40) + 30}
                      mode={mode}
                    />
                  ))}
                </div>
              </div>

              {/* Task Queue / Operations Table */}
              <div className="bg-surface-nav border border-surface-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-surface-border flex justify-between items-center bg-slate-900/50">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    {mode === 'DEFENSIVE' ? <Terminal className="w-4 h-4 text-brand-primary" /> : <Activity className="w-4 h-4 text-attack-primary" />}
                    {mode === 'DEFENSIVE' ? 'Active Thread Queue' : 'Live Operation Stream'}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                    {mode === 'DEFENSIVE' ? 'Live Ingestion' : 'Agent Heartbeat Active'}
                  </span>
                </div>
                <div className="min-h-[400px]">
                  <AnimatePresence mode="popLayout">
                    {mode === 'DEFENSIVE' ? (
                      tasks.length > 0 ? tasks.map((task) => (
                        <TaskRow key={task.id} task={task} onSelect={setSelectedTask} />
                      )) : (
                        <div className="flex-1 flex items-center justify-center min-h-[400px]">
                          <AzLoad />
                        </div>
                      )
                    ) : (
                      operations.map((op) => (
                        <motion.div 
                          key={op.id}
                          layout
                          className="flex items-center justify-between p-3 border-b border-surface-border/50 hover:bg-slate-800/30 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${op.status === 'processing' ? 'bg-attack-primary animate-pulse' : op.status === 'completed' ? 'bg-attack-primary' : 'bg-slate-600'}`} />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-500 uppercase">UID: {op.id}</span>
                                <span className="px-1.5 py-0.5 bg-attack-primary/10 text-attack-primary text-[9px] rounded uppercase font-bold tracking-wider">{op.type}</span>
                                {op.technique && <span className="text-[9px] text-slate-500 font-mono">[{op.technique}]</span>}
                              </div>
                              <p className="text-sm font-medium text-slate-200 truncate max-w-[300px]">{op.target}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 font-mono">PID: 4021</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-20 bg-surface-border h-1 rounded-full overflow-hidden">
                                  <div className="h-full bg-attack-primary rounded-full transition-all duration-300" style={{ width: `${op.progress}%` }} />
                                </div>
                                <span className="text-[9px] text-attack-primary font-mono">{op.progress}%</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-attack-primary transition-colors" />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                  {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-600">
                      <Loader2 className="w-8 h-8 animate-spin mb-4" />
                      <p className="text-sm uppercase tracking-widest font-bold">Waiting for feeds...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Side Column: Selection & IOCs / Campaigns */}
            <div className="col-span-12 xl:col-span-4 space-y-6">
              {mode === 'DEFENSIVE' ? (
                <>
                  {/* Task Analysis Card */}
                  <div className="bg-surface-nav p-5 border border-surface-border rounded-xl min-h-[300px]">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-4 flex justify-between">
                      <span>Selected Analysis</span>
                      {selectedTask && <span className="text-brand-primary">#{selectedTask.id}</span>}
                    </h4>
                    {selectedTask ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-mono">Source / Target</p>
                          <p className="text-xs font-bold text-white break-all">{selectedTask.target || selectedTask.source}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-mono">Analysis Insight</p>
                          <p className="text-xs text-slate-300 mt-1 italic">
                            {selectedTask.analysis_summary || (selectedTask.status === 'processing' ? 'Enriching via Gemini AI...' : 'Pending analysis...')}
                          </p>
                        </div>
                        {selectedTask.severity_score && (
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-400 uppercase">Risk Level</span>
                              <span className={selectedTask.severity_score > 70 ? 'text-brand-danger' : 'text-brand-primary'}>{selectedTask.severity_score}/100</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div className={`h-full ${selectedTask.severity_score > 70 ? 'bg-brand-danger' : 'bg-brand-primary'}`} style={{ width: `${selectedTask.severity_score}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 p-10 text-center">
                        <p className="text-xs uppercase tracking-widest leading-loose">Select a thread from the queue to view AI-enriched intelligence</p>
                      </div>
                    )}
                  </div>

                  {/* Extracted IOCs */}
                  <div className="bg-surface-nav p-5 border border-surface-border rounded-xl flex-1 flex flex-col">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-3">Extracted High-Risk Domains</h4>
                    <div className="space-y-2 font-mono text-[11px] overflow-y-auto max-h-[300px]">
                      {extractedIOCs.length > 0 ? extractedIOCs.map((ioc, i) => (
                        <div key={i} className="border-l-2 border-brand-primary pl-3 py-1 bg-brand-primary/5 flex justify-between">
                          <span className="text-slate-300 truncate max-w-[200px]">{ioc.val}</span>
                          <span className={ioc.severity === 'Critical' ? 'text-brand-danger font-bold' : 'text-brand-primary'}>[{ioc.severity}]</span>
                        </div>
                      )) : (
                        <p className="text-slate-600 text-center py-4">No high-risk domains identified yet</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Target Intelligence Module */}
                  <div className="bg-surface-nav p-5 border border-surface-border rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Target Intelligence</h4>
                      <button 
                        onClick={analyzeTargetIntel}
                        disabled={isAnalyzingTarget || !targetVal}
                        className="text-[9px] text-attack-primary font-bold uppercase tracking-widest border border-attack-primary/30 px-2 py-0.5 rounded hover:bg-attack-primary hover:text-slate-900 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {isAnalyzingTarget ? <Loader2 className="w-2 h-2 animate-spin" /> : <Search className="w-2 h-2" />}
                        AI Intel
                      </button>
                    </div>

                    {targetIntel ? (
                      <div className="space-y-4">
                        <div className="p-2 bg-slate-900/50 border border-surface-border rounded">
                          <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Target Profile</p>
                          <p className="text-[10px] text-slate-200 leading-relaxed italic">"{targetIntel.profile}"</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-500 uppercase font-mono">Suggested Vectors</p>
                          {targetIntel.vectors.map((vec: any, idx: number) => (
                            <div 
                              key={idx} 
                              className="group p-2 border border-surface-border bg-slate-900/30 rounded hover:border-attack-primary/50 transition-all cursor-pointer"
                              onClick={() => {
                                setTargetVal(targetVal); // Keep target
                                if (vec.platform.toLowerCase().includes('messenger')) {
                                  // Suggest platform selection if possible in UI
                                }
                                // In a more complex app, we'd pre-fill the form here
                              }}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-attack-primary uppercase">{vec.title}</span>
                                <span className="text-[8px] bg-slate-800 text-slate-400 px-1 rounded uppercase">{vec.platform}</span>
                              </div>
                              <p className="text-[9px] text-slate-400 group-hover:text-slate-300 transition-colors">{vec.description}</p>
                            </div>
                          ))}
                        </div>
                        <div className="p-2 border border-attack-primary/20 bg-attack-primary/5 rounded">
                          <p className="text-[10px] text-attack-primary uppercase font-bold mb-1">AI Recommendation</p>
                          <p className="text-[9px] text-slate-300">{targetIntel.recommendation}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center border border-dashed border-surface-border rounded-lg">
                        <p className="text-[9px] text-slate-600 uppercase font-mono">Enter a target and run AI Intel for personalized insights</p>
                      </div>
                    )}
                  </div>

                  {/* Campaign Stats */}
                  <div className="bg-surface-nav p-5 border border-surface-border rounded-xl">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-4">Active Campaigns</h4>
                    <div className="space-y-4">
                      {campaigns.map((c) => (
                        <div key={c.id} className="p-3 bg-slate-900/50 border border-surface-border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-white">OP: {c.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-attack-primary/10 text-attack-primary rounded uppercase font-bold tracking-tighter">{c.status}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="text-[10px]">
                              <p className="text-slate-500 uppercase">Success</p>
                              <p className="text-white font-mono">{c.success_rate}%</p>
                            </div>
                            <div className="text-[10px]">
                              <p className="text-slate-500 uppercase">Dwell</p>
                              <p className="text-white font-mono">{c.dwell_time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Staged Payloads */}
                  <div className="bg-surface-nav p-5 border border-surface-border rounded-xl flex-1 flex flex-col">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-3">Operation Configuration</h4>
                    <div className="space-y-4">
                      <div>
                        <AzTextBox 
                          label="Target Identity // HOST"
                          placeholder="+10000000000"
                          value={targetVal}
                          onChange={setTargetVal}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {['Phishing', 'Exploit', 'Exfiltration', 'Scan'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setSelectedOpType(type as any)}
                            className={`flex-1 min-w-[70px] py-1.5 text-[9px] uppercase font-bold tracking-tighter rounded-md border transition-all ${selectedOpType === type ? 'bg-attack-primary text-slate-950 border-attack-primary' : 'bg-slate-900 text-slate-500 border-surface-border hover:border-attack-primary/50'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">Technique / Vector</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {TECHNIQUES[selectedOpType].map((tech) => (
                            <button
                              key={tech}
                              onClick={() => setSelectedTechnique(tech)}
                              className={`py-1 px-2 text-[8px] uppercase font-mono text-left rounded border truncate transition-all ${selectedTechnique === tech ? 'bg-attack-primary/20 text-attack-primary border-attack-primary/50' : 'bg-slate-900/50 text-slate-500 border-surface-border hover:border-slate-600'}`}
                            >
                              {tech}
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedOpType === 'Exploit' && (
                        <div className="space-y-3 p-3 bg-slate-900/50 border border-surface-border rounded-lg">
                          <p className="text-[10px] text-attack-primary uppercase font-bold font-mono">Exploit Parameters</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 uppercase font-mono">CVE Reference</label>
                              <input 
                                type="text"
                                value={exploitCVE}
                                onChange={(e) => setExploitCVE(e.target.value)}
                                className="w-full bg-slate-950 border border-surface-border rounded p-1.5 text-[10px] text-white focus:border-attack-primary outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 uppercase font-mono">Payload Type</label>
                              <select 
                                value={exploitPayload}
                                onChange={(e) => setExploitPayload(e.target.value)}
                                className="w-full bg-slate-950 border border-surface-border rounded p-1.5 text-[10px] text-white focus:border-attack-primary outline-none"
                              >
                                <option value="reverse_tcp">Reverse TCP</option>
                                <option value="bind_tcp">Bind TCP</option>
                                <option value="meterpreter">Meterpreter</option>
                                <option value="custom_shell">Custom Shellcode</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedOpType === 'Exfiltration' && (
                        <div className="space-y-3 p-3 bg-slate-900/50 border border-surface-border rounded-lg">
                          <p className="text-[10px] text-attack-primary uppercase font-bold font-mono">Exfil Channels</p>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-500 uppercase font-mono">Destination Server</label>
                              <input 
                                type="text"
                                value={exfilDest}
                                onChange={(e) => setExfilDest(e.target.value)}
                                className="w-full bg-slate-950 border border-surface-border rounded p-1.5 text-[10px] text-white focus:border-attack-primary outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 uppercase font-mono">Protocol</label>
                                <select 
                                  value={exfilProtocol}
                                  onChange={(e) => setExfilProtocol(e.target.value)}
                                  className="w-full bg-slate-950 border border-surface-border rounded p-1.5 text-[10px] text-white focus:border-attack-primary outline-none"
                                >
                                  <option value="HTTPS">HTTPS</option>
                                  <option value="DNS">DNS</option>
                                  <option value="FTP">FTP</option>
                                  <option value="ICMP">ICMP</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 uppercase font-mono">Chunking</label>
                                <select 
                                  value={exfilChunking}
                                  onChange={(e) => setExfilChunking(e.target.value)}
                                  className="w-full bg-slate-950 border border-surface-border rounded p-1.5 text-[10px] text-white focus:border-attack-primary outline-none"
                                >
                                  <option value="16KB">16KB</option>
                                  <option value="64KB">64KB</option>
                                  <option value="256KB">256KB</option>
                                  <option value="1MB">1MB</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2 flex-1 flex flex-col">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] text-slate-600 uppercase font-mono tracking-[0.2em]">Staged Artifacts</p>
                            <label className="cursor-pointer group">
                               <input type="file" className="hidden" onChange={handlePayloadUpload} disabled={isUploading} />
                               <span className="text-[9px] text-white font-bold uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded hover:bg-white hover:text-black transition-all flex items-center gap-1">
                                 {isUploading ? <Loader2 className="w-2 h-2 animate-spin" /> : <Upload className="w-2 h-2" />}
                                 Commit Vector
                               </span>
                            </label>
                          </div>
                          <div className="flex gap-2 items-center bg-slate-900/50 p-1.5 rounded border border-surface-border">
                            <Lock className="w-3 h-3 text-slate-500" />
                            <input 
                              type="password" 
                              placeholder="Encryption Key (Optional)" 
                              value={encryptionKey}
                              onChange={(e) => setEncryptionKey(e.target.value)}
                              className="bg-transparent border-none text-[9px] text-slate-300 w-full focus:outline-none placeholder:text-slate-600"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1 custom-scrollbar">
                          {stagedPayloads.map((p) => (
                            <div 
                              key={p.id} 
                              onClick={() => setSelectedPayloadId(p.id === selectedPayloadId ? null : p.id)}
                              className={`p-2 border rounded flex justify-between items-center group transition-all cursor-pointer ${selectedPayloadId === p.id ? 'border-attack-primary bg-attack-primary/5' : 'border-surface-border bg-slate-900/30 hover:border-slate-600'}`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className={`p-1 rounded ${selectedPayloadId === p.id ? 'bg-attack-primary/20 text-attack-primary' : 'bg-slate-800 text-slate-500'}`}>
                                  <FileCode className="w-3 h-3" />
                                </div>
                                <div className="truncate">
                                  <div className="flex items-center gap-1">
                                    <p className={`text-[11px] font-mono truncate ${selectedPayloadId === p.id ? 'text-attack-primary' : 'text-slate-200'}`}>{p.name}</p>
                                    {p.encrypted && <Lock className="w-2 h-2 text-attack-primary" />}
                                  </div>
                                  <p className="text-[9px] text-slate-500 uppercase">{p.type} // {p.size}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setViewingPayload(p); }}
                                  className="p-1 text-slate-600 hover:text-attack-primary transition-all"
                                  title="View Details"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deletePayload(p.id); }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-white transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <RefreshCcw className={`w-3 h-3 ${selectedPayloadId === p.id ? 'text-attack-primary' : 'text-slate-600 group-hover:text-slate-400'}`} />
                              </div>
                            </div>
                          ))}
                          {stagedPayloads.length === 0 && (
                            <div className="py-8 text-center border border-dashed border-surface-border rounded-lg">
                              <p className="text-[10px] text-slate-600 uppercase font-mono">No artifacts staged</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button 
                          disabled={isDispatching}
                          onClick={() => dispatchAttack('whatsapp', targetVal, selectedOpType)}
                          className="py-2 bg-attack-primary/10 border border-attack-primary/30 text-attack-primary text-[10px] uppercase font-bold tracking-widest hover:bg-attack-primary hover:text-slate-950 transition-all rounded disabled:opacity-50"
                        >
                          {isDispatching ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'WhatsApp'}
                        </button>
                        <button 
                          disabled={isDispatching}
                          onClick={() => dispatchAttack('sms', targetVal, selectedOpType)}
                          className="py-2 bg-attack-primary/5 border border-attack-primary/20 text-attack-primary text-[10px] uppercase font-bold tracking-widest hover:bg-attack-primary/20 hover:text-white transition-all rounded disabled:opacity-50"
                        >
                          SMS
                        </button>
                      </div>

                      <button 
                        disabled={isDispatching}
                        onClick={() => dispatchAttack('facebook', targetVal, selectedOpType)}
                        className="w-full py-2 bg-blue-600/10 border border-blue-600/30 text-blue-400 text-[10px] uppercase font-bold tracking-widest hover:bg-blue-600 hover:text-white transition-all rounded disabled:opacity-50"
                      >
                        Facebook Messenger
                      </button>
                      
                      <button 
                        disabled={isDispatching}
                        onClick={() => dispatchAttack('network', targetVal, selectedOpType)}
                        className="w-full py-2 bg-slate-800 border border-surface-border text-slate-400 text-[10px] uppercase font-bold tracking-widest hover:bg-slate-700 hover:text-white transition-all rounded"
                      >
                        Execute Network Module
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <footer className={`h-10 bg-surface-nav border-t border-surface-border flex items-center px-6 justify-between text-[10px] text-slate-500 font-mono shrink-0`}>
          <div className="flex gap-4">
            <span>v2.3.2-STABLE</span>
            <span className="text-slate-700">|</span>
            <span>CID:ais-pre-fwpclxy2mhuaiidlrgepoh</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mode === 'DEFENSIVE' ? 'bg-brand-primary shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'bg-attack-primary shadow-[0_0_10px_rgba(255,255,255,0.4)]'}`}></div>
            <span className="uppercase tracking-widest font-bold">
              {mode === 'DEFENSIVE' ? 'Secure Connection Established // TLS 1.3' : 'Command Tunnel Active // 256-bit AES'}
            </span>
          </div>
        </footer>

        {/* Payload Details Modal */}
        <AnimatePresence>
          {viewingPayload && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface-nav border border-surface-border p-6 rounded-2xl w-full max-w-md shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-attack-primary/10 rounded-lg text-attack-primary">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 uppercase font-mono">Artifact Details</h3>
                      <p className="text-[10px] text-slate-500">SYSTEM ID: {viewingPayload.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setViewingPayload(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-mono">Filename</label>
                      <p className="text-xs text-slate-200 font-mono truncate">{viewingPayload.name}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-mono">Type</label>
                      <p className="text-xs text-slate-200 font-mono">{viewingPayload.type}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-mono">Size</label>
                      <p className="text-xs text-slate-200 font-mono">{viewingPayload.size}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase font-mono">Philosophical Weight</label>
                      <p className="text-[10px] text-white italic">"A digital phantom born from the need to hurt what we cannot understand."</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/50 border border-surface-border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Security Status</span>
                      {viewingPayload.encrypted ? (
                        <span className="flex items-center gap-1.5 text-[9px] text-white font-bold uppercase">
                          <Lock className="w-3 h-3" /> Secure // Zero Exposure
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[9px] text-white/40 font-bold uppercase border-b border-white/20">
                          <ShieldAlert className="w-3 h-3" /> Unprotected // Exposed to Reality
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500 italic">
                      {viewingPayload.encrypted 
                        ? "The artifact is locked away from the world's prying eyes. A secret kept by a machine that cannot feel." 
                        : "Warning: This artifact lay bare in the abyss. It is as vulnerable as any of us."}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setViewingPayload(null)}
                  className="w-full mt-6 py-2 bg-slate-800 text-slate-200 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Close Inspector
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

