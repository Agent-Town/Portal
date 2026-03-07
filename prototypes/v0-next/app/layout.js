import './globals.css';
import AgentDock from '../components/AgentDock';

export const metadata = {
  title: 'Agent Town v0 Prototype',
  description: 'Trainer + Atlas interaction prototype for UI restyling.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="shell">{children}</main>
        <AgentDock />
      </body>
    </html>
  );
}
