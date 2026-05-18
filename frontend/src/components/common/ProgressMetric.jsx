import React from 'react';
import { Box, Flex, Progress, Text } from '@chakra-ui/react';

export default function ProgressMetric({ label, value, color = 'brand.success' }) {
  return (
    <Box>
      <Flex justify="space-between" mb={2}>
        <Text fontSize="13px" fontWeight="700">{label}</Text>
        <Text fontSize="13px" fontWeight="800">{value}%</Text>
      </Flex>
      <Progress value={value} h="7px" borderRadius="999px" bg="rgba(17,24,39,.08)" sx={{ '& > div': { background: color } }} />
    </Box>
  );
}
