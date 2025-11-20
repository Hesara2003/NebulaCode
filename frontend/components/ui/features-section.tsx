import { Cpu, Lock, Sparkles, Zap } from 'lucide-react'

export function FeaturesSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-12 px-6">
                <div className="relative z-10 grid items-center gap-4 md:grid-cols-2 md:gap-12">
                    <h2 className="text-4xl font-semibold">The NebulaCode ecosystem brings together our models</h2>
                    <p className="max-w-sm sm:ml-auto text-gray-400">Empower your team with workflows that adapt to your needs, whether you prefer git synchronization or an AI Agents interface.</p>
                </div>
                <div className="relative rounded-3xl p-3 md:-mx-8 lg:col-span-3 bg-white/5 border border-white/10">
                    <div className="aspect-[88/36] relative overflow-hidden rounded-2xl">
                        <div className="bg-gradient-to-t z-10 from-black/50 absolute inset-0 to-transparent"></div>
                        <img 
                            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
                            className="absolute inset-0 z-0 w-full h-full object-cover opacity-80" 
                            alt="NebulaCode Interface" 
                        />
                        <div className="absolute inset-0 z-20 flex items-center justify-center">
                            <div className="bg-black/80 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-2xl max-w-md text-center">
                                <div className="flex gap-2 justify-center mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500"/>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                                    <div className="w-3 h-3 rounded-full bg-green-500"/>
                                </div>
                                <div className="font-mono text-sm text-green-400 mb-2">$ docker-compose up -d</div>
                                <div className="font-mono text-sm text-gray-300">Starting NebulaCode services...</div>
                                <div className="font-mono text-sm text-gray-300">Containerizing workspace...</div>
                                <div className="font-mono text-sm text-blue-400">Ready in 1.2s</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Zap className="size-4 text-yellow-500" />
                            <h3 className="text-sm font-medium">Lightning Fast</h3>
                        </div>
                        <p className="text-muted-foreground text-sm text-gray-400">Instant startup times with pre-warmed containers. Code in seconds, not minutes.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Cpu className="size-4 text-purple-500" />
                            <h3 className="text-sm font-medium">Powerful Compute</h3>
                        </div>
                        <p className="text-muted-foreground text-sm text-gray-400">Scale up to 64 cores and 128GB RAM per workspace. Handle any workload.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Lock className="size-4 text-green-500" />
                            <h3 className="text-sm font-medium">Enterprise Security</h3>
                        </div>
                        <p className="text-muted-foreground text-sm text-gray-400">SOC2 compliant, end-to-end encryption, and isolated sandboxes for every user.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-blue-500" />
                            <h3 className="text-sm font-medium">AI Powered</h3>
                        </div>
                        <p className="text-muted-foreground text-sm text-gray-400">Integrated LLMs understand your codebase and help you write better code faster.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
