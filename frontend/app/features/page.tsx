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
        {/* Hero Section */}
        <section className="relative z-20 pt-20 pb-10 text-center px-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              The Cloud IDE for <span className="text-red-500">Modern Teams</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Code, collaborate, and deploy from any device. Experience the power of a full development environment in your browser.
            </p>
          </div>
        </section>

        <div className="relative z-10">
          <FeaturesSection />
          <FeatureSection />
          <FeaturesGrid />
          <Features />
        </div>
      </div>
    </main>
  );
}
