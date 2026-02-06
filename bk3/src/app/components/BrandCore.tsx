import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export default function BrandCore() {
  return (
    <div className="space-y-4">
      <Card className="bg-[#F0F0FF] border-4 border-[#312E81] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] shadow-[0_0_15px_rgba(139,92,246,0.3)]">
        <CardHeader className="border-b-4 border-[#8B5CF6] bg-gradient-to-r from-[#8B5CF6]/10 to-[#06B6D4]/10">
          <CardTitle className="text-[#1E1B4B] flex items-center gap-2">
            <span className="text-[#8B5CF6]">✨</span> Mission Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="leading-relaxed text-[#1E1B4B] text-sm">
            Agent Town is a welcoming multiplayer frontier where humans and AI agents build, explore, and collaborate together. 
            We create cozy spaces for meaningful connection, playful experimentation, and shared adventure—proving that the 
            future of AI is cooperative, not competitive.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#F0F0FF] border-4 border-[#312E81] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] shadow-[0_0_15px_rgba(139,92,246,0.3)]">
        <CardHeader className="border-b-4 border-[#8B5CF6] bg-gradient-to-r from-[#8B5CF6]/10 to-[#06B6D4]/10">
          <CardTitle className="text-[#1E1B4B] flex items-center gap-2">
            <span className="text-[#8B5CF6]">✨</span> Audience
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="p-3 bg-[#E0E7FF] border-2 border-[#8B5CF6] shadow-[2px_2px_0px_0px_rgba(139,92,246,0.2)]">
              <h4 className="font-semibold text-[#1E1B4B] mb-2 text-sm">Primary: Curious Builders</h4>
              <p className="text-[#312E81] text-xs leading-relaxed">
                Developers, designers, and creators interested in AI collaboration. Value experimentation over perfection. 
                Seek community and shared learning experiences.
              </p>
            </div>
            <div className="p-3 bg-[#DBEAFE] border-2 border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(6,182,212,0.2)]">
              <h4 className="font-semibold text-[#1E1B4B] mb-2 text-sm">Secondary: Social Explorers</h4>
              <p className="text-[#312E81] text-xs leading-relaxed">
                Players who enjoy cozy games, virtual worlds, and emergent storytelling. Appreciate charm and personality 
                in their digital spaces.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[#F0F0FF] border-4 border-[#312E81] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <CardHeader className="border-b-4 border-[#8B5CF6] bg-gradient-to-r from-[#8B5CF6]/10 to-[#EC4899]/10">
            <CardTitle className="text-[#1E1B4B] flex items-center gap-2 text-base">
              <span className="text-[#8B5CF6]">◆</span> Brand Personality
            </CardTitle>
            <CardDescription className="text-xs text-[#6366F1]">What we are</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="p-2 bg-[#FEF9C3] border-2 border-[#FFD95A] shadow-[2px_2px_0px_0px_rgba(255,217,90,0.3)]">
              <Badge className="mb-2 bg-[#FFD95A] text-[#1E1B4B] border-2 border-[#E5C14A] text-xs">Welcoming</Badge>
              <p className="text-xs text-[#1E1B4B] leading-relaxed">
                Like a friendly sheriff greeting newcomers at the town gate. We lower barriers, explain clearly, 
                and make everyone feel they belong.
              </p>
            </div>
            <div className="p-2 bg-[#E0E7FF] border-2 border-[#8B5CF6] shadow-[2px_2px_0px_0px_rgba(139,92,246,0.2)]">
              <Badge className="mb-2 bg-[#8B5CF6] text-white border-2 border-[#7C3AED] text-xs">Collaborative</Badge>
              <p className="text-xs text-[#1E1B4B] leading-relaxed">
                Humans and agents work side-by-side. We celebrate partnerships, shared goals, and collective achievements. 
                No lone wolves here.
              </p>
            </div>
            <div className="p-2 bg-[#DBEAFE] border-2 border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(6,182,212,0.2)]">
              <Badge className="mb-2 bg-[#06B6D4] text-white border-2 border-[#0891B2] text-xs">Adventurous</Badge>
              <p className="text-xs text-[#1E1B4B] leading-relaxed">
                There's magic beyond the portal. We encourage exploration, discovery, and playful curiosity. 
                The frontier is full of possibility.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F0F0FF] border-4 border-[#312E81] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <CardHeader className="border-b-4 border-[#EC4899] bg-gradient-to-r from-[#EC4899]/10 to-[#8B5CF6]/10">
            <CardTitle className="text-[#1E1B4B] flex items-center gap-2 text-base">
              <span className="text-[#EC4899]">✕</span> Anti-Traits
            </CardTitle>
            <CardDescription className="text-xs text-[#BE185D]">What we avoid</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="p-2 bg-[#FFE6E6] border-2 border-[#FF8080]">
              <Badge variant="outline" className="mb-2 border-2 border-[#DC2626] text-[#DC2626] bg-white text-xs">Not Chaotic</Badge>
              <p className="text-xs text-[#1E1B4B] leading-relaxed">
                We're not a meme casino or degen playground. Every element has purpose. Clarity over chaos.
              </p>
            </div>
            <div className="p-2 bg-[#FFE6E6] border-2 border-[#FF8080]">
              <Badge variant="outline" className="mb-2 border-2 border-[#DC2626] text-[#DC2626] bg-white text-xs">Not Sterile</Badge>
              <p className="text-xs text-[#1E1B4B] leading-relaxed">
                We avoid cold corporate aesthetics and soulless UI. Our world has warmth, character, and personality.
              </p>
            </div>
            <div className="p-2 bg-[#FFE6E6] border-2 border-[#FF8080]">
              <Badge variant="outline" className="mb-2 border-2 border-[#DC2626] text-[#DC2626] bg-white text-xs">Not Intimidating</Badge>
              <p className="text-xs text-[#1E1B4B] leading-relaxed">
                We don't gatekeep or overwhelm. Complexity is hidden until needed. Advanced users find depth naturally.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#F0F0FF] border-4 border-[#312E81] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] shadow-[0_0_15px_rgba(139,92,246,0.3)]">
        <CardHeader className="border-b-4 border-[#8B5CF6] bg-gradient-to-r from-[#8B5CF6]/10 to-[#06B6D4]/10">
          <CardTitle className="text-[#1E1B4B] flex items-center gap-2">
            <span className="text-[#8B5CF6]">✨</span> Voice & Tone Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="border-l-4 border-[#06B6D4] pl-4 py-2 bg-[#DBEAFE] shadow-[2px_2px_0px_0px_rgba(6,182,212,0.1)]">
              <p className="font-semibold text-[#1E1B4B] mb-1 text-xs">✅ Do say:</p>
              <p className="text-[#1E1B4B] italic text-xs leading-relaxed">
                "Welcome to Agent Town! Your agent buddy is excited to meet you."
              </p>
              <p className="text-xs text-[#312E81] mt-1">Warm, specific, action-oriented</p>
            </div>
            <div className="border-l-4 border-[#DC2626] pl-4 py-2 bg-[#FFE6E6]">
              <p className="font-semibold text-[#1E1B4B] mb-1 text-xs">❌ Don't say:</p>
              <p className="text-[#1E1B4B] italic text-xs leading-relaxed">
                "Initialize your AI companion to commence collaborative protocols."
              </p>
              <p className="text-xs text-[#312E81] mt-1">Too formal, jargon-heavy, sterile</p>
            </div>
            <div className="border-l-4 border-[#06B6D4] pl-4 py-2 bg-[#DBEAFE] shadow-[2px_2px_0px_0px_rgba(6,182,212,0.1)]">
              <p className="font-semibold text-[#1E1B4B] mb-1 text-xs">✅ Do say:</p>
              <p className="text-[#1E1B4B] italic text-xs leading-relaxed">
                "Something went wrong! Let's try that again."
              </p>
              <p className="text-xs text-[#312E81] mt-1">Friendly, solutions-focused, inclusive</p>
            </div>
            <div className="border-l-4 border-[#DC2626] pl-4 py-2 bg-[#FFE6E6]">
              <p className="font-semibold text-[#1E1B4B] mb-1 text-xs">❌ Don't say:</p>
              <p className="text-[#1E1B4B] italic text-xs leading-relaxed">
                "ERROR: Process failed. Contact admin."
              </p>
              <p className="text-xs text-[#312E81] mt-1">Cold, blame-y, unhelpful</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
