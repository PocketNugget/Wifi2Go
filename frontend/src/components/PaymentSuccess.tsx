import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/active');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass max-w-sm w-full rounded-[2rem] p-8 flex flex-col items-center text-center border-2 border-green-500/30 shadow-lg shadow-green-500/10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.1 }}
          className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </motion.div>

        <h2 className="text-3xl font-bold tracking-tight mb-2">Payment Successful!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Your transaction has been securely processed. Your network access is being provisioned.
        </p>

        <div className="w-full bg-gray-50 dark:bg-black/30 rounded-xl p-4 mb-8">
          <p className="text-sm font-medium">Redirecting to Dashboard in</p>
          <p className="text-2xl font-bold text-appleBlue">{countdown}s</p>
        </div>

        <button 
          onClick={() => navigate('/active')}
          className="w-full bg-appleBlue text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
        >
          Go to Dashboard Now <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
