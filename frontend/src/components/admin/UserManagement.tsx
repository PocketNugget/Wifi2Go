import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Shield, ShieldOff, Mail, KeyRound } from 'lucide-react';

interface Client {
  id: string;
  email: string;
  two_factor_enabled: number;
}

export default function UserManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState("");
  
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [form2FA, setForm2FA] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await fetch("/admin-api/clients", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load clients");
      const data = await res.json();
      setClients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    
    try {
      let res;
      if (isEditMode) {
        res = await fetch(`/admin-api/clients/${currentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ email: formEmail, two_factor_enabled: form2FA })
        });
      } else {
        res = await fetch("/admin-api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ email: formEmail, password: formPassword })
        });
      }

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Operation failed");
      }

      setIsModalOpen(false);
      fetchClients();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this client?")) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/admin-api/clients/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchClients();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setFormEmail("");
    setFormPassword("");
    setCurrentId("");
    setIsModalOpen(true);
  };

  const openEditModal = (c: Client) => {
    setIsEditMode(true);
    setCurrentId(c.id);
    setFormEmail(c.email);
    setForm2FA(c.two_factor_enabled === 1);
    setIsModalOpen(true);
  };

  if (loading) return <div className="text-gray-500 animate-pulse">Cargando base de datos de usuarios...</div>;
  if (error) return <div className="text-red-500 font-medium">Error de conexión: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end pb-4 border-b border-gray-200 dark:border-white/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage client portal access and two-factor statuses.</p>
        </div>
        <button onClick={openAddModal} className="apple-btn bg-appleBlue text-white hover:bg-blue-600 flex items-center gap-2">
          <Plus className="w-5 h-5"/>
          New Client
        </button>
      </div>

      <div className="glass rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">
              <th className="p-4 pl-6">Client Identity</th>
              <th className="p-4">2FA Security</th>
              <th className="p-4 text-right pr-6">Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {clients.map((client) => (
              <motion.tr key={client.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td className="p-4 pl-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-appleBlue/10 text-appleBlue flex items-center justify-center font-bold">
                    {client.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{client.email}</p>
                    <p className="text-xs text-gray-400">ID: {client.id.split('-')[0]}...</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${client.two_factor_enabled ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                    {client.two_factor_enabled ? <Shield className="w-3.5 h-3.5"/> : <ShieldOff className="w-3.5 h-3.5"/>}
                    {client.two_factor_enabled ? 'Protected' : 'No 2FA'}
                  </span>
                </td>
                <td className="p-4 pr-6 flex justify-end gap-3 text-gray-400">
                  <button onClick={() => openEditModal(client)} className="p-2 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-500/20 rounded-xl transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="p-2 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/20 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-gray-500">No client accounts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-appleDark w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-xl font-bold">{isEditMode ? 'Edit Client Profile' : 'Register New Client'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)} className="apple-input w-full pl-10" placeholder="client@example.com" />
                </div>
              </div>
              
              {!isEditMode && (
                <div>
                  <label className="block text-sm font-medium mb-1">Temporary Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input type="password" required minLength={6} value={formPassword} onChange={e => setFormPassword(e.target.value)} className="apple-input w-full pl-10" placeholder="••••••••" />
                  </div>
                </div>
              )}

              {isEditMode && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                  <input type="checkbox" id="2fa-toggle" checked={form2FA} onChange={e => setForm2FA(e.target.checked)} className="w-4 h-4 rounded text-appleBlue focus:ring-appleBlue" />
                  <label htmlFor="2fa-toggle" className="text-sm font-medium cursor-pointer flex-1">Enforce 2FA Security</label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 apple-btn bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20">Cancel</button>
                <button type="submit" className="flex-1 apple-btn bg-appleBlue text-white hover:bg-blue-600">{isEditMode ? 'Save Changes' : 'Create Client'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
