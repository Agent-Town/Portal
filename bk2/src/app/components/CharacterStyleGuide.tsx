import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import lobsterSheriff from 'figma:asset/bc7980315a9a000bf3a5e79801e960d811154cec.png';
import ladySheriff from 'figma:asset/22219a7af08e73559f32279fc814a0ed356121e8.png';

export default function CharacterStyleGuide() {
  return (
    <div className="space-y-4">
      {/* Town Bosses - Featured Section */}
      <Card className="bg-[#FFF9E6] border-4 border-[#FFD95A] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#FFE466] bg-[#FAEBD7]">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[#5D4E37] flex items-center gap-2">
              <span className="text-[#FFD95A]">★★</span> Town Bosses <span className="text-[#FFD95A]">★★</span>
            </CardTitle>
            <Badge className="bg-[#FFD95A] text-[#5D4E37] border-2 border-[#E5C14A] text-xs">Leadership</Badge>
          </div>
          <CardDescription className="text-xs text-[#99761A]">
            The two sheriffs who keep Agent Town running smoothly
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* OpenClaw Lobster Sheriff */}
            <div className="p-4 bg-[#FFE8D0] border-4 border-[#D2691E] rounded-lg">
              <div className="flex flex-col items-center mb-4">
                <img 
                  src={lobsterSheriff} 
                  alt="OpenClaw Sheriff" 
                  className="w-48 h-48 rounded-lg border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] bg-[#FAEBD7]"
                />
                <h3 className="text-base font-semibold text-[#5D4E37] mt-3">OpenClaw Sheriff</h3>
                <Badge className="bg-[#D2691E] text-white border-2 border-[#B35818] text-xs mt-2">OpenClaw Framework</Badge>
              </div>
              <div className="space-y-2 text-xs text-[#5D4E37]">
                <p><span className="font-semibold">Species:</span> Friendly red lobster/crab</p>
                <p><span className="font-semibold">Role:</span> Technical sheriff, framework mascot</p>
                <p><span className="font-semibold">Body:</span> Bright terracotta, chunky rounded shell</p>
                <p><span className="font-semibold">Hat:</span> Brown sheriff hat with golden star</p>
                <p><span className="font-semibold">Eyes:</span> Large, expressive, always welcoming</p>
                <p><span className="font-semibold">Personality:</span> Helpful, technical, playful</p>
              </div>
              <div className="mt-4 pt-3 border-t-2 border-[#CD853F]">
                <p className="text-xs font-semibold text-[#5D4E37] mb-2">Usage:</p>
                <ul className="text-xs text-[#5D4E37] space-y-1 list-disc list-inside">
                  <li>OpenClaw framework documentation</li>
                  <li>Technical tutorials & guides</li>
                  <li>Developer onboarding</li>
                  <li>Code examples & snippets</li>
                </ul>
              </div>
            </div>

            {/* ElizaOS Lady Sheriff */}
            <div className="p-4 bg-[#E8F2E8] border-4 border-[#8FBC8F] rounded-lg">
              <div className="flex flex-col items-center mb-4">
                <img 
                  src={ladySheriff} 
                  alt="ElizaOS Sheriff" 
                  className="w-48 h-48 rounded-lg border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] bg-[#FAEBD7]"
                />
                <h3 className="text-base font-semibold text-[#5D4E37] mt-3">ElizaOS Sheriff</h3>
                <Badge className="bg-[#8FBC8F] text-white border-2 border-[#6FA06F] text-xs mt-2">ElizaOS Framework</Badge>
              </div>
              <div className="space-y-2 text-xs text-[#5D4E37]">
                <p><span className="font-semibold">Species:</span> Human character, chibi anime style</p>
                <p><span className="font-semibold">Role:</span> Community sheriff, framework mascot</p>
                <p><span className="font-semibold">Hair:</span> Long black hair with blue highlights</p>
                <p><span className="font-semibold">Hat:</span> Brown sheriff hat with golden star</p>
                <p><span className="font-semibold">Outfit:</span> Frontier vest, boots, practical gear</p>
                <p><span className="font-semibold">Personality:</span> Welcoming, organized, collaborative</p>
              </div>
              <div className="mt-4 pt-3 border-t-2 border-[#A8D9A8]">
                <p className="text-xs font-semibold text-[#5D4E37] mb-2">Usage:</p>
                <ul className="text-xs text-[#5D4E37] space-y-1 list-disc list-inside">
                  <li>ElizaOS framework documentation</li>
                  <li>Community & social features</li>
                  <li>User onboarding & welcome</li>
                  <li>Collaboration tutorials</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-[#FAEBD7] border-2 border-[#FFD95A] rounded-lg">
            <p className="text-xs text-[#5D4E37] leading-relaxed">
              <span className="font-semibold text-[#5D4E37]">Design Note:</span> Both sheriffs wear the iconic 
              brown hat with golden star, symbolizing their equal leadership in Agent Town. They represent the 
              two major AI agent frameworks working together - OpenClaw (technical/backend) and ElizaOS 
              (community/interaction). Use them together to show collaboration, or individually to represent 
              their respective frameworks.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#FAEBD7] border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#F4A460]">
          <CardTitle className="text-[#5D4E37]">Character Design Philosophy</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-[#5D4E37] mb-4 text-sm leading-relaxed">
            Agent Town characters are chibi-style with friendly proportions, chunky pixel outlines, and expressive 
            features. Both human and agent characters share similar construction rules to emphasize equality and 
            partnership. The red crustacean sheriff is our mascot anchor.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#6BA3D0] text-white border-2 border-[#5890B8] text-xs">Chibi Proportions</Badge>
            <Badge className="bg-[#F4A460] text-white border-2 border-[#D48A40] text-xs">Large Expressive Eyes</Badge>
            <Badge className="bg-[#FFD95A] text-[#5D4E37] border-2 border-[#E5C14A] text-xs">Simple Silhouettes</Badge>
            <Badge className="bg-[#8FBC8F] text-white border-2 border-[#6FA06F] text-xs">Diverse & Inclusive</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Anatomy Rules */}
      <Card className="bg-[#E8F4E7] border-4 border-[#2A3D29] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#B8D4B6]">
          <CardTitle className="text-[#2A3D29]">Character Anatomy Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Proportion System (2:1 Chibi)</h4>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-semibold text-sm text-slate-900 mb-1">Head</p>
                <p className="text-sm text-slate-600">
                  1 unit tall. Large and round. Contains most personality through eyes and expression.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-semibold text-sm text-slate-900 mb-1">Body</p>
                <p className="text-sm text-slate-600">
                  1 unit tall (same as head). Simplified torso, no visible waist. Straight or slightly tapered.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-semibold text-sm text-slate-900 mb-1">Legs (Optional)</p>
                <p className="text-sm text-slate-600">
                  Short and stubby. Often simplified to boots/feet only. Can be omitted for floating agents.
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Total height: approximately 2-2.5 head units. This creates maximum charm and readability at small sizes.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Head Construction</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="font-semibold w-24 shrink-0">Shape:</span>
                <span>Circle or rounded square base. 48-64px diameter for standard size.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold w-24 shrink-0">Eyes:</span>
                <span>Large, positioned in upper 2/3 of head. Spacing = 1 eye width apart. 12-16px diameter each.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold w-24 shrink-0">Mouth:</span>
                <span>Simple curved line, 2-3px wide. Positioned in lower 1/3. Can be stylized dot or small shape.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold w-24 shrink-0">Nose:</span>
                <span>Optional. Small dot or 2px line. Often omitted for cleaner look.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold w-24 shrink-0">Hair:</span>
                <span>Chunky shapes, 2-4 major clumps maximum. Follows head silhouette with 4-8px extension.</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Eye Styles</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 text-center">
                <div className="w-full aspect-square bg-slate-100 rounded-lg flex items-center justify-center border-2 border-slate-200">
                  <div className="flex gap-2">
                    <div className="w-4 h-4 bg-slate-900 rounded-full"></div>
                    <div className="w-4 h-4 bg-slate-900 rounded-full"></div>
                  </div>
                </div>
                <p className="text-xs text-slate-600">Dot Eyes (Simple)</p>
              </div>
              <div className="space-y-2 text-center">
                <div className="w-full aspect-square bg-slate-100 rounded-lg flex items-center justify-center border-2 border-slate-200">
                  <div className="flex gap-2">
                    <div className="w-4 h-5 bg-amber-800 rounded-full relative">
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div className="w-4 h-5 bg-amber-800 rounded-full relative">
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600">Round (Standard)</p>
              </div>
              <div className="space-y-2 text-center">
                <div className="w-full aspect-square bg-slate-100 rounded-lg flex items-center justify-center border-2 border-slate-200">
                  <div className="flex gap-2">
                    <div className="w-3 h-2 bg-slate-900 rounded-sm"></div>
                    <div className="w-3 h-2 bg-slate-900 rounded-sm"></div>
                  </div>
                </div>
                <p className="text-xs text-slate-600">Line (Chill)</p>
              </div>
              <div className="space-y-2 text-center">
                <div className="w-full aspect-square bg-slate-100 rounded-lg flex items-center justify-center border-2 border-slate-200">
                  <div className="flex gap-2">
                    <div className="w-5 h-5 bg-cyan-400 rounded-full border-2 border-slate-900 relative">
                      <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="w-5 h-5 bg-cyan-400 rounded-full border-2 border-slate-900 relative">
                      <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600">Magical (Agents)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expression Set */}
      <Card className="bg-[#E8F4E7] border-4 border-[#2A3D29] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#B8D4B6]">
          <CardTitle className="text-[#2A3D29]">Core Expression Set</CardTitle>
          <CardDescription className="text-xs text-[#5C7A5A]">Every character should support these 6 expressions minimum</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="text-4xl mb-2">😊</div>
              <p className="font-semibold text-sm text-slate-900">Happy</p>
              <p className="text-xs text-slate-600 mt-1">Default/neutral positive. Slight smile, open eyes.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="text-4xl mb-2">😃</div>
              <p className="font-semibold text-sm text-slate-900">Excited</p>
              <p className="text-xs text-slate-600 mt-1">Wide smile, larger eyes. Achievement moments.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="text-4xl mb-2">🤔</div>
              <p className="font-semibold text-sm text-slate-900">Thinking</p>
              <p className="text-xs text-slate-600 mt-1">Slight head tilt, one eye squinted. Processing.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="text-4xl mb-2">😮</div>
              <p className="font-semibold text-sm text-slate-900">Surprised</p>
              <p className="text-xs text-slate-600 mt-1">Wide eyes, open mouth. Discoveries.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="text-4xl mb-2">😔</div>
              <p className="font-semibold text-sm text-slate-900">Sad</p>
              <p className="text-xs text-slate-600 mt-1">Downturned mouth, droopy eyes. Failures.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <div className="text-4xl mb-2">😴</div>
              <p className="font-semibold text-sm text-slate-900">Idle</p>
              <p className="text-xs text-slate-600 mt-1">Closed or half-closed eyes. Waiting state.</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-cyan-50 rounded-lg border-l-4 border-cyan-500">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Expression Changes:</span> Only eyes and mouth move. Head/body stay 
              static. This allows for easy sprite swapping and animation efficiency.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Outfit & Accessories */}
      <Card className="bg-[#E8F4E7] border-4 border-[#2A3D29] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#B8D4B6]">
          <CardTitle className="text-[#2A3D29]">Outfit & Accessory Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Outfit Layers</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><span className="font-semibold">Base Body:</span> Neutral skin tone or surface color</li>
              <li><span className="font-semibold">Clothing:</span> Simple shapes, 2-3 colors max, follows body form</li>
              <li><span className="font-semibold">Accessories:</span> Hats, badges, tools. Max 2 per character to avoid clutter</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Frontier Aesthetic Items</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-amber-50 rounded border-2 border-amber-300 text-center">
                <span className="text-2xl">🤠</span>
                <p className="text-xs text-slate-600 mt-1">Sheriff Hat</p>
              </div>
              <div className="p-3 bg-amber-50 rounded border-2 border-amber-300 text-center">
                <span className="text-2xl">⭐</span>
                <p className="text-xs text-slate-600 mt-1">Star Badge</p>
              </div>
              <div className="p-3 bg-amber-50 rounded border-2 border-amber-300 text-center">
                <span className="text-2xl">👢</span>
                <p className="text-xs text-slate-600 mt-1">Leather Boots</p>
              </div>
              <div className="p-3 bg-amber-50 rounded border-2 border-amber-300 text-center">
                <span className="text-2xl">🧰</span>
                <p className="text-xs text-slate-600 mt-1">Tool Belt</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Color Coordination</h4>
            <p className="text-sm text-slate-600 mb-2">
              Outfits should use 2-3 colors from the brand palette. Avoid mixing too many bright colors. 
              Use neutrals (wood tones) as base with one accent color.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-slate-50 rounded text-center">
                <div className="flex justify-center gap-1 mb-2">
                  <div className="w-6 h-6 bg-amber-700 rounded"></div>
                  <div className="w-6 h-6 bg-slate-100 rounded"></div>
                  <div className="w-6 h-6 bg-amber-500 rounded"></div>
                </div>
                <p className="text-xs text-green-700">✓ Good</p>
              </div>
              <div className="flex-1 p-3 bg-slate-50 rounded text-center">
                <div className="flex justify-center gap-1 mb-2">
                  <div className="w-6 h-6 bg-red-600 rounded"></div>
                  <div className="w-6 h-6 bg-cyan-400 rounded"></div>
                  <div className="w-6 h-6 bg-yellow-400 rounded"></div>
                </div>
                <p className="text-xs text-red-700">✗ Too Busy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Silhouette Checklist */}
      <Card className="bg-[#E8F4E7] border-4 border-[#2A3D29] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#B8D4B6]">
          <CardTitle className="text-[#2A3D29]">Character Quality Checklist</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {[
              'Head is approximately same height as body (2:1 chibi ratio)',
              'Eyes are large and positioned in upper 2/3 of head',
              'Character reads clearly as solid black silhouette',
              'Outfits use 2-3 colors maximum from brand palette',
              'Accessories don\'t clutter silhouette (max 2 items)',
              'Expression can change without affecting body/pose',
              'Outline is consistent 3-4px weight',
              'Character fits personality (human, agent, or hybrid)',
              'Works at both 64px and 256px sizes',
              'Adheres to frontier aesthetic (rustic, cozy, welcoming)',
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