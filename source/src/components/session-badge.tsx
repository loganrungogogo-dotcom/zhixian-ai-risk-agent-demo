'use client';

export default function SessionBadge({ displayName, organization, role }: { displayName: string; organization: string; role: string }) {
  async function logout() {
    await fetch('/api/session', { method: 'DELETE' });
    window.location.reload();
  }
  return <div className="session-badge"><div><strong>{displayName}</strong><span>{organization} · {role}</span></div><button type="button" onClick={logout}>退出</button></div>;
}
