/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Activity, 
  Database, 
  Globe, 
  Layers, 
  ShieldAlert, 
  Terminal, 
  Zap,
  Server,
  ChevronRight,
  Search,
  Settings,
  Bell,
  Cpu as CpuIcon,
  RefreshCcw,
  Loader2
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
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
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

// --- Main App ---

export default function App() {
  const [mode, setMode] = useState<DashboardMode>('DEFENSIVE');
  const [tasks, setTasks] = useState<IntelTask[]>([]);
  const [campaigns, setCampaigns] = useState<AttackCampaign[]>([
    { id: 'OP-01', name: 'NIGHTFALL', status: 'active', success_rate: 82, dwell_time: '14d', targets_compromised: 12, last_activity: '2m ago' },
    { id: 'OP-02', name: 'GHOST-C2', status: 'planning', success_rate: 0, dwell_time: '0d', targets_compromised: 0, last_activity: 'Just now' },
  ]);
  const [operations, setOperations] = useState<AttackOperation[]>([
    { id: 'OP-A1', campaign_id: 'OP-01', type: 'Phishing', target: 'finance.corp.net', status: 'completed', progress: 100, technique: 'Spear Phishing' },
    { id: 'OP-B1', campaign_id: 'OP-01', type: 'Exploit', target: 'srv-04.dc.corp', status: 'processing', progress: 45, technique: 'CVE-2023-1284' },
    { id: 'OP-C1', campaign_id: 'OP-01', type: 'Exfiltration', target: 'db.corp.net', status: 'pending', progress: 0 },
  ]);
  
  const [activeStep, setActiveStep] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<IntelTask | null>(null);
  const analysisQueue = useRef<string[]>([]);

  // 1. Collector: Fetch from Backend CTI Proxy
  const collectIntel = useCallback(async () => {
    if (isCollecting) return;
    setIsCollecting(true);
    try {
      const res = await fetch('/api/collect');
      const data = await res.json();
      if (data.tasks) {
        setTasks(prev => {
          // Merge and avoid duplicates
          const existingIds = new Set(prev.map(t => t.id));
          const newTasks = data.tasks.filter((t: any) => !existingIds.has(t.id));
          return [...newTasks, ...prev].slice(0, 50);
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

  useEffect(() => {
    // Pipeline visualization animation
    const visInterval = setInterval(() => {
      const stepsCount = mode === 'DEFENSIVE' ? ANALYSIS_STEPS.length : ATTACK_STEPS.length;
      setActiveStep(s => (s + 1) % stepsCount);
    }, 4000);
    return () => clearInterval(visInterval);
  }, [mode]);

  // Process pending tasks one by one
  useEffect(() => {
    const pending = tasks.filter(t => t.status === 'pending').slice(0, 1);
    if (pending.length > 0) {
      analyzeTask(pending[0].id);
    }
  }, [tasks, analyzeTask]);

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
    <div className="h-screen bg-surface-base flex overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-surface-nav border-r border-surface-border flex flex-col">
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center justify-between mb-4">
            <div className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${mode === 'DEFENSIVE' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-attack-primary/10 text-attack-primary'}`}>
              Mode: {mode}
            </div>
            <button 
              onClick={() => setMode(m => m === 'DEFENSIVE' ? 'OFFENSIVE' : 'DEFENSIVE')}
              className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-500 hover:text-white"
            >
              <RefreshCcw className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${mode === 'DEFENSIVE' ? 'bg-brand-primary' : 'bg-attack-primary'} rounded flex items-center justify-center text-slate-950 font-bold transition-colors`}>
              {mode === 'DEFENSIVE' ? 'ST' : 'SP'}
            </div>
            <span className="font-semibold tracking-tight text-white uppercase text-sm">{mode === 'DEFENSIVE' ? 'Sentinel' : 'Specter'} v2.3.2</span>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-1">
          {mode === 'DEFENSIVE' ? (
            <>
              <div className="px-3 py-2 bg-slate-800 text-white rounded-md text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" /> Infrastructure Map
              </div>
              <div className="px-3 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-md text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
                <Terminal className="w-4 h-4" /> Node Explorer
              </div>
              <div className="px-3 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-md text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Security Protocols
              </div>
              <div className="px-3 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-md text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
                <Zap className="w-4 h-4" /> Deployment Pipeline
              </div>
              <div className="px-3 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-md text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
                <Database className="w-4 h-4" /> Audit Logs
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-2 bg-slate-800 text-white rounded-md text-sm font-medium flex items-center gap-2">
                <Layers className="w-4 h-4" /> Campaign Manager
              </div>
              <div className="px-3 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-md text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
                <Activity className="w-4 h-4" /> Payload Staging
              </div>
              <div className="px-3 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-md text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
                <Globe className="w-4 h-4" /> Target Recon
              </div>
              <div className="px-3 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-md text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
                <Zap className="w-4 h-4" /> C2 Infrastructure
              </div>
              <div className="px-3 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-white rounded-md text-sm font-medium cursor-pointer transition-colors flex items-center gap-2">
                <Settings className="w-4 h-4" /> Exfil Config
              </div>
            </>
          )}
        </div>
        <div className="p-4 border-t border-surface-border text-xs text-slate-500 font-mono">
          System Status: <span className={`${mode === 'DEFENSIVE' ? 'text-brand-primary' : 'text-attack-primary'} animate-pulse`}>
            {mode === 'DEFENSIVE' ? 'Synchronized' : 'Infiltrated'}
          </span>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
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
              <span className="text-lg font-mono text-brand-secondary leading-none">
                {mode === 'DEFENSIVE' ? '1.4ms' : '14.2d'}
              </span>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button 
              onClick={collectIntel}
              disabled={isCollecting}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white disabled:opacity-50"
            >
              {isCollecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
            </button>
            <div className="h-6 w-px bg-surface-border mx-2" />
            <button className="px-4 py-1.5 bg-slate-800 border border-surface-border rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors">Export INTEL</button>
            <button className="px-4 py-1.5 bg-brand-primary text-slate-950 font-bold rounded text-xs uppercase tracking-wider hover:brightness-110 transition-all">Manual Sync</button>
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
                      tasks.map((task) => (
                        <TaskRow key={task.id} task={task} onSelect={setSelectedTask} />
                      ))
                    ) : (
                      operations.map((op) => (
                        <motion.div 
                          key={op.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
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
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-3">Staged Payloads (Red)</h4>
                    <div className="space-y-2">
                      {[
                        { name: 'cobalt_beacon.exe', type: 'C2', size: '1.2MB' },
                        { name: 'shadow_inject.ps1', type: 'Loader', size: '14KB' },
                        { name: 'exfil_routine.py', type: 'Lateral', size: '256KB' },
                      ].map((p, i) => (
                        <div key={i} className="p-2 border border-surface-border bg-slate-900/30 rounded flex justify-between items-center group hover:border-attack-primary/50 transition-colors cursor-pointer">
                          <div>
                            <p className="text-[11px] font-mono text-slate-200 group-hover:text-attack-primary">{p.name}</p>
                            <p className="text-[9px] text-slate-500 uppercase">{p.type} // {p.size}</p>
                          </div>
                          <RefreshCcw className="w-3 h-3 text-slate-600 group-hover:text-attack-primary" />
                        </div>
                      ))}
                    </div>
                    <button className="mt-4 w-full py-2 bg-attack-primary/10 border border-attack-primary/30 text-attack-primary text-[10px] uppercase font-bold tracking-widest hover:bg-attack-primary hover:text-slate-950 transition-all rounded">
                      Deploy New Artifact
                    </button>
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
            <div className={`w-2 h-2 rounded-full ${mode === 'DEFENSIVE' ? 'bg-brand-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-attack-primary shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
            <span className="uppercase tracking-widest font-bold">
              {mode === 'DEFENSIVE' ? 'Secure Connection Established // TLS 1.3' : 'Command Tunnel Active // 256-bit AES'}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

