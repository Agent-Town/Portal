import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function IllustrationStyle() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Illustration Style Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-4">
            Agent Town illustrations blend pixel art charm with modern clarity. Think "2.5D pixel art" - chunky 
            outlines, simple shading, and friendly proportions. Everything should feel handcrafted but clean 
            enough for web rendering.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>Chunky Pixel Outlines</Badge>
            <Badge>Simple Shading</Badge>
            <Badge>Warm & Inviting</Badge>
            <Badge>Consistent Proportions</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Line Weight */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Line Weight & Outlines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Primary Outline: 3-4px</h4>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-24 h-24 bg-amber-200 rounded-lg border-4 border-amber-800"></div>
              <p className="text-sm text-slate-600">
                Main character and object outlines. Uses wood-800 or black at 90% opacity. Creates that 
                "chunky pixel" look while staying crisp at web resolution.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Detail Lines: 2px</h4>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-24 h-24 bg-slate-100 rounded-lg border-2 border-slate-400 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-slate-600 rounded"></div>
              </div>
              <p className="text-sm text-slate-600">
                Interior details, facial features, clothing seams. Slightly lighter color (wood-700 at 80%) 
                to create depth hierarchy.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Highlight Lines: 1-2px</h4>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-cyan-200 rounded-lg border-4 border-cyan-800 relative">
                <div className="absolute top-2 left-2 w-8 h-1 bg-white rounded"></div>
              </div>
              <p className="text-sm text-slate-600">
                Specular highlights, magical glow edges. Often white or portal-200 for magical elements. 
                Subtle and only on key features.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900 mb-2">Export Guidelines</p>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Always use crisp pixel edges (no anti-aliasing on outlines)</li>
              <li>Export at 2x resolution minimum for Retina displays</li>
              <li>SVG format preferred for UI illustrations, PNG for game sprites</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Shading Technique */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Shading & Lighting Technique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Cell Shading (2-3 Values)</h4>
            <p className="text-sm text-slate-600 mb-3">
              Use flat color blocks instead of gradients. Each surface should have a base color, one shadow tone, 
              and optionally one highlight. This keeps things pixel-art inspired while remaining scalable.
            </p>
            <div className="flex gap-4">
              <div className="space-y-2">
                <div className="w-20 h-20 bg-amber-400 rounded-lg"></div>
                <p className="text-xs text-center text-slate-600">Base</p>
              </div>
              <div className="space-y-2">
                <div className="w-20 h-20 bg-amber-600 rounded-lg"></div>
                <p className="text-xs text-center text-slate-600">Shadow</p>
              </div>
              <div className="space-y-2">
                <div className="w-20 h-20 bg-amber-200 rounded-lg"></div>
                <p className="text-xs text-center text-slate-600">Highlight</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Light Direction</h4>
            <p className="text-sm text-slate-600 mb-3">
              Consistent top-left light source (45° angle). Shadows fall to bottom-right. This matches user 
              expectations from classic pixel games and creates comfortable depth.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Shadow Rules</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Hard-edged shadows, no blurs (except magical portal effects)</li>
              <li>Shadow color = base color darkened 30-40%, slightly desaturated</li>
              <li>Ground shadows: soft circular blobs at 30% opacity, wood-900</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Texture & Detail */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Texture & Surface Detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Wood Grain</h4>
            <p className="text-sm text-slate-600 mb-2">
              2px horizontal lines in slightly darker tone. Spacing: 4-6px apart. Indicates wooden surfaces 
              (buildings, signs, fences).
            </p>
            <div className="w-full h-20 bg-amber-600 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 flex flex-col justify-around">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-0.5 bg-amber-800 opacity-40"></div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Stone/Brick Texture</h4>
            <p className="text-sm text-slate-600 mb-2">
              Rectangular blocks with 2px divider lines. Offset every other row for brick pattern. 
              Use for building foundations, paths.
            </p>
            <div className="w-full h-20 bg-slate-400 rounded-lg relative overflow-hidden grid grid-cols-4 gap-0.5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-slate-500 border border-slate-600"></div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Magical/Portal Effects</h4>
            <p className="text-sm text-slate-600 mb-2">
              ONLY exception to hard-edge rule. Portal glow uses 8-16px blur, portal-300 color at 40% opacity. 
              Sparkle particles are 2x2px squares in white or portal-200.
            </p>
            <div className="w-full h-20 bg-slate-800 rounded-lg relative overflow-hidden flex items-center justify-center">
              <div className="w-16 h-16 bg-cyan-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="absolute w-1 h-1 bg-white rounded-full top-4 left-8 animate-pulse"></div>
              <div className="absolute w-1 h-1 bg-white rounded-full bottom-6 right-12 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-600">
            <p className="text-sm font-semibold text-slate-900 mb-1">⚠️ Texture Sparingly</p>
            <p className="text-sm text-slate-600">
              Don't over-texture. Most surfaces should be flat color + cell shading. Add texture only to key 
              surfaces for visual interest (major buildings, ground).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Proportions */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Proportions & Scale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Character to Building Ratio</h4>
            <p className="text-sm text-slate-600 mb-3">
              Characters are roughly 1/4 to 1/3 the height of a single-story building. This creates comfortable 
              "chibi" proportions while maintaining architectural believability.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Silhouette Clarity</h4>
            <p className="text-sm text-slate-600 mb-2">
              All illustrations should read clearly as solid black silhouettes. If the silhouette is confusing, 
              simplify the form.
            </p>
            <div className="flex gap-4 items-end">
              <div className="w-16 h-24 bg-slate-900 rounded-t-full"></div>
              <div className="w-20 h-32 bg-slate-900 rounded-lg"></div>
              <div className="w-12 h-16 bg-slate-900 rounded-full"></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Character, building, and prop silhouettes should be instantly recognizable
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Pixel Grid Alignment</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>All major elements snap to 4px grid</li>
              <li>Small details can use 2px grid</li>
              <li>Maintains crispness and consistent visual rhythm</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Background Depth */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Background Depth & Layers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Three-Layer System</h4>
            <div className="space-y-3">
              <div className="p-3 bg-sky-100 rounded border-2 border-sky-300">
                <p className="font-semibold text-sm text-slate-900">Far Background (Sky/Mountains)</p>
                <p className="text-xs text-slate-600">
                  Desaturated, lighter values, minimal detail. 60-70% opacity. Creates atmosphere.
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded border-2 border-green-400">
                <p className="font-semibold text-sm text-slate-900">Mid-ground (Buildings/Props)</p>
                <p className="text-xs text-slate-600">
                  Full saturation, complete detail. Primary action layer. 100% opacity.
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded border-2 border-amber-400">
                <p className="font-semibold text-sm text-slate-900">Foreground (Ground/Grass)</p>
                <p className="text-xs text-slate-600">
                  Slightly darker, grounded. Provides base. Occasional foreground elements at 100% opacity.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Atmospheric Perspective</h4>
            <p className="text-sm text-slate-600">
              Objects further away: less saturation, lighter value, less contrast, less detail. 
              This creates natural depth without complex 3D rendering.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Style Checklist */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Illustration Quality Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              'Outlines are 3-4px with consistent color (wood-800)',
              'Cell shading uses 2-3 flat color values maximum',
              'Light source is consistent (top-left 45°)',
              'Silhouette reads clearly in solid black',
              'Elements snap to 4px or 2px grid',
              'Textures are used sparingly and purposefully',
              'Color palette uses only approved brand colors',
              'Magic effects have appropriate glow (portal colors only)',
              'Background depth follows 3-layer system',
              'No gradients except magical portal effects',
            ].map((item, i) => (
              <label key={i} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm text-slate-700">{item}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
