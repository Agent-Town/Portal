import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, X, AlertCircle } from 'lucide-react';

export default function AccessibilityChecks() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Accessibility Philosophy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-4">
            Agent Town is welcoming to all players. Accessibility isn't a nice-to-have—it's core to our brand promise. 
            We design for a wide range of abilities, ensure WCAG AA compliance minimum, and test with real users.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-600">WCAG AA Compliant</Badge>
            <Badge>Screen Reader Friendly</Badge>
            <Badge>Color Blind Safe</Badge>
            <Badge>Keyboard Navigable</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contrast Targets */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Color Contrast Targets</CardTitle>
          <CardDescription>WCAG 2.1 Level AA Standards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Check className="text-green-600" />
              Body Text (16px and below)
            </h4>
            <p className="text-sm text-slate-600 mb-3">
              <span className="font-semibold">Minimum Contrast Ratio:</span> 4.5:1
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base" style={{ color: '#332819' }}>wood-800 on white</span>
                  <Badge className="bg-green-600">9.2:1 ✓</Badge>
                </div>
                <p className="text-xs text-slate-500">Body text, descriptions</p>
              </div>
              <div className="bg-slate-100 p-3 rounded border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base" style={{ color: '#1A140D' }}>wood-900 on wood-100</span>
                  <Badge className="bg-green-600">12.1:1 ✓</Badge>
                </div>
                <p className="text-xs text-slate-500">High emphasis text</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Check className="text-green-600" />
              Large Text (18px+ or 14px+ bold)
            </h4>
            <p className="text-sm text-slate-600 mb-3">
              <span className="font-semibold">Minimum Contrast Ratio:</span> 3:1
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-500 p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl text-white font-semibold">White on star-500</span>
                  <Badge className="bg-green-600">5.8:1 ✓</Badge>
                </div>
                <p className="text-xs text-white/80">Primary buttons</p>
              </div>
              <div className="bg-cyan-500 p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl text-white font-semibold">White on portal-500</span>
                  <Badge className="bg-green-600">3.9:1 ✓</Badge>
                </div>
                <p className="text-xs text-white/80">Portal actions</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-600">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <X className="text-red-600" />
              UI Components & Graphics
            </h4>
            <p className="text-sm text-slate-600 mb-3">
              <span className="font-semibold">Minimum Contrast Ratio:</span> 3:1 against adjacent colors
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <p>✓ Buttons have 3:1 contrast with background</p>
              <p>✓ Form inputs have visible borders (not just background color difference)</p>
              <p>✓ Focus indicators have 3:1 contrast</p>
              <p>✓ Icon-only buttons include visible boundary or background</p>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-lg">
            <p className="font-semibold mb-2">🧰 Testing Tools</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>WebAIM Contrast Checker: <code className="text-green-400">webaim.org/resources/contrastchecker/</code></li>
              <li>Chrome DevTools: Lighthouse accessibility audit</li>
              <li>Figma: Stark plugin for real-time contrast checking</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Color Blind Safe */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Color Blind Safe Combinations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Safe Color Pairings</h4>
            <p className="text-sm text-slate-600 mb-3">
              Tested with deuteranopia (red-green), protanopia (red-green), and tritanopia (blue-yellow) simulators.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded border-2 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="text-green-600" size={16} />
                  <span className="font-semibold text-sm text-slate-900">✓ Safe</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <div className="w-12 h-12 bg-amber-500 rounded"></div>
                  <div className="w-12 h-12 bg-cyan-500 rounded"></div>
                </div>
                <p className="text-xs text-slate-600">star-500 + portal-500</p>
              </div>

              <div className="p-3 bg-slate-50 rounded border-2 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="text-green-600" size={16} />
                  <span className="font-semibold text-sm text-slate-900">✓ Safe</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <div className="w-12 h-12 bg-slate-900 rounded"></div>
                  <div className="w-12 h-12 bg-white border-2 border-slate-300 rounded"></div>
                </div>
                <p className="text-xs text-slate-600">wood-900 + white</p>
              </div>

              <div className="p-3 bg-slate-50 rounded border-2 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="text-green-600" size={16} />
                  <span className="font-semibold text-sm text-slate-900">✓ Safe</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <div className="w-12 h-12 bg-red-600 rounded"></div>
                  <div className="w-12 h-12 bg-amber-400 rounded"></div>
                </div>
                <p className="text-xs text-slate-600">red-600 + star-400</p>
              </div>

              <div className="p-3 bg-slate-50 rounded border-2 border-red-500">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-red-600" size={16} />
                  <span className="font-semibold text-sm text-slate-900">⚠ Use with icons</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <div className="w-12 h-12 bg-green-600 rounded"></div>
                  <div className="w-12 h-12 bg-red-600 rounded"></div>
                </div>
                <p className="text-xs text-slate-600">success + error (add icons)</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Never Rely on Color Alone</h4>
            <p className="text-sm text-slate-600 mb-3">
              Always pair color with additional visual cues: icons, patterns, text labels, or position.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="text-green-600" />
                  <p className="font-semibold text-sm text-slate-900">✓ Good: Color + Icon</p>
                </div>
                <div className="flex items-center gap-2 p-2 bg-green-100 rounded">
                  <Check className="text-green-700" size={16} />
                  <span className="text-sm text-green-900">Action successful</span>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-600">
                <div className="flex items-center gap-2 mb-2">
                  <X className="text-red-600" />
                  <p className="font-semibold text-sm text-slate-900">✗ Bad: Color Only</p>
                </div>
                <div className="p-2 bg-green-100 rounded">
                  <span className="text-sm text-green-900">Action successful</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-lg">
            <p className="font-semibold mb-2">🧰 Testing Tools</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Color Oracle: Free color blindness simulator (colororacle.org)</li>
              <li>Figma: Color Blind plugin</li>
              <li>Chrome: Rendering &gt; Emulate vision deficiencies</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Text Size */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Minimum Text Sizes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-600">
              <p className="font-semibold text-sm text-slate-900 mb-1">✓ Body Text Minimum: 16px (1rem)</p>
              <p className="text-sm text-slate-600">
                Default body text should be 16px or larger. Never go below 14px for any text users need to read.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
              <p className="font-semibold text-sm text-slate-900 mb-1">⚠ Small Text Minimum: 12px (0.75rem)</p>
              <p className="text-sm text-slate-600">
                Captions, timestamps, metadata. Use sparingly. Must have high contrast (7:1+).
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-600">
              <p className="font-semibold text-sm text-slate-900 mb-1">✗ Never Below 12px</p>
              <p className="text-sm text-slate-600">
                No text below 12px, ever. If it feels too small, it probably is.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Line Height Guidelines</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Body text: 1.5-1.6 line height (24-26px for 16px text)</li>
              <li>Large text/headings: 1.2-1.3 line height</li>
              <li>Paragraph spacing: 1.5-2em between paragraphs</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Line Length (Measure)</h4>
            <p className="text-sm text-slate-600 mb-2">
              Optimal: 50-75 characters per line (approximately 600-900px at 16px).
              Long lines (100+ characters) are harder to read.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Navigation */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Keyboard Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Focus Indicators</h4>
            <p className="text-sm text-slate-600 mb-3">
              All interactive elements must have a visible focus state for keyboard users.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-600">
                <p className="font-semibold text-sm text-slate-900 mb-2">✓ Good Focus State</p>
                <button className="px-4 py-2 bg-amber-500 text-white rounded-lg ring-4 ring-cyan-400">
                  Focused Button
                </button>
                <p className="text-xs text-slate-600 mt-2">
                  4px ring, high-contrast color (cyan-400), 2px offset
                </p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border-2 border-red-600">
                <p className="font-semibold text-sm text-slate-900 mb-2">✗ Poor Focus State</p>
                <button className="px-4 py-2 bg-amber-500 text-white rounded-lg outline outline-1 outline-amber-600">
                  Focused Button
                </button>
                <p className="text-xs text-slate-600 mt-2">
                  Thin outline, low contrast, barely visible
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Tab Order</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Logical flow: left-to-right, top-to-bottom</li>
              <li>Skip navigation links for long pages</li>
              <li>Modals trap focus (can't tab out until closed)</li>
              <li>No keyboard traps (user can always escape with ESC or Tab)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Keyboard Shortcuts</h4>
            <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-sm font-mono">
              <p><kbd className="px-2 py-1 bg-slate-200 rounded">Tab</kbd> - Navigate forward</p>
              <p><kbd className="px-2 py-1 bg-slate-200 rounded">Shift+Tab</kbd> - Navigate backward</p>
              <p><kbd className="px-2 py-1 bg-slate-200 rounded">Enter/Space</kbd> - Activate button/link</p>
              <p><kbd className="px-2 py-1 bg-slate-200 rounded">Esc</kbd> - Close modal/dismiss overlay</p>
              <p><kbd className="px-2 py-1 bg-slate-200 rounded">Arrow Keys</kbd> - Navigate lists/menus</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screen Reader Support */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Screen Reader Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Semantic HTML</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Use proper heading hierarchy (H1 → H2 → H3, no skipping)</li>
              <li>Use &lt;button&gt; for buttons, &lt;a&gt; for links</li>
              <li>Use &lt;nav&gt;, &lt;main&gt;, &lt;aside&gt;, &lt;footer&gt; landmarks</li>
              <li>Form inputs have associated &lt;label&gt; elements</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">ARIA Labels</h4>
            <div className="p-4 bg-slate-900 rounded-lg">
              <pre className="text-green-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
{`<!-- Icon-only button needs label -->
<button aria-label="Close chat panel">
  ✕
</button>

<!-- Decorative images should be hidden -->
<img src="decoration.png" alt="" aria-hidden="true">

<!-- Status messages -->
<div role="status" aria-live="polite">
  Achievement unlocked!
</div>

<!-- Loading state -->
<button aria-busy="true" aria-label="Loading...">
  <span class="spinner"></span>
</button>`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Alt Text Guidelines</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Descriptive alt text for meaningful images</li>
              <li>Empty alt="" for purely decorative images</li>
              <li>Character images: "Sheriff Clawson, a friendly red crustacean wearing a brown hat"</li>
              <li>UI icons: Describe the action, not the icon ("Close", not "X icon")</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Checklist */}
      <Card className="bg-white/80 backdrop-blur border-2 border-green-500">
        <CardHeader>
          <CardTitle>Complete Accessibility Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              'All text has 4.5:1 contrast minimum (3:1 for large text)',
              'UI components have 3:1 contrast with adjacent elements',
              'Color is never the only way to convey information',
              'Design tested with color blind simulators',
              'No text below 12px',
              'Body text is 16px or larger',
              'All interactive elements have visible focus indicators',
              'Tab order is logical and complete',
              'Keyboard users can access all functionality',
              'ESC key closes modals and dismisses overlays',
              'All images have appropriate alt text',
              'Icon-only buttons have aria-labels',
              'Proper heading hierarchy (no skipped levels)',
              'Form inputs have associated labels',
              'ARIA live regions for dynamic content updates',
              'Modals trap focus and return focus on close',
              'Skip navigation link for long pages',
              'Animations respect prefers-reduced-motion',
              'Zoom to 200% doesn\'t break layout',
              'Tested with screen reader (NVDA, JAWS, or VoiceOver)',
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
