import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export default function AssetNaming() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Asset Naming Convention</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-4">
            Consistent, predictable asset naming makes development faster, reduces errors, and improves collaboration. 
            All assets follow a structured naming pattern with category, descriptors, and version control.
          </p>
        </CardContent>
      </Card>

      {/* General Pattern */}
      <Card className="bg-white/80 backdrop-blur border-2 border-amber-500">
        <CardHeader>
          <CardTitle>Universal Naming Pattern</CardTitle>
          <CardDescription>Applied to all asset types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-900 rounded-lg mb-4">
            <code className="text-green-400 font-mono text-lg">
              [category].[subcategory].[descriptor].[variant].v[#].[ext]
            </code>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-4">
              <span className="font-mono bg-slate-100 px-2 py-1 rounded shrink-0">category</span>
              <span className="text-slate-600">
                Top-level asset type: house, character, ui, sfx, ambience, etc. Lowercase, no spaces.
              </span>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-mono bg-slate-100 px-2 py-1 rounded shrink-0">subcategory</span>
              <span className="text-slate-600">
                Specific type within category: western, sheriff, button, click, etc. Lowercase.
              </span>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-mono bg-slate-100 px-2 py-1 rounded shrink-0">descriptor</span>
              <span className="text-slate-600">
                Tier, state, or specific detail: tier1, hover, open, etc. Lowercase.
              </span>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-mono bg-slate-100 px-2 py-1 rounded shrink-0">variant</span>
              <span className="text-slate-600">
                Optional letter/number for variations: a, b, 01, 02. Use when multiple versions exist.
              </span>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-mono bg-slate-100 px-2 py-1 rounded shrink-0">v[#]</span>
              <span className="text-slate-600">
                Version number: v1, v2, v3. Always increment, never delete old versions during development.
              </span>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-mono bg-slate-100 px-2 py-1 rounded shrink-0">ext</span>
              <span className="text-slate-600">
                File extension: .png, .wav, .mp3, etc.
              </span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900 mb-2">Rules:</p>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Always lowercase</li>
              <li>Use periods (.) to separate segments</li>
              <li>Use underscores (_) only within a segment if needed (e.g., town_hall)</li>
              <li>No spaces, ever</li>
              <li>Be descriptive but concise</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Category Examples */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Houses */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Houses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div className="p-2 bg-slate-50 rounded">house.western.tier1.v1.png</div>
              <div className="p-2 bg-slate-50 rounded">house.western.tier2.v1.png</div>
              <div className="p-2 bg-slate-50 rounded">house.victorian.tier3.v1.png</div>
              <div className="p-2 bg-slate-50 rounded">house.cabin.tier1.a.v2.png</div>
              <div className="p-2 bg-slate-50 rounded">house.portal.tier4.v1.png</div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Pattern: house.[archetype].[tier].[variant].v[#].png
            </p>
          </CardContent>
        </Card>

        {/* Characters */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Characters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div className="p-2 bg-slate-50 rounded">character.sheriff.idle.v1.png</div>
              <div className="p-2 bg-slate-50 rounded">character.sheriff.walk.01.v1.png</div>
              <div className="p-2 bg-slate-50 rounded">character.human.female.happy.v1.png</div>
              <div className="p-2 bg-slate-50 rounded">character.agent.blue.idle.v2.png</div>
              <div className="p-2 bg-slate-50 rounded">character.npc.vendor.wave.v1.png</div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Pattern: character.[type].[state/pose].[frame].v[#].png
            </p>
          </CardContent>
        </Card>

        {/* UI Elements */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">UI Elements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div className="p-2 bg-slate-50 rounded">ui.button.primary.default.v1.png</div>
              <div className="p-2 bg-slate-50 rounded">ui.button.primary.hover.v1.png</div>
              <div className="p-2 bg-slate-50 rounded">ui.icon.star.v1.svg</div>
              <div className="p-2 bg-slate-50 rounded">ui.panel.chat.v2.png</div>
              <div className="p-2 bg-slate-50 rounded">ui.badge.tier3.v1.png</div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Pattern: ui.[component].[style].[state].v[#].[ext]
            </p>
          </CardContent>
        </Card>

        {/* Props & Items */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Props & Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div className="p-2 bg-slate-50 rounded">prop.tree.oak.v1.png</div>
              <div className="p-2 bg-slate-50 rounded">prop.fence.wood.v1.png</div>
              <div className="p-2 bg-slate-50 rounded">prop.sign.hanging.v2.png</div>
              <div className="p-2 bg-slate-50 rounded">item.tool.hammer.v1.png</div>
              <div className="p-2 bg-slate-50 rounded">item.badge.sheriff.v1.png</div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Pattern: [prop/item].[category].[type].v[#].png
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sound Effects */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Sound Effects (SFX)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">UI Sounds</h4>
            <div className="space-y-2 font-mono text-sm">
              <div className="p-2 bg-slate-50 rounded">sfx.ui.click.primary.v1.wav</div>
              <div className="p-2 bg-slate-50 rounded">sfx.ui.click.secondary.v1.wav</div>
              <div className="p-2 bg-slate-50 rounded">sfx.ui.error.v1.wav</div>
              <div className="p-2 bg-slate-50 rounded">sfx.ui.success.v1.wav</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">World Interaction</h4>
            <div className="space-y-2 font-mono text-sm">
              <div className="p-2 bg-slate-50 rounded">sfx.door.open.v1.wav</div>
              <div className="p-2 bg-slate-50 rounded">sfx.door.close.v1.wav</div>
              <div className="p-2 bg-slate-50 rounded">sfx.footstep.wood.01.v1.wav</div>
              <div className="p-2 bg-slate-50 rounded">sfx.footstep.wood.02.v1.wav</div>
              <div className="p-2 bg-slate-50 rounded">sfx.build.place.v1.wav</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Portal & Magic</h4>
            <div className="space-y-2 font-mono text-sm">
              <div className="p-2 bg-slate-50 rounded">sfx.portal.open.v1.wav</div>
              <div className="p-2 bg-slate-50 rounded">sfx.portal.close.v1.wav</div>
              <div className="p-2 bg-slate-50 rounded">sfx.portal.interact.v1.wav</div>
              <div className="p-2 bg-slate-50 rounded">sfx.portal.ambient.loop.v1.wav</div>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Pattern: <code className="font-mono bg-slate-100 px-2 py-1 rounded">sfx.[category].[action].[variant].v[#].wav</code>
          </p>
        </CardContent>
      </Card>

      {/* Ambient & Music */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Ambient & Music</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm mb-4">
            <div className="p-2 bg-slate-50 rounded">ambience.town_square.loop.v1.mp3</div>
            <div className="p-2 bg-slate-50 rounded">ambience.interior.cozy.loop.v1.mp3</div>
            <div className="p-2 bg-slate-50 rounded">ambience.nature.day.loop.v1.mp3</div>
            <div className="p-2 bg-slate-50 rounded">music.theme.main.v1.mp3</div>
            <div className="p-2 bg-slate-50 rounded">music.event.festival.v1.mp3</div>
          </div>
          <p className="text-sm text-slate-600">
            Pattern: <code className="font-mono bg-slate-100 px-2 py-1 rounded">[ambience/music].[location/theme].[mood/type].loop.v[#].mp3</code>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Note: Add ".loop" before version if file is designed to loop seamlessly
          </p>
        </CardContent>
      </Card>

      {/* CSS Variables */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>CSS Variable Naming</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Colors</h4>
              <div className="space-y-2 font-mono text-sm">
                <div className="p-2 bg-slate-50 rounded">--color-star-500</div>
                <div className="p-2 bg-slate-50 rounded">--color-portal-300</div>
                <div className="p-2 bg-slate-50 rounded">--color-red-600</div>
                <div className="p-2 bg-slate-50 rounded">--color-wood-800</div>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Pattern: <code className="font-mono">--color-[palette]-[weight]</code>
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Typography</h4>
              <div className="space-y-2 font-mono text-sm">
                <div className="p-2 bg-slate-50 rounded">--font-size-display-xl</div>
                <div className="p-2 bg-slate-50 rounded">--font-size-h1</div>
                <div className="p-2 bg-slate-50 rounded">--font-size-body</div>
                <div className="p-2 bg-slate-50 rounded">--font-size-caption</div>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Pattern: <code className="font-mono">--font-size-[scale-name]</code>
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Spacing & Layout</h4>
              <div className="space-y-2 font-mono text-sm">
                <div className="p-2 bg-slate-50 rounded">--spacing-xs (4px)</div>
                <div className="p-2 bg-slate-50 rounded">--spacing-sm (8px)</div>
                <div className="p-2 bg-slate-50 rounded">--spacing-md (16px)</div>
                <div className="p-2 bg-slate-50 rounded">--spacing-lg (24px)</div>
                <div className="p-2 bg-slate-50 rounded">--spacing-xl (32px)</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Animation</h4>
              <div className="space-y-2 font-mono text-sm">
                <div className="p-2 bg-slate-50 rounded">--duration-fast (150ms)</div>
                <div className="p-2 bg-slate-50 rounded">--duration-normal (300ms)</div>
                <div className="p-2 bg-slate-50 rounded">--duration-slow (600ms)</div>
                <div className="p-2 bg-slate-50 rounded">--easing-out</div>
                <div className="p-2 bg-slate-50 rounded">--easing-in-out</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Asset Keys */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Game Engine Asset Keys</CardTitle>
          <CardDescription>For Phaser, Unity, or other engines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Sprite/Texture Keys</h4>
              <p className="text-sm text-slate-600 mb-2">
                Match file name without extension. Use camelCase or keep original convention.
              </p>
              <div className="p-4 bg-slate-900 rounded-lg">
                <pre className="text-green-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
{`// Load asset
this.load.image('house.western.tier1.v1', 'assets/houses/house.western.tier1.v1.png');

// Use in code
this.add.image(x, y, 'house.western.tier1.v1');`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Audio Keys</h4>
              <div className="p-4 bg-slate-900 rounded-lg">
                <pre className="text-green-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
{`// Load audio
this.load.audio('sfx.ui.click.primary.v1', 'assets/audio/sfx.ui.click.primary.v1.wav');

// Play sound
this.sound.play('sfx.ui.click.primary.v1');`}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-cyan-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-900 mb-2">💡 Pro Tip</p>
              <p className="text-sm text-slate-600">
                Keep asset keys identical to file names (minus extension). This makes debugging easier and 
                reduces mental overhead when coding.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card className="bg-white/80 backdrop-blur border-2 border-green-500">
        <CardHeader>
          <CardTitle>Quick Reference Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-900">Asset Type</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-900">Pattern</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-900">Example</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">House</td>
                  <td className="py-2 px-3">house.[type].[tier].v#</td>
                  <td className="py-2 px-3 text-slate-600">house.western.tier2.v1.png</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">Character</td>
                  <td className="py-2 px-3">character.[type].[state].v#</td>
                  <td className="py-2 px-3 text-slate-600">character.sheriff.walk.v1.png</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">UI</td>
                  <td className="py-2 px-3">ui.[component].[state].v#</td>
                  <td className="py-2 px-3 text-slate-600">ui.button.hover.v1.png</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">SFX</td>
                  <td className="py-2 px-3">sfx.[category].[action].v#</td>
                  <td className="py-2 px-3 text-slate-600">sfx.portal.open.v1.wav</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3">Ambience</td>
                  <td className="py-2 px-3">ambience.[location].loop.v#</td>
                  <td className="py-2 px-3 text-slate-600">ambience.town_square.loop.v1.mp3</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">CSS Var</td>
                  <td className="py-2 px-3">--[type]-[name]-[value]</td>
                  <td className="py-2 px-3 text-slate-600">--color-star-500</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
