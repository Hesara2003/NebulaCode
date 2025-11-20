import Navbar from "@/components/Navbar";
import { Pricing } from "@/components/ui/pricing";

const pricingPlans = [
  {
    name: "HOBBY",
    price: "0",
    yearlyPrice: "0",
    period: "per month",
    features: [
      "Up to 3 active workspaces",
      "2 CPU cores / 4GB RAM",
      "Community Support",
      "Public Repositories only",
    ],
    description: "Perfect for side projects and learning",
    buttonText: "Get Started",
    href: "/editor",
    isPopular: false,
  },
  {
    name: "PRO",
    price: "29",
    yearlyPrice: "24",
    period: "per month",
    features: [
      "Unlimited workspaces",
      "4 CPU cores / 8GB RAM",
      "Priority Support",
      "Private Repositories",
      "AI Assistant (Unlimited)",
    ],
    description: "For professional developers and freelancers",
    buttonText: "Start Free Trial",
    href: "/editor",
    isPopular: true,
  },
  {
    name: "TEAM",
    price: "99",
    yearlyPrice: "79",
    period: "per month",
    features: [
      "Everything in Pro",
      "8 CPU cores / 16GB RAM",
      "Dedicated Support",
      "SSO & Audit Logs",
      "Team Management",
    ],
    description: "For teams building production software",
    buttonText: "Contact Sales",
    href: "/editor",
    isPopular: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-purple-500 selection:text-white">
      <Navbar />
      
      <div className="pt-20">
        <Pricing 
          plans={pricingPlans}
          title="Simple, Transparent Pricing"
          description="Start for free, upgrade as you grow. No hidden fees."
        />
      </div>
    </main>
  );
}

