'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/calls';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const username = form.get('username');
    const password = form.get('password');
    try {
      await api('/api/login', { method: 'POST', body: { username, password } });
      router.replace('/');
      router.refresh();
    } catch (ex) {
      setError((ex as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={onSubmit}>
        <Image src="/logo.png" alt="DevMate" className="login-logo" width={158} height={56} priority />
        <h1>AI Lead Management</h1>
        <p className="muted">Sign in to manage leads, run campaigns and review results.</p>
        <label className="field">
          <span>Username</span>
          <input type="text" name="username" autoComplete="username" defaultValue="Veronika" required autoFocus />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <p className="form-error" role="alert">{error}</p>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="tiny muted">Powered by DevMate Solutions · devmatesolutions.com</p>
      </form>
    </main>
  );
}
