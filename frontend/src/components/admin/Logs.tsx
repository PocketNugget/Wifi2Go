import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Log {
  id: string;
  time: string;
  type: string;
  details: string;
  ip: string;
  severity: "high" | "low" | "info";
}

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch("/admin-api/logs", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setLogs(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Security & Audit Logs</h1>
        <p className="text-gray-500">Real-time view of firewall events, failed authentications, and network anomalies.</p>
      </header>

      <div className="glass rounded-[2rem] overflow-hidden p-6 space-y-4">
        {loading ? <p className="text-gray-500">Loading security audit data...</p> : logs.map(log => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={log.id} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/10">
            <div className="flex-shrink-0 mt-1">
              {log.severity === 'high' ? (
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              ) : log.severity === 'low' ? (
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white capitalize">{log.type.replace('_', ' ')}</h4>
                  {log.severity === 'high' && <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-red-500 rounded-full">Suspicious</span>}
                </div>
                <span className="text-sm text-gray-500">{log.time}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                {log.details}
              </p>
              <div className="flex gap-2">
                <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">Src IP: {log.ip}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
