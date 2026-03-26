import { useState, FC, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

interface AutomationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'task' | 'macro';
  item?: any; // If editing
  onSave: () => void;
}

export const AutomationEditor: FC<AutomationEditorProps> = ({ isOpen, onClose, type, item, onSave }) => {
  // Task state
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCommand, setTaskCommand] = useState('');
  const [scheduleType, setScheduleType] = useState('daily');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Macro state
  const [macroName, setMacroName] = useState('');
  const [macroDesc, setMacroDesc] = useState('');
  const [macroTrigger, setMacroTrigger] = useState('manual');
  const [triggerPhrase, setTriggerPhrase] = useState('');
  const [macroCommands, setMacroCommands] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      if (type === 'task') {
        setTaskName(item.name || '');
        setTaskDesc(item.description || '');
        setTaskCommand(item.command || '');
        setScheduleType(item.schedule_type || 'daily');
        setScheduleTime(item.schedule_time || '08:00');
        setSelectedDays(item.days || []);
      } else {
        setMacroName(item.name || '');
        setMacroDesc(item.description || '');
        setMacroTrigger(item.trigger || 'manual');
        setTriggerPhrase(item.trigger_phrase || '');
        setMacroCommands(item.commands || []);
      }
    } else {
      // Reset
      setTaskName('');
      setTaskDesc('');
      setTaskCommand('');
      setMacroName('');
      setMacroDesc('');
      setMacroCommands([]);
    }
  }, [item, type, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (type === 'task') {
        if (!taskName || !taskCommand) throw new Error('Name and command are required');
        await apiClient.createTask({
          name: taskName,
          description: taskDesc,
          command: taskCommand,
          schedule_type: scheduleType,
          schedule_time: scheduleTime,
          days: selectedDays
        });
      } else {
        if (!macroName || macroCommands.length === 0) throw new Error('Name and at least one command are required');
        await apiClient.createMacro({
          name: macroName,
          description: macroDesc,
          commands: macroCommands,
          trigger: macroTrigger,
          trigger_phrase: triggerPhrase
        });
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addMacroCommand = () => {
    setMacroCommands([...macroCommands, { command: '', delay: 1, parameters: {} }]);
  };

  const updateMacroCommand = (index: number, field: string, value: any) => {
    const newCmds = [...macroCommands];
    newCmds[index][field] = value;
    setMacroCommands(newCmds);
  };

  const removeMacroCommand = (index: number) => {
    setMacroCommands(macroCommands.filter((_, i) => i !== index));
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-xl w-full max-w-2xl shadow-2xl shadow-cyan-500/20 max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-cyan-500/30 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-white">
            {item ? 'Edit' : 'Create'} {type === 'task' ? 'Scheduled Task' : 'Macro'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm">{error}</div>}

          {type === 'task' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Task Name</label>
                <input 
                  value={taskName} onChange={e => setTaskName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
                  placeholder="e.g. Morning Briefing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea 
                  value={taskDesc} onChange={e => setTaskDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none h-20"
                  placeholder="What does this task do?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Command to Execute</label>
                <input 
                  value={taskCommand} onChange={e => setTaskCommand(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none font-mono"
                  placeholder="e.g. system_status"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Schedule Type</label>
                  <select 
                    value={scheduleType} onChange={e => setScheduleType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
                    title="Select schedule frequency"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="interval">Interval (Minutes)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    {scheduleType === 'interval' ? 'Minutes' : 'Time (HH:MM)'}
                  </label>
                  <input 
                    type={scheduleType === 'interval' ? 'number' : 'text'}
                    value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
                    placeholder={scheduleType === 'interval' ? '30' : '08:00'}
                  />
                </div>
              </div>

              {scheduleType === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          selectedDays.includes(day) 
                            ? 'bg-cyan-500 text-slate-900' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Macro Name</label>
                <input 
                  value={macroName} onChange={e => setMacroName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
                  placeholder="e.g. Work Mode"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Trigger Type</label>
                <select 
                  value={macroTrigger} onChange={e => setMacroTrigger(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
                  title="Select what triggers this macro"
                >
                  <option value="manual">Manual Only</option>
                  <option value="voice">Voice Trigger</option>
                </select>
              </div>
              
              {macroTrigger === 'voice' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Trigger Phrase</label>
                  <input 
                    value={triggerPhrase} onChange={e => setTriggerPhrase(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
                    placeholder="e.g. activate work mode"
                  />
                </div>
              )}

              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-cyan-400 tracking-wider uppercase">Sequence Steps</h3>
                  <button 
                    onClick={addMacroCommand}
                    className="text-xs px-3 py-1 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-600/40 transition-colors"
                  >
                    + Add Step
                  </button>
                </div>
                
                <div className="space-y-3">
                  {macroCommands.map((cmd, idx) => (
                    <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 relative group">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Command</label>
                          <input 
                            value={cmd.command} onChange={e => updateMacroCommand(idx, 'command', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                            placeholder="e.g. open_app"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-slate-500 mb-1 block">Delay (sec)</label>
                          <input 
                            type="number"
                            value={cmd.delay} onChange={e => updateMacroCommand(idx, 'delay', parseInt(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                            title="Delay in seconds before this step"
                            min="0"
                          />
                        </div>
                        <div className="flex items-end">
                          <button 
                            onClick={() => removeMacroCommand(idx)}
                            className="w-full py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500/20"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {macroCommands.length === 0 && (
                    <div className="text-center py-6 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-xl">
                      No steps added. Macros run multiple commands in sequence.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/30">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Automation'}
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.4); }
      `}</style>
    </div>
  );
};
