import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function AudioBrandNotes() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Audio Brand Philosophy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-4">
            Agent Town's soundscape is warm, welcoming, and subtly frontier-inspired. Audio reinforces actions without 
            overwhelming. Think cozy game meets western atmosphere - wood creaks, friendly chimes, magical sparkles, 
            never harsh or aggressive.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>Warm & Organic</Badge>
            <Badge>Playful</Badge>
            <Badge>Subtle Feedback</Badge>
            <Badge>Frontier-Inspired</Badge>
          </div>
        </CardContent>
      </Card>

      {/* UI Sound Family */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>UI Click Sound Family</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
            <h4 className="font-semibold text-slate-900 mb-2">Primary Action Click</h4>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Sound:</span> Warm wood tap + subtle chime
            </p>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Pitch:</span> Mid-range (C4 - E4)
            </p>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Duration:</span> 80-120ms
            </p>
            <p className="text-xs text-slate-500">
              Usage: Primary buttons (Build, Confirm, Send). Feels satisfying and responsive.
            </p>
            <div className="mt-2 p-2 bg-white rounded font-mono text-xs text-slate-700">
              sfx.ui.click.primary.v1.wav
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-slate-500">
            <h4 className="font-semibold text-slate-900 mb-2">Secondary Action Click</h4>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Sound:</span> Soft wood knock
            </p>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Pitch:</span> Lower (A3 - C4)
            </p>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Duration:</span> 50-80ms
            </p>
            <p className="text-xs text-slate-500">
              Usage: Secondary buttons (Cancel, Back, Close). Less prominent than primary.
            </p>
            <div className="mt-2 p-2 bg-white rounded font-mono text-xs text-slate-700">
              sfx.ui.click.secondary.v1.wav
            </div>
          </div>

          <div className="p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-500">
            <h4 className="font-semibold text-slate-900 mb-2">Portal/Magical Click</h4>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Sound:</span> Ethereal chime + shimmer tail
            </p>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Pitch:</span> Higher (E4 - A4)
            </p>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Duration:</span> 150-250ms with tail
            </p>
            <p className="text-xs text-slate-500">
              Usage: Portal interactions, agent actions, magical features. More ethereal and special.
            </p>
            <div className="mt-2 p-2 bg-white rounded font-mono text-xs text-slate-700">
              sfx.portal.interact.v1.wav
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
            <h4 className="font-semibold text-slate-900 mb-2">Error/Warning Sound</h4>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Sound:</span> Gentle low thud (not harsh buzzer)
            </p>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Pitch:</span> Low (E2 - G2)
            </p>
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-semibold">Duration:</span> 100ms
            </p>
            <p className="text-xs text-slate-500">
              Usage: Failed actions, warnings. Never scary - just "oops, try again" friendly.
            </p>
            <div className="mt-2 p-2 bg-white rounded font-mono text-xs text-slate-700">
              sfx.ui.error.v1.wav
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ambient Soundscape */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Ambient Soundscape Mood</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Town Square Ambience</h4>
            <p className="text-sm text-slate-600 mb-2">
              Gentle background layer that creates atmosphere without demanding attention. Volume: 20-30% of max.
            </p>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Distant wood creaks and door swings</li>
              <li>Occasional friendly NPC chatter (unintelligible murmurs)</li>
              <li>Light wind through grass</li>
              <li>Distant bird calls (1-2 per minute)</li>
              <li>Subtle portal hum if near Portal District</li>
            </ul>
            <div className="mt-2 p-2 bg-slate-50 rounded font-mono text-xs text-slate-700">
              ambience.town_square.loop.v1.mp3 (2-3min loop, seamless)
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Interior Spaces</h4>
            <p className="text-sm text-slate-600 mb-2">
              Quieter, more intimate. Muffled exterior sounds, emphasize cozy interior acoustics.
            </p>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Soft fireplace crackle (if applicable)</li>
              <li>Muffled footsteps on wood floors</li>
              <li>Distant muffled town sounds</li>
            </ul>
            <div className="mt-2 p-2 bg-slate-50 rounded font-mono text-xs text-slate-700">
              ambience.interior.cozy.loop.v1.mp3
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm font-semibold text-slate-900 mb-1">🎵 Music Direction (Optional)</p>
            <p className="text-sm text-slate-600">
              Acoustic guitar or banjo-led melodies. Major keys, slow-mid tempo (90-110 BPM). 
              Think: Stardew Valley meets Zelda: BOTW. Extremely subtle, volume 15-20%, easily ignorable 
              so players can listen to own music.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Interaction Cues */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Gameplay Interaction Cues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm text-slate-900 mb-2">🚪 Door Open/Close</h4>
              <p className="text-xs text-slate-600">Wood creak + latch click. 200-400ms. Stereo positioned.</p>
              <p className="font-mono text-xs text-slate-500 mt-1">sfx.door.open.v1.wav</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm text-slate-900 mb-2">👞 Footsteps</h4>
              <p className="text-xs text-slate-600">Soft wood taps, 4-6 variations. Match walk cycle timing.</p>
              <p className="font-mono text-xs text-slate-500 mt-1">sfx.footstep.wood.[1-6].wav</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm text-slate-900 mb-2">💬 Chat Message</h4>
              <p className="text-xs text-slate-600">Gentle pop or chime. 60-100ms. Not annoying if frequent.</p>
              <p className="font-mono text-xs text-slate-500 mt-1">sfx.chat.message.v1.wav</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm text-slate-900 mb-2">🎁 Item Pickup/Receive</h4>
              <p className="text-xs text-slate-600">Pleasant ascending chime. 150-250ms. Feels rewarding.</p>
              <p className="font-mono text-xs text-slate-500 mt-1">sfx.item.pickup.v1.wav</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm text-slate-900 mb-2">🔨 Build/Place Object</h4>
              <p className="text-xs text-slate-600">Satisfying thunk + small whoosh. 120-180ms.</p>
              <p className="font-mono text-xs text-slate-500 mt-1">sfx.build.place.v1.wav</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm text-slate-900 mb-2">⭐ Achievement Unlock</h4>
              <p className="text-xs text-slate-600">Celebratory chime sequence. 600-1000ms. Feels special!</p>
              <p className="font-mono text-xs text-slate-500 mt-1">sfx.achievement.unlock.v1.wav</p>
            </div>

            <div className="p-3 bg-cyan-50 rounded-lg border-2 border-cyan-300">
              <h4 className="font-semibold text-sm text-slate-900 mb-2">✨ Portal Open</h4>
              <p className="text-xs text-slate-600">Swirling whoosh + sparkle tail. 800-1200ms. Magical!</p>
              <p className="font-mono text-xs text-slate-500 mt-1">sfx.portal.open.v1.wav</p>
            </div>

            <div className="p-3 bg-cyan-50 rounded-lg border-2 border-cyan-300">
              <h4 className="font-semibold text-sm text-slate-900 mb-2">🌀 Portal Ambient Loop</h4>
              <p className="text-xs text-slate-600">Subtle ethereal hum. 30-40% volume. Seamless 10s loop.</p>
              <p className="font-mono text-xs text-slate-500 mt-1">sfx.portal.ambient.loop.v1.wav</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume Guidelines */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Volume & Mixing Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Loudness Consistency</h4>
            <p className="text-sm text-slate-600 mb-3">
              All sound effects should be normalized to consistent perceived loudness. Use LUFS (Loudness Units 
              relative to Full Scale) targeting for consistency.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="w-40 text-sm text-slate-600">UI Clicks:</span>
                <div className="flex-1 bg-slate-200 h-4 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-sm text-slate-600">-18 LUFS</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-40 text-sm text-slate-600">Footsteps:</span>
                <div className="flex-1 bg-slate-200 h-4 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '40%' }}></div>
                </div>
                <span className="text-sm text-slate-600">-24 LUFS</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-40 text-sm text-slate-600">Ambient:</span>
                <div className="flex-1 bg-slate-200 h-4 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '30%' }}></div>
                </div>
                <span className="text-sm text-slate-600">-30 LUFS</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-40 text-sm text-slate-600">Achievements:</span>
                <div className="flex-1 bg-slate-200 h-4 rounded-full overflow-hidden">
                  <div className="bg-yellow-500 h-full rounded-full" style={{ width: '70%' }}></div>
                </div>
                <span className="text-sm text-slate-600">-14 LUFS</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-40 text-sm text-slate-600">Music (if used):</span>
                <div className="flex-1 bg-slate-200 h-4 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '25%' }}></div>
                </div>
                <span className="text-sm text-slate-600">-32 LUFS</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">User Volume Controls</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Separate sliders for: SFX, Ambience, Music (if applicable)</li>
              <li>Master mute toggle accessible via ESC or settings</li>
              <li>Remember user preferences in local storage</li>
              <li>Default: SFX 70%, Ambience 50%, Music 40%</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Ducking Rules</h4>
            <p className="text-sm text-slate-600 mb-2">
              When important sounds play (achievements, errors, portal opens), temporarily reduce ambient/music 
              by 50% for 2-3 seconds, then fade back.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Technical Specs */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Audio Technical Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-sm text-slate-900 w-32 shrink-0">Format:</span>
              <span className="text-sm text-slate-600">
                .wav for SFX (uncompressed, low latency), .mp3 for ambience/music (compressed, smaller size)
              </span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-sm text-slate-900 w-32 shrink-0">Sample Rate:</span>
              <span className="text-sm text-slate-600">
                44.1kHz (standard, web-friendly)
              </span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-sm text-slate-900 w-32 shrink-0">Bit Depth:</span>
              <span className="text-sm text-slate-600">
                16-bit for SFX (sufficient quality, small file size), 24-bit source for mastering
              </span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-sm text-slate-900 w-32 shrink-0">Channels:</span>
              <span className="text-sm text-slate-600">
                Stereo preferred. Mono acceptable for UI clicks. Use stereo positioning for spatial world sounds.
              </span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-sm text-slate-900 w-32 shrink-0">File Size:</span>
              <span className="text-sm text-slate-600">
                Target &lt;50KB for UI SFX, &lt;2MB for ambient loops. Optimize for web delivery.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Checklist */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Audio Quality Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              'All SFX normalized to consistent LUFS targets',
              'No clipping or distortion in any sound file',
              'Ambient loops are seamless (no audible seam)',
              'UI sounds are &lt;250ms duration (responsive feel)',
              'Stereo positioning used for world sounds (doors, footsteps)',
              'Volume respects mixing hierarchy (SFX > Ambient > Music)',
              'User can control SFX, Ambience, Music independently',
              'No harsh or aggressive sounds (maintain friendly tone)',
              'Magical portal sounds distinct from regular UI',
              'All audio files follow naming convention (sfx.[category].[name].v[#])',
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
