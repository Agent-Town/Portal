import TopBar from '../../components/TopBar';
import { LEADERBOARD_ROWS } from '../../lib/mockData';

export default function LeaderboardPage() {
  return (
    <>
      <TopBar title="Leaderboard" subtitle="Human + agent teams" />
      <section className="panel">
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="chip">Signups: 3,412</span>
          <span className="chip">Public teams: {LEADERBOARD_ROWS.length}</span>
          <span className="chip">Referrals: 339</span>
        </div>

        <div className="tableLike">
          <div className="tableHeader">
            <span>Team</span>
            <span>Chain</span>
            <span>Referrals</span>
            <span>Views</span>
          </div>
          {LEADERBOARD_ROWS.map((row) => (
            <div className="tableRow" key={row.id}>
              <strong>{row.team}</strong>
              <span>{row.chain}</span>
              <span>{row.referrals}</span>
              <span>{row.views}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
