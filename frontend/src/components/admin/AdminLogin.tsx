import { motion } from 'framer-motion';
import { Shield, Lock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/admin-api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('admin_token', data.token);
        navigate('/admin/devices');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-appleDark text-white">
      <motion.form 
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass max-w-sm w-full rounded-[2rem] p-8 flex flex-col border border-white/10"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 self-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Portal</h2>
        
        {error && <div className="mb-4 text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">{error}</div>}

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
            <input 
              type="text" 
              value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-appleBlue transition-colors"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-appleBlue transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button type="submit" className="w-full bg-white text-black font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
          <Lock className="w-4 h-4" />
          Secure Login
        </button>
      </motion.form>
    </div>
  );
}
