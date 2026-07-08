// ==========================================================================
// JARVIS v4.0 — PAGE-3: System Dashboard / Analytics
// Performance charts, command insights, process table, network info
// ==========================================================================

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { systemApi } from '../api/system';
import { PerformanceChart } from '../components/PerformanceChart';
import { ProcessTable } from '../components/ProcessTable';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';
import { NotificationStack } from '../components/NotificationToast';
import { useStore } from '../store';
import type { PerformanceEntry, CommandInsights, ProcessInfo, ConnectionInfo, NetworkInfoResponse } from '../types';
import { ArrowLeft, RefreshCw, Activity, Cpu, Network, Wifi } from 'lucide-react';

const TABS = [
  { id: 'performance', label: 'Performance' },
  { id: 'commands', label: 'Commands' },
  { id: 'processes', label: 'Processes' },
  { id: 'network', label: 'Network' },
];

export function AnalyticsPage() {
  const navigate = useNavigate();
  const { notifications, addNotification, dismissNotification } = useStore();

  // Tab state
  const [activeTab, setActiveTab] = useState('performance');

  // Data states
  const [performanceData, setPerformanceData] = useState<PerformanceEntry[]>([]);
  const [perfLoading, setPerfLoading] = useState(true);

  const [commandInsights, setCommandInsights] = useState<CommandInsights | null>(null);
  const [cmdLoading, setCmdLoading] = useState(true);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [procLoading, setProcLoading] = useState(true);
  const [actionLoadingPid, setActionLoadingPid] = useState<number | null>(null);
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [connLoading, setConnLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfoResponse | null>(null);
  const [netLoading, setNetLoading] = useState(true);
  // Used in JSX for conditional rendering
  void cmdLoading; void netLoading;

  // Fetch functions
  const fetchPerformance = useCallback(async () => {
    setPerfLoading(true);
    try {
      const res = await systemApi.getPerformanceHistory(180);
      setPerformanceData(res.data ?? []);
    } catch (err: unknown) {
      addNotification({ id: crypto.randomUUID(), title: 'Error', message: 'Failed to load performance data', type: 'error', duration: 5000 });
    } finally {
      setPerfLoading(false);
    }
  }, [addNotification]);

  const fetchCommands = useCallback(async () => {
    setCmdLoading(true);
    try {
      const res = await systemApi.getCommandInsights(30);
      setCommandInsights(res.data);
    } catch {
      addNotification({ id: crypto.randomUUID(), title: 'Error', message: 'Failed to load command insights', type: 'error', duration: 5000 });
    } finally {
      setCmdLoading(false);
    }
  }, [addNotification]);

  const fetchProcesses = useCallback(async () => {
    setProcLoading(true);
    try {
      const res = await systemApi.getRunningProcesses();
      setProcesses(res.processes ?? []);
    } catch {
      addNotification({ id: crypto.randomUUID(), title: 'Error', message: 'Failed to load processes', type: 'error', duration: 5000 });
    } finally {
      setProcLoading(false);
    }
  }, [addNotification]);

  const fetchNetwork = useCallback(async () => {
    setConnLoading(true);
    setNetLoading(true);
    try {
      const [connRes, netRes] = await Promise.all([
        systemApi.getNetworkConnections(),
        systemApi.getNetworkInfo(),
      ]);
      setConnections(connRes.connections ?? []);
      setNetworkInfo(netRes);
    } catch {
      addNotification({ id: crypto.randomUUID(), title: 'Error', message: 'Failed to load network data', type: 'error', duration: 5000 });
    } finally {
      setConnLoading(false);
      setNetLoading(false);
    }
  }, [addNotification]);

  // Load all on mount
  useEffect(() => {
    fetchPerformance();
    fetchCommands();
    fetchProcesses();
    fetchNetwork();
  }, [fetchPerformance, fetchCommands, fetchProcesses, fetchNetwork]);

  // Handle process action
  const handleProcessAction = useCallback(async (pid: number, action: 'suspend' | 'resume' | 'terminate') => {
    setActionLoadingPid(pid);
    try {
      const res = await systemApi.quarantineProcess(pid, action);
      addNotification({
        id: crypto.randomUUID(),
        title: 'Process Action',
        message: res.response ?? `Process ${action} executed`,
        type: 'success',
        duration: 3000,
      });
      // Refresh
      await fetchProcesses();
    } catch (err: unknown) {
      addNotification({
        id: crypto.randomUUID(),
        title: 'Action Failed',
        message: err instanceof Error ? err.message : `Failed to ${action} process`,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoadingPid(null);
    }
  }, [addNotification, fetchProcesses]);

  // Refresh all data
  const handleRefresh = useCallback(() => {
    fetchPerformance();
    fetchCommands();
    fetchProcesses();
    fetchNetwork();
  }, [fetchPerformance, fetchCommands, fetchProcesses, fetchNetwork]);

  return (
    <div className="min-h-screen bg-cyber-dark p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            title="Back to Home"
            aria-label="Back to Home"
            className="p-2 glass-button !rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display text-2xl font-bold neon-text">Analytics</h1>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleRefresh}
          title="Refresh all data"
          aria-label="Refresh all data"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      <div className="max-w-6xl mx-auto">
        {/* ── Performance Tab ── */}
        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PerformanceChart
              data={performanceData.map((d) => ({ timestamp: d.timestamp, value: d.cpu_percent }))}
              label="CPU Usage"
              color="#00d4ff"
              yAxisLabel="%"
              isLoading={perfLoading}
              isEmpty={!perfLoading && performanceData.length === 0}
            />
            <PerformanceChart
              data={performanceData.map((d) => ({ timestamp: d.timestamp, value: d.memory_percent }))}
              label="Memory Usage"
              color="#8b5cf6"
              yAxisLabel="%"
              isLoading={perfLoading}
              isEmpty={!perfLoading && performanceData.length === 0}
            />
            <div className="md:col-span-2">
              <PerformanceChart
                data={performanceData.map((d) => ({ timestamp: d.timestamp, value: d.event_loop_lag }))}
                label="Event Loop Lag"
                color="#ff2d95"
                yAxisLabel="ms"
                isLoading={perfLoading}
                isEmpty={!perfLoading && performanceData.length === 0}
              />
            </div>
          </div>
        )}

        {/* ── Commands Tab ── */}
        {activeTab === 'commands' && (
          <div className="space-y-6">
            {/* Peak Hour */}
            {commandInsights?.peak_hour && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h2 className="font-display font-bold text-sm text-slate-200">Peak Usage Hour</h2>
                </div>
                <p className="font-mono text-2xl font-bold text-cyan-300">
                  {commandInsights.peak_hour.hour}:00
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    ({commandInsights.peak_hour.count} commands)
                  </span>
                </p>
              </Card>
            )}

            {/* Top Commands */}
            <Card className="p-4">
              <h2 className="font-display font-bold text-sm text-slate-200 mb-3">Top Commands</h2>
              <div className="space-y-2">
                {commandInsights?.top_commands?.map((cmd, i) => (
                  <div key={cmd.command} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 w-6">{i + 1}.</span>
                    <span className="flex-1 text-sm font-mono text-slate-200">{cmd.command}</span>
                    <Badge variant="info">{cmd.count}</Badge>
                  </div>
                )) ?? <p className="text-sm text-slate-500">No command data available</p>}
              </div>
            </Card>

            {/* Daily Activity */}
            {commandInsights?.daily_activity && commandInsights.daily_activity.length > 0 && (
              <PerformanceChart
                data={commandInsights.daily_activity.map((d) => ({ timestamp: d.date, value: d.count }))}
                label="Daily Command Activity"
                color="#f5e642"
                yAxisLabel="commands"
                isEmpty={false}
              />
            )}

            {/* Failure Patterns */}
            {commandInsights?.failure_patterns && commandInsights.failure_patterns.length > 0 && (
              <Card className="p-4">
                <h2 className="font-display font-bold text-sm text-slate-200 mb-3">Failure Patterns</h2>
                <div className="space-y-2">
                  {commandInsights.failure_patterns.map((fp, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-500">{fp.pattern}</span>
                      <Badge variant="error">{fp.count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── Processes Tab ── */}
        {activeTab === 'processes' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display font-bold text-sm text-slate-200">Running Processes (Top 50 by CPU)</h2>
            </div>
            <ProcessTable
              processes={processes}
              onAction={handleProcessAction}
              isLoading={procLoading}
              actionLoadingPid={actionLoadingPid}
            />
          </div>
        )}

        {/* ── Network Tab ── */}
        {activeTab === 'network' && (
          <div className="space-y-6">
            {/* Network Info */}
            {networkInfo && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  <h2 className="font-display font-bold text-sm text-slate-200">Network Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Hostname</p>
                    <p className="text-sm font-mono text-slate-200">{networkInfo.hostname}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">IP Address</p>
                    <p className="text-sm font-mono text-cyan-300">{networkInfo.ip}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Interfaces</p>
                    <p className="text-sm font-mono text-slate-200">{networkInfo.interfaces?.join(', ') ?? '-'}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Connections */}
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display font-bold text-sm text-slate-200">Active Connections</h2>
            </div>

            {connLoading ? (
              <Card className="p-4 animate-pulse">
                <div className="h-8 bg-cyan-900/10 rounded" />
              </Card>
            ) : connections.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-slate-500">No active connections</p>
              </Card>
            ) : (
              <div className="glass-panel rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-cyan-900/30">
                        <th className="px-3 py-2 text-left text-[10px] font-mono font-semibold uppercase text-slate-400">PID</th>
                        <th className="px-3 py-2 text-left text-[10px] font-mono font-semibold uppercase text-slate-400">Process</th>
                        <th className="px-3 py-2 text-left text-[10px] font-mono font-semibold uppercase text-slate-400">Local Address</th>
                        <th className="px-3 py-2 text-left text-[10px] font-mono font-semibold uppercase text-slate-400">Remote Address</th>
                        <th className="px-3 py-2 text-left text-[10px] font-mono font-semibold uppercase text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/20">
                      {connections.map((conn, i) => (
                        <tr key={`${conn.pid}-${i}`} className="hover:bg-cyan-950/20 transition-colors">
                          <td className="px-3 py-2 text-xs font-mono text-slate-400">{conn.pid}</td>
                          <td className="px-3 py-2 text-xs font-mono text-slate-200">{conn.process}</td>
                          <td className="px-3 py-2 text-xs font-mono text-slate-300">{conn.local_addr}</td>
                          <td className="px-3 py-2 text-xs font-mono text-slate-300">{conn.remote_addr}</td>
                          <td className="px-3 py-2">
                            <Badge variant={conn.status === 'ESTABLISHED' ? 'success' : 'default'}>
                              {conn.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <NotificationStack notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
}
