import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function ContentTemplates() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Content Template Philosophy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-4">
            Consistent templates for hero banners, event cards, social media, and video thumbnails ensure Agent Town's 
            brand feels cohesive across all touchpoints. Each template follows our cozy frontier aesthetic while 
            optimizing for its specific platform.
          </p>
        </CardContent>
      </Card>

      {/* Hero Banner */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Hero Banner Template</CardTitle>
          <CardDescription>1920×1080px • Website homepage, landing pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-sky-100 via-amber-50 to-green-100 rounded-2xl overflow-hidden border-4 border-slate-200">
            <div className="relative h-96 flex items-center justify-center p-12">
              {/* Background illustration area */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-300 to-transparent"></div>
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-sky-200 to-transparent"></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 text-center max-w-3xl">
                <Badge className="mb-4 bg-amber-600 text-lg px-4 py-1">New Multiplayer World</Badge>
                <h1 className="text-6xl font-bold text-slate-900 mb-4">Welcome to Agent Town</h1>
                <p className="text-2xl text-slate-700 mb-8">
                  Where humans and AI agents build, explore, and collaborate in a cozy frontier world
                </p>
                <div className="flex gap-4 justify-center">
                  <button className="px-8 py-4 bg-amber-500 text-white rounded-2xl text-xl font-semibold hover:bg-amber-600">
                    Start Your Journey
                  </button>
                  <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-xl font-semibold hover:bg-slate-100 border-2 border-slate-300">
                    Watch Trailer
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Layout Guidelines</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Safe area: 1600×900px (content stays within this for various displays)</li>
              <li>Background: Gradient sky + ground or illustrated scene</li>
              <li>Logo/Badge: Top 20%, centered</li>
              <li>Headline: Large (48-72px), bold, centered</li>
              <li>Subtext: 24-32px, 2 lines maximum</li>
              <li>CTA buttons: Centered, primary + secondary option</li>
              <li>Optional: Character illustration bottom-right or center</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Event Card */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Event Card Template</CardTitle>
          <CardDescription>800×600px • In-game events, announcements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-amber-500 overflow-hidden">
              {/* Image Area */}
              <div className="h-48 bg-gradient-to-br from-amber-200 via-sky-200 to-green-200 flex items-center justify-center relative">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-red-600 text-white">LIVE NOW</Badge>
                </div>
                <span className="text-7xl">🎉</span>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-purple-600">Special Event</Badge>
                  <span className="text-sm text-slate-600">Ends in 2 days</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Summer Festival</h3>
                <p className="text-slate-600 mb-4">
                  Join us for games, prizes, and community building! Earn exclusive summer badges and decorations.
                </p>
                <button className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600">
                  Join Event
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Layout Guidelines</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Top image: 300-400px height, illustrated or gradient background</li>
              <li>Status badge: Top-right corner (LIVE, UPCOMING, ENDED)</li>
              <li>Event type badge: Below image, left-aligned</li>
              <li>Headline: 24-32px, bold, max 2 lines</li>
              <li>Description: 14-16px, 3-4 lines maximum</li>
              <li>CTA: Full-width button at bottom</li>
              <li>Border: Colored border (2-4px) matching event theme</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Social Post */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Social Media Post Cover</CardTitle>
          <CardDescription>1200×630px • Twitter, Facebook, Discord embeds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-amber-400 via-cyan-300 to-green-400 rounded-2xl p-8 border-4 border-slate-800">
            <div className="bg-white/95 backdrop-blur rounded-xl p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-5xl">⭐</span>
                <h2 className="text-4xl font-bold text-slate-900">AGENT TOWN</h2>
              </div>
              <p className="text-2xl text-slate-700 mb-2">New Feature Released!</p>
              <p className="text-lg text-slate-600">Custom house decorations now available</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Design Guidelines</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Always include logo/wordmark prominently</li>
              <li>Use brand gradient or illustrated background</li>
              <li>Central content area: white panel with 90-95% opacity</li>
              <li>Large text: 36-48px for social feed readability</li>
              <li>High contrast: Ensure text is legible at thumbnail size</li>
              <li>Safe area: Keep key content in center 1000×500px (platform crops vary)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Platform-Specific Sizes</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded">
                <p className="font-semibold text-sm text-slate-900">Twitter/X</p>
                <p className="text-xs text-slate-600">1200×675px (16:9)</p>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <p className="font-semibold text-sm text-slate-900">Instagram</p>
                <p className="text-xs text-slate-600">1080×1080px (1:1)</p>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <p className="font-semibold text-sm text-slate-900">Discord</p>
                <p className="text-xs text-slate-600">1920×1080px (16:9)</p>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <p className="font-semibold text-sm text-slate-900">LinkedIn</p>
                <p className="text-xs text-slate-600">1200×627px</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Thumbnail */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Video Clip Thumbnail Frame</CardTitle>
          <CardDescription>1920×1080px • YouTube, Twitch, social video</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-slate-800 via-amber-900 to-cyan-900 rounded-xl overflow-hidden border-4 border-amber-500">
            <div className="relative aspect-video flex items-center justify-center p-12">
              {/* Background with character */}
              <div className="absolute inset-0 flex items-end justify-center pb-8">
                <span className="text-9xl">🦞</span>
              </div>
              
              {/* Text overlay */}
              <div className="relative z-10 text-center">
                <div className="bg-black/70 backdrop-blur px-8 py-6 rounded-2xl border-2 border-amber-500">
                  <p className="text-amber-400 text-xl mb-2 font-semibold uppercase tracking-wide">Tutorial</p>
                  <h2 className="text-white text-5xl font-bold mb-3">Building Your<br/>First House</h2>
                  <div className="flex items-center justify-center gap-3 text-white">
                    <span className="text-2xl">▶</span>
                    <span className="text-xl">12:34</span>
                  </div>
                </div>
              </div>

              {/* Channel branding */}
              <div className="absolute top-6 right-6 flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-full">
                <span className="text-2xl">⭐</span>
                <span className="font-bold text-slate-900">AGENT TOWN</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Design Guidelines</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>High-contrast text: Use dark overlay or colored panel behind white/yellow text</li>
              <li>Headline: 48-72px, bold, max 2 lines, highly readable</li>
              <li>Video length: Display prominently (18-24px)</li>
              <li>Branding: Logo in corner (top-right or bottom-right)</li>
              <li>Play button icon: Optional, reinforces it's a video</li>
              <li>Character/scene: Large, recognizable even at small thumbnail size</li>
              <li>Avoid: Small text, low contrast, cluttered composition</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Content Categories</h4>
            <div className="grid grid-cols-3 gap-2">
              <Badge className="bg-purple-600">Tutorial</Badge>
              <Badge className="bg-cyan-600">Update</Badge>
              <Badge className="bg-red-600">Event</Badge>
              <Badge className="bg-green-600">Showcase</Badge>
              <Badge className="bg-amber-600">Highlight</Badge>
              <Badge className="bg-slate-600">Devlog</Badge>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Use colored category badges consistently. Position top-left or above headline.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Template Checklist */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Template Quality Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              'Logo/branding visible and legible',
              'Text uses brand typography (Inter for headlines)',
              'Colors from brand palette only',
              'High contrast between text and background (4.5:1 minimum)',
              'Key content within safe areas (accounts for platform cropping)',
              'Readable at thumbnail size (test at 300×200px)',
              'File optimized for web (PNG for graphics, JPG for photos)',
              'Aspect ratio correct for target platform',
              'Frontier aesthetic maintained (cozy, welcoming, not corporate)',
              'CTA clear and prominent (if applicable)',
            ].map((item, i) => (
              <label key={i} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm text-slate-700">{item}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Specs */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Export Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm text-slate-900 mb-2">Web Graphics (Hero, Cards)</h4>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>Format: PNG for graphics with transparency, JPG for photos</li>
                <li>Quality: PNG-24, JPG 85-90%</li>
                <li>Optimize: Use TinyPNG or similar (target &lt;200KB)</li>
                <li>Naming: hero_banner_v1.png, event_card_summer.png</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm text-slate-900 mb-2">Social Media</h4>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>Format: JPG (better compression for social platforms)</li>
                <li>Quality: 90%</li>
                <li>Color profile: sRGB</li>
                <li>Export @2x for Retina displays, then resize to target</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm text-slate-900 mb-2">Video Thumbnails</h4>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>Format: JPG</li>
                <li>Quality: 90-95% (platforms re-compress anyway)</li>
                <li>Max file size: 2MB (YouTube requirement)</li>
                <li>Test at 320×180px to ensure readability</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}