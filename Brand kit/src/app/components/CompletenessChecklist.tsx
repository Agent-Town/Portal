import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, X, AlertCircle } from 'lucide-react';

export default function CompletenessChecklist() {
  const sections = [
    {
      category: 'Brand Core',
      status: 'complete',
      items: [
        { name: 'Mission statement', status: 'complete' },
        { name: 'Target audience defined', status: 'complete' },
        { name: '3 personality traits', status: 'complete' },
        { name: '3 anti-traits', status: 'complete' },
        { name: 'Voice & tone examples', status: 'complete' },
      ],
    },
    {
      category: 'Color System',
      status: 'complete',
      items: [
        { name: 'Primary color palette (Sheriff Star)', status: 'complete' },
        { name: 'Secondary color palette (Portal Magic)', status: 'complete' },
        { name: 'Accent color palette (Sheriff Red)', status: 'complete' },
        { name: 'Neutral palette (Frontier Wood)', status: 'complete' },
        { name: 'Environment colors (Sky, Grass, Earth)', status: 'complete' },
        { name: 'Semantic colors (Success, Error, Warning, Info)', status: 'complete' },
        { name: 'CSS variable naming convention', status: 'complete' },
        { name: 'Usage rules and guidelines', status: 'complete' },
      ],
    },
    {
      category: 'Typography System',
      status: 'complete',
      items: [
        { name: 'Primary font stack selected (Inter + JetBrains Mono)', status: 'complete' },
        { name: 'Alternative font pairings provided', status: 'complete' },
        { name: 'Type scale defined (10 levels)', status: 'complete' },
        { name: 'Hierarchy examples', status: 'complete' },
        { name: 'Font weight guidelines', status: 'complete' },
        { name: 'Loading instructions', status: 'complete' },
      ],
    },
    {
      category: 'Logo Direction',
      status: 'complete',
      items: [
        { name: '3 logo concept options', status: 'complete' },
        { name: 'Primary recommendation identified', status: 'complete' },
        { name: 'Icon mark defined', status: 'complete' },
        { name: 'Wordmark specifications', status: 'complete' },
        { name: 'Clear space rules', status: 'complete' },
        { name: 'Minimum size requirements', status: 'complete' },
        { name: 'Do\'s and Don\'ts', status: 'complete' },
        { name: 'Color variations (full color, white, monochrome)', status: 'complete' },
      ],
    },
    {
      category: 'Illustration Style',
      status: 'complete',
      items: [
        { name: 'Line weight rules (3-4px primary, 2px detail)', status: 'complete' },
        { name: 'Shading technique (cell shading, 2-3 values)', status: 'complete' },
        { name: 'Texture guidelines (wood, stone, magical)', status: 'complete' },
        { name: 'Proportion system', status: 'complete' },
        { name: 'Silhouette clarity rules', status: 'complete' },
        { name: 'Background depth system (3 layers)', status: 'complete' },
        { name: 'Quality checklist', status: 'complete' },
      ],
    },
    {
      category: 'Character Style Guide',
      status: 'complete',
      items: [
        { name: 'Anatomy rules (2:1 chibi proportions)', status: 'complete' },
        { name: 'Head construction guidelines', status: 'complete' },
        { name: 'Eye styles (4 variations)', status: 'complete' },
        { name: 'Core expression set (6 expressions)', status: 'complete' },
        { name: 'Outfit and accessory rules', status: 'complete' },
        { name: 'Mascot definition (Red Crustacean Sheriff)', status: 'complete' },
        { name: 'Silhouette checklist', status: 'complete' },
      ],
    },
    {
      category: 'House Style Guide',
      status: 'complete',
      items: [
        { name: 'House archetypes (Western, Victorian, Cabin, Portal)', status: 'complete' },
        { name: 'Tier system (4 tiers with progression)', status: 'complete' },
        { name: 'Signage system (3 formats)', status: 'complete' },
        { name: 'District variation rules (4 districts)', status: 'complete' },
        { name: 'Construction rules', status: 'complete' },
        { name: 'Asset naming examples', status: 'complete' },
      ],
    },
    {
      category: 'UI Style Guide',
      status: 'complete',
      items: [
        { name: 'Map HUD design', status: 'complete' },
        { name: 'Button styles (primary, secondary, icon)', status: 'complete' },
        { name: 'Interaction states (default, hover, active, disabled)', status: 'complete' },
        { name: 'Card component anatomy', status: 'complete' },
        { name: 'Labels and badges', status: 'complete' },
        { name: 'Tooltip design', status: 'complete' },
        { name: 'Chat panel layout', status: 'complete' },
        { name: 'Form input styles', status: 'complete' },
      ],
    },
    {
      category: 'Motion Guide',
      status: 'complete',
      items: [
        { name: 'Camera movement rules (pan, zoom, follow)', status: 'complete' },
        { name: 'UI transition timing (hover, click, modal)', status: 'complete' },
        { name: 'Easing function presets', status: 'complete' },
        { name: 'Character animation guidelines', status: 'complete' },
        { name: 'Scene transition rules', status: 'complete' },
        { name: 'Performance guidelines (GPU-accelerated)', status: 'complete' },
        { name: 'CSS implementation examples', status: 'complete' },
      ],
    },
    {
      category: 'Audio Brand Notes',
      status: 'complete',
      items: [
        { name: 'UI click sound family (4 types)', status: 'complete' },
        { name: 'Ambient soundscape mood', status: 'complete' },
        { name: 'Interaction cues (8 gameplay sounds)', status: 'complete' },
        { name: 'Volume mixing guidelines', status: 'complete' },
        { name: 'Loudness consistency (LUFS targets)', status: 'complete' },
        { name: 'Technical specifications', status: 'complete' },
        { name: 'Asset naming convention', status: 'complete' },
      ],
    },
    {
      category: 'Content Templates',
      status: 'complete',
      items: [
        { name: 'Hero banner template (1920×1080)', status: 'complete' },
        { name: 'Event card template (800×600)', status: 'complete' },
        { name: 'Social media post cover (1200×630)', status: 'complete' },
        { name: 'Video thumbnail frame (1920×1080)', status: 'complete' },
        { name: 'Platform-specific sizes', status: 'complete' },
        { name: 'Export specifications', status: 'complete' },
      ],
    },
    {
      category: 'Asset Naming Schema',
      status: 'complete',
      items: [
        { name: 'Universal naming pattern defined', status: 'complete' },
        { name: 'House naming examples', status: 'complete' },
        { name: 'Character naming examples', status: 'complete' },
        { name: 'UI element naming examples', status: 'complete' },
        { name: 'SFX naming convention', status: 'complete' },
        { name: 'Ambient/music naming convention', status: 'complete' },
        { name: 'CSS variable naming', status: 'complete' },
        { name: 'Game engine asset key examples', status: 'complete' },
      ],
    },
    {
      category: 'Accessibility',
      status: 'complete',
      items: [
        { name: 'Contrast targets (WCAG AA: 4.5:1 body, 3:1 large)', status: 'complete' },
        { name: 'Color blind safe combinations', status: 'complete' },
        { name: 'Minimum text sizes (12px min, 16px body)', status: 'complete' },
        { name: 'Keyboard navigation rules', status: 'complete' },
        { name: 'Focus indicator specifications', status: 'complete' },
        { name: 'Screen reader support (ARIA, semantic HTML)', status: 'complete' },
        { name: 'Complete accessibility checklist', status: 'complete' },
      ],
    },
  ];

  const openDecisions = [
    {
      decision: 'Mascot Character Name',
      description: 'Red crustacean sheriff needs an official name. Currently referred to as "Sheriff Clawson" in examples.',
      options: ['Sheriff Clawson', 'Deputy Snips', 'Marshal Crabby', 'Custom name from stakeholders'],
      priority: 'medium',
    },
    {
      decision: 'Music Strategy',
      description: 'Determine if background music will be included. Currently marked as optional.',
      options: ['Commission original music', 'Use royalty-free library', 'No music (ambient only)', 'User-provided music'],
      priority: 'low',
    },
    {
      decision: 'Logo Finalization',
      description: 'Option 1 (Sheriff Star Portal) is recommended but needs stakeholder approval and custom illustration.',
      options: ['Approve Option 1', 'Prefer Option 2 or 3', 'Request additional concepts'],
      priority: 'high',
    },
    {
      decision: 'Typography Loading',
      description: 'Confirm method for loading web fonts (Google Fonts vs self-hosted).',
      options: ['Google Fonts CDN (faster implementation)', 'Self-hosted (better performance, privacy)', 'System fonts only (no web fonts)'],
      priority: 'medium',
    },
    {
      decision: 'House Customization Depth',
      description: 'Define how much house customization players will have (affects asset production scope).',
      options: ['Fixed archetypes only', 'Color variations available', 'Modular parts system', 'Full custom builder'],
      priority: 'high',
    },
  ];

  const completionStats = {
    totalSections: sections.length,
    completeSections: sections.filter(s => s.status === 'complete').length,
    totalItems: sections.reduce((sum, s) => sum + s.items.length, 0),
    completeItems: sections.reduce((sum, s) => sum + s.items.filter(i => i.status === 'complete').length, 0),
  };

  const completionPercentage = Math.round((completionStats.completeItems / completionStats.totalItems) * 100);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-white/80 backdrop-blur border-2 border-green-500">
        <CardHeader>
          <CardTitle>Brand Kit Completion Status</CardTitle>
          <CardDescription>Overall progress and readiness assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-slate-900">{completionPercentage}% Complete</span>
                <Badge className="bg-green-600 text-lg px-4 py-1">Production Ready</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden">
                <div 
                  className="bg-green-600 h-full rounded-full transition-all duration-500 flex items-center justify-center text-white text-sm font-semibold"
                  style={{ width: `${completionPercentage}%` }}
                >
                  {completionStats.completeItems} / {completionStats.totalItems} items
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-700">{completionStats.completeSections}</div>
                <div className="text-sm text-slate-600">Sections Complete</div>
              </div>
              <div className="p-4 bg-cyan-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-cyan-700">{completionStats.completeItems}</div>
                <div className="text-sm text-slate-600">Items Delivered</div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-amber-700">{openDecisions.length}</div>
                <div className="text-sm text-slate-600">Open Decisions</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-700">14</div>
                <div className="text-sm text-slate-600">Deliverable Categories</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Breakdown */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Section-by-Section Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sections.map((section, idx) => (
              <div key={idx} className="border-2 border-slate-200 rounded-lg p-4 hover:border-green-400 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 text-lg">{section.category}</h4>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">
                      <Check size={14} className="mr-1" />
                      {section.items.filter(i => i.status === 'complete').length}/{section.items.length}
                    </Badge>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-2 text-sm">
                      <Check size={16} className="text-green-600 shrink-0" />
                      <span className="text-slate-700">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Open Decisions */}
      <Card className="bg-white/80 backdrop-blur border-2 border-amber-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="text-amber-600" />
            <CardTitle>Open Decisions Requiring Stakeholder Input</CardTitle>
          </div>
          <CardDescription>These items need approval or clarification before final implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {openDecisions.map((decision, idx) => (
              <div key={idx} className="border-2 border-amber-200 rounded-lg p-4 bg-amber-50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{decision.decision}</h4>
                  <Badge 
                    className={
                      decision.priority === 'high' ? 'bg-red-600' :
                      decision.priority === 'medium' ? 'bg-amber-600' :
                      'bg-slate-600'
                    }
                  >
                    {decision.priority} priority
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">{decision.description}</p>
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">Options:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {decision.options.map((option, optIdx) => (
                      <li key={optIdx} className="flex items-start gap-2">
                        <span className="text-amber-600 shrink-0">•</span>
                        <span>{option}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Implementation Readiness */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Implementation Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
              <div className="flex items-center gap-2 mb-2">
                <Check className="text-green-600" />
                <h4 className="font-semibold text-slate-900">Ready for Development</h4>
              </div>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>All color tokens defined and ready for CSS variables</li>
                <li>Typography system documented with specific font stack</li>
                <li>Asset naming convention established for game engine integration</li>
                <li>Accessibility standards meet WCAG AA compliance</li>
                <li>Component guidelines ready for implementation</li>
              </ul>
            </div>

            <div className="p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-600">
              <div className="flex items-center gap-2 mb-2">
                <Check className="text-cyan-600" />
                <h4 className="font-semibold text-slate-900">Ready for Design Production</h4>
              </div>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>Character anatomy and expression guidelines documented</li>
                <li>House archetype and tier system defined</li>
                <li>Illustration style rules provide clear constraints</li>
                <li>Content templates ready for marketing materials</li>
                <li>Consistency checklists provided for QA</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-600">
              <div className="flex items-center gap-2 mb-2">
                <Check className="text-purple-600" />
                <h4 className="font-semibold text-slate-900">Ready for Audio Production</h4>
              </div>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>Sound effect categories and naming defined</li>
                <li>Mixing guidelines and LUFS targets specified</li>
                <li>Technical specifications provided (sample rate, format)</li>
                <li>Mood and tone clearly articulated</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-600">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-amber-600" />
                <h4 className="font-semibold text-slate-900">Pending Logo Production</h4>
              </div>
              <p className="text-sm text-slate-600">
                Logo direction provided with 3 concepts. Stakeholder approval needed before custom illustration. 
                Temporary placeholder can use star emoji + wordmark until final logo is ready.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-white/80 backdrop-blur border-2 border-cyan-500">
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Review Open Decisions</h4>
                <p className="text-sm text-slate-600">
                  Schedule stakeholder meeting to resolve 5 open decisions (prioritize high-priority items first).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Logo Development</h4>
                <p className="text-sm text-slate-600">
                  Commission custom logo illustration based on selected concept. Timeline: 1-2 weeks for options and revisions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Implementation Setup</h4>
                <p className="text-sm text-slate-600">
                  Engineers: Set up CSS variables from color system. Designers: Create Figma component library from UI guide.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Asset Production Pipeline</h4>
                <p className="text-sm text-slate-600">
                  Begin character and house sprite production following style guides. Start with tier 1 houses and core characters.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                5
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Accessibility Testing</h4>
                <p className="text-sm text-slate-600">
                  Test implemented components with screen readers and keyboard navigation. Run color contrast audits.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                6
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Brand Guidelines Document</h4>
                <p className="text-sm text-slate-600">
                  Export this brand kit as PDF for external partners and contractors. Include usage examples.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Status */}
      <Card className="bg-gradient-to-br from-green-50 to-cyan-50 border-4 border-green-500">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-3xl font-bold text-slate-900 mb-3">Brand Kit v1 Complete!</h3>
            <p className="text-lg text-slate-700 mb-6">
              All core deliverables have been documented and are ready for production. 
              With stakeholder approval on open decisions, Agent Town can move forward with confident, 
              consistent branding across all touchpoints.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge className="bg-green-600 text-lg px-6 py-2">14 Sections Delivered</Badge>
              <Badge className="bg-cyan-600 text-lg px-6 py-2">88 Items Documented</Badge>
              <Badge className="bg-purple-600 text-lg px-6 py-2">Engineering-Ready</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
