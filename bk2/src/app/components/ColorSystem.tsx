import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function ColorSystem() {
  const colors = {
    primary: {
      name: 'Canyon Blue',
      description: 'Primary brand color - deep desert sky, vast and open',
      variants: [
        { name: 'canyon-50', hex: '#E8F4FF', usage: 'Backgrounds, very subtle highlights' },
        { name: 'canyon-100', hex: '#D0E8FF', usage: 'Light backgrounds' },
        { name: 'canyon-200', hex: '#A3CFED', usage: 'Hover states' },
        { name: 'canyon-300', hex: '#85BDE5', usage: 'Interactive elements' },
        { name: 'canyon-400', hex: '#6BA3D0', usage: 'Secondary actions' },
        { name: 'canyon-500', hex: '#6BA3D0', usage: 'Primary actions, headers, sky' },
        { name: 'canyon-600', hex: '#5890B8', usage: 'Primary hover' },
        { name: 'canyon-700', hex: '#467BA0', usage: 'Primary active' },
        { name: 'canyon-800', hex: '#356688', usage: 'Dark text on light backgrounds' },
        { name: 'canyon-900', hex: '#245170', usage: 'Darkest accents' },
      ],
    },
    secondary: {
      name: 'Desert Sand',
      description: 'Secondary brand color - warm, sandy, inviting',
      variants: [
        { name: 'sand-50', hex: '#FFF8E8', usage: 'Backgrounds' },
        { name: 'sand-100', hex: '#FFEFD0', usage: 'Light backgrounds' },
        { name: 'sand-200', hex: '#FFD4A0', usage: 'Hover states' },
        { name: 'sand-300', hex: '#F4A460', usage: 'Interactive elements' },
        { name: 'sand-400', hex: '#E89650', usage: 'Secondary actions' },
        { name: 'sand-500', hex: '#F4A460', usage: 'Accents, warmth, CTAs' },
        { name: 'sand-600', hex: '#D48A40', usage: 'Hover' },
        { name: 'sand-700', hex: '#B47030', usage: 'Active' },
        { name: 'sand-800', hex: '#945620', usage: 'Dark text' },
        { name: 'sand-900', hex: '#743C10', usage: 'Darkest' },
      ],
    },
    accent: {
      name: 'Golden Star',
      description: 'Accent color - sheriff stars, achievements, special moments',
      variants: [
        { name: 'gold-50', hex: '#FFF9E6', usage: 'Light backgrounds' },
        { name: 'gold-100', hex: '#FFF2CC', usage: 'Subtle highlights' },
        { name: 'gold-200', hex: '#FFEB99', usage: 'Hover states' },
        { name: 'gold-300', hex: '#FFE466', usage: 'Interactive' },
        { name: 'gold-400', hex: '#FFDC4D', usage: 'Attention' },
        { name: 'gold-500', hex: '#FFD95A', usage: 'Stars, badges, highlights' },
        { name: 'gold-600', hex: '#E5C14A', usage: 'Hover' },
        { name: 'gold-700', hex: '#CCA83A', usage: 'Active' },
        { name: 'gold-800', hex: '#B38F2A', usage: 'Dark accents' },
        { name: 'gold-900', hex: '#99761A', usage: 'Darkest' },
      ],
    },
    neutral: {
      name: 'Adobe Cream',
      description: 'Neutral palette - warm adobe, earthen backgrounds',
      variants: [
        { name: 'adobe-50', hex: '#FFF8F0', usage: 'Page backgrounds' },
        { name: 'adobe-100', hex: '#FAEBD7', usage: 'Card backgrounds' },
        { name: 'adobe-200', hex: '#F0DFC7', usage: 'Borders' },
        { name: 'adobe-300', hex: '#E5D3B7', usage: 'Dividers' },
        { name: 'adobe-400', hex: '#D4C0A0', usage: 'Placeholder text' },
        { name: 'adobe-500', hex: '#C0AC90', usage: 'Secondary text' },
        { name: 'adobe-600', hex: '#A89378', usage: 'Body text' },
        { name: 'adobe-700', hex: '#8B7355', usage: 'Headings' },
        { name: 'adobe-800', hex: '#6E5840', usage: 'Primary text' },
        { name: 'adobe-900', hex: '#5D4E37', usage: 'Mesa brown, darkest' },
      ],
    },
    environment: {
      name: 'Natural Elements',
      description: 'Desert frontier colors - sage, clay, terracotta',
      variants: [
        { name: 'sage', hex: '#8FBC8F', usage: 'Cactus, plants, subtle green' },
        { name: 'terracotta', hex: '#D2691E', usage: 'Clay pots, warm earth' },
        { name: 'mesa', hex: '#CD853F', usage: 'Rock formations' },
        { name: 'dust', hex: '#D2B48C', usage: 'Desert dust, roads' },
      ],
    },
    semantic: {
      name: 'Semantic Colors',
      description: 'Feedback and status colors',
      variants: [
        { name: 'success', hex: '#8FBC8F', usage: 'Success messages, checkmarks' },
        { name: 'warning', hex: '#FFD95A', usage: 'Warnings, cautions' },
        { name: 'error', hex: '#D2691E', usage: 'Errors, destructive actions' },
        { name: 'info', hex: '#6BA3D0', usage: 'Information, tips' },
      ],
    },
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[#FAEBD7] border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#F4A460]">
          <CardTitle className="text-[#5D4E37] flex items-center gap-2">
            <span className="text-[#FFD95A]">★</span> Desert Sky Color Philosophy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-[#5D4E37] mb-4 text-sm leading-relaxed">
            Agent Town's Desert Sky palette captures the classic western frontier: big blue skies, warm sandy earth, 
            and golden sunlight. This color system balances open, expansive canyon blues with cozy adobe warmth and 
            touches of sage green for life in the desert.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#6BA3D0] text-white border-2 border-[#5890B8] text-xs">Open & Vast</Badge>
            <Badge className="bg-[#F4A460] text-white border-2 border-[#D48A40] text-xs">Warm & Cozy</Badge>
            <Badge className="bg-[#FFD95A] text-[#5D4E37] border-2 border-[#E5C14A] text-xs">Golden Moments</Badge>
            <Badge className="bg-[#5D4E37] text-white border-2 border-[#4A3B28] text-xs">Desert Grounded</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Primary Colors - Canyon Blue */}
      <Card className="bg-[#E8F4FF] border-4 border-[#6BA3D0] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#A3CFED]">
          <CardTitle className="text-[#5D4E37]">{colors.primary.name}</CardTitle>
          <CardDescription className="text-xs text-[#245170]">{colors.primary.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {colors.primary.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-16 rounded border-2 border-[#5D4E37] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#5D4E37]">{variant.name}</p>
                  <p className="font-mono text-xs text-[#245170]">{variant.hex}</p>
                  <p className="text-xs text-[#5D4E37] mt-1">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#FAEBD7] border-2 border-[#6BA3D0] rounded">
            <p className="font-mono text-sm text-[#5D4E37]">
              CSS Variable: <code className="bg-[#5D4E37] text-[#6BA3D0] px-2 py-1 rounded text-xs">--color-canyon-[weight]</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Colors - Desert Sand */}
      <Card className="bg-[#FFF8E8] border-4 border-[#F4A460] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#FFD4A0]">
          <CardTitle className="text-[#5D4E37]">{colors.secondary.name}</CardTitle>
          <CardDescription className="text-xs text-[#743C10]">{colors.secondary.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {colors.secondary.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-16 rounded border-2 border-[#5D4E37] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#5D4E37]">{variant.name}</p>
                  <p className="font-mono text-xs text-[#743C10]">{variant.hex}</p>
                  <p className="text-xs text-[#5D4E37] mt-1">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#FAEBD7] border-2 border-[#F4A460] rounded">
            <p className="font-mono text-sm text-[#5D4E37]">
              CSS Variable: <code className="bg-[#5D4E37] text-[#F4A460] px-2 py-1 rounded text-xs">--color-sand-[weight]</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Accent Colors - Golden Star */}
      <Card className="bg-[#FFF9E6] border-4 border-[#FFD95A] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#FFE466]">
          <CardTitle className="text-[#5D4E37]">{colors.accent.name}</CardTitle>
          <CardDescription className="text-xs text-[#99761A]">{colors.accent.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {colors.accent.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-16 rounded border-2 border-[#5D4E37] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#5D4E37]">{variant.name}</p>
                  <p className="font-mono text-xs text-[#99761A]">{variant.hex}</p>
                  <p className="text-xs text-[#5D4E37] mt-1">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#FAEBD7] border-2 border-[#FFD95A] rounded">
            <p className="font-mono text-sm text-[#5D4E37]">
              CSS Variable: <code className="bg-[#5D4E37] text-[#FFD95A] px-2 py-1 rounded text-xs">--color-gold-[weight]</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Neutral & Environment Colors */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#FAEBD7] border-4 border-[#8B7355] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
          <CardHeader className="border-b-4 border-[#D4C0A0]">
            <CardTitle className="text-[#5D4E37]">{colors.neutral.name}</CardTitle>
            <CardDescription className="text-xs text-[#6E5840]">{colors.neutral.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-3">
              {colors.neutral.variants.map((variant) => (
                <div key={variant.name} className="space-y-2">
                  <div
                    className="h-12 rounded border-2 border-[#5D4E37] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                    style={{ backgroundColor: variant.hex }}
                  />
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#5D4E37]">{variant.name}</p>
                    <p className="text-xs text-[#5D4E37]">{variant.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FAEBD7] border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
          <CardHeader className="border-b-4 border-[#F4A460]">
            <CardTitle className="text-[#5D4E37]">{colors.environment.name}</CardTitle>
            <CardDescription className="text-xs text-[#8B7355]">{colors.environment.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-3">
              {colors.environment.variants.map((variant) => (
                <div key={variant.name} className="space-y-2">
                  <div
                    className="h-12 rounded border-2 border-[#5D4E37] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                    style={{ backgroundColor: variant.hex }}
                  />
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#5D4E37]">{variant.name}</p>
                    <p className="text-xs text-[#5D4E37]">{variant.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Semantic Colors */}
      <Card className="bg-[#FAEBD7] border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#F4A460]">
          <CardTitle className="text-[#5D4E37]">{colors.semantic.name}</CardTitle>
          <CardDescription className="text-xs text-[#8B7355]">{colors.semantic.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {colors.semantic.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-12 rounded border-2 border-[#5D4E37] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#5D4E37]">{variant.name}</p>
                  <p className="text-xs text-[#5D4E37]">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Rules */}
      <Card className="bg-[#FAEBD7] border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#F4A460]">
          <CardTitle className="text-[#5D4E37]">Color Usage Rules</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="p-3 bg-[#E8F4FF] border-2 border-[#6BA3D0] rounded">
              <h4 className="font-semibold text-[#5D4E37] mb-2 text-sm">Primary (Canyon Blue)</h4>
              <ul className="list-disc list-inside space-y-1 text-[#5D4E37] text-xs leading-relaxed">
                <li>Use for headers, navigation, and sky-related elements</li>
                <li>Creates sense of openness and western expansiveness</li>
                <li>Reserve canyon-500 for main structural elements</li>
              </ul>
            </div>
            <div className="p-3 bg-[#FFF8E8] border-2 border-[#F4A460] rounded">
              <h4 className="font-semibold text-[#5D4E37] mb-2 text-sm">Secondary (Desert Sand)</h4>
              <ul className="list-disc list-inside space-y-1 text-[#5D4E37] text-xs leading-relaxed">
                <li>Use for CTAs, warm accents, and earth-toned elements</li>
                <li>Balances cool sky blues with warm desert feel</li>
                <li>Great for hover states and inviting interactions</li>
              </ul>
            </div>
            <div className="p-3 bg-[#FFF9E6] border-2 border-[#FFD95A] rounded">
              <h4 className="font-semibold text-[#5D4E37] mb-2 text-sm">Accent (Golden Star)</h4>
              <ul className="list-disc list-inside space-y-1 text-[#5D4E37] text-xs leading-relaxed">
                <li>Reserved for sheriff stars, badges, and achievements</li>
                <li>Use sparingly to maintain special quality</li>
                <li>Works with both canyon blue and desert sand</li>
              </ul>
            </div>
            <div className="p-3 bg-[#FFF8F0] border-2 border-[#8B7355] rounded">
              <h4 className="font-semibold text-[#5D4E37] mb-2 text-sm">Contrast Requirements</h4>
              <ul className="list-disc list-inside space-y-1 text-[#5D4E37] text-xs leading-relaxed">
                <li>Body text: minimum 4.5:1 contrast ratio (WCAG AA)</li>
                <li>Large text: minimum 3:1 contrast ratio</li>
                <li>Use mesa brown (#5D4E37) for text on light backgrounds</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
