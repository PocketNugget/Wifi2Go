import { motion } from 'framer-motion';
import { Wifi, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass max-w-sm w-full rounded-[2rem] p-8 flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 rounded-full bg-appleBlue/10 flex items-center justify-center mb-6">
          <Wifi className="w-10 h-10 text-appleBlue" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">NetConnect</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          Premium High-Speed Internet Access. Secure and reliable connection anywhere you go.
        </p>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/login')}
          className="w-full bg-appleBlue text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-appleBlue/30 transition-shadow"
        >
          Get Connected
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}
