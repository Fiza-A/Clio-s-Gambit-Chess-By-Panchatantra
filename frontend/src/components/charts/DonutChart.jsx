import React from 'react';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export default function DonutChart({ data, centerValue, centerLabel, variant }) {
  const isRoles = variant === 'roles';
  const chartSize = isRoles ? 200 : 230;
  const innerRadius = isRoles ? 58 : 68;
  const outerRadius = isRoles ? 86 : 100;

  return (
    <Flex
      className="donut-chart-layout"
      align="center"
      justify="space-between"
      gap={6}
      direction={{ base: 'column', md: 'row' }}
      w="100%"
      minW={0}
    >
      <Box
        className="donut-chart-area"
        flex={isRoles ? '0 0 auto' : '1'}
        flexShrink={0}
        w={isRoles ? `${chartSize}px` : '100%'}
        maxW={isRoles ? `${chartSize}px` : '100%'}
        minW={isRoles ? undefined : '220px'}
        h={`${chartSize}px`}
        position="relative"
        mx={isRoles ? { base: 'auto', md: 0 } : undefined}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={0}>
              {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <Box position="absolute" inset="0" display="grid" placeItems="center" pointerEvents="none">
          <Box textAlign="center">
            <Text fontFamily="Georgia,serif" fontSize={isRoles ? '24px' : '28px'} fontWeight="800">{centerValue}</Text>
            <Text fontSize="13px">{centerLabel}</Text>
          </Box>
        </Box>
      </Box>
      <VStack
        className="donut-chart-legend"
        align="stretch"
        spacing={3}
        flex="1"
        minW={0}
        w="100%"
        overflow="visible"
      >
        {data.map((item) => (
          <Flex key={item.name} justify="space-between" align="flex-start" gap={3} flexWrap="wrap" rowGap={1}>
            <Flex align="center" gap={2} minW={0} flex="1 1 120px">
              <Box flexShrink={0} w="10px" h="10px" borderRadius="50%" bg={item.color} />
              <Text fontWeight="800" fontSize="14px" whiteSpace="normal" wordBreak="break-word">{item.name}</Text>
            </Flex>
            <Text
              className="donut-legend-value"
              fontSize="13px"
              flexShrink={0}
              whiteSpace="normal"
              textAlign={{ base: 'left', md: 'right' }}
              pl={{ base: '18px', md: 0 }}
            >
              {item.value.toLocaleString()} ({item.percent})
            </Text>
          </Flex>
        ))}
      </VStack>
    </Flex>
  );
}
