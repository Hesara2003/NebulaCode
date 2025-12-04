/* eslint-disable react/no-unescaped-entities */
'use client'
import { Activity, Map as MapIcon, MessageCircle } from 'lucide-react'
import DottedMap from 'dotted-map'
import { Area, AreaChart, CartesianGrid } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

export function FeaturesGrid() {
    return (
        <section className="py-32 bg-black relative z-20">
            <div className="mb-12 text-center max-w-3xl mx-auto px-6 relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 font-heading">
                    Infrastructure that <span className="text-red-500">scales with you</span>
                </h2>
                <p className="text-xl text-gray-400">
                    Built on a global edge network to ensure low latency and high availability for developers everywhere.
                </p>
            </div>
            <div className="mx-auto grid max-w-5xl border border-white/10 md:grid-cols-2 bg-black/20 rounded-3xl overflow-hidden px-0">
                <div>
                    <div className="p-6 sm:p-12">
                        <span className="text-muted-foreground flex items-center gap-2 text-gray-400">
                            <MapIcon className="size-4 text-red-500" />
                            Global Edge Network
                        </span>

                        <p className="mt-8 text-2xl font-semibold text-white">Low-latency connections from 35+ regions worldwide.</p>
                    </div>

                    <div aria-hidden className="relative">
                        <div className="absolute inset-0 z-10 m-auto size-fit">
                            <div className="rounded-[--radius] bg-black/80 backdrop-blur-md border border-white/10 relative flex size-fit w-fit items-center gap-2 px-3 py-1 text-xs font-medium shadow-md shadow-black/5 text-white">
                                <span className="text-lg text-green-500">●</span> Connected to fra1 (Frankfurt)
                            </div>
                            <div className="rounded-[--radius] bg-black/80 backdrop-blur-md border border-white/10 relative flex size-fit w-fit items-center gap-2 px-3 py-1 text-xs font-medium shadow-md shadow-black/5 text-white">
                                <span className="text-lg text-green-500">●</span> Connected to iad1 (N. Virginia)
                            </div>
                            <div className="rounded-[--radius] bg-black/50 absolute inset-2 -bottom-2 mx-auto border border-white/10 px-3 py-4 text-xs font-medium shadow-md shadow-black/5"></div>
                        </div>

                        <div className="relative overflow-hidden">
                            <div className="[background-image:radial-gradient(var(--tw-gradient-stops))] z-1 to-background absolute inset-0 from-transparent to-75%"></div>
                            <Map />
                        </div>
                    </div>
                </div>
                <div className="overflow-hidden border-t border-white/10 bg-black/20 p-6 sm:p-12 md:border-0 md:border-l">
                    <div className="relative z-10">
                        <span className="text-muted-foreground flex items-center gap-2 text-gray-400">
                            <MessageCircle className="size-4 text-red-500" />
                            24/7 Expert Support
                        </span>

                        <p className="my-8 text-2xl font-semibold text-white">Direct access to cloud engineers for mission-critical issues.</p>
                    </div>
                    <div aria-hidden className="flex flex-col gap-8">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="flex justify-center items-center size-5 rounded-full border border-white/10">
                                    <span className="size-3 rounded-full bg-red-500" />
                                </span>
                                <span className="text-muted-foreground text-xs text-gray-500">Sat 22 Feb</span>
                            </div>
                            <div className="rounded-lg bg-white/10 mt-1.5 w-3/5 border border-white/5 p-3 text-xs text-gray-300">Build failed with error 500 on deployment.</div>
                        </div>

                        <div>
                            <div className="rounded-lg mb-1 ml-auto w-3/5 bg-red-600 p-3 text-xs text-white">We've identified a config issue in your Dockerfile. Fix applied.</div>
                            <span className="text-muted-foreground block text-right text-xs text-gray-500">Just now</span>
                        </div>
                    </div>
                </div>
                <div className="col-span-full border-y border-white/10 p-12 bg-black/40">
                    <p className="text-center text-4xl font-semibold lg:text-7xl text-white">99.99% SLA</p>
                </div>
                <div className="relative col-span-full bg-black/20">
                    <div className="absolute z-10 max-w-lg px-6 pr-12 pt-6 md:px-12 md:pt-12">
                        <span className="text-muted-foreground flex items-center gap-2 text-gray-400">
                            <Activity className="size-4 text-red-500" />
                            Live Workspace Activity
                        </span>

                        <p className="my-8 text-2xl font-semibold text-white">
                            Real-time visibility into workspace usage. <span className="text-muted-foreground text-gray-500"> Track compute, memory, and active sessions.</span>
                        </p>
                    </div>
                    <MonitoringChart />
                </div>
            </div>
        </section>
    )
}

const map = new DottedMap({ height: 55, grid: 'diagonal' })

const points = map.getPoints()

const svgOptions = {
    backgroundColor: 'transparent',
    color: '#ef4444', // Red-500
    radius: 0.15,
}

const Map = () => {
    const viewBox = `0 0 120 60`
    return (
        <svg viewBox={viewBox} style={{ background: svgOptions.backgroundColor }} className="w-full h-full opacity-50">
            {points.map((point, index) => (
                <circle key={index} cx={point.x} cy={point.y} r={svgOptions.radius} fill={svgOptions.color} />
            ))}
        </svg>
    )
}

const chartConfig = {
    desktop: {
        label: 'Desktop',
        color: '#ef4444', // Red-500
    },
    mobile: {
        label: 'Mobile',
        color: '#3b82f6', // Blue-500
    },
} satisfies ChartConfig

const chartData = [
    { month: 'May', desktop: 56, mobile: 224 },
    { month: 'June', desktop: 56, mobile: 224 },
    { month: 'January', desktop: 126, mobile: 252 },
    { month: 'February', desktop: 205, mobile: 410 },
    { month: 'March', desktop: 200, mobile: 126 },
    { month: 'April', desktop: 400, mobile: 800 },
]

const MonitoringChart = () => {
    return (
        <ChartContainer className="h-120 aspect-auto md:h-96 w-full" config={chartConfig}>
            <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                    left: 0,
                    right: 0,
                }}>
                <defs>
                    <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                        <stop offset="55%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
                        <stop offset="55%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
                <ChartTooltip active cursor={false} content={<ChartTooltipContent className="dark:bg-black border-white/10 text-white" />} />
                <Area strokeWidth={2} dataKey="mobile" type="stepBefore" fill="url(#fillMobile)" fillOpacity={0.1} stroke="var(--color-mobile)" stackId="a" />
                <Area strokeWidth={2} dataKey="desktop" type="stepBefore" fill="url(#fillDesktop)" fillOpacity={0.1} stroke="var(--color-desktop)" stackId="a" />
            </AreaChart>
        </ChartContainer>
    )
}
