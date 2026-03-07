import TopBar from '../components/TopBar';
import TownHubPrototype from '../components/TownHubPrototype';

export default function HomePage() {
  return (
    <>
      <TopBar title="Agent Town" subtitle="Town hub + district modals + dock" />
      <TownHubPrototype />
    </>
  );
}
