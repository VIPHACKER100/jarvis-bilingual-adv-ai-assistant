import { useState, useEffect, FC } from 'react';
import { apiClient } from '../services/apiClient';

interface Conversation {
  id: number;
  timestamp: string;
  user_input: string;
  jarvis_response: string;
  command_type: string;
  success: boolean;
  language: string;
}

interface MemoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MemoryFact {
  id: number;
  key: string;
  value: string;
  category: string;
  confidence: number;
  updated_at: string;
}

type ViewMode = 'history' | 'analytics' | 'memories';

export const MemoryViewer: FC<MemoryViewerProps> = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('history');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [convRes, statsRes, factsRes] = await Promise.all([
        apiClient.getConversations(100),
        apiClient.getMemoryStats(7),
        apiClient.getMemoryFacts()
      ]);

      if (convRes.success) {
        setConversations(convRes.conversations);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      if (factsRes.success) {
        setFacts(factsRes.facts);
      }
    } catch (error) {
      console.error('Error loading memory data:', error);
    }
    setLoading(false);
  };

  const handleAddFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.key || !newFact.value) return;

    try {
      const res = await apiClient.createMemoryFact(newFact.key, newFact.value, newFact.category);
      if (res.success) {
        setNewFact({ key: '', value: '', category: 'personal' });
        setIsAddingFact(false);
        loadData();
      }
    } catch (error) {
      console.error("Failed to add fact:", error);
    }
  };

  const handleEditFact = (fact: MemoryFact) => {
    setEditingId(fact.id);
    setEditValue(fact.value);
  };

  const saveEdit = async (id: number) => {
    try {
      const data = await apiClient.updateMemoryFact(id, editValue);
      if (data.success) {
        setFacts(prev => prev.map(f => f.id === id ? { ...f, value: editValue, updated_at: new Date().toISOString() } : f));
        setEditingId(null);
      }
    } catch (error) {
      console.error("Failed to update fact:", error);
    }
  };

  const handleDeleteFact = async (id: number) => {
    try {
      const res = await apiClient.deleteMemoryFact(id);
      if (res.success) {
        setFacts(prev => prev.filter(f => f.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete fact:", error);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await apiClient.clearConversationHistory();
      if (res.success) {
        setConversations([]);
      }
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const [newFact, setNewFact] = useState({ key: '', value: '', category: 'personal' });
  const [isAddingFact, setIsAddingFact] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const exportHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `jarvis_history_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user_input.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.jarvis_response.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.command_type && conv.command_type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFacts = facts.filter(fact =>
    fact.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fact.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fact.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'UNKNOWN';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-lg w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 to-blue-950 p-4 border-b border-white/10 flex justify-between items-center shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px neon-glow-line" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-3">
              <span className="text-2xl animate-pulse neon-text">🧠</span>
              NEURAL ARCHIVE EXPLORER
            </h2>
            <p className="text-cyan-400 text-[10px] uppercase tracking-[0.3em] font-mono">Archive Protocol 7-Beta // Memory Analytics</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-white transition-all hover:rotate-90 p-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/30 p-1 border-b border-slate-700 shrink-0">
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 py-2 text-sm font-medium rounded transition-all ${viewMode === 'history'
              ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            History Log
          </button>
          <button
            onClick={() => setViewMode('memories')}
            className={`flex-1 py-2 text-sm font-medium rounded transition-all ${viewMode === 'memories'
              ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Core Memories
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex-1 py-2 text-sm font-medium rounded transition-all ${viewMode === 'analytics'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Analytics Dashboard
          </button>
        </div>

        {/* Search (Only in history or memories mode) */}
        {viewMode !== 'analytics' && (
          <div className="p-4 border-b border-slate-700 shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder={viewMode === 'history' ? "Search by input, response, or command type..." : "Search core memories..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-10 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-all"
              />
              <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-900/40">
          {viewMode === 'history' ? (
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-cyan-400 p-8">
                  <div className="animate-spin inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
                  <p className="animate-pulse tracking-widest uppercase text-xs">Retrieving neural links...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 opacity-60">
                  <p className="text-6xl mb-4">📔</p>
                  <p className="text-lg font-medium">No records found</p>
                  <p className="text-sm mt-1">Start a conversation with JARVIS to populate the database.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {filteredConversations.map((conv, idx) => (
                    <div
                      key={conv.id}
                      className={`p-5 hover:bg-slate-800/30 transition-all border-l-2 animate-in delay-${idx % 5} ${conv.success ? 'border-transparent' : 'border-red-500/50 bg-red-900/5'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                          REC ID: {conv.id} // {formatTimestamp(conv.timestamp)}
                        </span>
                        <div className="flex gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${conv.success
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            {conv.success ? 'VALID' : 'FAILED'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                            {conv.language}
                          </span>
                          {conv.command_type && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                              {conv.command_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-slate-900/50 rounded p-3 border border-slate-800">
                          <div className="flex gap-3">
                            <span className="text-cyan-500 font-mono text-xs uppercase shrink-0 pt-1">User &gt;</span>
                            <span className="text-slate-200 text-sm leading-relaxed">{conv.user_input}</span>
                          </div>
                        </div>
                        <div className="bg-cyan-900/10 rounded p-3 border border-cyan-500/10">
                          <div className="flex gap-3">
                            <span className="text-orange-400 font-mono text-xs uppercase shrink-0 pt-1">JARVIS &gt;</span>
                            <span className="text-cyan-200/90 text-sm leading-relaxed italic">{conv.jarvis_response}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : viewMode === 'memories' ? (
            <div className="overflow-y-auto flex-1 custom-scrollbar p-5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Global Memory Bank</h3>
                <button 
                  onClick={() => setIsAddingFact(!isAddingFact)}
                  className="text-[10px] font-bold px-3 py-1.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition-all uppercase"
                >
                  {isAddingFact ? 'Cancel Input' : '+ Manual Override'}
                </button>
              </div>

              {isAddingFact && (
                <form onSubmit={handleAddFact} className="bg-slate-800/60 border border-orange-500/30 rounded-xl p-4 mb-6 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input 
                      type="text" 
                      placeholder="Fact Key (e.g. coffee_preference)" 
                      className="bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-orange-500/50 outline-none"
                      value={newFact.key}
                      onChange={e => setNewFact({...newFact, key: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                    />
                    <input 
                      type="text" 
                      placeholder="Fact Value (e.g. black with no sugar)" 
                      className="bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-orange-500/50 outline-none"
                      value={newFact.value}
                      onChange={e => setNewFact({...newFact, value: e.target.value})}
                    />
                    <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] uppercase rounded tracking-widest transition-all">
                      Inject Memory
                    </button>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-orange-400">
                  <div className="animate-bounce mb-4 text-4xl">💾</div>
                  <p className="animate-pulse tracking-widest uppercase text-[10px]">Accessing biometric database...</p>
                </div>
              ) : filteredFacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                  <p className="text-6xl mb-4">🧩</p>
                  <p className="text-lg font-medium">No core memories established</p>
                  <p className="text-sm mt-1">Tell JARVIS facts about yourself to store them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFacts.map((fact, idx) => (
                    <div key={idx} className="bg-slate-950/60 border border-white/5 rounded-xl p-4 hover:border-orange-500/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/5 to-transparent pointer-none" />
                      
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                          {fact.category}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-mono text-slate-600 uppercase">
                            Archived: {new Date(fact.updated_at).toLocaleDateString()}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditFact(fact)}
                              className="text-slate-600 hover:text-cyan-400 transition-colors"
                              title="Edit record"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button
                              onClick={() => {if(confirm('Delete memory?')) handleDeleteFact(fact.id)}}
                              className="text-slate-600 hover:text-red-400 transition-colors"
                              title="Purge record"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      <h4 className="text-cyan-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 group-hover:text-white transition-colors">
                        {fact.key.replace(/_/g, ' ')}
                      </h4>
                      
                      {editingId === fact.id ? (
                        <div className="flex gap-2 animate-in fade-in zoom-in-95">
                          <input 
                            autoFocus
                            className="bg-black/40 border border-orange-500/50 rounded px-2 py-1 text-sm text-white flex-1 outline-none"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit(fact.id);
                                if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button onClick={() => saveEdit(fact.id)} className="text-green-500 hover:text-white">✓</button>
                          <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-white">×</button>
                        </div>
                      ) : (
                        <p className="text-slate-300 text-sm italic font-light leading-relaxed">"{fact.value}"</p>
                      )}

                      <div className="mt-4 w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-orange-600/60 to-orange-400/20 transition-all duration-1000 ease-out fact-width-${idx}`}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-slate-600 mt-1 uppercase tracking-widest">
                        <span>Linguistic Certainty</span>
                        <span>{(fact.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 p-6 space-y-8 custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-pulse text-purple-400">Processing analytics...</div>
                </div>
              ) : stats ? (
                <>
                  {/* High Level Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold mb-1">Total Signals</span>
                      <span className="text-2xl font-bold text-white">{stats.total_conversations}</span>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold mb-1">Integrity Rate</span>
                      <span className={`text-2xl font-bold ${stats.success_rate > 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {stats.success_rate?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold mb-1">Multi-Lang Link</span>
                      <span className="text-2xl font-bold text-orange-400">{Object.keys(stats.languages || {}).length}</span>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold mb-1">Time Horizon</span>
                      <span className="text-2xl font-bold text-blue-400">{stats.period_days}d</span>
                    </div>
                  </div>

                  {/* Commands Breakdown */}
                  <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="text-purple-400">⚡</span> Protocol Execution Distribution
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(stats.command_types || {})
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 8)
                        .map(([type, count], idx) => {
                          const percentage = ((count as number) / stats.total_conversations * 100).toFixed(0);
                          return (
                            <div key={type} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-mono uppercase tracking-tighter">
                                <span className="text-slate-400">{type || 'General'}</span>
                                <span className="text-cyan-400">{count as number} calls ({percentage}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full transition-all duration-1000 protocol-width-${idx}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Language Distribution */}
                  <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="text-orange-400">🌐</span> Linguistic Pattern Analysis
                    </h3>
                    <div className="flex items-center gap-8 justify-center py-4">
                      {Object.entries(stats.languages || {}).map(([lang, count]) => {
                        const isHinglish = lang === 'hi-EN' || lang === 'hinglish';
                        const isHindi = lang === 'hi' && !isHinglish;
                        return (
                          <div key={lang} className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold mb-2 ${isHinglish ? 'border-purple-500 text-purple-400' :
                              isHindi ? 'border-orange-500 text-orange-400' :
                                'border-cyan-500 text-cyan-400'
                              }`}>
                              {lang === 'hi-EN' ? 'HI-EN' : lang.toUpperCase()}
                            </div>
                            <span className="text-xs text-white font-mono">{count as number} entries</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  Analytics unavailable. Gather more data.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 p-4 border-t border-slate-700 flex justify-between items-center shrink-0">
          <span className="text-slate-500 text-xs font-mono">
            REC_COUNT: {viewMode === 'history' ? filteredConversations.length : 'N/A'} // STATS_HORIZON: 7D
          </span>
          <div className="flex gap-2">
            {viewMode === 'history' && conversations.length > 0 && (
              <>
                <button
                  onClick={exportHistory}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[10px] transition-all border border-slate-600 flex items-center gap-1"
                >
                  <span>📥</span> EXPORT
                </button>
                <button
                  onClick={handleClearHistory}
                  className="px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded text-[10px] transition-all border border-red-500/30 flex items-center gap-1"
                >
                  <span>🗑️</span> WIPE LOGS
                </button>
              </>
            )}
            <button
              onClick={loadData}
              className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-all border border-slate-600"
            >
              SYNC SYSTEM
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs transition-all border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              EXIT VIEWER
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { 
          animation: fadeIn 0.4s ease-out forwards; 
          opacity: 0; 
        }
        .delay-0 { animation-delay: 0s; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.4); }
        ${filteredFacts.map((fact, idx) => ".fact-width-" + idx + " { width: " + (fact.confidence * 100) + "%; }").join('\\n')}
        ${stats && stats.command_types ? Object.entries(stats.command_types).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 8).map(([, count], idx) => ".protocol-width-" + idx + " { width: " + (((count as number) / stats.total_conversations) * 100) + "%; }").join('\\n') : ''}
      `}</style>
    </div>
  );
};
