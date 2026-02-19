import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function HouseStyleGuide() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>House Design Philosophy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-4">
            Houses in Agent Town are player-customizable landmarks that express personality and progress. They follow 
            frontier architecture archetypes (Western, Victorian, Cabin, etc.) with clear tiering for experience/rarity 
            and modular signage for function labeling.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>Frontier Archetypes</Badge>
            <Badge>Tiered Progression</Badge>
            <Badge>Modular Signage</Badge>
            <Badge>District Variations</Badge>
          </div>
        </CardContent>
      </Card>

      {/* House Archetypes */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Core House Archetypes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-300">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">🤠</span> Western Saloon
              </h4>
              <p className="text-sm text-slate-600 mb-3">
                Classic frontier style. Vertical wood planks, swinging doors, balcony railing on tier 2+. 
                Warm wood tones (wood-500 to wood-700).
              </p>
              <div className="space-y-1 text-xs text-slate-600">
                <p><span className="font-semibold">Roof:</span> Flat or shallow pitch, dark wood</p>
                <p><span className="font-semibold">Windows:</span> Rectangle, 2-4 panes, dark frames</p>
                <p><span className="font-semibold">Door:</span> Swinging saloon style or solid wood</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border-2 border-slate-300">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">🏰</span> Victorian Townhouse
              </h4>
              <p className="text-sm text-slate-600 mb-3">
                More refined, painted wood. Decorative trim, peaked roof, round or arched windows. 
                Neutral tones with accent colors.
              </p>
              <div className="space-y-1 text-xs text-slate-600">
                <p><span className="font-semibold">Roof:</span> Steep pitch, patterned shingles, chimney</p>
                <p><span className="font-semibold">Windows:</span> Arched or circular, decorative frames</p>
                <p><span className="font-semibold">Door:</span> Centered, ornate frame, small porch</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">🏕️</span> Log Cabin
              </h4>
              <p className="text-sm text-slate-600 mb-3">
                Rustic, cozy. Horizontal logs with visible notching. Stone foundation. 
                Earthy tones (wood-600, earth-medium).
              </p>
              <div className="space-y-1 text-xs text-slate-600">
                <p><span className="font-semibold">Roof:</span> Medium pitch, wood shingles or thatch</p>
                <p><span className="font-semibold">Windows:</span> Small, square, minimal trim</p>
                <p><span className="font-semibold">Door:</span> Heavy wood, iron hardware</p>
              </div>
            </div>

            <div className="p-4 bg-cyan-50 rounded-lg border-2 border-cyan-300">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">✨</span> Portal Workshop
              </h4>
              <p className="text-sm text-slate-600 mb-3">
                Magical/experimental. Mix of wood and glowing cyan accents. Asymmetrical design. 
                For advanced/agent-heavy builds.
              </p>
              <div className="space-y-1 text-xs text-slate-600">
                <p><span className="font-semibold">Roof:</span> Unusual shape, portal glow effects</p>
                <p><span className="font-semibold">Windows:</span> Glowing cyan panes, irregular shapes</p>
                <p><span className="font-semibold">Door:</span> Arched portal opening with particle effects</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier System */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Tier System (Experience Progression)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="text-3xl">🏠</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900">Tier 1: Starter</h4>
                  <Badge variant="outline">Basic</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  Single story, simple shape (square/rectangle), minimal decoration. 3-4 colors. 
                  Approximately 128×128px footprint.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
              <div className="text-3xl">🏡</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900">Tier 2: Established</h4>
                  <Badge className="bg-amber-600">Common</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  1.5 stories, added architectural detail (balcony, porch, trim), 4-5 colors. 
                  Approximately 128×160px footprint.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <div className="text-3xl">🏘️</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900">Tier 3: Distinguished</h4>
                  <Badge className="bg-purple-600">Rare</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  2 stories, complex roof, unique features (tower, chimney, awning), 5-6 colors. 
                  Approximately 160×192px footprint.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-500">
              <div className="text-3xl">🏛️</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900">Tier 4: Legendary</h4>
                  <Badge className="bg-cyan-600">Epic</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  2-3 stories, landmark quality, animated elements (flags, lights, portal effects), 6+ colors. 
                  Approximately 192×240px footprint.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-lg">
            <p className="font-mono text-sm">
              Asset naming: <code className="text-green-400">house.[archetype].[tier].[variant].png</code>
            </p>
            <p className="font-mono text-xs text-slate-400 mt-1">
              Example: house.western.tier2.v3.png
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Signage Style */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Signage System</CardTitle>
          <CardDescription>Modular signs to label house function</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Sign Formats</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-amber-100 rounded-lg border-2 border-amber-800 text-center">
                <div className="text-2xl mb-2">🪧</div>
                <p className="font-semibold text-sm text-slate-900">Hanging Board</p>
                <p className="text-xs text-slate-600">Rectangular wood, hangs from bracket. Western/Saloon style.</p>
              </div>
              <div className="p-4 bg-slate-100 rounded-lg border-2 border-slate-800 text-center">
                <div className="text-2xl mb-2">🏷️</div>
                <p className="font-semibold text-sm text-slate-900">Wall Plaque</p>
                <p className="text-xs text-slate-600">Flat against wall. Victorian/Townhouse style.</p>
              </div>
              <div className="p-4 bg-cyan-100 rounded-lg border-2 border-cyan-800 text-center">
                <div className="text-2xl mb-2">✨</div>
                <p className="font-semibold text-sm text-slate-900">Glowing Text</p>
                <p className="text-xs text-slate-600">Portal-style floating text. Workshop/Magical style.</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Typography for Signs</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Font: Inter Bold or hand-lettered style (chunky, pixel-aligned)</li>
              <li>Size: 12-16px for readability at standard zoom</li>
              <li>Colors: wood-900 on light wood, white on dark wood, portal-300 for glowing</li>
              <li>Max length: 12 characters (e.g., "GENERAL STORE", "WORKSHOP", "SALOON")</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Icon + Text Combinations</h4>
            <p className="text-sm text-slate-600 mb-3">
              For international clarity, pair text with universal icons (hammer for workshop, bed for inn, etc.). 
              Icon size: 16×16px, positioned above or beside text.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* District Variations */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>District Variation Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Agent Town can be divided into themed districts. Houses maintain their core archetype but adopt 
            district-specific color palettes and decorative elements.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-600">
              <h4 className="font-semibold text-slate-900 mb-2">Market District</h4>
              <p className="text-sm text-slate-600 mb-2">
                Bright, welcoming. Use star-400, red-400, grass-light accents. Awnings, outdoor goods, 
                festive bunting.
              </p>
              <div className="flex gap-1">
                <div className="w-8 h-8 bg-amber-400 rounded"></div>
                <div className="w-8 h-8 bg-red-400 rounded"></div>
                <div className="w-8 h-8 bg-green-400 rounded"></div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-slate-600">
              <h4 className="font-semibold text-slate-900 mb-2">Residential District</h4>
              <p className="text-sm text-slate-600 mb-2">
                Cozy, neutral. Use wood-400 to wood-600, grass-medium, sky-light. Gardens, fences, 
                personal touches.
              </p>
              <div className="flex gap-1">
                <div className="w-8 h-8 bg-amber-700 rounded"></div>
                <div className="w-8 h-8 bg-green-600 rounded"></div>
                <div className="w-8 h-8 bg-sky-400 rounded"></div>
              </div>
            </div>

            <div className="p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-600">
              <h4 className="font-semibold text-slate-900 mb-2">Portal District</h4>
              <p className="text-sm text-slate-600 mb-2">
                Magical, experimental. Use portal-300 to portal-500, star-500, wood-700. Glowing effects, 
                asymmetric design.
              </p>
              <div className="flex gap-1">
                <div className="w-8 h-8 bg-cyan-400 rounded"></div>
                <div className="w-8 h-8 bg-yellow-400 rounded"></div>
                <div className="w-8 h-8 bg-amber-800 rounded"></div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
              <h4 className="font-semibold text-slate-900 mb-2">Nature District</h4>
              <p className="text-sm text-slate-600 mb-2">
                Organic, rustic. Use grass-dark, wood-600, earth-medium. Natural materials, vine accents, 
                thatched roofs.
              </p>
              <div className="flex gap-1">
                <div className="w-8 h-8 bg-green-700 rounded"></div>
                <div className="w-8 h-8 bg-amber-700 rounded"></div>
                <div className="w-8 h-8 bg-amber-600 rounded"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Construction Rules */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>House Construction Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <span className="font-semibold text-slate-900 w-32 shrink-0">Grid Alignment:</span>
              <span>All houses snap to 32px grid for consistent placement and collision</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-slate-900 w-32 shrink-0">Footprint:</span>
              <span>Base should be slightly wider than tall (not square) for visual stability</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-slate-900 w-32 shrink-0">Door Placement:</span>
              <span>Always at ground level, centered or slightly off-center. 24-32px wide</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-slate-900 w-32 shrink-0">Windows:</span>
              <span>Minimum 2 per floor. Evenly spaced. 16-24px wide each</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-slate-900 w-32 shrink-0">Roof Overhang:</span>
              <span>4-8px beyond wall edges for depth and shadow</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-slate-900 w-32 shrink-0">Shadow:</span>
              <span>Soft ground shadow, wood-900 at 30% opacity, extends 40-60% of house width</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-slate-900 w-32 shrink-0">Layers:</span>
              <span>Foundation → Walls → Windows/Door → Roof → Details → Sign (separate sprite)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
