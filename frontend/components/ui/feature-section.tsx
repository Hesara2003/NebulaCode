"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Bell,
  DollarSign,
  Users,
  Share2,
  FileBarChart,
} from "lucide-react";

const tasks = [
  {
    title: "AI code completion",
    subtitle: "Intelligent suggestions as you type",
    icon: <Bell className="w-4 h-4 text-red-500" />,
  },
  {
    title: "Automated testing",
    subtitle: "Run tests with every commit",
    icon: <DollarSign className="w-4 h-4 text-red-500" />,
  },
  {
    title: "Code review automation",
    subtitle: "AI-powered code analysis",
    icon: <Users className="w-4 h-4 text-red-500" />,
  },
  {
    title: "Deployment pipelines",
    subtitle: "One-click cloud deployments",
    icon: <Share2 className="w-4 h-4 text-red-500" />,
  },
  {
    title: "Performance monitoring",
    subtitle: "Real-time app analytics",
    icon: <FileBarChart className="w-4 h-4 text-red-500" />,
  },
];

export default function FeatureSection() {
  return (
    <section className="py-32 bg-black relative z-20 text-white">
      <div className="container mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 items-center gap-12 px-6 relative z-10">
        {/* LEFT SIDE - Task Loop with Vertical Bar */}
        <div className="relative w-full max-w-sm">
          <Card className="overflow-hidden bg-black/80 backdrop-blur-md shadow-xl rounded-lg border border-white/10">
            <CardContent className="relative h-[320px] p-0 overflow-hidden">
              {/* Scrollable Container */}
              <div className="relative h-full overflow-hidden">
                {/* Motion list */}
                <motion.div
                  className="flex flex-col gap-2 absolute w-full"
                  animate={{ y: ["0%", "-50%"] }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 14,
                    ease: "linear",
                  }}
                >
                  {[...tasks, ...tasks].map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 relative"
                    >
                      {/* Icon + Content */}
                      <div className="flex items-center justify-between flex-1">
                        <div className="flex items-center gap-2">
                          <div className="bg-black/50 w-10 h-10 rounded-xl shadow-md flex items-center justify-center">
                            {task.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{task.title}</p>
                            <p className="text-xs text-gray-500">{task.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Fade effect only inside card */}
                <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-black/80 via-black/60 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-black/80 via-black/60 to-transparent pointer-events-none" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE - Content */}
        <div className="space-y-6">
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            Development Automation
          </Badge>
          <h3 className="text-lg sm:text-md lg:text-2xl font-normal text-white leading-relaxed">
            Automate development workflows {" "}
            <span className="text-gray-400 text-sm sm:text-base lg:text-2xl">we help you
              streamline coding with AI-driven automation — from code completion and
              testing to deployment and monitoring. Our cloud platform reduces
              development time, eliminates errors, and scales with your team's needs.</span>
          </h3>

          <div className="flex gap-3 flex-wrap">
            <Badge className="px-4 py-2 text-sm bg-red-500">AI Code Assistant</Badge>
            <Badge className="px-4 py-2 text-sm bg-red-500">Auto Deploy</Badge>
            <Badge className="px-4 py-2 text-sm bg-red-500">Cloud Ready</Badge>
          </div>
        </div>
      </div>
    </section>
  );
}