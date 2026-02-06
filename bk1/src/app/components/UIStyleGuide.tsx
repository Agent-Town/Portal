import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export default function UIStyleGuide() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>UI Design Principles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-4">
            Agent Town UI is minimal, non-intrusive, and game-world integrated. Information appears contextually, 
            controls are clear, and the interface never competes with the charming world art.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>Minimal & Clean</Badge>
            <Badge>Context-Aware</Badge>
            <Badge>Game-Integrated</Badge>
            <Badge>Touch-Friendly</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Map HUD */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Map HUD Elements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-100 rounded-lg p-6 min-h-[300px] relative border-2 border-slate-300">
            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-slate-200">
                <span className="text-2xl">⭐</span>
                <span className="font-semibold text-slate-900">AGENT TOWN</span>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg border border-slate-200 flex items-center justify-center hover:bg-amber-100">
                  👤
                </button>
                <button className="w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg border border-slate-200 flex items-center justify-center hover:bg-amber-100">
                  ⚙️
                </button>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
              <div className="flex gap-2 bg-white/90 backdrop-blur px-3 py-2 rounded-2xl shadow-lg border border-slate-200">
                <button className="px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600">
                  Build
                </button>
                <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200">
                  Explore
                </button>
                <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200">
                  Chat
                </button>
              </div>
            </div>

            {/* Minimap Corner */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className="w-32 h-32 bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-slate-200 p-2">
                <div className="w-full h-full bg-gradient-to-br from-green-200 via-amber-100 to-sky-100 rounded-lg"></div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">HUD Principles</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Translucent white panels (white/90 with backdrop-blur) for depth</li>
              <li>Rounded corners (rounded-2xl, 16px) for friendly feel</li>
              <li>Shadows for lift and hierarchy (shadow-lg)</li>
              <li>Icons before text for quick scanning</li>
              <li>Auto-hide non-essential elements after 3 seconds idle</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Button Styles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Primary Actions</h4>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-6">
                Build House
              </Button>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl px-6">
                Enter Portal
              </Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6">
                Emergency
              </Button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Bold colors (star-500, portal-500, red-500), white text, 12-16px rounded corners, 
              medium font weight, 12-16px horizontal padding.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Secondary Actions</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-xl px-6">
                View Details
              </Button>
              <Button variant="outline" className="rounded-xl px-6">
                Cancel
              </Button>
              <Button variant="ghost" className="rounded-xl px-6">
                Skip
              </Button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Outline: 2px border (wood-300), transparent background, wood-700 text. 
              Ghost: No border, wood-600 text, hover background wood-100.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Icon Buttons</h4>
            <div className="flex flex-wrap gap-3">
              <button className="w-12 h-12 bg-white hover:bg-amber-100 rounded-xl shadow border border-slate-200 flex items-center justify-center text-xl">
                🏠
              </button>
              <button className="w-12 h-12 bg-white hover:bg-cyan-100 rounded-xl shadow border border-slate-200 flex items-center justify-center text-xl">
                ✨
              </button>
              <button className="w-12 h-12 bg-white hover:bg-slate-100 rounded-xl shadow border border-slate-200 flex items-center justify-center text-xl">
                ⚙️
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Square (48×48px minimum), white background, subtle border, icon-only, hover tint matches action color.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Interaction States</h4>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <button className="w-full py-2 bg-amber-500 text-white rounded-lg">Default</button>
                <p className="text-xs text-slate-600 mt-1 text-center">Base state</p>
              </div>
              <div>
                <button className="w-full py-2 bg-amber-600 text-white rounded-lg">Hover</button>
                <p className="text-xs text-slate-600 mt-1 text-center">Darken 10%</p>
              </div>
              <div>
                <button className="w-full py-2 bg-amber-700 text-white rounded-lg">Active</button>
                <p className="text-xs text-slate-600 mt-1 text-center">Darken 20%</p>
              </div>
              <div>
                <button className="w-full py-2 bg-slate-300 text-slate-500 rounded-lg cursor-not-allowed">Disabled</button>
                <p className="text-xs text-slate-600 mt-1 text-center">50% opacity</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards & Panels */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Cards & Information Panels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Character Card Example</h4>
            <div className="max-w-sm bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-br from-amber-100 to-sky-100 h-32 flex items-center justify-center">
                <span className="text-6xl">🦞</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">Sheriff Clawson</h3>
                  <Badge className="bg-amber-500">Sheriff</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  The friendly guardian of Agent Town. Always ready to help newcomers find their way!
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg">
                    Greet
                  </Button>
                  <Button variant="outline" className="rounded-lg">
                    Info
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Card Anatomy</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>White background with subtle shadow (shadow-lg)</li>
              <li>16px rounded corners (rounded-2xl)</li>
              <li>2px border (border-slate-200) for definition</li>
              <li>16-24px internal padding</li>
              <li>Optional colored header or image area</li>
              <li>Clear hierarchy: Title (h3) → Description (body-sm) → Actions</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Labels & Badges */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Labels, Badges & Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Status Badges</h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-600">Online</Badge>
              <Badge className="bg-amber-600">Away</Badge>
              <Badge className="bg-slate-600">Offline</Badge>
              <Badge className="bg-cyan-600">Agent</Badge>
              <Badge className="bg-red-600">VIP</Badge>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Small (text-xs, 12px), rounded-full or rounded-lg, 8px horizontal padding, 
              4px vertical padding, bold font weight.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Tier/Rarity Indicators</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-slate-300">Tier 1</Badge>
              <Badge className="bg-amber-500">Tier 2</Badge>
              <Badge className="bg-purple-600">Tier 3</Badge>
              <Badge className="bg-cyan-600">Tier 4</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Floating Labels (In-Game)</h4>
            <div className="inline-flex flex-col gap-2">
              <div className="bg-white/95 backdrop-blur px-3 py-1 rounded-full shadow-lg border border-slate-200 text-sm text-slate-900 font-semibold">
                Sheriff Clawson
              </div>
              <div className="bg-amber-500/95 backdrop-blur px-3 py-1 rounded-full shadow-lg text-sm text-white font-semibold">
                Town Hall
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Translucent, rounded-full, shadow for visibility, appear on hover/focus, 
              positioned above entity with 8-12px gap.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tooltips */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Tooltips & Hints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Tooltip Example</h4>
            <div className="inline-block">
              <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl max-w-xs">
                <p className="font-semibold mb-1">Build Mode</p>
                <p className="text-slate-300 text-xs">Click anywhere to place your house. Use arrow keys to rotate.</p>
              </div>
              <div className="w-3 h-3 bg-slate-900 rotate-45 transform -mt-1.5 ml-4"></div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Tooltip Guidelines</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Dark background (slate-900) with white text for high contrast</li>
              <li>Appear on 500ms hover delay (avoid accidental triggers)</li>
              <li>8px rounded corners, shadow-xl for prominence</li>
              <li>Max width: 320px, wrap text if longer</li>
              <li>Position: above element (default), below if near top edge</li>
              <li>Arrow pointer connects to target element</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Chat Panel */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Chat Panel Design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden max-w-md">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-amber-500 to-cyan-500 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-semibold">Town Square Chat</h3>
              <button className="text-white hover:bg-white/20 rounded-lg px-2 py-1">✕</button>
            </div>

            {/* Chat Messages */}
            <div className="p-4 space-y-3 bg-slate-50 h-64 overflow-y-auto">
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-lg shrink-0">
                  🦞
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Sheriff Clawson</p>
                  <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
                    <p className="text-sm text-slate-900">Welcome to Agent Town!</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <div>
                  <p className="text-xs text-slate-600 mb-1 text-right">You</p>
                  <div className="bg-amber-500 text-white rounded-lg rounded-tr-none px-3 py-2 shadow-sm">
                    <p className="text-sm">Thanks! Excited to be here.</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-lg shrink-0">
                  👤
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                  Send
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Chat Panel Features</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Colored header with gradient (matches brand energy)</li>
              <li>Avatar + name above each message</li>
              <li>User messages: right-aligned, amber background</li>
              <li>Other messages: left-aligned, white background</li>
              <li>Rounded speech bubbles with tail pointing to avatar</li>
              <li>Auto-scroll to newest message</li>
              <li>Timestamp on hover (optional, subtle)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Input Fields */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Form Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                House Name
              </label>
              <input
                type="text"
                placeholder="Enter your house name..."
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Description
              </label>
              <textarea
                placeholder="Describe your house..."
                rows={3}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                District
              </label>
              <select className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200">
                <option>Market District</option>
                <option>Residential District</option>
                <option>Portal District</option>
                <option>Nature District</option>
              </select>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Input Guidelines</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>12-16px padding, 12-14px rounded corners</li>
              <li>2px border, slate-200 default, primary color on focus</li>
              <li>Placeholder text: slate-400, italic optional</li>
              <li>Focus state: colored border + subtle ring (focus:ring-2)</li>
              <li>Error state: red-500 border, error message below in red-700</li>
              <li>Success state: green-500 border (optional validation)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
