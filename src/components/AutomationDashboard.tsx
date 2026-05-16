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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-card border-accent/30 w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl shadow-accent/20 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-background-deep to-accent/10 p-6 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px neon-glow-line opacity-50" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-3 tracking-widest">
              <Zap className="w-6 h-6 text-accent animate-pulse" />
              AUTOMATION CENTER
            </h2>
            <p className="text-accent text-[10px] uppercase tracking-[0.3em] font-mono opacity-70">Scheduled Tasks & Macro Sequences</p>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={() => openEditor(activeTab === 'tasks' ? 'task' : 'macro')}
              className="bg-accent hover:bg-accent/80 text-white px-6 py-2 rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-accent/20 flex items-center gap-2 uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" /> Create {activeTab === 'tasks' ? 'Task' : 'Macro'}
            </button>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <button onClick={onClose} className="text-foreground-muted hover:text-foreground transition-all hover:rotate-90 p-2">
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        {status && (
          <div className="bg-white/[0.02] p-4 border-b border-white/5 flex gap-8 text-[10px] font-mono tracking-widest uppercase">
            <div className="text-accent flex items-center gap-2">
              <span className="opacity-50">Tasks:</span> {status.enabled_tasks}/{status.total_tasks}
            </div>
            <div className="text-purple-400 flex items-center gap-2">
              <span className="opacity-50">Macros:</span> {status.enabled_macros}/{status.total_macros}
            </div>
            <div className="text-orange-400 flex items-center gap-2">
              <span className="opacity-50">Active Jobs:</span> {status.scheduled_jobs}
            </div>
            <div className={`ml-auto px-3 py-1 rounded-full border flex items-center gap-2 ${status.running ? 'text-green-400 bg-green-400/10 border-green-500/20' : 'text-red-400 bg-red-400/10 border-red-500/20'}`}>
              <Activity className={`w-3 h-3 ${status.running ? 'animate-pulse' : ''}`} />
              SCHEDULER: {status.running ? 'ACTIVE' : 'IDLE'}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-white/[0.02] shrink-0">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-4 text-center text-[10px] font-bold tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-3 ${
              activeTab === 'tasks'
                ? 'bg-accent/10 text-accent border-b-2 border-accent'
                : 'text-foreground-muted hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Scheduled Tasks
          </button>
          <button
            onClick={() => setActiveTab('macros')}
            className={`flex-1 py-4 text-center text-[10px] font-bold tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-3 ${
              activeTab === 'macros'
                ? 'bg-purple-500/10 text-purple-400 border-b-2 border-purple-500'
                : 'text-foreground-muted hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            Sequence Macros
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-accent gap-6">
              <RefreshCw className="w-12 h-12 animate-spin opacity-50" />
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] animate-pulse">Accessing Automation Hub...</p>
            </div>
          ) : activeTab === 'tasks' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(!tasks || tasks.length === 0) ? (
                <div className="col-span-2 text-center py-20 text-foreground-muted opacity-40">
                  <Calendar className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No scheduled tasks found</p>
                  <p className="text-[10px] mt-1 font-mono">Create a task to automate recurring actions.</p>
                </div>
              ) : (
                tasks?.map((task) => (
                  <div key={task.id} className={`glass-panel p-6 transition-all hover:bg-white/[0.03] animate-fade-in ${task.enabled ? 'border-white/10' : 'border-white/5 opacity-50 grayscale'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-foreground text-lg tracking-tight">{task.name}</h3>
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border ${task.enabled ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/10 text-foreground-muted border-white/10'}`}>
                            {task.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-foreground-muted text-xs mt-1.5 line-clamp-2 leading-relaxed">{task.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6 bg-background-deep/40 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3 text-[10px] text-accent font-mono uppercase tracking-widest">
                        <span className="opacity-40">Schedule:</span> {getScheduleLabel(task)}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-foreground font-mono uppercase tracking-tighter overflow-hidden">
                        <span className="opacity-40 uppercase tracking-widest">Cmd:</span> 
                        <span className="truncate">{task.command}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="text-[9px] text-foreground-muted font-mono uppercase tracking-widest">
                        Runs: {task.run_count} | Sync: {task.last_run ? new Date(task.last_run).toLocaleTimeString() : 'NEVER'}
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => toggleTask(task.id)} 
                          className={`p-2 rounded-xl transition-all ${task.enabled ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-green-500/10 text-green-400'}`} 
                          title={task.enabled ? 'Suspend Task' : 'Resume Task'}
                          aria-label={task.enabled ? 'Suspend Task' : 'Resume Task'}
                        >
                          {task.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => openEditor('task', task)} 
                          className="p-2 hover:bg-white/5 text-foreground-muted hover:text-foreground rounded-xl transition-all" 
                          title="Edit Parameters"
                          aria-label="Edit Parameters"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteTask(task.id)} 
                          className="p-2 hover:bg-red-500/10 text-foreground-muted hover:text-red-400 rounded-xl transition-all" 
                          title="Purge Task"
                          aria-label="Purge Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {macros?.length === 0 ? (
                <div className="col-span-2 text-center py-20 text-foreground-muted opacity-40">
                  <Layers className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No macros created</p>
                  <p className="text-[10px] mt-1 font-mono">Combine multiple commands into a single sequence.</p>
                </div>
              ) : (
                macros?.map((macro) => (
                  <div key={macro.id} className={`glass-panel p-6 transition-all hover:bg-white/[0.03] animate-fade-in ${macro.enabled ? 'border-white/10' : 'border-white/5 opacity-50 grayscale'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-foreground text-lg tracking-tight">{macro.name}</h3>
                          <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border ${macro.enabled ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-white/10 text-foreground-muted border-white/10'}`}>
                            {macro.enabled ? 'Active' : 'Muted'}
                          </span>
                        </div>
                        <p className="text-foreground-muted text-xs mt-1.5 leading-relaxed">{macro.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="text-[9px] px-3 py-1 bg-background-deep/40 border border-white/5 rounded-lg text-foreground-muted uppercase font-mono tracking-widest">
                        Trigger: {macro.trigger}
                      </span>
                      {macro.trigger_phrase && (
                        <span className="text-[9px] px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 font-mono tracking-tight">
                          "{macro.trigger_phrase}"
                        </span>
                      )}
                      <span className="text-[9px] px-3 py-1 bg-accent/10 border border-accent/30 rounded-lg text-accent font-mono font-bold tracking-widest">
                        {macro.commands?.length || 0} STEPS
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <button 
                        onClick={() => runMacro(macro.id)}
                        disabled={!macro.enabled}
                        className="bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:opacity-50 text-white text-[10px] font-black px-6 py-2 rounded-xl transition-all shadow-lg shadow-purple-500/20 uppercase tracking-[0.2em] flex items-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5" /> RUN MACRO
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => toggleMacro(macro.id)} className="p-2 hover:bg-white/5 text-foreground-muted hover:text-foreground rounded-xl transition-all" title={macro.enabled ? 'Mute' : 'Activate'}>
                          {macro.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEditor('macro', macro)} className="p-2 hover:bg-white/5 text-foreground-muted hover:text-foreground rounded-xl transition-all" title="Edit Macro">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMacro(macro.id)} className="p-2 hover:bg-red-500/10 text-foreground-muted hover:text-red-400 rounded-xl transition-all" title="Delete Macro">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="bg-background-deep/40 p-5 border-t border-white/5 flex justify-between items-center px-8 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-white/5" />
          <div className="text-[9px] text-foreground-muted uppercase tracking-[0.3em] font-mono flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-accent" />
            SECURE AUTOMATION PROTOCOL v4.0 // {new Date().getFullYear()}
          </div>
          <button onClick={fetchData} className="text-accent hover:text-accent/80 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync with Backend
          </button>
        </div>
      </div>

      {/* Editor Modal Overlay */}

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
      `}</style>
    </div>
  );
};

