import React from 'react';
import { Box } from '@chakra-ui/react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';

export default function RadarIdentityChart({ data }) {
  return (
    <Box h="260px">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius={95}>
          <PolarGrid stroke="rgba(255,255,255,.35)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#fff', fontSize: 12 }} />
          <Radar dataKey="value" stroke="#F4D27A" fill="#D6A84F" fillOpacity={0.48} />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
}
