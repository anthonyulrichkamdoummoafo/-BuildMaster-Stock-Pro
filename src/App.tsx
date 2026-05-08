import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Truck, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from './lib/store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';

const Navigation = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed left-0 top-0 h-full w-20 bg-black text-white flex flex-col items-center py-8 gap-10 border-r border-zinc-800 z-50">
      <div className="font-bold text-blue-500 mb-4 px-2 text-center text-[10px] leading-tight uppercase tracking-tighter">
        BuildMaster<br/>Stock Pro
      </div>
      <NavLink to="/" icon={<LayoutDashboard size={24} />} label="Dash" />
      <NavLink to="/pos" icon={<ShoppingCart size={24} />} label="POS" />
      <NavLink to="/inventory" icon={<Package size={24} />} label="Inv" />
      <NavLink to="/customers" icon={<Users size={24} />} label="Cust" />
      <NavLink to="/suppliers" icon={<Truck size={24} />} label="Sup" />
      <div className="mt-auto flex flex-col gap-6">
        <NavLink to="/settings" icon={<Settings size={24} />} label="Set" />
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 hover:text-red-500 transition-all cursor-pointer"
        >
          <LogOut size={24} />
          <span className="text-[10px] uppercase font-bold tracking-widest">Exit</span>
        </button>
      </div>
      <div className="mt-4 text-[8px] text-zinc-500 uppercase rotate-90 w-full text-center">
        {user?.role} - {user?.username}
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <Link 
    to={to} 
    className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-all group"
  >
    <div className="group-hover:scale-110 transition-transform">{icon}</div>
    <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
  </Link>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen pl-20 bg-[#F0F0F0]">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <div className="flex flex-col min-h-screen">
                  <Navigation />
                  <main className="p-8 flex-1">
                    <Dashboard />
                  </main>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pos" 
            element={
              <ProtectedRoute>
                <div className="flex flex-col min-h-screen">
                  <Navigation />
                  <main className="p-0 flex-1">
                    <POS />
                  </main>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute>
                <div className="flex flex-col min-h-screen">
                  <Navigation />
                  <main className="p-8 flex-1">
                    <Inventory />
                  </main>
                </div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}
