import { useState, useEffect, FC } from 'react';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'macros'>('tasks');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tasks
      const tasksRes = await fetch('http://localhost:8000/api/automation/tasks');
      const tasksData = await tasksRes.json();
      if (tasksData.success) {
        setTasks(tasksData.tasks);
      }

      // Fetch macros
      const macrosRes = await fetch('http://localhost:8000/api/automation/macros');
      const macrosData = await macrosRes.json();
      if (macrosData.success) {
        setMacros(macrosData.macros);
      }

      // Fetch status
      const statusRes = await fetch('http://localhost:8000/api/automation/status');
      const statusData = await statusRes.json();
      if (statusData.success) {
        setStatus(statusData.status);
      }
    } catch (error) {
      console.error('Error fetching automation data:', error);
    }
    setLoading(false);
  };

  const toggleTask = async (taskId: string) => {
    try {
      // Note: This endpoint might need to be added to backend
      await fetch(`http://localhost:8000/api/automation/task/${taskId}/toggle`, {
        method: 'POST'
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const runMacro = async (macroId: string) => {
    try {
      await fetch(`http://localhost:8000/api/automation/macro/${macroId}/run`, {
        method: 'POST'
      });
      fetchData();
    } catch (error) {
      console.error('Error running macro:', error);
    }
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
      <div className="bg-slate-900 border border-cyan-500/50 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 p-4 border-b border-cyan-500/30 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Automation Dashboard
            </h2>
            <p className="text-cyan-400 text-sm">Scheduled Tasks & Macros</p>
          </div>
          <div className="flex gap-2">
            {status && (
              <span className={`px-3 py-1 rounded text-sm ${
                status.running 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {status.running ? '🟢 Running' : '🔴 Stopped'}
              </span>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Status Bar */}
        {status && (
          <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex gap-6 text-sm">
            <div className="text-cyan-400">
              <span className="text-slate-400">Tasks:</span> {status.enabled_tasks}/{status.total_tasks}
            </div>
            <div className="text-purple-400">
              <span className="text-slate-400">Macros:</span> {status.enabled_macros}/{status.total_macros}
            </div>
            <div className="text-orange-400">
              <span className="text-slate-400">Jobs:</span> {status.scheduled_jobs}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📅 Scheduled Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('macros')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'macros'
                ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎬 Macros ({macros.length})
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {loading ? (
            <div className="p-8 text-center text-cyan-400">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mb-2"></div>
              <p>Loading automation...</p>
            </div>
          ) : activeTab === 'tasks' ? (
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center p-8 text-slate-500">
                  <p className="text-4xl mb-2">📅</p>
                  <p>No scheduled tasks</p>
                  <p className="text-sm mt-1">Create tasks to automate repetitive actions</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white">{task.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            task.enabled 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {task.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{task.description}</p>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span className="text-cyan-400">⏰ {getScheduleLabel(task)}</span>
                          <span>📝 {task.command}</span>
                          <span>✓ Run {task.run_count} times</span>
                          {task.last_run && (
                            <span>Last: {new Date(task.last_run).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            task.enabled
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          }`}
                        >
                          {task.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {macros.length === 0 ? (
                <div className="text-center p-8 text-slate-500">
                  <p className="text-4xl mb-2">🎬</p>
                  <p>No macros created</p>
                  <p className="text-sm mt-1">Create macros to run multiple commands at once</p>
                </div>
              ) : (
                macros.map((macro) => (
                  <div
                    key={macro.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white">{macro.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            macro.enabled 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {macro.enabled ? 'Active' : 'Disabled'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">
                            {macro.trigger}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{macro.description}</p>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span className="text-purple-400">
                            🎯 {macro.commands.length} commands
                          </span>
                          <span>✓ Run {macro.run_count} times</span>
                          {macro.trigger_phrase && (
                            <span className="text-cyan-400">🎤 "{macro.trigger_phrase}"</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => runMacro(macro.id)}
                        disabled={!macro.enabled}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded transition-colors text-sm font-medium"
                      >
                        ▶ Run
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 p-4 border-t border-slate-700 flex justify-between items-center">
          <span className="text-slate-500 text-sm">
            {activeTab === 'tasks' 
              ? `${tasks.filter(t => t.enabled).length} active tasks`
              : `${macros.filter(m => m.enabled).length} active macros`
            }
          </span>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
