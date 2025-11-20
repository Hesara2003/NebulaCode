import { Activity, DraftingCompass, Mail, Zap } from 'lucide-react'

export function Features() {
    return (
        <section className="py-32 bg-black relative z-20">
            <div className="container mx-auto max-w-5xl px-6 relative z-10">
                <div className="grid items-center gap-12 md:grid-cols-2 md:gap-12 lg:grid-cols-5 lg:gap-24">
                    <div className="lg:col-span-2">
                        <div className="md:pr-6 lg:pr-0">
                            <h2 className="text-4xl font-semibold lg:text-5xl text-white">Built for Scaling teams</h2>
                            <p className="mt-6 text-gray-400">Orrupti aut temporibus assumenda atque ab, accusamus sit, molestiae veniam laboriosam pariatur.</p>
                        </div>
                        <ul className="mt-8 divide-y divide-white/10 border-y border-white/10 text-white *:flex *:items-center *:gap-3 *:py-3">
                            <li>
                                <Mail className="size-5" />
                                Email and web support
                            </li>
                            <li>
                                <Zap className="size-5" />
                                Fast response time
                            </li>
                            <li>
                                <Activity className="size-5" />
                                Menitoring and analytics
                            </li>
                            <li>
                                <DraftingCompass className="size-5" />
                                Architectural review
                            </li>
                        </ul>
                    </div>
                    <div className="border-white/10 relative rounded-3xl border p-3 lg:col-span-3">
                        <div className="bg-gradient-to-b aspect-76/59 relative rounded-2xl from-zinc-300 to-transparent p-px dark:from-zinc-700">
                                <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1207&h=929&fit=crop" className="hidden rounded-[15px] dark:block z-10" alt="payments illustration dark" width={1207} height={929} />
                                <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1207&h=929&fit=crop" className="rounded-[15px] shadow dark:hidden z-10" alt="payments illustration light" width={1207} height={929} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}