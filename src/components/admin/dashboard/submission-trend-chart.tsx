
'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"


const chartConfig = {
  pop: { label: "Pop", color: "hsl(var(--chart-1))" },
  rock: { label: "Rock/Indie", color: "hsl(var(--chart-2))" },
  hiphop: { label: "Hip-Hop/R&B", color: "hsl(var(--chart-3))" },
  electronic: { label: "Electronic", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

export default function SubmissionTrendChart({ data }: { data: any[] }) {
  return (
     <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-80">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="hiphop"
          type="natural"
          fill="var(--color-hiphop)"
          fillOpacity={0.4}
          stroke="var(--color-hiphop)"
          stackId="a"
        />
        <Area
          dataKey="rock"
          type="natural"
          fill="var(--color-rock)"
          fillOpacity={0.4}
          stroke="var(--color-rock)"
          stackId="a"
        />
        <Area
          dataKey="pop"
          type="natural"
          fill="var(--color-pop)"
          fillOpacity={0.4}
          stroke="var(--color-pop)"
          stackId="a"
        />
         <Area
          dataKey="electronic"
          type="natural"
          fill="var(--color-electronic)"
          fillOpacity={0.4}
          stroke="var(--color-electronic)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
