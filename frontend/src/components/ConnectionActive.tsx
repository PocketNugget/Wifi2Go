import { motion } from 'framer-motion';
import { Wifi, ShieldCheck, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ConnectionActive() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0); 

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const mac = urlParams.get('mac') || '00:11:22:33:44:55';
        const res = await fetch(`/api/client/status?mac=${mac}`);
        if (res.ok) {
          const data = await res.json();
          if (data.active) {
            setTimeLeft(data.timeRemaining);
          } else {
            console.log("No active connection.");
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkStatus();

    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="glass max-w-sm w-full rounded-[2rem] p-8 flex flex-col items-center text-center"
      >
        <div className="relative">
          <motion.div
             animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
             transition={{ repeat: Infinity, duration: 2 }}
             className="absolute inset-0 bg-green-500 rounded-full blur-xl"
          />
          <div className="relative w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
            <Wifi className="w-12 h-12 text-green-600 dark:text-green-400" strokeWidth={2} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight mb-2">Connected</h2>
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full mb-8">
          <ShieldCheck className="w-4 h-4" />
          Secure Connection Active
        </div>

        <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 mb-8 text-center border border-gray-100 dark:border-gray-700/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Time Remaining</p>
          <p className="text-4xl font-mono font-bold tracking-tight text-gray-900 dark:text-white">
            {formatTime(timeLeft)}
          </p>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-500 transition-colors py-2 font-medium"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </motion.div>
    </div>
  );
}
