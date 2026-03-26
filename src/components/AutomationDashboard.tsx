import { useState, useEffect, FC } from 'react';
import { apiClient } from '../services/apiClient';
import { AutomationEditor } from './AutomationEditor';
import { useNotifications } from '../context/NotificationContext';

interface Task {
  id: string;
  name: string;
  description: string;
  command: string;
  schedule_type: string;
  schedule_time: string;
  days: string[];
  enabled: boolean;
  run_count: number;
  last_run: string;
}

interface Macro {
  id: string;
  name: string;
  description: string;
  commands: any[];
  trigger: string;
  trigger_phrase: string;
  enabled: boolean;
  run_count: number;
}

interface AutomationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomationDashboard: FC<AutomationDashboardProps> = ({ isOpen, onClose }) => {
  const { addNotification } = useNotifications();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'macros'>('tasks');
  
  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState<'task' | 'macro'>('task');
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tasksData = await apiClient.getTasks();
      if (tasksData.success) setTasks(tasksData.tasks);

      const macrosData = await apiClient.getMacros();
      if (macrosData.success) setMacros(macrosData.macros);

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

  const openEditor = (type: 'task' | 'macro', item: any = null) => {
    setEditorType(type);
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  const getScheduleLabel = (task: Task) => {
    switch (task.schedule_type) {
      case 'daily':
        return `Daily at ${task.schedule_time}`;
      case 'weekly':
        return `Weekly on ${task.days.join(', ')} at ${task.schedule_time}`;
      case 'interval':
        return `Every ${task.schedule_time} minutes`;
      default:
        return task.schedule_type;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/20 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 p-4 border-b border-cyan-500/30 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl animate-pulse">⚡</span>
              Automation Dashboard
            </h2>
            <p className="text-cyan-400 text-sm">Scheduled Tasks & Macros</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => openEditor(activeTab === 'tasks' ? 'task' : 'macro')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <span>+</span> Create {activeTab === 'tasks' ? 'Task' : 'Macro'}
            </button>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-3xl">×</button>
          </div>
        </div>

        {/* Status Bar */}
        {status && (
          <div className="bg-slate-800/80 p-3 border-b border-slate-700 flex gap-6 text-[11px] font-mono tracking-wider">
            <div className="text-cyan-400 uppercase">
              <span className="text-slate-500">Tasks:</span> {status.enabled_tasks}/{status.total_tasks}
            </div>
            <div className="text-purple-400 uppercase">
              <span className="text-slate-500">Macros:</span> {status.enabled_macros}/{status.total_macros}
            </div>
            <div className="text-orange-400 uppercase">
              <span className="text-slate-500">Active Jobs:</span> {status.scheduled_jobs}
            </div>
            <div className={`ml-auto px-2 rounded ${status.running ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
              SCHEDULER: {status.running ? 'ACTIVE' : 'IDLE'}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-800/20">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-3 text-center text-xs font-bold tracking-[0.2em] uppercase transition-all ${
              activeTab === 'tasks'
                ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            📅 Scheduled Tasks
          </button>
          <button
            onClick={() => setActiveTab('macros')}
            className={`flex-1 py-3 text-center text-xs font-bold tracking-[0.2em] uppercase transition-all ${
              activeTab === 'macros'
                ? 'bg-purple-500/10 text-purple-400 border-b-2 border-purple-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🎬 Sequence Macros
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-cyan-400 gap-4">
              <div className="animate-spin w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
              <p className="text-xs font-mono uppercase tracking-widest">Accessing Automation Hub...</p>
            </div>
          ) : activeTab === 'tasks' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.length === 0 ? (
                <div className="col-span-2 text-center py-20 text-slate-600">
                  <p className="text-4xl mb-4 opacity-20">📅</p>
                  <p className="text-sm font-medium">No scheduled tasks found.</p>
                  <p className="text-xs mt-1">Click "Create Task" to automate a recurring action.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className={`group relative bg-slate-800/40 border rounded-xl p-5 transition-all hover:bg-slate-800/60 ${task.enabled ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-lg">{task.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${task.enabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                            {task.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{task.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                        <span className="text-slate-500">T:</span> {getScheduleLabel(task)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                        <span className="text-slate-500">C:</span> {task.command}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="text-[10px] text-slate-500 font-mono">
                        RUNS: {task.run_count} | LAST: {task.last_run ? new Date(task.last_run).toLocaleTimeString() : 'NEVER'}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleTask(task.id)} className={`p-2 rounded-lg transition-colors ${task.enabled ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-green-500/10 text-green-400'}`} title={task.enabled ? 'Disable' : 'Enable'}>
                          {task.enabled ? '⏸' : '▶'}
                        </button>
                        <button onClick={() => openEditor('task', task)} className="p-2 hover:bg-white/5 text-slate-400 rounded-lg transition-colors" title="Edit">✏️</button>
                        <button onClick={() => deleteTask(task.id)} className="p-2 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 rounded-lg transition-colors" title="Delete">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {macros.length === 0 ? (
                <div className="col-span-2 text-center py-20 text-slate-600">
                  <p className="text-4xl mb-4 opacity-20">🎬</p>
                  <p className="text-sm font-medium">No macros created.</p>
                  <p className="text-xs mt-1">Combine multiple commands into a single sequence.</p>
                </div>
              ) : (
                macros.map((macro) => (
                  <div key={macro.id} className={`group relative bg-slate-800/40 border rounded-xl p-5 transition-all hover:bg-slate-800/60 ${macro.enabled ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-lg">{macro.name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${macro.enabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                            {macro.enabled ? 'Active' : 'Muted'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{macro.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-[10px] px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-400 uppercase font-mono">
                        {macro.trigger}
                      </span>
                      {macro.trigger_phrase && (
                        <span className="text-[10px] px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-purple-400 font-mono">
                          "{macro.trigger_phrase}"
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 font-mono">
                        {macro.commands.length} STEPS
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <button 
                        onClick={() => runMacro(macro.id)}
                        disabled={!macro.enabled}
                        className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all"
                      >
                        ⚡ RUN MACRO
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => toggleMacro(macro.id)} className="p-2 hover:bg-white/5 text-slate-400 rounded-lg transition-colors">{macro.enabled ? '⏸' : '▶'}</button>
                        <button onClick={() => openEditor('macro', macro)} className="p-2 hover:bg-white/5 text-slate-400 rounded-lg transition-colors">✏️</button>
                        <button onClick={() => deleteMacro(macro.id)} className="p-2 hover:bg-red-500/10 text-red-400 opacity-60 hover:opacity-100 rounded-lg transition-colors">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 p-4 border-t border-slate-700 flex justify-between items-center px-8">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            SECURE AUTOMATION PROTOCOL v4.0
          </div>
          <button onClick={fetchData} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-widest">
            Sync with Backend
          </button>
        </div>
      </div>

      {/* Editor Modal Overlay */}
      <AutomationEditor 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)}
        type={editorType}
        item={editingItem}
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

