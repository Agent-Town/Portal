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
    <div className="w-full h-full bg-gradient-to-b from-[#1E1B4B] via-[#312E81] to-[#1E1B4B] relative overflow-hidden" style={{ fontFamily: 'var(--font-pixel)' }}>
      {/* Magical starfield and energy particles */}
      <div className="absolute inset-0">
        {/* Floating energy particles */}
        <div className="absolute top-10 left-[10%] w-3 h-3 bg-[#06B6D4] rounded-full shadow-[0_0_10px_#06B6D4] animate-[float_15s_ease-in-out_infinite]"></div>
        <div className="absolute top-32 right-[15%] w-2 h-2 bg-[#EC4899] rounded-full shadow-[0_0_8px_#EC4899] animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute top-24 left-[45%] w-4 h-4 bg-[#8B5CF6] rounded-full shadow-[0_0_12px_#8B5CF6] animate-[float_18s_ease-in-out_infinite]"></div>
        <div className="absolute top-48 right-[40%] w-2 h-2 bg-[#06B6D4] rounded-full shadow-[0_0_8px_#06B6D4] animate-[float_22s_ease-in-out_infinite]"></div>
        <div className="absolute top-64 left-[25%] w-3 h-3 bg-[#EC4899] rounded-full shadow-[0_0_10px_#EC4899] animate-[float_25s_ease-in-out_infinite]"></div>
        <div className="absolute top-80 right-[60%] w-2 h-2 bg-[#8B5CF6] rounded-full shadow-[0_0_8px_#8B5CF6] animate-[float_17s_ease-in-out_infinite]"></div>
        
        {/* Stars */}
        <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full opacity-80"></div>
        <div className="absolute top-[25%] right-[30%] w-1 h-1 bg-white rounded-full opacity-60"></div>
        <div className="absolute top-[45%] left-[60%] w-1 h-1 bg-white rounded-full opacity-90"></div>
        <div className="absolute top-[65%] right-[15%] w-1 h-1 bg-white rounded-full opacity-70"></div>
        <div className="absolute top-[35%] left-[80%] w-1 h-1 bg-white rounded-full opacity-85"></div>
        
        {/* Pixel grid overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 4px, #8B5CF6 4px, #8B5CF6 8px),
            repeating-linear-gradient(90deg, transparent, transparent 4px, #8B5CF6 4px, #8B5CF6 8px)
          `
        }}></div>
      </div>
      
      <div className="container mx-auto p-6 h-full relative z-10">
        {/* Retro game-style header */}
        <header className="mb-6 bg-[#8B5CF6] p-6 relative border-4 border-[#312E81] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] shadow-[0_0_20px_rgba(139,92,246,0.5)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#06B6D4] via-[#EC4899] to-[#06B6D4]"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#EC4899]"></div>
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src={logoImage} 
                alt="Agent Town Logo" 
                className="w-24 h-24 rounded-lg border-4 border-[#06B6D4] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] shadow-[0_0_15px_rgba(6,182,212,0.6)] bg-[#F0F0FF]"
              />
            </div>
            {/* Text */}
            <div className="flex-1">
              <h1 className="text-3xl text-[#FFD95A] mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)] drop-shadow-[0_0_10px_rgba(255,217,90,0.5)] tracking-tight leading-relaxed">
                Agent Town
              </h1>
              <h2 className="text-base text-[#F0F0FF] drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)] tracking-tight leading-relaxed">
                Brand Guidelines
              </h2>
              <p className="text-xs text-[#D4D4FF] mt-3 leading-relaxed">
                Your guide through the portal frontier
              </p>
            </div>
            {/* Town Bosses */}
            <div className="flex gap-3 flex-shrink-0">
              <div className="text-center">
                <img 
                  src={lobsterSheriff} 
                  alt="OpenClaw Sheriff" 
                  className="w-20 h-20 rounded-lg border-4 border-[#EC4899] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] shadow-[0_0_15px_rgba(236,72,153,0.5)] bg-[#F0F0FF]"
                />
                <p className="text-[10px] text-[#F0F0FF] mt-1">OpenClaw</p>
              </div>
              <div className="text-center">
                <img 
                  src={ladySheriff} 
                  alt="ElizaOS Sheriff" 
                  className="w-20 h-20 rounded-lg border-4 border-[#06B6D4] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] shadow-[0_0_15px_rgba(6,182,212,0.5)] bg-[#F0F0FF]"
                />
                <p className="text-[10px] text-[#F0F0FF] mt-1">ElizaOS</p>
              </div>
            </div>
          </div>
        </header>

        <Tabs defaultValue="brand-core" className="h-[calc(100%-180px)]">
          {/* Pixel-styled tabs */}
          <ScrollArea className="w-full mb-4">
            <TabsList className="w-full justify-start flex-wrap h-auto bg-[#312E81] p-2 border-4 border-[#1E1B4B] gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <TabsTrigger 
                value="brand-core"
                className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2"
              >
                Core
              </TabsTrigger>
              <TabsTrigger value="color" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                Color
              </TabsTrigger>
              <TabsTrigger value="typography" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                Type
              </TabsTrigger>
              <TabsTrigger value="logo" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                Logo
              </TabsTrigger>
              <TabsTrigger value="illustration" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                Art
              </TabsTrigger>
              <TabsTrigger value="motion" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                Motion
              </TabsTrigger>
              <TabsTrigger value="ui" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                UI
              </TabsTrigger>
              <TabsTrigger value="character" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                Character
              </TabsTrigger>
              <TabsTrigger value="audio" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                Audio
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                Content
              </TabsTrigger>
              <TabsTrigger value="house-style" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                Style
              </TabsTrigger>
              <TabsTrigger value="accessibility" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                A11y
              </TabsTrigger>
              <TabsTrigger value="naming" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
                Naming
              </TabsTrigger>
              <TabsTrigger value="checklist" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white bg-[#1E1B4B] text-[#D4D4FF] border-2 border-[#312E81] data-[state=active]:border-[#06B6D4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] data-[state=active]:shadow-[0_0_10px_rgba(139,92,246,0.5)] text-xs px-3 py-2">
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