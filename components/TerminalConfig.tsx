import React, { useState, useEffect } from 'react';
import { CurrencyCode, UserProfile } from '../types';
import { SUPPORTED_CURRENCIES } from '../services/currencyService';
import { Shield, Globe, Bell, Trash2, User } from 'lucide-react';

interface RecruitmentFormProps {
  onProvision: (email: string, pass: string, name: string) => Promise<any>;
}

const RecruitmentForm: React.FC<RecruitmentFormProps> = ({ onProvision }) => {
    const [form, setForm] = useState({ email: '', password: '', name: '' });
    const [status, setStatus] = useState<'idle' | 'provisioning' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleSubmit = async () => {
        if (!form.email || !form.password || !form.name) return;
        setStatus('provisioning');
        const res = await onProvision(form.email, form.password, form.name);
        
        if (res.success) {
            setStatus('success');
            setForm({ email: '', password: '', name: '' });
            setMsg('OPERATOR COMMISSIONED');
            setTimeout(() => { setStatus('idle'); setMsg(''); }, 3000);
        } else {
            setStatus('error');
            setMsg(res.message || 'COMMISSION FAILED');
        }
    };

    return (
        <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                     <label className="block text-sm text-terminal-muted mb-1 font-mono">Operator ID (Email)</label>
                     <input 
                        type="email" 
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        className="w-full bg-terminal-bg border border-terminal-border rounded px-4 py-2 text-white font-mono focus:border-terminal-accent focus:outline-none"
                        placeholder="operator@titan.os"
                     />
                </div>
                <div>
                     <label className="block text-sm text-terminal-muted mb-1 font-mono">Access Key (Password)</label>
                     <input 
                        type="password" 
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})}
                        className="w-full bg-terminal-bg border border-terminal-border rounded px-4 py-2 text-white font-mono focus:border-terminal-accent focus:outline-none"
                        placeholder="••••••••"
                     />
                </div>
            </div>
             <div>
                     <label className="block text-sm text-terminal-muted mb-1 font-mono">Display Name</label>
                     <input 
                        type="text" 
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full bg-terminal-bg border border-terminal-border rounded px-4 py-2 text-white font-mono focus:border-terminal-accent focus:outline-none"
                        placeholder="COMMANDER NAME"
                     />
            </div>
            
            <div className="flex items-center justify-between mt-4">
                <span className={`text-xs font-mono ${status === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>{msg}</span>
                <button 
                    onClick={handleSubmit}
                    disabled={status === 'provisioning'}
                    className="bg-terminal-accent text-black font-bold px-6 py-2 rounded hover:bg-terminal-accent-bright disabled:opacity-50 transition-colors uppercase text-sm"
                >
                    {status === 'provisioning' ? 'COMMISSIONING...' : 'COMMISSION OPERATOR'}
                </button>
            </div>
        </div>
    );
};

interface TerminalConfigProps {
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  onReset: () => void;
  user: UserProfile | null;
  onUserUpdate: (name: string) => Promise<boolean>;
  onUserProvision?: (email: string, pass: string, name: string) => Promise<any>;
}

export const TerminalConfig: React.FC<TerminalConfigProps> = ({ currency, onCurrencyChange, onReset, user, onUserUpdate, onUserProvision }) => {
  const [notifications, setNotifications] = useState({
    trades: true,
    risk: true,
    news: false
  });

  const [displayName, setDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!displayName.trim() || isUpdating) return;
    
    setIsUpdating(true);
    setUpdateStatus('idle');
    
    const success = await onUserUpdate(displayName);
    
    setIsUpdating(false);
    if (success) {
      setUpdateStatus('success');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } else {
      setUpdateStatus('error');
    }
  };

  const handleFullReset = () => {
      if (confirm('CONFIRM RESET: This will wipe all API keys and local settings. Continue?')) {
        onReset();
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-white mb-1">
                Terminal <span className="font-bold text-terminal-accent">Config</span>
              </h1>
              <p className="text-terminal-muted text-sm font-mono">System Preferences & Network Protocols</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Identity Settings */}
             <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4 border-b border-terminal-border pb-4">
                    <User className="text-terminal-accent" size={20} />
                    <h2 className="text-lg font-bold text-white">Operator Identity</h2>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-terminal-muted mb-2 font-mono">Display Name (Global)</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="flex-1 bg-terminal-bg border border-terminal-border rounded px-4 py-3 text-white focus:outline-none focus:border-terminal-accent font-mono"
                                placeholder="ENTER IDENTIFIER"
                            />
                            <button 
                                onClick={handleUpdateProfile}
                                disabled={isUpdating || !displayName.trim() || displayName === user?.displayName}
                                className={`px-4 py-2 rounded text-sm font-bold uppercase transition-all ${
                                    updateStatus === 'success' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' :
                                    updateStatus === 'error' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/50' :
                                    'bg-terminal-accent text-black hover:bg-terminal-accent-bright disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            >
                                {isUpdating ? 'SYNCING...' : 
                                 updateStatus === 'success' ? 'SAVED' : 
                                 updateStatus === 'error' ? 'ERROR' : 'UPDATE'}
                            </button>
                        </div>
                        <p className="text-xs text-terminal-muted mt-2">
                           ID: {user?.id}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recruitment (Admin Only) */}
            {user?.role === 'ADMIN' && onUserProvision && (
             <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4 border-b border-terminal-border pb-4">
                    <User className="text-terminal-accent" size={20} />
                    <h2 className="text-lg font-bold text-white">Recruitment Protocol</h2>
                </div>
                <RecruitmentForm onProvision={onUserProvision} />
            </div>
            )}

            {/* General Settings */}
            <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4 border-b border-terminal-border pb-4">
                    <Globe className="text-terminal-accent" size={20} />
                    <h2 className="text-lg font-bold text-white">Localization</h2>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-terminal-muted mb-2 font-mono">Base Currency</label>
                        <select 
                            value={currency}
                            onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                            className="w-full bg-terminal-bg border border-terminal-border rounded px-4 py-3 text-white focus:outline-none focus:border-terminal-accent"
                        >
                            {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
                                <option key={code} value={code}>{code} - {info.name} ({info.symbol})</option>
                            ))}
                        </select>
                        <p className="text-xs text-terminal-muted mt-2">
                            Global conversion rate updates occur every 60 seconds via Forex stream.
                        </p>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4 border-b border-terminal-border pb-4">
                    <Bell className="text-terminal-accent" size={20} />
                    <h2 className="text-lg font-bold text-white">Alert Protocols</h2>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-terminal-bg rounded border border-terminal-border">
                        <span className="text-sm text-white">Trade Execution Confirmation</span>
                        <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${notifications.trades ? 'bg-terminal-accent' : 'bg-terminal-border'}`} onClick={() => setNotifications(n => ({...n, trades: !n.trades}))}>
                            <div className={`absolute top-1 w-3 h-3 bg-black rounded-full transition-all ${notifications.trades ? 'left-6' : 'left-1'}`}></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-terminal-bg rounded border border-terminal-border">
                        <span className="text-sm text-white">High Risk Exposure Warnings</span>
                        <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${notifications.risk ? 'bg-terminal-accent' : 'bg-terminal-border'}`} onClick={() => setNotifications(n => ({...n, risk: !n.risk}))}>
                             <div className={`absolute top-1 w-3 h-3 bg-black rounded-full transition-all ${notifications.risk ? 'left-6' : 'left-1'}`}></div>
                        </div>
                    </div>
                     <div className="flex items-center justify-between p-3 bg-terminal-bg rounded border border-terminal-border">
                        <span className="text-sm text-white">Breaking News Interrupts</span>
                        <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${notifications.news ? 'bg-terminal-accent' : 'bg-terminal-border'}`} onClick={() => setNotifications(n => ({...n, news: !n.news}))}>
                             <div className={`absolute top-1 w-3 h-3 bg-black rounded-full transition-all ${notifications.news ? 'left-6' : 'left-1'}`}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
             <div className="bg-terminal-panel border border-terminal-border rounded-lg p-6 space-y-6 lg:col-span-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 mb-4 border-b border-terminal-border pb-4">
                    <Shield className="text-red-500" size={20} />
                    <h2 className="text-lg font-bold text-white">System Danger Zone</h2>
                </div>
                
                <div className="flex items-center justify-between">
                    <div>
                         <h4 className="text-white font-medium text-sm">Purge Local Data</h4>
                         <p className="text-xs text-terminal-muted mt-1">Permanently deletes all locally stored portfolio data, settings, API keys, and cached AI analysis.</p>
                    </div>
                     <button 
                        onClick={handleFullReset}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded transition-colors text-sm font-medium"
                    >
                        <Trash2 size={16} /> Factory Reset
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};