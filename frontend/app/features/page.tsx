import Navbar from "@/components/Navbar";
import { FeaturesSection } from "@/components/ui/features-section";
import { FeaturesGrid } from "@/components/ui/features-grid";
import { Features } from "@/components/ui/features-5";
import FeatureSection from "@/components/ui/feature-section";

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-red-500 selection:text-white">
      <Navbar />
      
      <div className="pt-20 relative">
        {/* subtle dotted background pattern */}

        <div className="relative z-10">
          <FeaturesSection />
          <FeaturesGrid />
          <Features />
          <FeatureSection />
        </div>
      </div>
    </main>
  );
}
