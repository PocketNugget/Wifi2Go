import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ClientLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [clientId, setClientId] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (requires2FA) {
        const res = await fetch('/api/client/verify-totp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: clientId, totpToken: totp })
        });
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('client_token', data.token);
          navigate('/pricing');
        } else {
          setError(data.error || 'Invalid 2FA code');
        }
      } else {
        const res = await fetch('/api/client/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
          if (data.requires2FA) {
            setRequires2FA(true);
            setClientId(data.id);
          } else {
            localStorage.setItem('client_token', data.token);
            navigate('/pricing');
          }
        } else {
          setError(data.error || 'Invalid credentials');
        }
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-appleDark text-gray-900 dark:text-white">
      <motion.form onSubmit={handleLogin} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass max-w-sm w-full rounded-[2rem] p-8 flex flex-col border border-gray-200 dark:border-white/10">
        <h2 className="text-2xl font-bold mb-2 text-center">{requires2FA ? 'Two-Factor Auth' : 'Client Login'}</h2>
        <p className="text-center text-sm text-gray-500 mb-6">
           {requires2FA ? 'Enter the 6-digit code from your authenticator app.' : 'Log in to access the captive portal.'}
        </p>
        
        {error && <div className="mb-4 text-red-500 text-sm text-center bg-red-50 dark:bg-red-500/10 py-2 rounded-lg">{error}</div>}

        <div className="space-y-4 mb-8">
          {!requires2FA ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-appleBlue transition-colors" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-appleBlue transition-colors" placeholder="••••••••" />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Authenticator Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input type="text" required maxLength={6} pattern="\d{6}" value={totp} onChange={e => setTotp(e.target.value)} className="w-full text-center tracking-widest font-mono text-xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-appleBlue transition-colors" placeholder="000000" />
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="w-full bg-appleBlue text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors mb-4 shadow-lg shadow-appleBlue/20">
          {loading ? 'Verifying...' : (requires2FA ? 'Verify Code' : 'Secure Login')}
        </button>

        {!requires2FA && (
          <p className="text-center text-sm text-gray-500">
            Need an account? <button type="button" onClick={() => navigate('/register')} className="text-appleBlue font-medium hover:underline">Register now</button>
          </p>
        )}
      </motion.form>
    </div>
  );
}
