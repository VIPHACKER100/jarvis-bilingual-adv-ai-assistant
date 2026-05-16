import { useState, FC, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Trash2, Clock, Terminal, Calendar, Layers, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { AutomationTask, AutomationMacro, MacroStep } from '../types/api';

interface AutomationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'task' | 'macro';
  item?: AutomationTask | AutomationMacro; // If editing
  onSave: () => void;
}

export const AutomationEditor: FC<AutomationEditorProps> = ({ isOpen, onClose, type, item, onSave }) => {
  // Task state
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCommand, setTaskCommand] = useState('');
  const [scheduleType, setScheduleType] = useState<'once' | 'interval' | 'cron'>('once');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [taskCondition, setTaskCondition] = useState('');

  // Macro state
  const [macroName, setMacroName] = useState('');
  const [macroDesc, setMacroDesc] = useState('');
  const [macroTrigger, setMacroTrigger] = useState('manual');
  const [triggerPhrase, setTriggerPhrase] = useState('');
  const [macroCommands, setMacroCommands] = useState<MacroStep[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      if (type === 'task') {
        const task = item as AutomationTask;
        setTaskName(task.name || '');
        setTaskDesc(task.description || '');
        setTaskCommand(task.command || '');
        setScheduleType(task.schedule_type || 'once');
        setScheduleTime(task.schedule_time || '08:00');
        setSelectedDays(task.days || []);
        setTaskCondition(''); // Not in task type yet
      } else {
        const macro = item as AutomationMacro;
        setMacroName(macro.name || '');
        setMacroDesc(macro.description || '');
        setMacroTrigger(macro.trigger || 'manual');
        setTriggerPhrase(macro.trigger_phrase || '');
        setMacroCommands(macro.commands || []);
      }
    } else {
      // Reset
      setTaskName('');
      setTaskDesc('');
      setTaskCommand('');
      setTaskCondition('');
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
          command: taskCommand,
          schedule_type: scheduleType,
          schedule_time: scheduleTime,
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addMacroCommand = () => {
    setMacroCommands([...macroCommands, { command: '', delay: 1, parameters: {} }]);
  };

  const updateMacroCommand = <K extends keyof MacroStep>(index: number, field: K, value: MacroStep[K]) => {
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="glass-card border-accent/30 w-full max-w-2xl shadow-2xl shadow-accent/20 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-background-deep to-accent/5 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 right-0 h-px neon-glow-line opacity-50" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
              {type === 'task' ? <Calendar className="w-5 h-5 text-accent" /> : <Layers className="w-5 h-5 text-purple-400" />}
              {item ? 'EDIT' : 'INITIALIZE'} {type === 'task' ? 'SCHEDULED TASK' : 'MACRO SEQUENCE'}
            </h2>
            <p className="text-foreground-muted text-[9px] uppercase tracking-[0.3em] font-mono mt-0.5">Automated Execution Protocol</p>
          </div>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground transition-all hover:rotate-90 relative z-10 p-2">
            <X className="w-7 h-7" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar bg-white/[0.01]">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-mono uppercase tracking-widest flex items-center gap-3 animate-shake">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {type === 'task' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] ml-1">Identity & Purpose</label>
                <div className="space-y-3">
                  <input 
                    value={taskName} onChange={e => setTaskName(e.target.value)}
                    className="w-full bg-background-deep/60 border border-white/10 rounded-xl px-5 py-3 text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    placeholder="Task Name (e.g., Morning Briefing)"
                  />
                  <textarea 
                    value={taskDesc} onChange={e => setTaskDesc(e.target.value)}
                    className="w-full bg-background-deep/60 border border-white/10 rounded-xl px-5 py-3 text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none h-24 transition-all resize-none"
                    placeholder="Describe the objective of this automation..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-accent" /> Execution String
                </label>
                <input 
                  value={taskCommand} onChange={e => setTaskCommand(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-sm text-accent font-mono focus:border-accent outline-none transition-all shadow-inner"
                  placeholder="system_status --verbose"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] ml-1">Temporal Pattern</label>
                  <select 
                    value={scheduleType} onChange={e => setScheduleType(e.target.value as 'once' | 'interval' | 'cron')}
                    className="w-full bg-background-deep/60 border border-white/10 rounded-xl px-5 py-3 text-sm text-foreground focus:border-accent outline-none appearance-none transition-all"
                    title="Select schedule frequency"
                  >
                    <option value="once">One-time Trigger</option>
                    <option value="interval">Recurring Interval</option>
                    <option value="cron">Complex (Cron)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-accent" /> 
                    {scheduleType === 'interval' ? 'Interval (Min)' : 'Target Time'}
                  </label>
                  <input 
                    type={scheduleType === 'interval' ? 'number' : 'text'}
                    value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                    className="w-full bg-background-deep/60 border border-white/10 rounded-xl px-5 py-3 text-sm text-foreground focus:border-accent outline-none transition-all"
                    placeholder={scheduleType === 'interval' ? '30' : '08:00'}
                  />
                </div>
              </div>


              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-accent" /> Conditional Logic (Optional)
                </label>
                <input 
                  value={taskCondition} onChange={e => setTaskCondition(e.target.value)}
                  className="w-full bg-background-deep/60 border border-white/10 rounded-xl px-5 py-3 text-sm text-foreground font-mono focus:border-accent outline-none transition-all"
                  placeholder="battery < 20 or cpu > 80"
                />
                <p className="text-[9px] text-foreground-muted/60 uppercase tracking-widest font-mono ml-1">
                  Task will only execute if the logic evaluates to TRUE.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] ml-1">Macro Definition</label>
                <div className="space-y-3">
                  <input 
                    value={macroName} onChange={e => setMacroName(e.target.value)}
                    className="w-full bg-background-deep/60 border border-white/10 rounded-xl px-5 py-3 text-sm text-foreground focus:border-accent outline-none transition-all"
                    placeholder="Macro Name (e.g., Focus Mode)"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      value={macroTrigger} onChange={e => setMacroTrigger(e.target.value)}
                      className="bg-background-deep/60 border border-white/10 rounded-xl px-5 py-3 text-sm text-foreground focus:border-accent outline-none appearance-none transition-all"
                      title="Select what triggers this macro"
                    >
                      <option value="manual">Manual Trigger Only</option>
                      <option value="voice">Vocal Activation</option>
                    </select>
                    {macroTrigger === 'voice' && (
                      <input 
                        value={triggerPhrase} onChange={e => setTriggerPhrase(e.target.value)}
                        className="bg-background-deep/60 border border-white/10 rounded-xl px-5 py-3 text-sm text-purple-400 focus:border-purple-500 outline-none transition-all font-bold"
                        placeholder="Trigger phrase..."
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Operational Sequence
                  </label>
                  <button 
                    onClick={addMacroCommand}
                    className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-accent/10 text-accent border border-accent/20 rounded-xl hover:bg-accent/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" /> Add Step
                  </button>
                </div>
                
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {macroCommands.map((cmd, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-panel p-4 relative group hover:bg-white/[0.02] transition-all flex items-center gap-4"
                      >
                        <div className="text-xs font-mono text-foreground-muted w-6 flex-shrink-0">
                          {idx + 1}.
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <input 
                              value={cmd.command} onChange={e => updateMacroCommand(idx, 'command', e.target.value)}
                              className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:border-accent outline-none"
                              placeholder="Action command..."
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 bg-black/20 border border-white/5 rounded-lg px-3 py-2">
                              <Clock className="w-3 h-3 text-foreground-muted" />
                              <input 
                                type="number"
                                value={cmd.delay} onChange={e => updateMacroCommand(idx, 'delay', parseInt(e.target.value))}
                                className="w-full bg-transparent text-xs text-foreground outline-none"
                                title="Delay in seconds"
                                min="0"
                              />
                              <span className="text-[8px] text-foreground-muted uppercase">s</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeMacroCommand(idx)}
                            className="p-2 text-foreground-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                            title="Purge Step"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {macroCommands.length === 0 && (
                    <div className="text-center py-10 text-foreground-muted/30 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center gap-3">
                      <Layers className="w-8 h-8" />
                      <p className="text-[10px] font-mono uppercase tracking-widest">No steps in sequence</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 flex justify-between items-center bg-background-deep/40 relative shrink-0">
          <div className="text-[8px] text-foreground-muted uppercase tracking-[0.4em] font-mono hidden sm:block">
            Bypass Safety: OFF // Protocol Alpha
          </div>
          <div className="flex gap-4 ml-auto">
            <button 
              onClick={onClose}
              className="text-[10px] font-bold text-foreground-muted hover:text-foreground uppercase tracking-widest transition-all px-4"
            >
              Abort
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-accent text-white text-[11px] font-black rounded-xl hover:brightness-110 transition-all disabled:opacity-50 uppercase tracking-[0.2em] shadow-lg shadow-accent/20 flex items-center gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'SYNCHRONIZING...' : 'COMMIT AUTOMATION'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--accent-rgb), 0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--accent-rgb), 0.4); }
      `}</style>
    </div>
  );
};
