import React from 'react';
import { Cloud, Command, Cpu, Database, Globe, Server, Shield, Wifi } from 'lucide-react';

const brands = [
  { name: "TechCorp", icon: Cloud },
  { name: "InnovateX", icon: Command },
  { name: "DataFlow", icon: Database },
  { name: "NetScale", icon: Globe },
  { name: "SecureOps", icon: Shield },
  { name: "CloudNine", icon: Server },
  { name: "FutureSys", icon: Cpu },
  { name: "ConnectAI", icon: Wifi },
];

const BrandCarousel = () => {
  return (
    <div className="w-full overflow-hidden bg-black py-10 border-y border-white/5">
      <div className="relative w-full max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Trusted by industry leaders</p>
        </div>
        
        <div className="flex overflow-hidden relative mask-gradient">
          <div className="flex animate-marquee whitespace-nowrap gap-16 items-center">
            {/* First set of logos */}
            {brands.map((brand, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group cursor-pointer">
                <brand.icon size={32} className="group-hover:text-red-500 transition-colors" />
                <span className="text-xl font-bold font-heading">{brand.name}</span>
              </div>
            ))}
            
            {/* Duplicate set for seamless loop */}
            {brands.map((brand, index) => (
              <div key={`dup-${index}`} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group cursor-pointer">
                <brand.icon size={32} className="group-hover:text-red-500 transition-colors" />
                <span className="text-xl font-bold font-heading">{brand.name}</span>
              </div>
            ))}

             {/* Triplicate set for safety on wide screens */}
             {brands.map((brand, index) => (
              <div key={`tri-${index}`} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group cursor-pointer">
                <brand.icon size={32} className="group-hover:text-red-500 transition-colors" />
                <span className="text-xl font-bold font-heading">{brand.name}</span>
              </div>
            ))}
          </div>
          
          {/* Gradient Masks for Fade Effect */}
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default BrandCarousel;
