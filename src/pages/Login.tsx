import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import { motion } from 'motion/react';
import { Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setAuth(data.user, data.token);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failure. Check if server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-8 shadow-2xl"
      >
        <div className="mb-12">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">
            BuildMaster<span className="text-blue-500">_</span>
          </h1>
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">
            Enterprise Stock Management / v1.0.4
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest pl-1">Identities</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="USERNAME"
                className="w-full bg-black border border-zinc-800 p-3 pl-10 text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest pl-1">Security</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD"
                className="w-full bg-black border border-zinc-800 p-3 pl-10 text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold uppercase tracking-wide border-l-2 border-red-500 pl-2">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black p-4 uppercase tracking-[0.3em] text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
          >
            {loading ? 'INITIATING...' : 'ACCESS SYSTEM'}
          </button>
        </form>

        <div className="mt-12 text-[9px] text-zinc-600 font-bold uppercase text-center border-t border-zinc-900 pt-4">
          Encrypted Session Mode Enabled
        </div>
      </motion.div>
    </div>
  );
}
