import { motion } from 'framer-motion';
import { AlertTriangle, Info, Terminal } from 'lucide-react';

const mockLogs = [
  { id: 101, time: '10:45 AM', type: 'spoof_attempt', details: 'MAC address changed rapidly (Possible spoofing) - AA:BB:CC...', ip: '192.168.1.100', severity: 'high' },
  { id: 102, time: '09:12 AM', type: 'firewall_update', details: 'Device 11:22:33:44:55:66 allowed via iptables', ip: '192.168.1.105', severity: 'info' },
  { id: 103, time: '08:30 AM', type: 'auth_failure', details: 'Invalid login attempt for admin', ip: '192.168.1.45', severity: 'medium' },
];

export default function SecurityLogs() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Security & Audit Logs</h1>
        <p className="text-gray-500">Real-time view of firewall events, failed authentications, and network anomalies.</p>
      </header>

      <div className="glass rounded-[2rem] overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {mockLogs.map(log => (
            <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={log.id} className="p-6 flex items-start gap-4 hover:bg-white/5 transition-colors">
              <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                log.severity === 'high' ? 'bg-red-100 text-red-500 dark:bg-red-500/10' :
                log.severity === 'medium' ? 'bg-orange-100 text-orange-500 dark:bg-orange-500/10' :
                'bg-blue-100 text-blue-500 dark:bg-blue-500/10'
              }`}>
                {log.severity === 'high' ? <AlertTriangle className="w-5 h-5" /> : 
                 log.severity === 'medium' ? <Info className="w-5 h-5" /> : 
                 <Terminal className="w-5 h-5" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold capitalize flex items-center gap-2">
                    {log.type.replace('_', ' ')}
                    {log.severity === 'high' && <span className="text-[10px] uppercase tracking-wider bg-red-500 text-white px-2 py-0.5 rounded-full">Suspicious</span>}
                  </span>
                  <span className="text-sm text-gray-500">{log.time}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{log.details}</p>
                <div className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800/50 inline-block px-2 py-1 rounded">
                  Src IP: {log.ip}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
