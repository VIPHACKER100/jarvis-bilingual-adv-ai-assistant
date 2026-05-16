import { useState, useEffect, FC, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Brain, BarChart3, Network, Shield, Search, X, Plus, Edit, Save, Trash2, Download, RefreshCw, ChevronLeft } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { SecurityDashboard } from './SecurityDashboard';
import { ConversationEntry, MemoryFact, MemoryStats, MemoryNodeInfo } from '../types/api';

interface MemoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'history' | 'analytics' | 'memories' | 'map' | 'security';

export const MemoryViewer: FC<MemoryViewerProps> = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('history');
  
  // Neural Memory Map State
  const [memoryNodes, setMemoryNodes] = useState<MemoryNodeInfo[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeContent, setNodeContent] = useState<string>('');
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [isSavingNode, setIsSavingNode] = useState(false);

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
        setConversations(convRes.conversations || []);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      if (factsRes.success) {
        setFacts(factsRes.facts || []);
      }
      
      // Load Neural Memory Nodes
      const nodesRes = await apiClient.getMemoryNodes();
      if (nodesRes.success) {
        setMemoryNodes(nodesRes.nodes);
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
        setFacts(prev => prev.map(f => f.id === id ? { ...f, value: editValue, timestamp: new Date().toISOString() } : f));
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

  const handleSelectNode = async (nodeName: string) => {
    setSelectedNode(nodeName);
    setIsEditingNode(true);
    setLoading(true);
    try {
      const res = await apiClient.getMemoryNodeContent(nodeName);
      if (res.success) {
        setNodeContent(res.content);
      }
    } catch (error) {
      console.error(`Error loading node ${nodeName}:`, error);
    }
    setLoading(false);
  };

  const handleSaveNode = async () => {
    if (!selectedNode) return;
    setIsSavingNode(true);
    try {
      const res = await apiClient.updateMemoryNode(selectedNode, nodeContent);
      if (res.success) {
        setIsEditingNode(false);
        loadData();
      }
    } catch (error) {
      console.error(`Error saving node ${selectedNode}:`, error);
    }
    setIsSavingNode(false);
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

  const mapData = useMemo(() => {
    interface MapNode { id: string; label: string; type: string; color: string }
    interface MapEdge { source: string; target: string }
    const nodes: MapNode[] = [{ id: 'core', label: 'JARVIS CORE', type: 'core', color: '#06b6d4' }];
    const edges: MapEdge[] = [];
    
    // Extract unique categories
    const categories = Array.from(new Set(facts.map(f => f.category)));
    
    // Add category nodes
    categories.forEach((cat, i) => {
      nodes.push({ id: `cat_${cat}`, label: cat.toUpperCase(), type: 'category', color: '#f97316' });
      edges.push({ source: 'core', target: `cat_${cat}` });
    });
    
    // Add fact nodes
    facts.forEach((fact, i) => {
      nodes.push({ id: `fact_${fact.id}`, label: fact.key.replace(/_/g, ' '), type: 'fact', color: '#64748b' });
      edges.push({ source: `cat_${fact.category}`, target: `fact_${fact.id}` });
    });
    
    return { nodes, edges, categories };
  }, [facts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-card border-accent/30 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-accent/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-background-deep to-accent/10 p-5 border-b border-white/5 flex justify-between items-center shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px neon-glow-line opacity-50" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold tracking-widest text-foreground flex items-center gap-3">
              <Brain className="w-6 h-6 text-accent animate-pulse" />
              NEURAL ARCHIVE EXPLORER
            </h2>
            <p className="text-accent text-[10px] uppercase tracking-[0.3em] font-mono opacity-70">Archive Protocol 7-Beta // Memory Analytics</p>
          </div>
          <button
            onClick={onClose}
            title="Close Neural Archive"
            aria-label="Close Neural Archive"
            className="text-foreground-muted hover:text-foreground transition-all hover:rotate-90 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 border-b border-white/5 shrink-0">
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === 'history'
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'text-foreground-muted hover:text-foreground hover:bg-white/5'
              }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History Log</span>
          </button>
          <button
            onClick={() => setViewMode('memories')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === 'memories'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-foreground-muted hover:text-foreground hover:bg-white/5'
              }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Core Memories</span>
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === 'analytics'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-foreground-muted hover:text-foreground hover:bg-white/5'
              }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === 'map'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'text-foreground-muted hover:text-foreground hover:bg-white/5'
              }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Neural Map</span>
          </button>
          <button
            onClick={() => setViewMode('security')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${viewMode === 'security'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'text-foreground-muted hover:text-foreground hover:bg-white/5'
              }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Security</span>
          </button>
        </div>

        {/* Search (Only in history or memories mode) */}
        {viewMode !== 'analytics' && viewMode !== 'map' && (
          <div className="p-4 border-b border-white/5 bg-white/[0.02] shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder={viewMode === 'history' ? "Search by input, response, or command type..." : "Search core memories..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border-default rounded-xl px-10 py-2 text-foreground placeholder-foreground-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all text-sm"
              />
              <Search className="absolute left-3 top-2.5 text-foreground-muted w-4 h-4" />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-900/40">
          {viewMode === 'history' ? (
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-accent p-8">
                  <RefreshCw className="w-10 h-10 animate-spin mb-4 opacity-50" />
                  <p className="animate-pulse tracking-widest uppercase text-[10px] font-mono">Retrieving neural links...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-foreground-muted p-8 opacity-40">
                  <History className="w-16 h-16 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No records found</p>
                  <p className="text-[10px] mt-1 font-mono">Start a conversation to populate the archive.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredConversations.map((conv, idx) => (
                    <div
                      key={conv.id}
                      className={`p-6 hover:bg-white/[0.03] transition-all border-l-2 animate-in ${conv.success ? 'border-transparent' : 'border-red-500/50 bg-red-500/5'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-mono text-foreground-muted uppercase tracking-wider">
                          REC ID: {conv.id} // {formatTimestamp(conv.timestamp)}
                        </span>
                        <div className="flex gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${conv.success
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            {conv.success ? 'VALID' : 'FAILED'}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20 uppercase tracking-tighter">
                            {conv.language}
                          </span>
                          {conv.command_type && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-tighter">
                              {conv.command_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-background-deep/40 rounded-xl p-4 border border-white/5">
                          <div className="flex gap-4">
                            <span className="text-accent font-black font-mono text-[10px] uppercase shrink-0 pt-0.5 tracking-widest">USER_INPUT &gt;</span>
                            <span className="text-foreground text-sm leading-relaxed">{conv.user_input}</span>
                          </div>
                        </div>
                        <div className="bg-accent/5 rounded-xl p-4 border border-accent/10">
                          <div className="flex gap-4">
                            <span className="text-orange-400 font-black font-mono text-[10px] uppercase shrink-0 pt-0.5 tracking-widest">JARVIS_LOG &gt;</span>
                            <span className="text-foreground text-sm leading-relaxed italic opacity-90">{conv.jarvis_response}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : viewMode === 'memories' ? (
            <div className="overflow-y-auto flex-1 custom-scrollbar p-6">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-bold text-foreground-muted uppercase tracking-[0.3em]">Neural Core Memories</h3>
                <button 
                  onClick={() => setIsAddingFact(!isAddingFact)}
                  className="text-[10px] font-bold px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition-all uppercase tracking-widest flex items-center gap-2"
                >
                  {isAddingFact ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {isAddingFact ? 'Cancel Injection' : 'Manual Memory Injection'}
                </button>
              </div>

              {isAddingFact && (
                <form onSubmit={handleAddFact} className="glass-panel border-orange-500/30 p-6 mb-8 animate-fade-in-scale">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-orange-400 uppercase tracking-widest ml-1">Fact Key</label>
                      <input 
                        type="text" 
                        placeholder="e.g. coffee_preference" 
                        className="w-full bg-surface border border-border-default rounded-xl px-4 py-2 text-xs text-foreground focus:border-orange-500/50 outline-none transition-all"
                        value={newFact.key}
                        onChange={e => setNewFact({...newFact, key: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-orange-400 uppercase tracking-widest ml-1">Fact Value</label>
                      <input 
                        type="text" 
                        placeholder="e.g. black with no sugar" 
                        className="w-full bg-surface border border-border-default rounded-xl px-4 py-2 text-xs text-foreground focus:border-orange-500/50 outline-none transition-all"
                        value={newFact.value}
                        onChange={e => setNewFact({...newFact, value: e.target.value})}
                      />
                    </div>
                    <div className="flex items-end">
                      <button type="submit" className="w-full h-[34px] bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] uppercase rounded-xl tracking-[0.2em] transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                        <Save className="w-3.5 h-3.5" />
                        Inject Memory
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-orange-400">
                  <Brain className="w-12 h-12 animate-pulse mb-4 opacity-50" />
                  <p className="animate-pulse tracking-widest uppercase text-[9px] font-mono">Accessing biometric database...</p>
                </div>
              ) : filteredFacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-foreground-muted opacity-40 py-20">
                  <Brain className="w-16 h-16 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No core memories established</p>
                  <p className="text-[10px] mt-1 font-mono">Tell JARVIS facts about yourself to store them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredFacts.map((fact, idx) => (
                    <div key={idx} className="glass-panel border-white/5 p-5 hover:border-orange-500/30 transition-all group relative overflow-hidden bg-white/[0.01]">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/[0.03] to-transparent pointer-events-none" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-[0.2em]">
                          {fact.category}
                        </span>
                          <div className="flex items-center gap-4">
                            <span className="text-[8px] font-mono text-foreground-muted uppercase tracking-tighter opacity-60">
                              Synced: {fact.timestamp ? new Date(fact.timestamp).toLocaleDateString() : 'N/A'}
                            </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditFact(fact)}
                              className="text-foreground-muted hover:text-accent transition-colors p-1"
                              title="Edit record"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {if(confirm('Delete memory?')) handleDeleteFact(fact.id!)}}
                              className="text-foreground-muted hover:text-red-400 transition-colors p-1"
                              title="Purge record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
                            title="Edit memory value"
                            placeholder="Enter new value..."
                            className="bg-black/40 border border-orange-500/50 rounded px-2 py-1 text-sm text-white flex-1 outline-none"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit(fact.id!);
                                if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button onClick={() => saveEdit(fact.id!)} className="text-green-500 hover:text-white">✓</button>
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
                      {fact.source && (
                        <div className="flex justify-between text-[8px] font-mono text-slate-600 mt-1 uppercase tracking-widest">
                          <span>Source: {fact.source}</span>
                          <span>{fact.timestamp ? new Date(fact.timestamp).toLocaleDateString() : ''}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : viewMode === 'analytics' ? (
            <div className="overflow-y-auto flex-1 p-8 space-y-10 custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-400 opacity-50" />
                </div>
              ) : stats ? (
                <>
                  {/* High Level Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div className="bg-white/[0.02] p-5 rounded-xl border border-white/5 flex flex-col items-center">
                      <span className="text-foreground-muted text-[9px] uppercase font-bold mb-2 tracking-widest">Total Signals</span>
                      <span className="text-3xl font-black text-foreground">{stats.total_conversations}</span>
                    </div>
                    <div className="bg-white/[0.02] p-5 rounded-xl border border-white/5 flex flex-col items-center">
                      <span className="text-foreground-muted text-[9px] uppercase font-bold mb-2 tracking-widest">Integrity Rate</span>
                      <span className={`text-3xl font-black ${stats.success_rate > 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {stats.success_rate?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-white/[0.02] p-5 rounded-xl border border-white/5 flex flex-col items-center">
                      <span className="text-foreground-muted text-[9px] uppercase font-bold mb-2 tracking-widest">Multi-Lang Link</span>
                      <span className="text-3xl font-black text-orange-400">{Object.keys(stats.languages || {}).length}</span>
                    </div>
                    <div className="bg-white/[0.02] p-5 rounded-xl border border-white/5 flex flex-col items-center">
                      <span className="text-foreground-muted text-[9px] uppercase font-bold mb-2 tracking-widest">Time Horizon</span>
                      <span className="text-3xl font-black text-accent">{stats.period_days}d</span>
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
                            const total = stats.total_conversations || 1;
                            const percentage = ((count as number) / total * 100).toFixed(0);
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
          ) : viewMode === 'map' ? (
            <div className="flex-1 flex bg-slate-950 overflow-hidden relative">
              {/* Left Panel: Node List */}
              <div className="w-72 border-r border-white/5 flex flex-col shrink-0 bg-background-deep/20">
                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                  <h3 className="text-[9px] font-bold text-foreground-muted uppercase tracking-[0.2em]">Neural Memory Nodes</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {memoryNodes.map(node => (
                    <button
                      key={node.name}
                      onClick={() => handleSelectNode(node.name)}
                      className={`w-full text-left p-4 rounded-xl text-xs transition-all border flex flex-col gap-1.5 ${
                        selectedNode === node.name
                          ? 'bg-accent/10 border-accent/50 text-foreground shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]'
                          : 'bg-white/[0.02] border-white/5 text-foreground-muted hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {node.is_core ? <Brain className="w-3.5 h-3.5 text-accent" /> : <Save className="w-3.5 h-3.5 text-foreground-muted" />}
                        <span className="font-mono font-bold tracking-tight">{node.name}</span>
                      </div>
                      <span className="text-[8px] text-foreground-muted uppercase tracking-wider opacity-60">
                        Last sync: {new Date(node.updated_at).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content: Node Editor or Visualization */}
              <div className="flex-1 relative flex flex-col overflow-hidden">
                {isEditingNode ? (
                  <div className="flex-1 flex flex-col animate-fade-in">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setIsEditingNode(false)}
                          className="p-1.5 hover:bg-white/5 rounded-lg text-foreground-muted transition-colors"
                          aria-label="Back to nodes"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-mono text-accent uppercase font-bold tracking-[0.2em]">{selectedNode}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveNode}
                          disabled={isSavingNode}
                          className="px-5 py-1.5 bg-accent hover:bg-accent/80 text-white rounded-xl text-[10px] transition-all font-bold uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-accent/20 flex items-center gap-2"
                        >
                          {isSavingNode ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          {isSavingNode ? 'SYNCING...' : 'SYNC CHANGES'}
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 p-0 relative">
                      <textarea
                        value={nodeContent}
                        title="Edit Node Content"
                        placeholder="Neural node content (markdown supported)..."
                        onChange={(e) => setNodeContent(e.target.value)}
                        className="w-full h-full bg-slate-950 text-slate-300 p-6 font-mono text-xs focus:outline-none resize-none custom-scrollbar leading-relaxed"
                        spellCheck="false"
                      />
                      <div className="absolute bottom-4 right-6 text-[10px] text-slate-600 font-mono italic">
                        * Markdown context is injected into LLM system prompt.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-24 h-24 rounded-full border-2 border-cyan-900/30 flex items-center justify-center mb-6 relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-t-2 border-cyan-500 rounded-full"
                      />
                      <span className="text-4xl">🧠</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em] mb-2">Neural Memory Core</h4>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                      Select a memory node from the library to inspect or modify JARVIS's cognitive foundation and personality matrix.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-md">
                      {memoryNodes.filter(n => n.is_core).map(node => (
                        <button
                          key={node.name}
                          onClick={() => handleSelectNode(node.name)}
                          className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all text-left group"
                        >
                          <div className="text-xs font-bold text-slate-400 mb-1 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">{node.name.replace('.md', '')}</div>
                          <div className="text-[10px] text-slate-600 line-clamp-1">View/Edit Core Logic</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === 'security' ? (
            <SecurityDashboard />
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-background-deep/40 p-5 border-t border-white/5 flex justify-between items-center shrink-0">
          <span className="text-foreground-muted text-[10px] font-mono tracking-widest opacity-60">
            REC_COUNT: {viewMode === 'history' ? filteredConversations.length : 'N/A'} // STATS_HORIZON: 7D
          </span>
          <div className="flex gap-3">
            {viewMode === 'history' && conversations.length > 0 && (
              <>
                <button
                  onClick={exportHistory}
                  className="px-4 py-2 bg-surface hover:bg-surface-hover text-foreground-muted hover:text-foreground rounded-xl text-[10px] transition-all border border-border-default flex items-center gap-2 font-bold uppercase tracking-widest"
                >
                  <Download className="w-3.5 h-3.5" /> EXPORT
                </button>
                <button
                  onClick={handleClearHistory}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] transition-all border border-red-500/30 flex items-center gap-2 font-bold uppercase tracking-widest"
                >
                  <Trash2 className="w-3.5 h-3.5" /> WIPE LOGS
                </button>
              </>
            )}
            <button
              onClick={loadData}
              className="px-5 py-2 bg-surface hover:bg-surface-hover text-foreground rounded-xl text-[10px] transition-all border border-border-default font-bold uppercase tracking-widest flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              SYNC SYSTEM
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-accent hover:bg-accent/80 text-white rounded-xl text-[10px] transition-all border border-accent/50 shadow-lg shadow-accent/20 font-bold uppercase tracking-widest"
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
        ${stats && stats.command_types && stats.total_conversations > 0 ? Object.entries(stats.command_types).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 8).map(([, count], idx) => ".protocol-width-" + idx + " { width: " + (((count as number) / stats.total_conversations) * 100) + "%; }").join('\n') : ''}
      `}</style>
    </div>
  );
};
