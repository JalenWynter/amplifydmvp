
'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface UserGrowthChartProps {
  data: { month: string; users: number; reviewers: number }[];
}

export default function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
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
        <Line
          type="monotone"
          dataKey="users"
          stroke="#8884d8"
          strokeWidth={2}
          name="Total Users"
        />
        <Line
          type="monotone"
          dataKey="reviewers"
          stroke="#82ca9d"
          strokeWidth={2}
          name="Reviewers"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
