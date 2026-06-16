import { useState, FC, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Trash2, Clock, Terminal, Calendar, Layers, ShieldCheck, AlertCircle, RefreshCw, Pencil } from 'lucide-react';
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
  const [, setSelectedDays] = useState<string[]>([]);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="hud-panel w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative"
      >
        <div className="scanline-overlay" />
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] relative overflow-hidden shrink-0">
          <div className="flex items-center gap-4 relative z-10">
            <div className={`p-3 rounded-lg border ${type === 'task' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
              {type === 'task' ? <Calendar className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground label-caps tracking-widest flex items-center gap-2">
                {item ? 'EDIT' : 'INITIALIZE'} {type === 'task' ? 'TASK' : 'MACRO'}
              </h2>
              <p className="text-foreground-muted text-[9px] uppercase tracking-[0.3em] font-mono opacity-70">Automated Execution Protocol</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-white/5 text-foreground-muted hover:text-foreground transition-all relative z-10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar relative z-10">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-mono uppercase tracking-widest flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          {type === 'task' ? (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-foreground-muted label-caps tracking-[0.2em] block">Identity & Purpose</label>
                <div className="space-y-4">
                  <div className="relative group">
                    <input 
                      value={taskName} onChange={e => setTaskName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-5 py-4 text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono"
                      placeholder="TASK_NAME_ID"
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-30 group-focus-within:opacity-100 transition-opacity">
                      <Pencil className="w-4 h-4 text-accent" />
                    </div>
                  </div>
                  <textarea 
                    value={taskDesc} onChange={e => setTaskDesc(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-5 py-4 text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none h-24 transition-all resize-none leading-relaxed"
                    placeholder="PROTOCOL_DESCRIPTION..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-foreground-muted label-caps tracking-[0.2em] flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-accent" /> Execution String
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-mono text-xs">$</div>
                  <input 
                    value={taskCommand} onChange={e => setTaskCommand(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-5 py-4 text-sm text-accent font-mono focus:border-accent outline-none transition-all shadow-inner"
                    placeholder="system_status --verbose"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-foreground-muted label-caps tracking-[0.2em]">Temporal Pattern</label>
                  <div className="relative">
                    <select 
                      value={scheduleType} onChange={e => setScheduleType(e.target.value as 'once' | 'interval' | 'cron')}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-5 py-4 text-sm text-foreground focus:border-accent outline-none appearance-none transition-all font-mono"
                    >
                      <option value="once">ONE_TIME_TRIGGER</option>
                      <option value="interval">RECURRING_INTERVAL</option>
                      <option value="cron">CRON_SEQUENCE</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-foreground-muted label-caps tracking-[0.2em] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-accent" /> 
                    {scheduleType === 'interval' ? 'INTERVAL_MIN' : 'TARGET_TIME'}
                  </label>
                  <input 
                    type={scheduleType === 'interval' ? 'number' : 'text'}
                    value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-5 py-4 text-sm text-foreground focus:border-accent outline-none transition-all font-mono"
                    placeholder={scheduleType === 'interval' ? '30' : '08:00'}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-foreground-muted label-caps tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Conditional Logic
                </label>
                <input 
                  value={taskCondition} onChange={e => setTaskCondition(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-5 py-4 text-sm text-foreground font-mono focus:border-accent outline-none transition-all"
                  placeholder="battery < 20 or cpu > 80"
                />
                <p className="text-[8px] text-foreground-muted/60 uppercase tracking-[0.2em] font-mono ml-1">
                  Task will only execute if the logic evaluates to <span className="text-green-400">TRUE</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-foreground-muted label-caps tracking-[0.2em]">Macro Definition</label>
                <div className="space-y-4">
                  <input 
                    value={macroName} onChange={e => setMacroName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-5 py-4 text-sm text-foreground focus:border-purple-500 outline-none transition-all font-mono"
                    placeholder="MACRO_SEQUENCE_ID"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <select 
                        value={macroTrigger} onChange={e => setMacroTrigger(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-5 py-4 text-sm text-foreground focus:border-purple-500 outline-none appearance-none transition-all font-mono"
                      >
                        <option value="manual">MANUAL_TRIGGER</option>
                        <option value="voice">VOCAL_ACTIVATION</option>
                      </select>
                    </div>
                    {macroTrigger === 'voice' && (
                      <input 
                        value={triggerPhrase} onChange={e => setTriggerPhrase(e.target.value)}
                        className="bg-purple-500/5 border border-purple-500/20 rounded-lg px-5 py-4 text-sm text-purple-400 focus:border-purple-500 outline-none transition-all font-mono font-bold"
                        placeholder="PHRASE..."
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-purple-400 label-caps tracking-[0.3em] flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Operational Sequence
                  </label>
                  <button 
                    onClick={addMacroCommand}
                    className="text-[9px] font-black label-caps tracking-widest px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded hover:bg-purple-500/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" /> ADD STEP
                  </button>
                </div>
                
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {macroCommands.map((cmd, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hud-panel p-4 relative group flex items-center gap-6"
                      >
                        <div className="text-[10px] font-mono text-foreground-muted w-6 flex-shrink-0 opacity-50">
                          {idx + 1}.
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <input 
                              value={cmd.command} onChange={e => updateMacroCommand(idx, 'command', e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded px-3 py-2 text-[10px] text-foreground font-mono focus:border-purple-500 outline-none"
                              placeholder="ACTION_COMMAND"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded px-3 py-2">
                              <Clock className="w-3.5 h-3.5 text-foreground-muted opacity-50" />
                              <input 
                                type="number"
                                value={cmd.delay} onChange={e => updateMacroCommand(idx, 'delay', parseInt(e.target.value))}
                                className="w-full bg-transparent text-[10px] text-foreground outline-none font-mono"
                                min="0"
                              />
                              <span className="text-[8px] text-foreground-muted label-caps">SEC</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeMacroCommand(idx)}
                            className="p-2 text-foreground-muted hover:text-red-400 transition-all flex justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {macroCommands.length === 0 && (
                    <div className="text-center py-12 text-foreground-muted/30 border border-dashed border-white/5 rounded-lg flex flex-col items-center gap-4 bg-white/[0.01]">
                      <Layers className="w-10 h-10 opacity-20" />
                      <p className="text-[10px] font-mono uppercase tracking-[0.4em]">NO STEPS IN SEQUENCE</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 flex justify-between items-center bg-white/[0.02] relative shrink-0">
          <div className="text-[9px] text-foreground-muted label-caps tracking-[0.4em] font-mono hidden sm:block">
            Bypass Safety: OFF // Alpha-Protocol
          </div>
          <div className="flex gap-6 items-center">
            <button 
              onClick={onClose}
              className="text-[10px] font-bold text-foreground-muted hover:text-foreground label-caps tracking-[0.2em] transition-all px-4"
            >
              Abort
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className={`px-10 py-4 ${type === 'task' ? 'bg-accent text-white shadow-accent/20' : 'bg-purple-600 text-white shadow-purple-500/20'} text-[11px] font-black rounded transition-all disabled:opacity-50 label-caps tracking-[0.3em] shadow-lg flex items-center gap-3 hover:scale-105 active:scale-95`}
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'SYNCHRONIZING...' : 'COMMIT AUTOMATION'}
            </button>
          </div>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--accent-rgb), 0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--accent-rgb), 0.4); }
      `}</style>
    </div>
  );
};
