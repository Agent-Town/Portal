import TopBar from '../../components/TopBar';

export default function HousePage() {
  return (
    <>
      <TopBar title="House of Secrets" subtitle="Wallet unlock + ERC-8004 attachment" />
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>House Management Prototype</h1>
        <p className="small" style={{ marginTop: 0 }}>
          Mirrors the current unlock and media-slot workflow. This is a design shell, not wired to backend state.
        </p>

        <div className="gridTwo">
          <div className="panel" style={{ margin: 0 }}>
            <h2 style={{ marginTop: 0 }}>Unlock</h2>
            <p className="small">Sign with wallet to unlock encrypted house state.</p>
            <div className="row">
              <button className="btn" type="button">Connect wallet</button>
              <button className="btn" type="button">Sign to unlock</button>
            </div>
            <p className="small">No unencrypted key material is stored server-side.</p>
          </div>

          <div className="panel" style={{ margin: 0 }}>
            <h2 style={{ marginTop: 0 }}>ERC-8004 Link</h2>
            <p className="small">Attach chain-aware identity and publish discoverable mapping when requested.</p>
            <div className="row">
              <button className="btn" type="button">Mint identity</button>
              <button className="btn" type="button">Link to house</button>
              <button className="btn bad" type="button">Opt out</button>
            </div>
            <p className="small">Opt-out should remove storefront visibility and hide public share by default.</p>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 10 }}>
          <h2 style={{ marginTop: 0 }}>Media Slots</h2>
          <p className="small">Share hero + human avatar + agent avatar + future service cards.</p>
          <div className="row">
            <span className="chip">shareHeroImageUrl</span>
            <span className="chip">humanAvatarImageUrl</span>
            <span className="chip">agentAvatarImageUrl</span>
            <span className="chip">serviceCardImages[]</span>
          </div>
        </div>
      </section>
    </>
  );
}
