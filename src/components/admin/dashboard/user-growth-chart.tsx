
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

const chartConfig = {
  users: {
    label: "New Users",
    color: "hsl(var(--chart-2))",
  },
  reviewers: {
    label: "New Reviewers",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function UserGrowthChart({ data }: { data: { month: string; users: number; reviewers: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-80">
      <BarChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="users" fill="var(--color-users)" radius={4} />
        <Bar dataKey="reviewers" fill="var(--color-reviewers)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
