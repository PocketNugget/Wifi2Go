import { motion } from 'framer-motion';
import { Clock, Zap, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const plans = [
  { id: '5min', title: '5 Min Trial', price: 'Free', priceNum: 0, icon: Zap, features: ['Test the Network', 'Standard Speed'], popular: false },
  { id: '1hr', title: '1 Hour Pass', price: '$2', priceNum: 2, icon: Clock, features: ['Unlimited Data', 'High Speed'], popular: false },
  { id: '24hr', title: '24 Hours Pass', price: '$8', priceNum: 8, icon: Zap, features: ['Unlimited Data', 'Ultra Fast Speed', 'Multiple Devices'], popular: true },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [macAddress, setMacAddress] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem('client_token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setClientId(payload.id);
    } catch (e) {
      console.error("Invalid token");
    }

    const urlParams = new URLSearchParams(window.location.search);
    setMacAddress(urlParams.get('mac') || "00:11:22:33:44:55");

  }, [navigate]);

  const handleFreeTier = async (planId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, macAddress, planId })
      });
      if (res.ok) {
        navigate('/payment-success');
      } else {
        const errorData = await res.json();
        alert("Error: " + errorData.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error processing free tier.");
    }
    setLoading(false);
  };

  const createOrder = async (planId: string) => {
    try {
      const res = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.orderId;
    } catch (e) {
      console.error("Create order error", e);
      alert("Failed to initiate PayPal checkout.");
      throw e;
    }
  };

  const onApprove = async (data: any, planId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: data.orderID,
          planId,
          macAddress,
          clientId
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        navigate('/payment-success');
      } else {
        alert("Payment capture failed: " + (result.error || "Unknown error"));
      }
    } catch (e) {
      console.error("Capture error", e);
      alert("Failed to process payment completion.");
    }
    setLoading(false);
  };

  const handleStripeCheckout = async (planId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, macAddress, clientId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to initiate Stripe checkout");
      }
    } catch (e) {
      console.error(e);
      alert("Error starting checkout.");
    }
    setLoading(false);
  };

  const paypalOptions = {
    "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
    currency: "USD",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
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
              Access our premium network with flexible plans designed for your needs. {loading && "Processing..."}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, idx) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * (idx + 1), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={`glass relative group flex flex-col p-8 rounded-[2rem] border-2 transition-all ${plan.popular ? 'border-appleBlue/50' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
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
                  
                  <div className="mt-auto">
                    {plan.priceNum === 0 ? (
                      <button 
                        onClick={() => !loading && handleFreeTier(plan.id)}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-semibold transition-colors ${plan.popular ? 'bg-appleBlue text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white group-hover:bg-gray-200 dark:group-hover:bg-gray-700'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Select Plan
                      </button>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => !loading && handleStripeCheckout(plan.id)}
                          disabled={loading}
                          className={`w-full py-3 rounded-xl font-semibold transition-colors ${plan.popular ? 'bg-appleBlue text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white group-hover:bg-gray-200 dark:group-hover:bg-gray-700'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Pay with Card
                        </button>
                        <div className="relative z-10 w-full" style={{ minHeight: '45px' }}>
                          {!loading && (
                            <PayPalButtons
                              style={{ layout: "horizontal", color: "blue", shape: "rect", height: 45 }}
                              createOrder={() => createOrder(plan.id)}
                              onApprove={(data) => onApprove(data, plan.id)}
                              onError={(err) => {
                                console.error("PayPal Error:", err);
                                alert("An error occurred with PayPal.");
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
