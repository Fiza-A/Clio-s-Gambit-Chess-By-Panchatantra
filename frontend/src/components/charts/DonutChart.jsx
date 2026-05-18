import React from 'react';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export default function DonutChart({ data, centerValue, centerLabel }) {
  return (
    <Flex align="center" gap={5} direction={{ base: 'column', md: 'row' }}>
      <Box h="230px" flex="1" minW="220px" position="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={68} outerRadius={100} paddingAngle={0}>
              {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <Box position="absolute" inset="0" display="grid" placeItems="center" pointerEvents="none">
          <Box textAlign="center">
            <Text fontFamily="Georgia,serif" fontSize="28px" fontWeight="800">{centerValue}</Text>
            <Text fontSize="13px">{centerLabel}</Text>
          </Box>
        </Box>
      </Box>
      <VStack align="stretch" spacing={3} flex="1">
        {data.map((item) => (
          <Flex key={item.name} justify="space-between" gap={4}>
            <Flex align="center" gap={2}><Box w="10px" h="10px" borderRadius="50%" bg={item.color} /><Text fontWeight="800" fontSize="14px">{item.name}</Text></Flex>
            <Text fontSize="13px">{item.value.toLocaleString()} ({item.percent})</Text>
          </Flex>
        ))}
      </VStack>
    </Flex>
  );
}
