import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import BrandCore from './components/BrandCore';
import ColorSystem from './components/ColorSystem';
import TypographySystem from './components/TypographySystem';
import LogoDirection from './components/LogoDirection';
import IllustrationStyle from './components/IllustrationStyle';
import MotionGuide from './components/MotionGuide';
import UIStyleGuide from './components/UIStyleGuide';
import CharacterStyleGuide from './components/CharacterStyleGuide';
import AudioBrandNotes from './components/AudioBrandNotes';
import ContentTemplates from './components/ContentTemplates';
import HouseStyleGuide from './components/HouseStyleGuide';
import AccessibilityChecks from './components/AccessibilityChecks';
import AssetNaming from './components/AssetNaming';
import CompletenessChecklist from './components/CompletenessChecklist';
import logoImage from 'figma:asset/36b7b0b6d06708358983ef5c96ae066ab7bd675b.png';
import lobsterSheriff from 'figma:asset/bc7980315a9a000bf3a5e79801e960d811154cec.png';
import ladySheriff from 'figma:asset/22219a7af08e73559f32279fc814a0ed356121e8.png';

export default function App() {
  return (
    <div className="w-full h-full bg-[#6BA3D0] relative overflow-hidden" style={{ fontFamily: 'var(--font-pixel)' }}>
      {/* Pixel art cloud background */}
      <div className="absolute inset-0">
        {/* Animated clouds */}
        <div className="absolute top-10 left-[10%] w-24 h-16 bg-white/90 rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.6)] animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute top-32 right-[15%] w-32 h-20 bg-white/80 rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] animate-[float_25s_ease-in-out_infinite]"></div>
        <div className="absolute top-24 left-[45%] w-28 h-18 bg-white/85 rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.6)] animate-[float_30s_ease-in-out_infinite]"></div>
        <div className="absolute top-48 right-[40%] w-36 h-22 bg-white/75 rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] animate-[float_35s_ease-in-out_infinite]"></div>
        
        {/* Pixel grid overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 4px, #5890B8 4px, #5890B8 8px),
            repeating-linear-gradient(90deg, transparent, transparent 4px, #5890B8 4px, #5890B8 8px)
          `
        }}></div>
      </div>
      
      <div className="container mx-auto p-6 h-full relative z-10">
        {/* Retro game-style header */}
        <header className="mb-6 bg-[#F4A460] p-6 relative border-4 border-[#5D4E37] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#FFD4A0]"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-[#D48A40]"></div>
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src={logoImage} 
                alt="Agent Town Logo" 
                className="w-24 h-24 rounded-lg border-4 border-[#5D4E37] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] bg-[#FAEBD7]"
              />
            </div>
            {/* Text */}
            <div className="flex-1">
              <h1 className="text-3xl text-[#FFD95A] mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)] tracking-tight leading-relaxed">
                Agent Town
              </h1>
              <h2 className="text-base text-[#FAEBD7] drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)] tracking-tight leading-relaxed">
                Brand Guidelines
              </h2>
              <p className="text-xs text-[#FFE8CC] mt-3 leading-relaxed">
                Your trusty manual for our desert frontier
              </p>
            </div>
            {/* Town Bosses */}
            <div className="flex gap-3 flex-shrink-0">
              <div className="text-center">
                <img 
                  src={lobsterSheriff} 
                  alt="OpenClaw Sheriff" 
                  className="w-20 h-20 rounded-lg border-4 border-[#D2691E] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] bg-[#FAEBD7]"
                />
                <p className="text-[10px] text-[#FAEBD7] mt-1">OpenClaw</p>
              </div>
              <div className="text-center">
                <img 
                  src={ladySheriff} 
                  alt="ElizaOS Sheriff" 
                  className="w-20 h-20 rounded-lg border-4 border-[#8FBC8F] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] bg-[#FAEBD7]"
                />
                <p className="text-[10px] text-[#FAEBD7] mt-1">ElizaOS</p>
              </div>
            </div>
          </div>
        </header>

        <Tabs defaultValue="brand-core" className="h-[calc(100%-180px)]">
          {/* Pixel-styled tabs */}
          <ScrollArea className="w-full mb-4">
            <TabsList className="w-full justify-start flex-wrap h-auto bg-[#F4A460] p-2 border-4 border-[#5D4E37] gap-2">
              <TabsTrigger 
                value="brand-core"
                className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2"
              >
                Core
              </TabsTrigger>
              <TabsTrigger value="color" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                Color
              </TabsTrigger>
              <TabsTrigger value="typography" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                Type
              </TabsTrigger>
              <TabsTrigger value="logo" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                Logo
              </TabsTrigger>
              <TabsTrigger value="illustration" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                Art
              </TabsTrigger>
              <TabsTrigger value="motion" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                Motion
              </TabsTrigger>
              <TabsTrigger value="ui" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                UI
              </TabsTrigger>
              <TabsTrigger value="character" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                Character
              </TabsTrigger>
              <TabsTrigger value="audio" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                Audio
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                Content
              </TabsTrigger>
              <TabsTrigger value="house-style" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                Style
              </TabsTrigger>
              <TabsTrigger value="accessibility" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                A11y
              </TabsTrigger>
              <TabsTrigger value="naming" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                Naming
              </TabsTrigger>
              <TabsTrigger value="checklist" className="data-[state=active]:bg-[#FFD95A] data-[state=active]:text-[#5D4E37] bg-[#D48A40] text-[#FAEBD7] border-2 border-[#5D4E37] data-[state=active]:border-[#E5C14A] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.2)] text-xs px-3 py-2">
                ✓ List
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          <ScrollArea className="h-[calc(100%-80px)]">
            <div className="pr-4">
              <TabsContent value="brand-core">
                <BrandCore />
              </TabsContent>

              <TabsContent value="color">
                <ColorSystem />
              </TabsContent>

              <TabsContent value="typography">
                <TypographySystem />
              </TabsContent>

              <TabsContent value="logo">
                <LogoDirection />
              </TabsContent>

              <TabsContent value="illustration">
                <IllustrationStyle />
              </TabsContent>

              <TabsContent value="motion">
                <MotionGuide />
              </TabsContent>

              <TabsContent value="ui">
                <UIStyleGuide />
              </TabsContent>

              <TabsContent value="character">
                <CharacterStyleGuide />
              </TabsContent>

              <TabsContent value="audio">
                <AudioBrandNotes />
              </TabsContent>

              <TabsContent value="content">
                <ContentTemplates />
              </TabsContent>

              <TabsContent value="house-style">
                <HouseStyleGuide />
              </TabsContent>

              <TabsContent value="accessibility">
                <AccessibilityChecks />
              </TabsContent>

              <TabsContent value="naming">
                <AssetNaming />
              </TabsContent>

              <TabsContent value="checklist">
                <CompletenessChecklist />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}