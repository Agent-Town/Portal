import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function ColorSystem() {
  const colors = {
    primary: {
      name: 'Portal Purple',
      description: 'Primary brand color - deep magical portal energy',
      variants: [
        { name: 'portal-50', hex: '#F5F3FF', usage: 'Lightest backgrounds' },
        { name: 'portal-100', hex: '#EDE9FE', usage: 'Light backgrounds' },
        { name: 'portal-200', hex: '#DDD6FE', usage: 'Subtle highlights' },
        { name: 'portal-300', hex: '#C4B5FD', usage: 'Hover states' },
        { name: 'portal-400', hex: '#A78BFA', usage: 'Interactive elements' },
        { name: 'portal-500', hex: '#8B5CF6', usage: 'Primary actions, portals' },
        { name: 'portal-600', hex: '#7C3AED', usage: 'Primary hover' },
        { name: 'portal-700', hex: '#6D28D9', usage: 'Primary active' },
        { name: 'portal-800', hex: '#5B21B6', usage: 'Deep magic' },
        { name: 'portal-900', hex: '#4C1D95', usage: 'Darkest portal' },
      ],
    },
    secondary: {
      name: 'Neon Cyan',
      description: 'Secondary brand color - electric AI energy, tech glow',
      variants: [
        { name: 'cyan-50', hex: '#ECFEFF', usage: 'Backgrounds' },
        { name: 'cyan-100', hex: '#CFFAFE', usage: 'Light backgrounds' },
        { name: 'cyan-200', hex: '#A5F3FC', usage: 'Hover states' },
        { name: 'cyan-300', hex: '#67E8F9', usage: 'Interactive elements' },
        { name: 'cyan-400', hex: '#22D3EE', usage: 'Secondary actions' },
        { name: 'cyan-500', hex: '#06B6D4', usage: 'Tech highlights, energy' },
        { name: 'cyan-600', hex: '#0891B2', usage: 'Hover' },
        { name: 'cyan-700', hex: '#0E7490', usage: 'Active' },
        { name: 'cyan-800', hex: '#155E75', usage: 'Dark tech' },
        { name: 'cyan-900', hex: '#164E63', usage: 'Darkest' },
      ],
    },
    accent: {
      name: 'Cosmic Pink',
      description: 'Accent color - magical bursts, energy, excitement',
      variants: [
        { name: 'pink-50', hex: '#FDF2F8', usage: 'Light backgrounds' },
        { name: 'pink-100', hex: '#FCE7F3', usage: 'Subtle highlights' },
        { name: 'pink-200', hex: '#FBCFE8', usage: 'Hover states' },
        { name: 'pink-300', hex: '#F9A8D4', usage: 'Interactive' },
        { name: 'pink-400', hex: '#F472B6', usage: 'Attention' },
        { name: 'pink-500', hex: '#EC4899', usage: 'Magic bursts, special moments' },
        { name: 'pink-600', hex: '#DB2777', usage: 'Hover' },
        { name: 'pink-700', hex: '#BE185D', usage: 'Active' },
        { name: 'pink-800', hex: '#9D174D', usage: 'Dark accents' },
        { name: 'pink-900', hex: '#831843', usage: 'Darkest' },
      ],
    },
    neutral: {
      name: 'Star Silver',
      description: 'Neutral palette - light cosmic backgrounds',
      variants: [
        { name: 'star-50', hex: '#FAFAFA', usage: 'Brightest white' },
        { name: 'star-100', hex: '#F0F0FF', usage: 'Card backgrounds' },
        { name: 'star-200', hex: '#E5E5FF', usage: 'Borders' },
        { name: 'star-300', hex: '#D4D4FF', usage: 'Dividers' },
        { name: 'star-400', hex: '#C0C0F0', usage: 'Placeholder text' },
        { name: 'star-500', hex: '#A0A0D8', usage: 'Secondary text' },
        { name: 'star-600', hex: '#8080C0', usage: 'Body text' },
        { name: 'star-700', hex: '#6060A8', usage: 'Headings' },
        { name: 'star-800', hex: '#484890', usage: 'Primary text' },
        { name: 'star-900', hex: '#312E81', usage: 'Deep space borders' },
      ],
    },
    void: {
      name: 'Void Depths',
      description: 'Dark cosmic backgrounds - mystery and depth',
      variants: [
        { name: 'void-50', hex: '#4C4A6F', usage: 'Lightest dark' },
        { name: 'void-100', hex: '#3F3D5E', usage: 'Dark backgrounds' },
        { name: 'void-200', hex: '#34325C', usage: 'Deep panels' },
        { name: 'void-300', hex: '#312E81', usage: 'Primary dark, borders' },
        { name: 'void-400', hex: '#2A2757', usage: 'Darker elements' },
        { name: 'void-500', hex: '#1E1B4B', usage: 'Main background' },
        { name: 'void-600', hex: '#1A1840', usage: 'Deeper void' },
        { name: 'void-700', hex: '#151335', usage: 'Darkest panels' },
        { name: 'void-800', hex: '#0F0D25', usage: 'Near black' },
        { name: 'void-900', hex: '#0A0818', usage: 'Pure void' },
      ],
    },
    semantic: {
      name: 'Semantic Colors',
      description: 'Feedback and status colors',
      variants: [
        { name: 'success', hex: '#10B981', usage: 'Success messages, checkmarks' },
        { name: 'warning', hex: '#FFD95A', usage: 'Warnings, cautions' },
        { name: 'error', hex: '#DC2626', usage: 'Errors, destructive actions' },
        { name: 'info', hex: '#06B6D4', usage: 'Information, tips' },
      ],
    },
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[#F0F0FF] border-4 border-[#312E81] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] shadow-[0_0_15px_rgba(139,92,246,0.3)]">
        <CardHeader className="border-b-4 border-[#8B5CF6] bg-gradient-to-r from-[#8B5CF6]/10 to-[#06B6D4]/10">
          <CardTitle className="text-[#1E1B4B] flex items-center gap-2">
            <span className="text-[#8B5CF6]">✨</span> Portal Frontier Color Philosophy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-[#1E1B4B] mb-4 text-sm leading-relaxed">
            Agent Town's Portal Frontier palette captures the magic of stepping through dimensions: deep purple portal 
            energy, electric cyan tech glow, and cosmic pink magical bursts. This system balances mysterious void darkness 
            with bright, welcoming energy particles that light the way forward.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#8B5CF6] text-white border-2 border-[#7C3AED] text-xs shadow-[0_0_8px_rgba(139,92,246,0.4)]">Magical & Mysterious</Badge>
            <Badge className="bg-[#06B6D4] text-white border-2 border-[#0891B2] text-xs shadow-[0_0_8px_rgba(6,182,212,0.4)]">Electric Energy</Badge>
            <Badge className="bg-[#EC4899] text-white border-2 border-[#DB2777] text-xs shadow-[0_0_8px_rgba(236,72,153,0.4)]">Cosmic Bursts</Badge>
            <Badge className="bg-[#1E1B4B] text-white border-2 border-[#312E81] text-xs">Deep Space</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Primary Colors - Portal Purple */}
      <Card className="bg-[#EDE9FE] border-4 border-[#8B5CF6] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] shadow-[0_0_15px_rgba(139,92,246,0.3)]">
        <CardHeader className="border-b-4 border-[#C4B5FD]">
          <CardTitle className="text-[#1E1B4B]">{colors.primary.name}</CardTitle>
          <CardDescription className="text-xs text-[#4C1D95]">{colors.primary.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {colors.primary.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-16 rounded border-2 border-[#312E81] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#1E1B4B]">{variant.name}</p>
                  <p className="font-mono text-xs text-[#4C1D95]">{variant.hex}</p>
                  <p className="text-xs text-[#312E81] mt-1">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#F0F0FF] border-2 border-[#8B5CF6] rounded shadow-[0_0_8px_rgba(139,92,246,0.2)]">
            <p className="font-mono text-sm text-[#1E1B4B]">
              CSS Variable: <code className="bg-[#1E1B4B] text-[#8B5CF6] px-2 py-1 rounded text-xs">--color-portal-[weight]</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Colors - Neon Cyan */}
      <Card className="bg-[#ECFEFF] border-4 border-[#06B6D4] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] shadow-[0_0_15px_rgba(6,182,212,0.3)]">
        <CardHeader className="border-b-4 border-[#67E8F9]">
          <CardTitle className="text-[#1E1B4B]">{colors.secondary.name}</CardTitle>
          <CardDescription className="text-xs text-[#164E63]">{colors.secondary.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {colors.secondary.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-16 rounded border-2 border-[#312E81] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#1E1B4B]">{variant.name}</p>
                  <p className="font-mono text-xs text-[#164E63]">{variant.hex}</p>
                  <p className="text-xs text-[#312E81] mt-1">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#F0F0FF] border-2 border-[#06B6D4] rounded shadow-[0_0_8px_rgba(6,182,212,0.2)]">
            <p className="font-mono text-sm text-[#1E1B4B]">
              CSS Variable: <code className="bg-[#1E1B4B] text-[#06B6D4] px-2 py-1 rounded text-xs">--color-cyan-[weight]</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Accent Colors - Cosmic Pink */}
      <Card className="bg-[#FDF2F8] border-4 border-[#EC4899] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] shadow-[0_0_15px_rgba(236,72,153,0.3)]">
        <CardHeader className="border-b-4 border-[#F9A8D4]">
          <CardTitle className="text-[#1E1B4B]">{colors.accent.name}</CardTitle>
          <CardDescription className="text-xs text-[#831843]">{colors.accent.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {colors.accent.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-16 rounded border-2 border-[#312E81] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#1E1B4B]">{variant.name}</p>
                  <p className="font-mono text-xs text-[#831843]">{variant.hex}</p>
                  <p className="text-xs text-[#312E81] mt-1">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#F0F0FF] border-2 border-[#EC4899] rounded shadow-[0_0_8px_rgba(236,72,153,0.2)]">
            <p className="font-mono text-sm text-[#1E1B4B]">
              CSS Variable: <code className="bg-[#1E1B4B] text-[#EC4899] px-2 py-1 rounded text-xs">--color-pink-[weight]</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Neutral & Void Colors */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#F0F0FF] border-4 border-[#312E81] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          <CardHeader className="border-b-4 border-[#D4D4FF]">
            <CardTitle className="text-[#1E1B4B]">{colors.neutral.name}</CardTitle>
            <CardDescription className="text-xs text-[#484890]">{colors.neutral.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-3">
              {colors.neutral.variants.map((variant) => (
                <div key={variant.name} className="space-y-2">
                  <div
                    className="h-12 rounded border-2 border-[#312E81] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                    style={{ backgroundColor: variant.hex }}
                  />
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#1E1B4B]">{variant.name}</p>
                    <p className="text-xs text-[#312E81]">{variant.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1B4B] border-4 border-[#8B5CF6] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] shadow-[0_0_15px_rgba(139,92,246,0.4)]">
          <CardHeader className="border-b-4 border-[#312E81]">
            <CardTitle className="text-[#F0F0FF]">{colors.void.name}</CardTitle>
            <CardDescription className="text-xs text-[#D4D4FF]">{colors.void.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-3">
              {colors.void.variants.map((variant) => (
                <div key={variant.name} className="space-y-2">
                  <div
                    className="h-12 rounded border-2 border-[#8B5CF6] shadow-[2px_2px_0px_0px_rgba(139,92,246,0.3)]"
                    style={{ backgroundColor: variant.hex }}
                  />
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#F0F0FF]">{variant.name}</p>
                    <p className="text-xs text-[#D4D4FF]">{variant.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Semantic Colors */}
      <Card className="bg-[#F0F0FF] border-4 border-[#312E81] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] shadow-[0_0_15px_rgba(139,92,246,0.2)]">
        <CardHeader className="border-b-4 border-[#8B5CF6]">
          <CardTitle className="text-[#1E1B4B]">{colors.semantic.name}</CardTitle>
          <CardDescription className="text-xs text-[#312E81]">{colors.semantic.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {colors.semantic.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-12 rounded border-2 border-[#312E81] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#1E1B4B]">{variant.name}</p>
                  <p className="text-xs text-[#312E81]">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Rules */}
      <Card className="bg-[#F0F0FF] border-4 border-[#312E81] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] shadow-[0_0_15px_rgba(139,92,246,0.2)]">
        <CardHeader className="border-b-4 border-[#8B5CF6]">
          <CardTitle className="text-[#1E1B4B]">Color Usage Rules</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="p-3 bg-[#E0E7FF] border-2 border-[#8B5CF6] rounded shadow-[0_0_8px_rgba(139,92,246,0.2)]">
              <h4 className="font-semibold text-[#1E1B4B] mb-2 text-sm">Primary (Portal Purple)</h4>
              <ul className="list-disc list-inside space-y-1 text-[#1E1B4B] text-xs leading-relaxed">
                <li>Use for main interactive elements, portals, and magical effects</li>
                <li>Creates sense of mystery and possibility</li>
                <li>Can be used with glowing shadow effects for extra magic</li>
              </ul>
            </div>
            <div className="p-3 bg-[#DBEAFE] border-2 border-[#06B6D4] rounded shadow-[0_0_8px_rgba(6,182,212,0.2)]">
              <h4 className="font-semibold text-[#1E1B4B] mb-2 text-sm">Secondary (Neon Cyan)</h4>
              <ul className="list-disc list-inside space-y-1 text-[#1E1B4B] text-xs leading-relaxed">
                <li>Use for AI/tech elements, energy indicators, and active states</li>
                <li>Represents technology and futuristic aspects</li>
                <li>Perfect for glowing borders and hover effects</li>
              </ul>
            </div>
            <div className="p-3 bg-[#FCE7F3] border-2 border-[#EC4899] rounded shadow-[0_0_8px_rgba(236,72,153,0.2)]">
              <h4 className="font-semibold text-[#1E1B4B] mb-2 text-sm">Accent (Cosmic Pink)</h4>
              <ul className="list-disc list-inside space-y-1 text-[#1E1B4B] text-xs leading-relaxed">
                <li>Reserved for special moments, achievements, and energy bursts</li>
                <li>Use sparingly for maximum impact</li>
                <li>Great for particle effects and magical sparkles</li>
              </ul>
            </div>
            <div className="p-3 bg-[#F5F5FF] border-2 border-[#312E81] rounded">
              <h4 className="font-semibold text-[#1E1B4B] mb-2 text-sm">Contrast & Glow Effects</h4>
              <ul className="list-disc list-inside space-y-1 text-[#1E1B4B] text-xs leading-relaxed">
                <li>Use void-500 (#1E1B4B) for main backgrounds</li>
                <li>Add box-shadow glows to enhance magical feeling</li>
                <li>Maintain 4.5:1 contrast ratio minimum for text</li>
                <li>Light text works better on dark void backgrounds</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
