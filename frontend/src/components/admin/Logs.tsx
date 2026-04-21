import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert, ShieldCheck, Info, RefreshCw, Search,
  Download, Wifi, AlertTriangle, Filter, X
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Log {
  id: number;
  timestamp: string;
  type: string;
  label: string;
  details: string;
  ip: string | null;
  mac: string | null;
  severity: 'high' | 'medium' | 'info';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 10_000;

const EVENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'auth_failure',    label: 'Auth Failure' },
  { value: 'spoof_attempt',   label: 'Spoof Attempt' },
  { value: 'network_error',   label: 'Network Error' },
  { value: 'firewall_update', label: 'Firewall Update' },
  { value: 'system_start',    label: 'System Start' },
  { value: 'user_created',    label: 'User Created' },
  { value: 'user_updated',    label: 'User Updated' },
  { value: 'user_deleted',    label: 'User Deleted' },
];

// ─── Severity helpers ─────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  high: {
    label: 'HIGH',
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
    rowBg: 'bg-red-500/5',
    Icon: ShieldAlert,
  },
  medium: {
    label: 'MED',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    rowBg: 'bg-amber-500/5',
    Icon: AlertTriangle,
  },
  info: {
    label: 'INFO',
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    dot: 'bg-sky-400',
    rowBg: '',
    Icon: Info,
  },
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Log['severity'] }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function LiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
      active
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
      {active ? 'LIVE' : 'PAUSED'}
    </span>
  );
}

function formatTimestamp(raw: string): { date: string; time: string } {
  try {
    const d = new Date(raw);
    const date = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const time = d.toLocaleTimeString('en-GB', { hour12: false }); // HH:MM:SS
    return { date, time };
  } catch {
    return { date: '—', time: raw };
  }
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCSV(logs: Log[]) {
  const headers = ['ID', 'Timestamp', 'Severity', 'Event Type', 'Label', 'IP', 'MAC', 'Details'];
  const rows = logs.map(l => [
    l.id,
    l.timestamp,
    l.severity.toUpperCase(),
    l.type,
    l.label,
    l.ip ?? '',
    l.mac ?? '',
    `"${(l.details ?? '').replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wifi2go-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);
  const [isLive, setIsLive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'' | 'high' | 'medium' | 'info'>('');
  const [filterType, setFilterType] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ──
  const fetchLogs = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setRefreshing(true);
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({ limit: '100' });
      if (filterType) params.set('type', filterType);

      const res = await fetch(`/admin-api/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Log[] = await res.json();
      setLogs(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(REFRESH_INTERVAL_MS / 1000);
    }
  }, [filterType]);

  // ── Auto-refresh ──
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (isLive) {
      intervalRef.current = setInterval(() => fetchLogs(), REFRESH_INTERVAL_MS);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => (prev <= 1 ? REFRESH_INTERVAL_MS / 1000 : prev - 1));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isLive, fetchLogs]);

  // ── Client-side filter ──
  const visibleLogs = logs.filter(l => {
    if (filterSeverity && l.severity !== filterSeverity) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (l.details ?? '').toLowerCase().includes(q) ||
      (l.ip ?? '').toLowerCase().includes(q) ||
      (l.mac ?? '').toLowerCase().includes(q) ||
      l.label.toLowerCase().includes(q) ||
      l.type.toLowerCase().includes(q)
    );
  });

  const hasActiveFilters = filterSeverity || filterType || search;

  const clearFilters = () => {
    setSearch('');
    setFilterSeverity('');
    setFilterType('');
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Security Logs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Real-time audit trail of firewall events, auth failures, and system activity.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <LiveBadge active={isLive} />
          {lastRefresh && (
            <span className="text-xs text-gray-500 font-mono hidden sm:block">
              last: {lastRefresh.toLocaleTimeString('en-GB')}
              {isLive && <span className="ml-1 text-emerald-500">· {countdown}s</span>}
            </span>
          )}
          <button
            id="logs-toggle-live"
            onClick={() => setIsLive(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isLive
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-gray-600 bg-gray-700/40 text-gray-300 hover:bg-gray-700/60'
            }`}
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
          <button
            id="logs-manual-refresh"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-gray-600 bg-gray-700/40 text-gray-300 hover:bg-gray-700/60 transition-all disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="logs-export-csv"
            onClick={() => exportCSV(visibleLogs)}
            disabled={visibleLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-600 bg-gray-700/40 text-gray-300 hover:bg-gray-700/60 transition-all text-xs font-semibold disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </header>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            id="logs-search"
            type="text"
            placeholder="Search details, IP, MAC…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-600 bg-gray-800/60 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 text-sm transition-all"
          />
        </div>

        {/* Severity filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <select
            id="logs-filter-severity"
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value as any)}
            className="pl-9 pr-8 py-2 rounded-xl border border-gray-600 bg-gray-800/60 text-gray-200 focus:outline-none focus:border-sky-500/60 text-sm appearance-none cursor-pointer transition-all"
          >
            <option value="">All Levels</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="info">INFO</option>
          </select>
        </div>

        {/* Event type filter */}
        <div className="relative">
          <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <select
            id="logs-filter-type"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-xl border border-gray-600 bg-gray-800/60 text-gray-200 focus:outline-none focus:border-sky-500/60 text-sm appearance-none cursor-pointer transition-all"
          >
            {EVENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            id="logs-clear-filters"
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-600 bg-gray-700/40 text-gray-400 hover:text-gray-200 text-sm transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {/* Count */}
        <span className="ml-auto text-xs text-gray-500 font-mono whitespace-nowrap">
          {visibleLogs.length} / {logs.length} entries
        </span>
      </div>

      {/* ── Log Table ── */}
      <div className="rounded-2xl border border-gray-700/60 overflow-hidden shadow-xl">
        {/* Terminal header bar */}
        <div className="flex items-center px-4 py-2.5 bg-gray-900/80 border-b border-gray-700/60">
          <span className="text-xs font-mono text-gray-500 tracking-widest">wifi2go — security_logs</span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[60px_160px_80px_140px_110px_140px_1fr] gap-0 bg-gray-900/60 border-b border-gray-700/60 text-[11px] font-semibold tracking-widest text-gray-500 uppercase select-none">
          <div className="px-4 py-2.5">#</div>
          <div className="px-4 py-2.5">Timestamp</div>
          <div className="px-4 py-2.5">Level</div>
          <div className="px-4 py-2.5">Event</div>
          <div className="px-4 py-2.5">IP Address</div>
          <div className="px-4 py-2.5">MAC</div>
          <div className="px-4 py-2.5">Details</div>
        </div>

        {/* Log rows */}
        <div className="bg-gray-950/80 overflow-y-auto" style={{ maxHeight: '62vh', minHeight: '280px' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
              <span className="text-sm font-mono">Fetching security logs…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <ShieldAlert className="w-8 h-8 text-red-400" />
              <p className="text-red-400 font-mono text-sm">{error}</p>
              <button
                onClick={() => fetchLogs(true)}
                className="text-sky-400 text-xs underline underline-offset-2 hover:text-sky-300"
              >
                Retry
              </button>
            </div>
          ) : visibleLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-600">
              <ShieldCheck className="w-8 h-8" />
              <p className="font-mono text-sm">
                {hasActiveFilters ? 'No logs match your filters.' : 'No log entries yet.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-sky-400 text-xs underline underline-offset-2">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            visibleLogs.map((log) => {
              const cfg = SEVERITY_CONFIG[log.severity];
              const { date, time } = formatTimestamp(log.timestamp);
              return (
                <div
                  key={log.id}
                  className={`grid grid-cols-[60px_160px_80px_140px_110px_140px_1fr] gap-0 border-b border-gray-800/60 text-sm font-mono hover:bg-gray-800/40 transition-colors group ${cfg.rowBg}`}
                >
                  {/* ID */}
                  <div className="px-4 py-2.5 text-gray-600 text-xs self-center">{log.id}</div>

                  {/* Timestamp */}
                  <div className="px-4 py-2.5 self-center">
                    <div className="text-gray-300 text-xs">{date}</div>
                    <div className="text-gray-500 text-[11px]">{time}</div>
                  </div>

                  {/* Level badge */}
                  <div className="px-4 py-2.5 self-center">
                    <SeverityBadge severity={log.severity} />
                  </div>

                  {/* Event type */}
                  <div className="px-4 py-2.5 self-center">
                    <span className={`text-xs font-semibold ${cfg.text}`}>{log.label}</span>
                  </div>

                  {/* IP */}
                  <div className="px-4 py-2.5 text-gray-400 text-xs self-center">
                    {log.ip ?? <span className="text-gray-600">—</span>}
                  </div>

                  {/* MAC */}
                  <div className="px-4 py-2.5 text-gray-400 text-[11px] self-center truncate">
                    {log.mac ?? <span className="text-gray-600">—</span>}
                  </div>

                  {/* Details */}
                  <div className="px-4 py-2.5 text-gray-300 text-xs self-center pr-6 leading-relaxed">
                    {log.details || <span className="text-gray-600 italic">no details</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer bar */}
        {!loading && !error && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-t border-gray-700/60 text-[11px] font-mono text-gray-600">
            <span>{visibleLogs.length} log{visibleLogs.length !== 1 ? 's' : ''} displayed</span>
            {lastRefresh && (
              <span>refreshed {lastRefresh.toLocaleTimeString('en-GB')}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
