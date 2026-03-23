import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './components/Welcome';
import Pricing from './components/Pricing';
import ConnectionActive from './components/ConnectionActive';
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import ActiveDevices from './components/admin/ActiveDevices';
import SecurityLogs from './components/admin/SecurityLogs';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Client Portal Routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/active" element={<ConnectionActive />} />
        
        {/* Admin Dashboard Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="devices" replace />} />
          <Route path="devices" element={<ActiveDevices />} />
          <Route path="logs" element={<SecurityLogs />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
