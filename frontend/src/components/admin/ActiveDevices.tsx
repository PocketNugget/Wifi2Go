import { motion } from 'framer-motion';
import { Ban, Smartphone, Laptop } from 'lucide-react';

const mockDevices = [
  { id: 1, mac: 'AA:BB:CC:DD:EE:01', ip: '192.168.1.101', type: 'smartphone', timeRemaining: '45m', status: 'active' },
  { id: 2, mac: '11:22:33:44:55:66', ip: '192.168.1.105', type: 'laptop', timeRemaining: '12h 30m', status: 'active' },
];

export default function ActiveDevices() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Active Devices</h1>
        <p className="text-gray-500">Manage currently connected users and internet sessions.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-[2rem]">
          <h3 className="text-gray-500 font-medium mb-1">Total Devices</h3>
          <p className="text-4xl font-bold">{mockDevices.length}</p>
        </div>
        <div className="glass p-6 rounded-[2rem]">
          <h3 className="text-gray-500 font-medium mb-1">Today's Revenue</h3>
          <p className="text-4xl font-bold text-green-500">$124.00</p>
        </div>
      </div>

      <div className="glass rounded-[2rem] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-sm tracking-wider text-gray-500 uppercase">
              <th className="px-6 py-4 font-medium">Device Info</th>
              <th className="px-6 py-4 font-medium">IP Address</th>
              <th className="px-6 py-4 font-medium">Time Left</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {mockDevices.map(dev => (
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={dev.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {dev.type === 'smartphone' ? <Smartphone className="w-5 h-5 text-gray-500" /> : <Laptop className="w-5 h-5 text-gray-500" />}
                  </div>
                  <div>
                    <div className="font-mono text-sm">{dev.mac}</div>
                    <div className="text-xs text-green-500 capitalize">{dev.status}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{dev.ip}</td>
                <td className="px-6 py-4 font-medium">{dev.timeRemaining}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors inline-flex items-center gap-2 text-sm font-medium">
                    <Ban className="w-4 h-4" /> Revoke
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
