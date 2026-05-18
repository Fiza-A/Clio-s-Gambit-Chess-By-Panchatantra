import React from 'react';
import { Box } from '@chakra-ui/react';
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function LineAreaChart({ data, lines, area = false, height = 270 }) {
  const Chart = area ? AreaChart : LineChart;
  return (
    <Box h={`${height}px`}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D6A84F" stopOpacity={0.34} />
              <stop offset="95%" stopColor="#D6A84F" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E9DFCA" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#111827' }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EADFC7' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          {lines.map((line, index) => area && index === 1 ? (
            <Area key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} fill="url(#goldFill)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#FFFDF8' }} />
          ) : (
            <Line key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#FFFDF8' }} />
          ))}
        </Chart>
      </ResponsiveContainer>
    </Box>
  );
}
