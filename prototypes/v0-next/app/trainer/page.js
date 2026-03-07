import TopBar from '../../components/TopBar';
import { TRAINER_ATTEMPTS } from '../../lib/mockData';

export default function TrainerPage() {
  return (
    <>
      <TopBar title="Experience Trainer" subtitle="Deterministic run harness" />
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>Quest: Portal Onboarding</h1>
        <p className="small" style={{ marginTop: 0 }}>
          Prototype of the full trainer surface: attempts, timeline, tool lab, integrity checks, and loadouts.
        </p>

        <div className="row" style={{ marginBottom: 10 }}>
          <button className="btn">Run 1</button>
          <button className="btn">Run 3</button>
          <button className="btn">Run 10</button>
          <button className="btn">Clear all</button>
        </div>

        <div className="gridTwo">
          <div className="panel" style={{ margin: 0 }}>
            <h2 style={{ marginTop: 0 }}>Attempts</h2>
            <div className="listCompact">
              {TRAINER_ATTEMPTS.map((attempt) => (
                <div className="listRow" key={attempt.id}>
                  <strong>{attempt.id}</strong>
                  <span className="chip">{attempt.status}</span>
                  <span className="small">score {(attempt.score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ margin: 0 }}>
            <h2 style={{ marginTop: 0 }}>Inspector + Tools</h2>
            <div className="row" style={{ marginBottom: 8 }}>
              <span className="chip">Trace</span>
              <span className="chip">Tool Lab</span>
              <span className="chip">Traffic</span>
              <span className="chip">Session</span>
            </div>
            <pre className="codeBlock">tool.invoke({`{ name: 'claim.create', args: { chain: 'evm' } }`})</pre>
          </div>
        </div>
      </section>
    </>
  );
}
