'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { api, contactName, endedBecause, fmt, isAnswered } from '@/lib/calls';
import type { CallDetail } from '@/lib/types';
import { SentimentBadge, StatusBadge } from './calls-ui';
import { useDashboard } from './dashboard-context';

const Icon = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
const ICONS = {
  overview: 'M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z',
  call: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  bulk: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6m0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13m8 0c-.3 0-.6 0-1 .05 1.2.85 2 2 2 3.45V19h6v-2.5c0-2.3-4.7-3.5-7-3.5',
  campaigns: 'M3 5h18v2H3zm0 6h18v2H3zm0 6h12v2H3z',
  history: 'M13 3a9 9 0 0 0-9 9H1l3.9 3.9L9 12H6a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 13 3m-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z',
  close: 'M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  refresh: 'M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z',
};
export { Icon, ICONS };

const NAV = [
  { href: '/', key: 'overview', label: 'Overview', title: 'Overview', sub: 'How your AI voice agents are performing', range: true },
  { href: '/call', key: 'call', label: 'New call', title: 'New call', sub: 'Have an AI agent call one person right now' },
  { href: '/bulk', key: 'bulk', label: 'Bulk campaign', title: 'Bulk campaign', sub: 'Upload a contact list and let your agent call everyone' },
  { href: '/campaigns', key: 'campaigns', label: 'Campaigns', title: 'Campaigns', sub: 'Progress of bulk campaigns launched from this dashboard' },
  { href: '/history', key: 'history', label: 'Call history', title: 'Call history', sub: 'Every call, with recordings, transcripts and outcomes', range: true },
] as const;

const RANGES = [{ d: 1, l: '24h' }, { d: 7, l: '7d' }, { d: 30, l: '30d' }, { d: 90, l: '90d' }, { d: 365, l: '1y' }];

function readTheme(): string | null {
  try { return localStorage.getItem('dm_theme'); } catch { return null; }
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { config, days, setDays, loading, reloadCalls, reloadConfig, toasts, configError, toast } = useDashboard();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const page = NAV.find((n) => n.href === pathname) ?? NAV[0];

  useEffect(() => {
    const t = readTheme();
    if (t) document.documentElement.dataset.theme = t;
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => { if (configError) toast(configError, true); }, [configError, toast]);

  function toggleTheme() {
    const cur = document.documentElement.dataset.theme;
    const dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('dm_theme', next); } catch { /* storage unavailable */ }
  }

  async function logout() {
    await api('/api/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
  }

  const c = config?.concurrency;

  return (
    <div className="app">
      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
          <Image src="/logo-mark.png" alt="" width={32} height={32} />
          <span><strong>AI Lead Management</strong><small>DevMate Solutions</small></span>
        </Link>
        <nav className="nav">
          {NAV.map((n) => (
            <Link key={n.key} href={n.href} className={n.href === pathname ? 'active' : ''} onClick={() => setMenuOpen(false)}>
              <Icon d={ICONS[n.key]} />{n.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          {c && (
            <div className="concurrency" title="Calls running right now vs. your plan limit">
              <span>Live calls</span>
              <strong className="num">{c.current_concurrency} / {c.concurrency_limit}</strong>
              <div className="meter"><i style={{ width: `${Math.min(100, (c.current_concurrency / Math.max(1, c.concurrency_limit)) * 100)}%` }} /></div>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" type="button" onClick={toggleTheme}>Toggle theme</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={logout}>Sign out</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setMenuOpen((o) => !o)}><Icon d={ICONS.menu} /></button>
          <div>
            <h1>{page.title}</h1>
            <p className="muted">{page.sub}</p>
          </div>
          <div className="topbar-actions" style={{ visibility: 'range' in page ? 'visible' : 'hidden' }}>
            <div className="segmented" role="group" aria-label="Date range">
              {RANGES.map((r) => (
                <button key={r.d} className={r.d === days ? 'active' : ''} onClick={() => setDays(r.d)}>{r.l}</button>
              ))}
            </div>
            <button className={`icon-btn${loading ? ' spinning' : ''}`} aria-label="Refresh" onClick={() => { reloadCalls(); reloadConfig(); }}>
              <Icon d={ICONS.refresh} />
            </button>
          </div>
        </header>
        <section className="view" aria-live="polite">{children}</section>
      </div>

      <CallDrawer />
      <div className="toast-wrap">
        {toasts.map((t) => <div key={t.id} className={`toast${t.err ? ' err' : ''}`}>{t.msg}</div>)}
      </div>
    </div>
  );
}

function CallDrawer() {
  const { openCallId, openCall, setCallPrefill } = useDashboard();
  const router = useRouter();
  const [call, setCall] = useState<CallDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!openCallId) return;
    let cancelled = false;
    // Reset before fetching the newly selected call.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCall(null);
    setError('');
    api<CallDetail>(`/api/calls/${encodeURIComponent(openCallId)}`)
      .then((c) => { if (!cancelled) setCall(c); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [openCallId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') openCall(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openCall]);

  const open = !!openCallId;
  const name = call ? contactName(call) : '';
  const custom = Object.entries(call?.analysis?.custom_analysis_data ?? {}).filter(([, v]) => v !== null && v !== '');
  const vars = Object.entries(call?.vars ?? {});

  return (
    <>
      {open && <div className="drawer-backdrop" onClick={() => openCall(null)} />}
      <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <h2>{name || call?.to || 'Call details'}</h2>
          <button className="icon-btn" aria-label="Close" onClick={() => openCall(null)}><Icon d={ICONS.close} /></button>
        </div>
        {open && (
          <div className="drawer-body">
            {error && <div className="result err">{error}</div>}
            {!call && !error && <><div className="skeleton" style={{ height: 120 }} /><div className="skeleton" style={{ height: 300 }} /></>}
            {call && (
              <>
                <div className="row">
                  <StatusBadge call={call} /> <SentimentBadge sentiment={call.sentiment} />
                  {call.successful === true && <span className="badge good">Goal achieved</span>}
                  {call.successful === false && isAnswered(call) && <span className="badge">Goal not achieved</span>}
                </div>
                <div className="facts">
                  <div className="fact"><span>Started</span><strong>{fmt.date(call.start)}</strong></div>
                  <div className="fact"><span>Duration</span><strong>{call.duration_ms ? fmt.dur(call.duration_ms) : '—'}</strong></div>
                  <div className="fact"><span>Agent</span><strong>{call.agent_name || '—'}</strong></div>
                  <div className="fact"><span>Ended because</span><strong>{endedBecause(call)}</strong></div>
                  <div className="fact"><span>From → To</span><strong className="mono">{call.from || '—'} → {call.to || '—'}</strong></div>
                  <div className="fact"><span>Cost</span><strong>{fmt.money(call.cost_cents)}</strong></div>
                </div>
                {call.recording_url && (
                  <div><div className="section-title">Recording</div><audio controls preload="none" src={call.recording_url} /></div>
                )}
                {call.summary && <div><div className="section-title">Summary</div><p style={{ margin: 0 }}>{call.summary}</p></div>}
                {custom.length > 0 && (
                  <div><div className="section-title">Extracted data</div>
                    <dl className="kv">{custom.map(([k, v]) => (
                      <div key={k} style={{ display: 'contents' }}><dt>{k.replace(/_/g, ' ')}</dt><dd>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd></div>
                    ))}</dl></div>
                )}
                {vars.length > 0 && (
                  <div><div className="section-title">Call variables</div>
                    <dl className="kv">{vars.map(([k, v]) => (
                      <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>
                    ))}</dl></div>
                )}
                <div>
                  <div className="section-title">Transcript</div>
                  {call.transcript.length ? (
                    <div className="transcript">
                      {call.transcript.map((t, i) => (
                        <div key={i} className={`bubble ${t.role === 'user' ? 'user' : 'agent'}`}>
                          <small>{t.role === 'user' ? 'Customer' : 'Agent'}{t.at != null ? ` · ${fmt.dur(t.at * 1000)}` : ''}</small>
                          {t.content}
                        </div>
                      ))}
                    </div>
                  ) : <p className="muted" style={{ margin: 0 }}>No conversation was recorded for this call.</p>}
                </div>
                <div className="row">
                  <button className="btn btn-primary" onClick={() => {
                    setCallPrefill({ to: call.to, agent_id: call.agent_id, from: call.from, vars: call.vars ?? {} });
                    openCall(null);
                    router.push('/call');
                  }}>Call again</button>
                  <span className="tiny muted mono">{call.id}</span>
                </div>
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
