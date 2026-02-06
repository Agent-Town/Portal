import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function TypographySystem() {
  return (
    <div className="space-y-4">
      <Card className="bg-[#E8F4E7] border-4 border-[#2A3D29] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#B8D4B6]">
          <CardTitle className="text-[#2A3D29] flex items-center gap-2">
            <span className="text-[#F5C400]">★</span> Typography Philosophy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-[#3D5A3C] mb-4 text-sm leading-relaxed">
            Agent Town uses friendly, readable typography that feels welcoming without being childish. Our type system 
            balances pixel-perfect UI clarity with enough warmth to match our cozy frontier aesthetic.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#6B9B69] text-white border-2 border-[#5C7A5A] text-xs">Highly Readable</Badge>
            <Badge className="bg-[#6B9B69] text-white border-2 border-[#5C7A5A] text-xs">Clear Hierarchy</Badge>
            <Badge className="bg-[#F5C400] text-[#2A3D29] border-2 border-[#C29D00] text-xs">Friendly But Professional</Badge>
            <Badge className="bg-[#00BFE6] text-white border-2 border-[#0099B3] text-xs">Web-Optimized</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Font Pairing Candidates */}
      <Card className="bg-[#E6F9FF] border-4 border-[#00BFE6] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#80E5FF]">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[#2A3D29]">Primary Font Stack (Selected)</CardTitle>
            <Badge className="bg-[#5A9B3D] text-white border-2 border-[#4A7B2D] text-xs">Recommended</Badge>
          </div>
          <CardDescription className="text-xs text-[#5C7A5A]">Inter + JetBrains Mono</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Display & Headings: Inter</h4>
            <div className="space-y-2">
              <p className="text-4xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                Welcome to Agent Town
              </p>
              <p className="text-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                Build, explore, collaborate
              </p>
              <p className="text-lg text-slate-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                Inter is highly legible, slightly rounded, and has excellent web rendering. Perfect for UI and headings.
              </p>
            </div>
            <div className="mt-3 p-3 bg-slate-50 rounded">
              <p className="font-mono text-sm">
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Code & Data: JetBrains Mono</h4>
            <div className="space-y-2">
              <p className="text-lg" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                agent.sheriff.red_01
              </p>
              <p className="text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                house.western.tier2.v1.png
              </p>
              <p className="text-lg text-slate-600" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                JetBrains Mono for asset names, code snippets, and technical data. Clear ligatures and excellent readability.
              </p>
            </div>
            <div className="mt-3 p-3 bg-slate-50 rounded">
              <p className="font-mono text-sm">
                font-family: 'JetBrains Mono', 'Courier New', monospace
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Candidates */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Option 2: Outfit + Fira Code</CardTitle>
            <CardDescription>More geometric, modern feel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome to Agent Town
            </p>
            <p className="text-sm text-slate-600">
              Outfit is geometric and friendly. Good alternative if Inter feels too corporate.
            </p>
            <p className="font-mono text-sm" style={{ fontFamily: 'Fira Code, monospace' }}>
              house.western.tier1
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Option 3: DM Sans + Space Mono</CardTitle>
            <CardDescription>More playful, less formal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Welcome to Agent Town
            </p>
            <p className="text-sm text-slate-600">
              DM Sans has a friendly geometric feel with great lowercase readability.
            </p>
            <p className="font-mono text-sm" style={{ fontFamily: 'Space Mono, monospace' }}>
              house.western.tier1
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Type Scale */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Type Scale</CardTitle>
          <CardDescription>Based on 1.250 (Major Third) ratio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-baseline gap-4 border-b border-slate-200 pb-3">
              <div className="w-32 text-sm text-slate-600 font-mono">display-xl</div>
              <div className="flex-1">
                <p className="text-6xl">Agent Town</p>
                <p className="text-sm text-slate-600 mt-1">60px / 3.75rem | Line height: 1.1 | Weight: 700</p>
                <p className="font-mono text-xs text-slate-500">--font-size-display-xl</p>
              </div>
            </div>

            <div className="flex items-baseline gap-4 border-b border-slate-200 pb-3">
              <div className="w-32 text-sm text-slate-600 font-mono">display-lg</div>
              <div className="flex-1">
                <p className="text-5xl">Agent Town</p>
                <p className="text-sm text-slate-600 mt-1">48px / 3rem | Line height: 1.1 | Weight: 700</p>
                <p className="font-mono text-xs text-slate-500">--font-size-display-lg</p>
              </div>
            </div>

            <div className="flex items-baseline gap-4 border-b border-slate-200 pb-3">
              <div className="w-32 text-sm text-slate-600 font-mono">heading-1</div>
              <div className="flex-1">
                <p className="text-4xl">Build Together</p>
                <p className="text-sm text-slate-600 mt-1">36px / 2.25rem | Line height: 1.2 | Weight: 600</p>
                <p className="font-mono text-xs text-slate-500">--font-size-h1</p>
              </div>
            </div>

            <div className="flex items-baseline gap-4 border-b border-slate-200 pb-3">
              <div className="w-32 text-sm text-slate-600 font-mono">heading-2</div>
              <div className="flex-1">
                <p className="text-3xl">Explore the Frontier</p>
                <p className="text-sm text-slate-600 mt-1">30px / 1.875rem | Line height: 1.3 | Weight: 600</p>
                <p className="font-mono text-xs text-slate-500">--font-size-h2</p>
              </div>
            </div>

            <div className="flex items-baseline gap-4 border-b border-slate-200 pb-3">
              <div className="w-32 text-sm text-slate-600 font-mono">heading-3</div>
              <div className="flex-1">
                <p className="text-2xl">Welcome Travelers</p>
                <p className="text-sm text-slate-600 mt-1">24px / 1.5rem | Line height: 1.4 | Weight: 600</p>
                <p className="font-mono text-xs text-slate-500">--font-size-h3</p>
              </div>
            </div>

            <div className="flex items-baseline gap-4 border-b border-slate-200 pb-3">
              <div className="w-32 text-sm text-slate-600 font-mono">heading-4</div>
              <div className="flex-1">
                <p className="text-xl">Character Details</p>
                <p className="text-sm text-slate-600 mt-1">20px / 1.25rem | Line height: 1.4 | Weight: 600</p>
                <p className="font-mono text-xs text-slate-500">--font-size-h4</p>
              </div>
            </div>

            <div className="flex items-baseline gap-4 border-b border-slate-200 pb-3">
              <div className="w-32 text-sm text-slate-600 font-mono">body-lg</div>
              <div className="flex-1">
                <p className="text-lg">The frontier is full of possibility and adventure.</p>
                <p className="text-sm text-slate-600 mt-1">18px / 1.125rem | Line height: 1.6 | Weight: 400</p>
                <p className="font-mono text-xs text-slate-500">--font-size-body-lg</p>
              </div>
            </div>

            <div className="flex items-baseline gap-4 border-b border-slate-200 pb-3">
              <div className="w-32 text-sm text-slate-600 font-mono">body</div>
              <div className="flex-1">
                <p className="text-base">Default body text for most content and descriptions.</p>
                <p className="text-sm text-slate-600 mt-1">16px / 1rem | Line height: 1.6 | Weight: 400</p>
                <p className="font-mono text-xs text-slate-500">--font-size-body</p>
              </div>
            </div>

            <div className="flex items-baseline gap-4 border-b border-slate-200 pb-3">
              <div className="w-32 text-sm text-slate-600 font-mono">body-sm</div>
              <div className="flex-1">
                <p className="text-sm">Supporting text, captions, and metadata.</p>
                <p className="text-sm text-slate-600 mt-1">14px / 0.875rem | Line height: 1.5 | Weight: 400</p>
                <p className="font-mono text-xs text-slate-500">--font-size-body-sm</p>
              </div>
            </div>

            <div className="flex items-baseline gap-4 pb-3">
              <div className="w-32 text-sm text-slate-600 font-mono">caption</div>
              <div className="flex-1">
                <p className="text-xs">Fine print, timestamps, and labels.</p>
                <p className="text-sm text-slate-600 mt-1">12px / 0.75rem | Line height: 1.4 | Weight: 400</p>
                <p className="font-mono text-xs text-slate-500">--font-size-caption</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Examples */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Hierarchy in Practice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Hero Section Example */}
            <div className="p-6 bg-gradient-to-br from-amber-50 to-sky-50 rounded-lg">
              <p className="text-xs uppercase tracking-wide text-slate-600 mb-2">Multiplayer World</p>
              <h1 className="text-5xl font-bold text-slate-900 mb-3">Welcome to Agent Town</h1>
              <p className="text-xl text-slate-700 mb-4">
                Where humans and AI agents build together in a cozy frontier world.
              </p>
              <button className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold">
                Start Your Journey
              </button>
            </div>

            {/* Card Example */}
            <div className="p-6 bg-white rounded-lg border-2 border-slate-200">
              <h3 className="text-2xl font-semibold text-slate-900 mb-2">Build Your House</h3>
              <p className="text-base text-slate-600 mb-4">
                Choose your architectural style and customize every detail. Your house becomes a landmark in Agent Town.
              </p>
              <p className="text-sm text-slate-500">Updated 2 hours ago</p>
            </div>

            {/* UI Component Example */}
            <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-slate-900">Sheriff Badge Unlocked</p>
                <p className="text-sm text-slate-600">You've completed 10 collaborative quests!</p>
              </div>
              <span className="text-3xl">⭐</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Typography Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Font Weights</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm text-slate-600">Regular 400</span>
                  <span className="flex-1" style={{ fontWeight: 400 }}>Body text, descriptions, general content</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm text-slate-600">Medium 500</span>
                  <span className="flex-1" style={{ fontWeight: 500 }}>Emphasized text, button labels</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm text-slate-600">Semibold 600</span>
                  <span className="flex-1" style={{ fontWeight: 600 }}>Headings, important UI labels</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm text-slate-600">Bold 700</span>
                  <span className="flex-1" style={{ fontWeight: 700 }}>Display text, hero headings</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Best Practices</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Never use font sizes below 12px for body text (accessibility)</li>
                <li>Maintain consistent line heights: 1.1-1.2 for headings, 1.5-1.6 for body</li>
                <li>Use medium or semibold for emphasis, not uppercase (friendlier tone)</li>
                <li>Reserve monospace for technical content, asset names, and code</li>
                <li>Limit heading levels to H1-H4 in most interfaces</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Loading Fonts</h4>
              <div className="p-3 bg-slate-900 rounded text-green-400 font-mono text-sm">
                <code>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');`}</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}