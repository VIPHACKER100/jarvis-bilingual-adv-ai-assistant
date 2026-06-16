import { useState, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Calendar, Layers, Plus, X, RefreshCw, Play, Pause, Edit2, Trash2, ShieldCheck, Activity } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { AutomationEditor } from './AutomationEditor';
import { useNotifications } from '../context/NotificationContext';
import { AutomationTask, AutomationMacro, AutomationStatusResponse } from '../types/api';

interface AutomationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomationDashboard: FC<AutomationDashboardProps> = ({ isOpen, onClose }) => {
  const { addNotification } = useNotifications();
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [macros, setMacros] = useState<AutomationMacro[]>([]);
  const [status, setStatus] = useState<AutomationStatusResponse['status'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'macros'>('tasks');
  
  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState<'task' | 'macro'>('task');
  const [editingItem, setEditingItem] = useState<AutomationTask | AutomationMacro | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tasksData = await apiClient.getTasks();
      if (tasksData.success) setTasks(tasksData.tasks || []);

      const macrosData = await apiClient.getMacros();
      if (macrosData.success) setMacros(macrosData.macros || []);

      const statusData = await apiClient.getAutomationStatus();
      if (statusData.success) setStatus(statusData.status);
    } catch (error) {
      console.error('Error fetching automation data:', error);
    }
    setLoading(false);
  };

  const toggleTask = async (taskId: string) => {
    try {
      await apiClient.toggleTask(taskId);
      addNotification({
        type: 'info',
        title: 'Task Status Updated',
        message: `Scheduled task successfully modified.`,
        duration: 2000
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiClient.deleteTask(taskId);
      addNotification({
        type: 'warning',
        title: 'Task Removed',
        message: 'The scheduled task has been permanently deleted.',
        duration: 3000
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const runMacro = async (macroId: string) => {
    try {
      await apiClient.runMacro(macroId);
      addNotification({
        type: 'success',
        title: 'Macro Sequence Triggered',
        message: `Autonomous sequence ${macroId} is now executing...`,
        duration: 4000
      });
      fetchData();
    } catch (error) {
      console.error('Error running macro:', error);
    }
  };

  const toggleMacro = async (macroId: string) => {
    try {
      await apiClient.toggleMacro(macroId);
      fetchData();
    } catch (error) {
      console.error('Error toggling macro:', error);
    }
  };

  const deleteMacro = async (macroId: string) => {
    if (!confirm('Are you sure you want to delete this macro?')) return;
    try {
      await apiClient.deleteMacro(macroId);
      fetchData();
    } catch (error) {
      console.error('Error deleting macro:', error);
    }
  };

  const openEditor = (type: 'task' | 'macro', item: AutomationTask | AutomationMacro | null = null) => {
    setEditorType(type);
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  const getScheduleLabel = (task: AutomationTask) => {
    switch (task.schedule_type) {
      case 'once':
        return task.schedule_time ? `Once at ${task.schedule_time}` : 'One-time';
      case 'interval':
        return task.schedule_time ? `Every ${task.schedule_time} seconds` : 'Interval';
      case 'cron':
        return task.schedule_time || 'Cron schedule';
      default:
        return task.schedule_type;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="hud-panel w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col relative"
      >
        <div className="scanline-overlay" />
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center relative overflow-hidden bg-white/[0.02]">
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <Zap className="w-6 h-6 text-accent animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground label-caps tracking-widest flex items-center gap-2">
                AUTOMATION CENTER
                <span className="text-[10px] text-accent opacity-50 px-2 py-0.5 border border-accent/30 rounded font-mono">v4.2</span>
              </h2>
              <p className="text-accent text-[10px] uppercase tracking-[0.3em] font-mono opacity-70">Scheduled Tasks & Macro Sequences</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={() => openEditor(activeTab === 'tasks' ? 'task' : 'macro')}
              className="bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 px-6 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 label-caps tracking-widest"
            >
              <Plus className="w-4 h-4" /> CREATE {activeTab === 'tasks' ? 'TASK' : 'MACRO'}
            </button>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-white/5 text-foreground-muted hover:text-foreground transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        {status && (
          <div className="bg-white/[0.01] p-4 border-b border-white/5 flex items-center gap-8 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-6 shrink-0">
              <div className="flex flex-col">
                <span className="text-[8px] text-foreground-muted label-caps tracking-[0.2em] mb-1">Total Tasks</span>
                <span className="text-sm font-mono text-accent">{status.enabled_tasks}<span className="text-foreground-muted opacity-30 mx-1">/</span>{status.total_tasks}</span>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div className="flex flex-col">
                <span className="text-[8px] text-foreground-muted label-caps tracking-[0.2em] mb-1">Macros</span>
                <span className="text-sm font-mono text-purple-400">{status.enabled_macros}<span className="text-foreground-muted opacity-30 mx-1">/</span>{status.total_macros}</span>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div className="flex flex-col">
                <span className="text-[8px] text-foreground-muted label-caps tracking-[0.2em] mb-1">Active Jobs</span>
                <span className="text-sm font-mono text-orange-400">{status.scheduled_jobs}</span>
              </div>
            </div>
            
            <div className={`ml-auto px-4 py-2 rounded-lg border flex items-center gap-3 shrink-0 ${status.running ? 'text-green-400 bg-green-400/5 border-green-500/20' : 'text-red-400 bg-red-400/5 border-red-500/20'}`}>
              <div className={`w-2 h-2 rounded-full ${status.running ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-[9px] font-mono uppercase tracking-[0.2em]">SCHEDULER: {status.running ? 'ACTIVE' : 'IDLE'}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-white/[0.01] border-b border-white/5">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-4 text-[10px] font-bold tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${
              activeTab === 'tasks' ? 'text-accent' : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {activeTab === 'tasks' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-accent/5 border-b-2 border-accent" />}
            <Calendar className={`w-4 h-4 transition-transform duration-500 ${activeTab === 'tasks' ? 'scale-110' : 'opacity-40 group-hover:opacity-100'}`} />
            <span className="relative z-10">SCHEDULED TASKS</span>
          </button>
          <button
            onClick={() => setActiveTab('macros')}
            className={`flex-1 py-4 text-[10px] font-bold tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${
              activeTab === 'macros' ? 'text-purple-400' : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {activeTab === 'macros' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-purple-500/5 border-b-2 border-purple-500" />}
            <Layers className={`w-4 h-4 transition-transform duration-500 ${activeTab === 'macros' ? 'scale-110' : 'opacity-40 group-hover:opacity-100'}`} />
            <span className="relative z-10">SEQUENCE MACROS</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
                <RefreshCw className="w-6 h-6 text-accent absolute inset-0 m-auto opacity-50" />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] animate-pulse text-accent">Accessing Automation Hub...</p>
            </div>
          ) : activeTab === 'tasks' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(!tasks || tasks.length === 0) ? (
                <div className="col-span-2 text-center py-20 opacity-40">
                  <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center mx-auto mb-6 bg-white/[0.02]">
                    <Calendar className="w-10 h-10 text-foreground-muted" />
                  </div>
                  <p className="text-sm font-bold label-caps tracking-widest text-foreground">NO SCHEDULED TASKS</p>
                  <p className="text-[10px] mt-2 font-mono uppercase tracking-widest">Create a task to automate recurring actions.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <motion.div 
                    layout
                    key={task.id} 
                    className={`hud-panel p-6 group transition-all relative overflow-hidden ${!task.enabled ? 'opacity-50' : ''}`}
                  >
                    {!task.enabled && <div className="absolute inset-0 bg-black/40 backdrop-grayscale z-10 pointer-events-none" />}
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-foreground text-lg tracking-tight truncate">{task.name}</h3>
                          <div className={`h-2 w-2 rounded-full ${task.enabled ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400'}`} />
                        </div>
                        <p className="text-foreground-muted text-xs line-clamp-2 leading-relaxed opacity-70">{task.description || 'No description provided.'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-8">
                      <div className="bg-white/[0.02] border border-white/5 p-3 rounded-lg flex items-center justify-between">
                        <span className="text-[9px] text-foreground-muted label-caps tracking-widest">SCHEDULE</span>
                        <span className="text-[10px] font-mono text-accent uppercase">{getScheduleLabel(task)}</span>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 p-3 rounded-lg flex flex-col gap-2">
                        <span className="text-[9px] text-foreground-muted label-caps tracking-widest">COMMAND STRING</span>
                        <div className="bg-black/40 p-2 rounded border border-white/5 font-mono text-[10px] text-accent truncate">
                          {task.command}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-20">
                      <div className="flex flex-col gap-1">
                        <div className="text-[8px] text-foreground-muted label-caps tracking-widest">EXECUTION COUNT: <span className="text-foreground font-mono ml-1">{task.run_count}</span></div>
                        <div className="text-[8px] text-foreground-muted label-caps tracking-widest">LAST SYNC: <span className="text-foreground font-mono ml-1">{task.last_run ? new Date(task.last_run).toLocaleTimeString() : 'NEVER'}</span></div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleTask(task.id)} 
                          className={`p-2 rounded-lg transition-all border ${task.enabled ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`} 
                          title={task.enabled ? 'Suspend Task' : 'Resume Task'}
                        >
                          {task.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => openEditor('task', task)} 
                          className="p-2 border border-white/10 hover:border-accent/30 text-foreground-muted hover:text-accent rounded-lg transition-all hover:bg-accent/5" 
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteTask(task.id)} 
                          className="p-2 border border-white/10 hover:border-red-500/30 text-foreground-muted hover:text-red-400 rounded-lg transition-all hover:bg-red-500/5" 
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(!macros || macros.length === 0) ? (
                <div className="col-span-2 text-center py-20 opacity-40">
                  <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center mx-auto mb-6 bg-white/[0.02]">
                    <Layers className="w-10 h-10 text-foreground-muted" />
                  </div>
                  <p className="text-sm font-bold label-caps tracking-widest text-foreground">NO MACROS CONFIGURED</p>
                  <p className="text-[10px] mt-2 font-mono uppercase tracking-widest">Combine multiple commands into a single sequence.</p>
                </div>
              ) : (
                macros.map((macro) => (
                  <motion.div 
                    layout
                    key={macro.id} 
                    className={`hud-panel p-6 group transition-all relative overflow-hidden ${!macro.enabled ? 'opacity-50' : ''}`}
                  >
                    {!macro.enabled && <div className="absolute inset-0 bg-black/40 backdrop-grayscale z-10 pointer-events-none" />}
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-foreground text-lg tracking-tight truncate">{macro.name}</h3>
                          <span className={`text-[8px] px-2 py-0.5 rounded border label-caps tracking-widest ${macro.enabled ? 'border-purple-500/50 text-purple-400 bg-purple-500/5' : 'border-white/20 text-foreground-muted bg-white/5'}`}>
                            {macro.enabled ? 'ACTIVE' : 'MUTED'}
                          </span>
                        </div>
                        <p className="text-foreground-muted text-xs leading-relaxed opacity-70">{macro.description || 'Macro sequence definition.'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                      <div className="bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-[8px] text-foreground-muted label-caps tracking-widest">TRIGGER</span>
                        <span className="text-[10px] font-mono text-foreground uppercase">{macro.trigger}</span>
                      </div>
                      {macro.trigger_phrase && (
                        <div className="bg-purple-500/5 border border-purple-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <span className="text-[8px] text-purple-400/70 label-caps tracking-widest">PHRASE</span>
                          <span className="text-[10px] font-mono text-purple-400">"{macro.trigger_phrase}"</span>
                        </div>
                      )}
                      <div className="bg-accent/5 border border-accent/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-[10px] font-mono text-accent font-bold tracking-widest">{macro.commands?.length || 0} STEPS</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-20">
                      <button 
                        onClick={() => runMacro(macro.id)}
                        disabled={!macro.enabled}
                        className="bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-400 text-[10px] font-black px-6 py-2 rounded-lg transition-all label-caps tracking-widest flex items-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5" /> RUN SEQUENCE
                      </button>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleMacro(macro.id)} 
                          className="p-2 border border-white/10 hover:border-foreground/30 text-foreground-muted hover:text-foreground rounded-lg transition-all hover:bg-white/5" 
                        >
                          {macro.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => openEditor('macro', macro)} 
                          className="p-2 border border-white/10 hover:border-accent/30 text-foreground-muted hover:text-accent rounded-lg transition-all hover:bg-accent/5" 
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteMacro(macro.id)} 
                          className="p-2 border border-white/10 hover:border-red-500/30 text-foreground-muted hover:text-red-400 rounded-lg transition-all hover:bg-red-500/5" 
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white/[0.02] p-5 border-t border-white/5 flex justify-between items-center px-8 relative shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded bg-accent/10 border border-accent/20">
              <ShieldCheck className="w-4 h-4 text-accent" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-foreground-muted label-caps tracking-[0.3em] font-mono">SECURE AUTOMATION PROTOCOL v4.0</span>
              <span className="text-[7px] text-accent/50 font-mono">CONNECTION STABLE // ENCRYPTION AES-256</span>
            </div>
          </div>
          <button 
            onClick={fetchData} 
            className="group text-accent hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 bg-accent/5 px-4 py-2 rounded border border-accent/20 hover:bg-accent/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            REFRESH CORE
          </button>
        </div>
      </motion.div>

      <AutomationEditor 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)}
        type={editorType}
        item={editingItem || undefined}
        onSave={fetchData}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.4); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

