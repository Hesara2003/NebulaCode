import Navbar from "@/components/Navbar";
import { FeaturesSection } from "@/components/ui/features-section";
import { FeaturesGrid } from "@/components/ui/features-grid";
import { Features } from "@/components/ui/features-5";

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-red-500 selection:text-white">
      <Navbar />
      
      <div className="pt-20">
        <FeaturesSection />
        <FeaturesGrid />
        <Features />
      </div>
    </main>
  );
}
