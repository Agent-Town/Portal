import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, X } from 'lucide-react';

export default function LogoDirection() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Logo Concept Philosophy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-4">
            The Agent Town logo should feel welcoming, frontier-inspired, and subtly magical. It must work at tiny sizes 
            (16px favicon) and large hero placements. The identity balances rustic charm with modern clarity.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>Scalable</Badge>
            <Badge>Memorable</Badge>
            <Badge>Frontier-Inspired</Badge>
            <Badge>Human + Agent Friendly</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Logo Option 1 - Recommended */}
      <Card className="bg-white/80 backdrop-blur border-2 border-green-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Option 1: Sheriff Star Portal (Recommended)</CardTitle>
            <Badge className="bg-green-600">Primary</Badge>
          </div>
          <CardDescription>Combines frontier (star badge) with magic (portal glow)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Icon Mark */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Icon Mark</h4>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 bg-gradient-to-br from-amber-100 to-cyan-100 rounded-2xl flex items-center justify-center border-4 border-amber-600">
                <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-2xl animate-pulse"></div>
                <span className="text-6xl relative z-10">⭐</span>
              </div>
              <div>
                <p className="text-sm text-slate-700 mb-2">
                  A golden sheriff star with a subtle cyan/portal glow. The star is chunky and pixel-art inspired 
                  with clean edges for scalability.
                </p>
                <p className="text-xs text-slate-500 font-mono">star-500 fill, portal-300 glow, 3px stroke</p>
              </div>
            </div>
          </div>

          {/* Wordmark */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Wordmark</h4>
            <div className="space-y-3">
              <div className="text-5xl font-bold text-slate-900 tracking-tight">AGENT TOWN</div>
              <p className="text-sm text-slate-600">
                Inter Bold, slight letter spacing (-0.02em), all caps for strong presence. Can be used with or 
                without icon mark.
              </p>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <span className="text-3xl">⭐</span>
                <span className="text-3xl font-bold text-slate-900">AGENT TOWN</span>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Usage Scenarios</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Full lockup (icon + wordmark): Hero banners, splash screens</li>
              <li>Icon only: Favicon, social media avatars, app icons, tight spaces</li>
              <li>Wordmark only: Headers, footer, merchandise</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Logo Option 2 */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Option 2: Town Gate Portal</CardTitle>
          <CardDescription>Architectural approach with portal archway</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-gradient-to-br from-amber-100 to-cyan-100 rounded-2xl flex items-center justify-center border-4 border-amber-600">
              <div className="text-4xl">🏛️</div>
            </div>
            <div>
              <p className="text-sm text-slate-700 mb-2">
                An arched gateway with magical portal swirl inside. More illustrative, emphasizes the "town" aspect. 
                Works well for immersive branding.
              </p>
              <p className="text-xs text-slate-500">Pros: Unique, story-driven | Cons: More complex at small sizes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Option 3 */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Option 3: Sheriff Hat Mascot</CardTitle>
          <CardDescription>Character-forward with the red sheriff mascot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-amber-100 rounded-2xl flex items-center justify-center border-4 border-red-600">
              <div className="text-5xl">🦞</div>
            </div>
            <div>
              <p className="text-sm text-slate-700 mb-2">
                Simplified red crustacean sheriff head with star badge hat. Very friendly and memorable, but may feel 
                too playful for technical audiences.
              </p>
              <p className="text-xs text-slate-500">Pros: Extremely friendly | Cons: May limit brand perception</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clear Space & Minimum Size */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Clear Space & Minimum Sizes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Clear Space Rule</h4>
            <p className="text-slate-600 mb-4">
              Maintain clear space around logo equal to the height of the star's top point (approx 0.5x logo height). 
              No text, graphics, or other elements should enter this zone.
            </p>
            <div className="inline-block p-8 border-4 border-dashed border-amber-300 rounded-lg bg-amber-50">
              <div className="p-4 bg-white rounded-lg">
                <span className="text-4xl">⭐</span>
                <span className="text-2xl font-bold ml-2">AGENT TOWN</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Dashed line shows minimum clear space zone</p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Minimum Sizes</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-slate-600">Full Lockup:</div>
                <div className="text-sm text-slate-700">
                  120px wide minimum (digital) | 1 inch wide (print)
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-slate-600">Icon Only:</div>
                <div className="text-sm text-slate-700">
                  16px × 16px minimum (favicon) | 32px × 32px recommended (UI)
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm text-slate-600">Wordmark:</div>
                <div className="text-sm text-slate-700">
                  80px wide minimum
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Do's and Don'ts */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Logo Do's and Don'ts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Do's */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Check className="text-green-600" />
                <h4 className="font-semibold text-slate-900">Do</h4>
              </div>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="text-green-600 shrink-0 mt-0.5" size={16} />
                  <span>Use on solid backgrounds with sufficient contrast</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-600 shrink-0 mt-0.5" size={16} />
                  <span>Scale proportionally maintaining aspect ratio</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-600 shrink-0 mt-0.5" size={16} />
                  <span>Use approved color variations (full color, white, black)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-600 shrink-0 mt-0.5" size={16} />
                  <span>Maintain clear space requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-600 shrink-0 mt-0.5" size={16} />
                  <span>Use high-resolution files for all applications</span>
                </li>
              </ul>
            </div>

            {/* Don'ts */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <X className="text-red-600" />
                <h4 className="font-semibold text-slate-900">Don't</h4>
              </div>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <X className="text-red-600 shrink-0 mt-0.5" size={16} />
                  <span>Rotate, skew, or distort the logo</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="text-red-600 shrink-0 mt-0.5" size={16} />
                  <span>Change logo colors outside approved palette</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="text-red-600 shrink-0 mt-0.5" size={16} />
                  <span>Add effects (shadows, glows, gradients) to wordmark</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="text-red-600 shrink-0 mt-0.5" size={16} />
                  <span>Rearrange icon and wordmark relationship</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="text-red-600 shrink-0 mt-0.5" size={16} />
                  <span>Use on busy backgrounds without protective container</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Variations */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Approved Color Variations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-6 bg-white border-2 border-slate-200 rounded-lg text-center">
              <div className="text-5xl mb-2">⭐</div>
              <div className="text-xl font-bold">AGENT TOWN</div>
              <p className="text-xs text-slate-500 mt-2">Full Color (Primary)</p>
            </div>
            <div className="p-6 bg-slate-900 rounded-lg text-center">
              <div className="text-5xl mb-2">⭐</div>
              <div className="text-xl font-bold text-white">AGENT TOWN</div>
              <p className="text-xs text-slate-400 mt-2">White (Dark Backgrounds)</p>
            </div>
            <div className="p-6 bg-slate-100 rounded-lg text-center">
              <div className="text-5xl mb-2 grayscale">⭐</div>
              <div className="text-xl font-bold text-slate-900">AGENT TOWN</div>
              <p className="text-xs text-slate-500 mt-2">Monochrome (Single Color)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
