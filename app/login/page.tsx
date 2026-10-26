'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight } from 'lucide-react';
import type { Role } from '@/lib/types';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('State Admin');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Enter a username and password.'); return; }
    try {
      // Demo entry only. Never persist or transmit the entered password.
      localStorage.setItem('mahacare-session', JSON.stringify({ role, district: 'Pune', demoLogin: true }));
      setBusy(true);
      window.location.assign('/portal');
    } catch { setError('Browser storage is unavailable. Enable site storage and try again.'); }
  }
  return <main className="demo-login admin-login">
    <Link className="brand" href="/"><span className="brand-icon"><Activity size={25}/></span><span><b>MahaCare<span className="brand-dot">.</span></b><small>DIAGNOSTIC REGISTRY</small></span></Link>
    <section className="panel">
      <span className="eyebrow">ADMIN PORTAL</span>
      <h1>Admin Login</h1>
      <p className="muted">Sign in to explore the MahaCare dashboard.</p>
      <form className="admin-login-form" onSubmit={login}>
        <div><label htmlFor="username">Username</label><input id="username" name="username" autoComplete="off" required value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter any demo username" /></div>
        <div><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="off" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter any demo password" /></div>
        <div><label htmlFor="login-role">Select Role</label><select id="login-role" name="role" value={role} onChange={e => setRole(e.target.value as Role)}><option value="State Admin">Admin</option><option value="District Admin">District Admin</option><option value="Officer">Officer</option><option value="Centre">Centre</option></select></div>
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <button className="button primary" type="submit" disabled={busy}>{busy ? 'Opening dashboard…' : 'Login'}<ArrowRight size={16}/></button>
      </form>
      <p className="admin-login-note">Demo access: use any username and password. Use sample values, not your real credentials.</p>
    </section>
    <Link className="text-button" href="/">Go to Website <ArrowRight size={15}/></Link>
  </main>;
}
