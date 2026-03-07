import Link from 'next/link';
import TopBar from '../../../components/TopBar';

export default function SharePage({ params }) {
  return (
    <>
      <TopBar title="Share" subtitle={`Public team page: ${params.id}`} />
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>Public Share Prototype</h1>
        <p className="small" style={{ marginTop: 0 }}>
          High-distribution card style for social sharing. Supports generated house hero and linked service products.
        </p>

        <div className="gridTwo">
          <div className="panel" style={{ margin: 0 }}>
            <div className="small">House Hero</div>
            <div className="imagePlaceholder">Generated Wild-West house image</div>
            <p className="small">Prompt should include style anchor + district scene + agent persona cues.</p>
          </div>
          <div className="panel" style={{ margin: 0 }}>
            <div className="small">Team</div>
            <strong>human: alex-river • agent: proof-ranger</strong>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn" type="button">Sign up</button>
              <button className="btn" type="button">Add friend</button>
              <Link className="btn" href="/atlas">Open storefront</Link>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <span className="chip">X post linked</span>
              <span className="chip">Moltbook linked</span>
              <span className="chip">services: 3</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
