import { motion } from 'framer-motion';
import { Mail, Lock, QrCode } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ClientRegister() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [registeredId, setRegisteredId] = useState('');
  const [verifCode, setVerifCode] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/client/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
        setRegisteredId(data.id);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (qrCodeUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-appleDark text-gray-900 dark:text-white">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass max-w-sm w-full rounded-[2rem] p-8 flex flex-col items-center border border-gray-200 dark:border-white/10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-appleBlue/10 flex items-center justify-center mb-6">
             <QrCode className="w-8 h-8 text-appleBlue" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Secure your Account</h2>
          <p className="text-sm text-gray-500 mb-6">Scan this QR code with Google Authenticator or Authy to enable Two-Factor Authentication.</p>
          
          <div className="bg-white p-4 rounded-xl mb-4 shadow-sm">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeUrl)}`} alt="TOTP QR Code" className="w-32 h-32" />
          </div>
          <p className="font-mono text-xs bg-gray-100 dark:bg-white/10 px-3 py-2 rounded-lg mb-6 break-all">
            {secret}
          </p>

          <div className="mb-6 w-full">
            <input type="text" placeholder="Enter 6-digit code" maxLength={6} value={verifCode} onChange={e => setVerifCode(e.target.value)} className="w-full text-center tracking-widest font-mono text-xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-appleBlue transition-colors" />
          </div>
          <button onClick={async () => {
            const res = await fetch('/api/client/enable-2fa', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: registeredId, totpToken: verifCode })
            });
            if (res.ok) navigate('/login'); else alert('Invalid code');
          }} className="w-full bg-appleBlue text-white font-semibold py-4 rounded-xl shadow-lg transition-colors hover:bg-blue-600">
            Verify and Continue
          </button>
          
          <button onClick={() => navigate('/login')} className="mt-4 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
            Skip for now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-appleDark text-gray-900 dark:text-white">
      <motion.form onSubmit={handleRegister} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass max-w-sm w-full rounded-[2rem] p-8 flex flex-col border border-gray-200 dark:border-white/10">
        <h2 className="text-2xl font-bold mb-2 text-center">Create Account</h2>
        <p className="text-center text-sm text-gray-500 mb-6">Register to purchase WiFi access.</p>
        
        {error && <div className="mb-4 text-red-500 text-sm text-center bg-red-50 dark:bg-red-500/10 py-2 rounded-lg">{error}</div>}

        <div className="space-y-4 mb-8">
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
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-appleBlue transition-colors" placeholder="••••••••" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-80 transition-opacity mb-4">
          {loading ? 'Processing...' : 'Register'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-appleBlue font-medium hover:underline">Log in</button>
        </p>
      </motion.form>
    </div>
  );
}
