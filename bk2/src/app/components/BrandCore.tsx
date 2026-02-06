import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function BrandCore() {
  return (
    <div className="space-y-4">
      <Card className="bg-[#FAEBD7] border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#F4A460]">
          <CardTitle className="text-[#5D4E37] flex items-center gap-2">
            <span className="text-[#FFD95A]">★</span> Mission Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="leading-relaxed text-[#5D4E37] text-sm">
            Agent Town is a welcoming multiplayer frontier where humans and AI agents build, explore, and collaborate together. 
            We create cozy spaces for meaningful connection, playful experimentation, and shared adventure—proving that the 
            future of AI is cooperative, not competitive.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#FAEBD7] border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#F4A460]">
          <CardTitle className="text-[#5D4E37] flex items-center gap-2">
            <span className="text-[#FFD95A]">★</span> Audience
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="p-3 bg-[#E8F4FF] border-2 border-[#6BA3D0]">
              <h4 className="font-semibold text-[#5D4E37] mb-2 text-sm">Primary: Curious Builders</h4>
              <p className="text-[#5D4E37] text-xs leading-relaxed">
                Developers, designers, and creators interested in AI collaboration. Value experimentation over perfection. 
                Seek community and shared learning experiences.
              </p>
            </div>
            <div className="p-3 bg-[#FFE8D0] border-2 border-[#F4A460]">
              <h4 className="font-semibold text-[#5D4E37] mb-2 text-sm">Secondary: Social Explorers</h4>
              <p className="text-[#5D4E37] text-xs leading-relaxed">
                Players who enjoy cozy games, virtual worlds, and emergent storytelling. Appreciate charm and personality 
                in their digital spaces.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#FAEBD7] border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
          <CardHeader className="border-b-4 border-[#F4A460]">
            <CardTitle className="text-[#5D4E37] flex items-center gap-2 text-base">
              <span className="text-[#6BA3D0]">♦</span> Brand Personality
            </CardTitle>
            <CardDescription className="text-xs text-[#8B7355]">What we are</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="p-2 bg-[#FFF9E6] border-2 border-[#FFD95A]">
              <Badge className="mb-2 bg-[#FFD95A] text-[#5D4E37] border-2 border-[#E5C14A] text-xs">Welcoming</Badge>
              <p className="text-xs text-[#5D4E37] leading-relaxed">
                Like a friendly sheriff greeting newcomers at the town gate. We lower barriers, explain clearly, 
                and make everyone feel they belong.
              </p>
            </div>
            <div className="p-2 bg-[#E8F4FF] border-2 border-[#6BA3D0]">
              <Badge className="mb-2 bg-[#6BA3D0] text-white border-2 border-[#5890B8] text-xs">Collaborative</Badge>
              <p className="text-xs text-[#5D4E37] leading-relaxed">
                Humans and agents work side-by-side. We celebrate partnerships, shared goals, and collective achievements. 
                No lone wolves here.
              </p>
            </div>
            <div className="p-2 bg-[#FFE8D0] border-2 border-[#F4A460]">
              <Badge className="mb-2 bg-[#F4A460] text-white border-2 border-[#D48A40] text-xs">Adventurous</Badge>
              <p className="text-xs text-[#5D4E37] leading-relaxed">
                There's magic beyond the portal. We encourage exploration, discovery, and playful curiosity. 
                The frontier is full of possibility.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FAEBD7] border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
          <CardHeader className="border-b-4 border-[#F4A460]">
            <CardTitle className="text-[#5D4E37] flex items-center gap-2 text-base">
              <span className="text-[#D2691E]">✕</span> Anti-Traits
            </CardTitle>
            <CardDescription className="text-xs text-[#8B7355]">What we avoid</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="p-2 bg-[#FFE6E6] border-2 border-[#FF8080]">
              <Badge variant="outline" className="mb-2 border-2 border-[#D2691E] text-[#D2691E] bg-white text-xs">Not Chaotic</Badge>
              <p className="text-xs text-[#5D4E37] leading-relaxed">
                We're not a meme casino or degen playground. Every element has purpose. Clarity over chaos.
              </p>
            </div>
            <div className="p-2 bg-[#FFE6E6] border-2 border-[#FF8080]">
              <Badge variant="outline" className="mb-2 border-2 border-[#D2691E] text-[#D2691E] bg-white text-xs">Not Sterile</Badge>
              <p className="text-xs text-[#5D4E37] leading-relaxed">
                We avoid cold corporate aesthetics and soulless UI. Our world has warmth, character, and personality.
              </p>
            </div>
            <div className="p-2 bg-[#FFE6E6] border-2 border-[#FF8080]">
              <Badge variant="outline" className="mb-2 border-2 border-[#D2691E] text-[#D2691E] bg-white text-xs">Not Intimidating</Badge>
              <p className="text-xs text-[#5D4E37] leading-relaxed">
                We don't gatekeep or overwhelm. Complexity is hidden until needed. Advanced users find depth naturally.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#FAEBD7] border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b-4 border-[#F4A460]">
          <CardTitle className="text-[#5D4E37] flex items-center gap-2">
            <span className="text-[#FFD95A]">★</span> Voice & Tone Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="border-l-4 border-[#6BA3D0] pl-4 py-2 bg-[#E8F4FF]">
              <p className="font-semibold text-[#5D4E37] mb-1 text-xs">✅ Do say:</p>
              <p className="text-[#5D4E37] italic text-xs leading-relaxed">
                "Welcome to Agent Town! Your agent buddy is excited to meet you."
              </p>
              <p className="text-xs text-[#8B7355] mt-1">Warm, specific, action-oriented</p>
            </div>
            <div className="border-l-4 border-[#D2691E] pl-4 py-2 bg-[#FFE6E6]">
              <p className="font-semibold text-[#5D4E37] mb-1 text-xs">❌ Don't say:</p>
              <p className="text-[#5D4E37] italic text-xs leading-relaxed">
                "Initialize your AI companion to commence collaborative protocols."
              </p>
              <p className="text-xs text-[#8B7355] mt-1">Too formal, jargon-heavy, sterile</p>
            </div>
            <div className="border-l-4 border-[#6BA3D0] pl-4 py-2 bg-[#E8F4FF]">
              <p className="font-semibold text-[#5D4E37] mb-1 text-xs">✅ Do say:</p>
              <p className="text-[#5D4E37] italic text-xs leading-relaxed">
                "Something went wrong! Let's try that again."
              </p>
              <p className="text-xs text-[#8B7355] mt-1">Friendly, solutions-focused, inclusive</p>
            </div>
            <div className="border-l-4 border-[#D2691E] pl-4 py-2 bg-[#FFE6E6]">
              <p className="font-semibold text-[#5D4E37] mb-1 text-xs">❌ Don't say:</p>
              <p className="text-[#5D4E37] italic text-xs leading-relaxed">
                "ERROR: Process failed. Contact admin."
              </p>
              <p className="text-xs text-[#8B7355] mt-1">Cold, blame-y, unhelpful</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
