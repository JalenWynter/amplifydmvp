
'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface SubmissionTrendChartProps {
  data: { month: string; pop: number; rock: number; hiphop: number; electronic: number }[];
}

export default function SubmissionTrendChart({ data }: SubmissionTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip />
        <Bar dataKey="pop" fill="#8884d8" name="Pop" />
        <Bar dataKey="rock" fill="#82ca9d" name="Rock/Indie" />
        <Bar dataKey="hiphop" fill="#ffc658" name="Hip-Hop/R&B" />
        <Bar dataKey="electronic" fill="#ff7300" name="Electronic" />
      </BarChart>
    </ResponsiveContainer>
  );
}
