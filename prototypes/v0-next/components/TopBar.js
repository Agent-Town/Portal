import Link from 'next/link';

const LINKS = [
  ['Home', '/'],
  ['House', '/house'],
  ['Leaderboard', '/leaderboard'],
  ['Atlas', '/atlas'],
  ['Trainer', '/trainer']
];

export default function TopBar({ title, subtitle }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brandDot" aria-hidden="true" />
        <div className="brandCopy">
          <strong>{title || 'Agent Town'}</strong>
          <span className="small">{subtitle || 'Human + agent co-op shell'}</span>
        </div>
      </div>
      <nav className="actions" aria-label="Primary">
        {LINKS.map(([label, href]) => (
          <Link key={href} className="btn" href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
