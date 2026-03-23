import { motion } from 'framer-motion';
import { Clock, Zap, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
  { id: '1hr', title: '1 Hour Pass', price: '$2', icon: Clock, features: ['Unlimited Data', 'High Speed'], popular: false },
  { id: '24hr', title: '24 Hours Pass', price: '$8', icon: Zap, features: ['Unlimited Data', 'Ultra Fast Speed', 'Multiple Devices'], popular: true },
];

export default function Pricing() {
  const navigate = useNavigate();

  const handleSelect = (planId: string) => {
    // Navigate to active connection (mocking successful payment for now)
    navigate('/active');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <button onClick={() => navigate('/')} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight mb-4"
          >
            Choose your connection
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-gray-500 max-w-lg mx-auto"
          >
            Access our premium network with flexible plans designed for your needs.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * (idx + 1), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => handleSelect(plan.id)}
                className={`glass relative cursor-pointer group flex flex-col p-8 rounded-[2rem] border-2 transition-all ${plan.popular ? 'border-appleBlue/50' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-appleBlue text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md shadow-appleBlue/20">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center justify-between mb-8">
                  <div className={`p-3 rounded-2xl ${plan.popular ? 'bg-appleBlue/10 text-appleBlue' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold">{plan.price}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-4">{plan.title}</h3>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-appleBlue" strokeWidth={2} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-xl font-semibold transition-colors ${plan.popular ? 'bg-appleBlue text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white group-hover:bg-gray-200 dark:group-hover:bg-gray-700'}`}>
                  Select Plan
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
