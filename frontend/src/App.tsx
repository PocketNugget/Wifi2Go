import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './components/Welcome';
import ClientLogin from './components/client/ClientLogin';
import ClientRegister from './components/client/ClientRegister';
import Pricing from './components/Pricing';
import ConnectionActive from './components/ConnectionActive';
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import ActiveDevices from './components/admin/ActiveDevices';
import SecurityLogs from './components/admin/SecurityLogs';
import UserManagement from './components/admin/UserManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Client Portal Routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<ClientLogin />} />
        <Route path="/register" element={<ClientRegister />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/active" element={<ConnectionActive />} />
        
        {/* Admin Dashboard Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/devices" replace />} />
          <Route path="devices" element={<ActiveDevices />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="logs" element={<SecurityLogs />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
