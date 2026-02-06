import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function ColorSystem() {
  const colors = {
    primary: {
      name: 'Sky Blue',
      description: 'Primary brand color - clear, open, welcoming frontier sky',
      variants: [
        { name: 'sky-50', hex: '#E6F4FF', usage: 'Backgrounds, very subtle highlights' },
        { name: 'sky-100', hex: '#B3DFFF', usage: 'Light backgrounds' },
        { name: 'sky-200', hex: '#80CAFF', usage: 'Hover states' },
        { name: 'sky-300', hex: '#6BB8E5', usage: 'Interactive elements' },
        { name: 'sky-400', hex: '#5BA8D5', usage: 'Secondary actions' },
        { name: 'sky-500', hex: '#5B9BD5', usage: 'Primary actions, headers' },
        { name: 'sky-600', hex: '#4A8DC7', usage: 'Primary hover' },
        { name: 'sky-700', hex: '#3D7DAB', usage: 'Primary active' },
        { name: 'sky-800', hex: '#2F5E82', usage: 'Dark text on light backgrounds' },
        { name: 'sky-900', hex: '#2C4563', usage: 'Darkest accents, borders' },
      ],
    },
    secondary: {
      name: 'Sunset Coral',
      description: 'Secondary brand color - warm, inviting, energetic',
      variants: [
        { name: 'coral-50', hex: '#FFE6D9', usage: 'Backgrounds' },
        { name: 'coral-100', hex: '#FFCCB3', usage: 'Light backgrounds' },
        { name: 'coral-200', hex: '#FFB28C', usage: 'Hover states' },
        { name: 'coral-300', hex: '#FF9B7C', usage: 'Interactive elements' },
        { name: 'coral-400', hex: '#FF8A66', usage: 'Secondary actions' },
        { name: 'coral-500', hex: '#FF9B7C', usage: 'Accents, CTAs, highlights' },
        { name: 'coral-600', hex: '#E87A5F', usage: 'Hover' },
        { name: 'coral-700', hex: '#D25E43', usage: 'Active' },
        { name: 'coral-800', hex: '#B54530', usage: 'Dark text' },
        { name: 'coral-900', hex: '#8A2F1C', usage: 'Darkest' },
      ],
    },
    accent: {
      name: 'Golden Hour',
      description: 'Accent color - warm gold, achievement stars, special moments',
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
      name: 'Warm Cream',
      description: 'Neutral palette - cozy, readable backgrounds',
      variants: [
        { name: 'cream-50', hex: '#FFFAF5', usage: 'Page backgrounds' },
        { name: 'cream-100', hex: '#FFF4E0', usage: 'Card backgrounds' },
        { name: 'cream-200', hex: '#FFECC7', usage: 'Borders' },
        { name: 'cream-300', hex: '#FFE3AD', usage: 'Dividers' },
        { name: 'cream-400', hex: '#FFD994', usage: 'Placeholder text' },
        { name: 'cream-500', hex: '#F5D085', usage: 'Secondary text' },
        { name: 'cream-600', hex: '#E0BC70', usage: 'Body text' },
        { name: 'cream-700', hex: '#CCA85B', usage: 'Headings' },
        { name: 'cream-800', hex: '#B89446', usage: 'Primary text' },
        { name: 'cream-900', hex: '#A38031', usage: 'Dark' },
      ],
    },
    environment: {
      name: 'Natural Elements',
      description: 'Supporting colors for variety and depth',
      variants: [
        { name: 'sage', hex: '#8FBC8F', usage: 'Nature elements, plants' },
        { name: 'lavender', hex: '#A78BFA', usage: 'Magic, portals, special' },
        { name: 'clay', hex: '#C97A63', usage: 'Earth tones, grounding' },
        { name: 'mint', hex: '#98D8C8', usage: 'Fresh accents' },
      ],
    },
    semantic: {
      name: 'Semantic Colors',
      description: 'Feedback and status colors',
      variants: [
        { name: 'success', hex: '#6BB36B', usage: 'Success messages, checkmarks' },
        { name: 'warning', hex: '#FFD95A', usage: 'Warnings, cautions' },
        { name: 'error', hex: '#E63946', usage: 'Errors, destructive actions' },
        { name: 'info', hex: '#5B9BD5', usage: 'Information, tips' },
      ],
    },
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[#FFF4E0] border-4 border-[#2C4563] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#5B9BD5]">
          <CardTitle className="text-[#2C4563] flex items-center gap-2">
            <span className="text-[#FFD95A]">★</span> Color Philosophy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-[#2C4563] mb-4 text-sm leading-relaxed">
            Agent Town's color system is inspired by frontier towns at golden hour: warm sky blues, peachy sunset corals, 
            and soft golden light. The palette balances open, welcoming sky tones with warm, cozy accents that make 
            everyone feel at home.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#5B9BD5] text-white border-2 border-[#4A8DC7] text-xs">Open & Welcoming</Badge>
            <Badge className="bg-[#FF9B7C] text-white border-2 border-[#E87A5F] text-xs">Warm & Cozy</Badge>
            <Badge className="bg-[#FFD95A] text-[#2C4563] border-2 border-[#E5C14A] text-xs">Magical Accents</Badge>
            <Badge className="bg-[#2C4563] text-white border-2 border-[#1A2D3F] text-xs">High Contrast</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Primary Colors - Sky Blue */}
      <Card className="bg-[#E6F4FF] border-4 border-[#5B9BD5] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#80CAFF]">
          <CardTitle className="text-[#2C4563]">{colors.primary.name}</CardTitle>
          <CardDescription className="text-xs text-[#3D7DAB]">{colors.primary.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {colors.primary.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-16 rounded border-2 border-[#2C4563] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#2C4563]">{variant.name}</p>
                  <p className="font-mono text-xs text-[#3D7DAB]">{variant.hex}</p>
                  <p className="text-xs text-[#2C4563] mt-1">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#FFF4E0] border-2 border-[#5B9BD5] rounded">
            <p className="font-mono text-sm text-[#2C4563]">
              CSS Variable: <code className="bg-[#2C4563] text-[#5B9BD5] px-2 py-1 rounded text-xs">--color-sky-[weight]</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Colors - Sunset Coral */}
      <Card className="bg-[#FFE6D9] border-4 border-[#FF9B7C] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#FFB28C]">
          <CardTitle className="text-[#2C4563]">{colors.secondary.name}</CardTitle>
          <CardDescription className="text-xs text-[#8A2F1C]">{colors.secondary.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {colors.secondary.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-16 rounded border-2 border-[#2C4563] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#2C4563]">{variant.name}</p>
                  <p className="font-mono text-xs text-[#8A2F1C]">{variant.hex}</p>
                  <p className="text-xs text-[#2C4563] mt-1">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#FFF4E0] border-2 border-[#FF9B7C] rounded">
            <p className="font-mono text-sm text-[#2C4563]">
              CSS Variable: <code className="bg-[#2C4563] text-[#FF9B7C] px-2 py-1 rounded text-xs">--color-coral-[weight]</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Accent Colors - Golden Hour */}
      <Card className="bg-[#FFF9E6] border-4 border-[#FFD95A] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#FFE466]">
          <CardTitle className="text-[#2C4563]">{colors.accent.name}</CardTitle>
          <CardDescription className="text-xs text-[#99761A]">{colors.accent.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {colors.accent.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-16 rounded border-2 border-[#2C4563] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#2C4563]">{variant.name}</p>
                  <p className="font-mono text-xs text-[#99761A]">{variant.hex}</p>
                  <p className="text-xs text-[#2C4563] mt-1">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#FFF4E0] border-2 border-[#FFD95A] rounded">
            <p className="font-mono text-sm text-[#2C4563]">
              CSS Variable: <code className="bg-[#2C4563] text-[#FFD95A] px-2 py-1 rounded text-xs">--color-gold-[weight]</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Neutral & Environment Colors */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#FFF4E0] border-4 border-[#CCA85B] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
          <CardHeader className="border-b-4 border-[#FFECC7]">
            <CardTitle className="text-[#2C4563]">{colors.neutral.name}</CardTitle>
            <CardDescription className="text-xs text-[#A38031]">{colors.neutral.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-3">
              {colors.neutral.variants.map((variant) => (
                <div key={variant.name} className="space-y-2">
                  <div
                    className="h-12 rounded border-2 border-[#2C4563] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                    style={{ backgroundColor: variant.hex }}
                  />
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#2C4563]">{variant.name}</p>
                    <p className="text-xs text-[#2C4563]">{variant.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FFF4E0] border-4 border-[#2C4563] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
          <CardHeader className="border-b-4 border-[#5B9BD5]">
            <CardTitle className="text-[#2C4563]">{colors.environment.name}</CardTitle>
            <CardDescription className="text-xs text-[#3D7DAB]">{colors.environment.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-3">
              {colors.environment.variants.map((variant) => (
                <div key={variant.name} className="space-y-2">
                  <div
                    className="h-12 rounded border-2 border-[#2C4563] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                    style={{ backgroundColor: variant.hex }}
                  />
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#2C4563]">{variant.name}</p>
                    <p className="text-xs text-[#2C4563]">{variant.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Semantic Colors */}
      <Card className="bg-[#FFF4E0] border-4 border-[#2C4563] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#5B9BD5]">
          <CardTitle className="text-[#2C4563]">{colors.semantic.name}</CardTitle>
          <CardDescription className="text-xs text-[#3D7DAB]">{colors.semantic.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {colors.semantic.variants.map((variant) => (
              <div key={variant.name} className="space-y-2">
                <div
                  className="h-12 rounded border-2 border-[#2C4563] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                  style={{ backgroundColor: variant.hex }}
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-[#2C4563]">{variant.name}</p>
                  <p className="text-xs text-[#2C4563]">{variant.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Rules */}
      <Card className="bg-[#FFF4E0] border-4 border-[#2C4563] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#5B9BD5]">
          <CardTitle className="text-[#2C4563]">Color Usage Rules</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="p-3 bg-[#E6F4FF] border-2 border-[#5B9BD5] rounded">
              <h4 className="font-semibold text-[#2C4563] mb-2 text-sm">Primary (Sky Blue)</h4>
              <ul className="list-disc list-inside space-y-1 text-[#2C4563] text-xs leading-relaxed">
                <li>Use for headers, primary navigation, and main structural elements</li>
                <li>Creates sense of openness and trust</li>
                <li>Reserve sky-500 for the most prominent UI elements</li>
              </ul>
            </div>
            <div className="p-3 bg-[#FFE6D9] border-2 border-[#FF9B7C] rounded">
              <h4 className="font-semibold text-[#2C4563] mb-2 text-sm">Secondary (Sunset Coral)</h4>
              <ul className="list-disc list-inside space-y-1 text-[#2C4563] text-xs leading-relaxed">
                <li>Use for CTAs, highlights, and warm accents</li>
                <li>Energizing without being aggressive</li>
                <li>Great for hover states and interactive feedback</li>
              </ul>
            </div>
            <div className="p-3 bg-[#FFF9E6] border-2 border-[#FFD95A] rounded">
              <h4 className="font-semibold text-[#2C4563] mb-2 text-sm">Accent (Golden Hour)</h4>
              <ul className="list-disc list-inside space-y-1 text-[#2C4563] text-xs leading-relaxed">
                <li>Use for stars, badges, achievements, and special moments</li>
                <li>Sparingly to maintain special quality</li>
                <li>Works perfectly with both sky blue and coral</li>
              </ul>
            </div>
            <div className="p-3 bg-[#FFFAF5] border-2 border-[#CCA85B] rounded">
              <h4 className="font-semibold text-[#2C4563] mb-2 text-sm">Contrast Requirements</h4>
              <ul className="list-disc list-inside space-y-1 text-[#2C4563] text-xs leading-relaxed">
                <li>Body text: minimum 4.5:1 contrast ratio (WCAG AA)</li>
                <li>Large text: minimum 3:1 contrast ratio</li>
                <li>UI components: minimum 3:1 against adjacent colors</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
