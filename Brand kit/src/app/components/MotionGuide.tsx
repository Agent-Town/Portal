import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function MotionGuide() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Motion Design Philosophy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-4">
            Motion in Agent Town should feel purposeful, responsive, and never distracting. Animations guide attention, 
            provide feedback, and add personality without slowing down interaction. Think "snappy cozy" - quick but warm.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>Purposeful</Badge>
            <Badge>Responsive</Badge>
            <Badge>Subtle</Badge>
            <Badge>Performance-First</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Camera Movement */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Camera Movement Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Pan & Zoom</h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-semibold w-32 shrink-0">Pan Duration:</span>
                <span>800ms for short distances (&lt;2 screens), 1200ms for long distances</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold w-32 shrink-0">Pan Easing:</span>
                <span>easeInOutCubic - smooth start and end, natural feel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold w-32 shrink-0">Zoom Duration:</span>
                <span>400ms for all zoom levels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold w-32 shrink-0">Zoom Easing:</span>
                <span>easeOutQuad - quick zoom, gentle settle</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Follow Character</h4>
            <p className="text-sm text-slate-600 mb-2">
              Camera smoothly follows player character with slight lag (150ms delay) to avoid jittery movement. 
              When character stops, camera settles within 200ms.
            </p>
          </div>

          <div className="p-4 bg-slate-900 text-green-400 rounded-lg">
            <p className="font-mono text-sm mb-1">// Phaser camera config example</p>
            <code className="font-mono text-xs whitespace-pre-wrap">{`camera.startFollow(player, true, 0.1, 0.1);
camera.setLerp(0.1, 0.1);`}</code>
          </div>
        </CardContent>
      </Card>

      {/* UI Transitions */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>UI Interaction Timing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
              <h4 className="font-semibold text-slate-900 mb-2">Hover States</h4>
              <p className="text-sm text-slate-600 mb-2">Duration: 150ms | Easing: easeOut</p>
              <p className="text-xs text-slate-500">
                Fast enough to feel responsive, slow enough to be smooth. Background color, border, shadow changes.
              </p>
            </div>

            <div className="p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-500">
              <h4 className="font-semibold text-slate-900 mb-2">Click/Tap Feedback</h4>
              <p className="text-sm text-slate-600 mb-2">Duration: 100ms | Easing: easeOut</p>
              <p className="text-xs text-slate-500">
                Immediate tactile response. Scale down 95% briefly, then return. Paired with sound.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <h4 className="font-semibold text-slate-900 mb-2">Modal/Panel Enter</h4>
              <p className="text-sm text-slate-600 mb-2">Duration: 300ms | Easing: easeOutBack</p>
              <p className="text-xs text-slate-500">
                Fade in (opacity 0→1) + scale (95%→100%) + slight overshoot for personality.
              </p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
              <h4 className="font-semibold text-slate-900 mb-2">Modal/Panel Exit</h4>
              <p className="text-sm text-slate-600 mb-2">Duration: 200ms | Easing: easeInQuad</p>
              <p className="text-xs text-slate-500">
                Faster exit than enter. Fade out + scale down (100%→90%). No overshoot.
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-semibold text-slate-900 mb-2">Slide-in Notifications</h4>
              <p className="text-sm text-slate-600 mb-2">Duration: 400ms | Easing: easeOutCubic</p>
              <p className="text-xs text-slate-500">
                Slide from right edge, slight bounce at end. Auto-dismiss after 4s with 300ms fade out.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-slate-500">
              <h4 className="font-semibold text-slate-900 mb-2">Loading Spinners</h4>
              <p className="text-sm text-slate-600 mb-2">Duration: 800ms loop | Easing: linear</p>
              <p className="text-xs text-slate-500">
                Continuous rotation. Simple, not distracting. Portal-500 color, 3px stroke.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Easing Presets */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Easing Function Reference</CardTitle>
          <CardDescription>CSS and JavaScript timing functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="font-mono text-sm font-semibold text-slate-900">easeOut</p>
                <Badge variant="outline">Default UI</Badge>
              </div>
              <p className="text-xs text-slate-600 mb-2">Fast start, gentle deceleration. Most UI interactions.</p>
              <code className="font-mono text-xs text-slate-700">cubic-bezier(0.25, 0.46, 0.45, 0.94)</code>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="font-mono text-sm font-semibold text-slate-900">easeInOut</p>
                <Badge variant="outline">Movement</Badge>
              </div>
              <p className="text-xs text-slate-600 mb-2">Smooth start and end. Camera panning, character movement.</p>
              <code className="font-mono text-xs text-slate-700">cubic-bezier(0.42, 0, 0.58, 1)</code>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="font-mono text-sm font-semibold text-slate-900">easeOutBack</p>
                <Badge variant="outline">Playful</Badge>
              </div>
              <p className="text-xs text-slate-600 mb-2">Slight overshoot. Adds personality to modals, achievements.</p>
              <code className="font-mono text-xs text-slate-700">cubic-bezier(0.34, 1.56, 0.64, 1)</code>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="font-mono text-sm font-semibold text-slate-900">easeInQuad</p>
                <Badge variant="outline">Quick Exit</Badge>
              </div>
              <p className="text-xs text-slate-600 mb-2">Accelerating. For hiding/closing elements.</p>
              <code className="font-mono text-xs text-slate-700">cubic-bezier(0.55, 0.085, 0.68, 0.53)</code>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="font-mono text-sm font-semibold text-slate-900">linear</p>
                <Badge variant="outline">Continuous</Badge>
              </div>
              <p className="text-xs text-slate-600 mb-2">Constant speed. Loading indicators, background effects.</p>
              <code className="font-mono text-xs text-slate-700">cubic-bezier(0, 0, 1, 1)</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Character Animation */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Character Animation Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Walk Cycle</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>4-6 frames for chibi characters (minimal animation needed)</li>
              <li>160ms per frame = 2.5-3 steps per second (leisurely pace)</li>
              <li>Slight vertical bob (2-4px) for depth</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Idle Animation</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Subtle breathing: 2-3px vertical movement, 2s cycle</li>
              <li>Occasional blink: every 3-5s, 100ms duration</li>
              <li>Small random movements: head tilt, shift weight (optional)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Emote Animations</h4>
            <p className="text-sm text-slate-600 mb-2">
              Quick, exaggerated. 300-500ms total duration. Examples: jump for joy, head shake for no, star sparkle for success.
            </p>
          </div>

          <div className="p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-500">
            <p className="text-sm font-semibold text-slate-900 mb-1">Portal Glow Animation</p>
            <p className="text-sm text-slate-600 mb-2">
              Continuous pulse: opacity 40%→60%, 2s cycle, easeInOut. 
              Particle sparkles: random position, 1-2s lifespan, fade in/out 200ms.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transition Rules */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Page/Scene Transition Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Scene Changes (Game World)</h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li><span className="font-semibold">Enter Portal:</span> 600ms spiral fade effect, portal sound, then load new scene</li>
              <li><span className="font-semibold">Enter Building:</span> 400ms fade to black, door sound, then interior scene</li>
              <li><span className="font-semibold">Fast Travel:</span> 300ms fade out, teleport, 300ms fade in at new location</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Web Page Navigation</h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li><span className="font-semibold">Route Change:</span> 200ms crossfade between views, no jarring cuts</li>
              <li><span className="font-semibold">Loading State:</span> Show spinner after 500ms delay (avoid flash for fast loads)</li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900 mb-2">⚠️ Performance Note</p>
            <p className="text-sm text-slate-600">
              Always use CSS transforms (translate, scale, rotate) and opacity for animations - these are GPU-accelerated. 
              Avoid animating width, height, top, left for smooth 60fps.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Motion Checklist */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Motion Quality Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              'All UI interactions have &lt;200ms response time',
              'Hover states use 150ms easeOut transition',
              'Modals/panels use appropriate easing (easeOutBack for enter)',
              'No animation longer than 1200ms (except continuous loops)',
              'Camera movement uses easeInOutCubic for natural feel',
              'Character walk cycle matches movement speed (no skating)',
              'Loading states appear after 500ms delay (avoid flash)',
              'All animations use CSS transforms or opacity (not layout properties)',
              'Motion respects user\'s prefers-reduced-motion setting',
              'No more than 3 simultaneous animations on screen',
            ].map((item, i) => (
              <label key={i} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: item }}></span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CSS Example */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>CSS Implementation Example</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-900 rounded-lg">
            <pre className="text-green-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
{`/* Button hover state */
.btn {
  transition: background-color 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
              transform 100ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.btn:hover {
  background-color: var(--color-star-600);
}

.btn:active {
  transform: scale(0.95);
}

/* Modal entrance */
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal {
  animation: modalEnter 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
