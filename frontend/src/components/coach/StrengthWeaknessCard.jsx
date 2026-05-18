import React from 'react';
import { Grid, Box, Text, VStack, Flex } from '@chakra-ui/react';
import ProgressMetric from '../common/ProgressMetric.jsx';

export default function StrengthWeaknessCard({ strengths, weaknesses }) {
  return (
    <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
      <Box>
        <Text fontWeight="900" fontSize="14px" mb={4}>Top Strengths</Text>
        <VStack align="stretch" spacing={4}>{strengths.map((item) => <ProgressMetric key={item.label} label={item.label} value={item.value} />)}</VStack>
        <Flex mt={5} p={3} bg="#EEF8EE" borderRadius="12px" color="brand.success" fontSize="13px" fontWeight="700">Great progress in tactics! Keep challenging them.</Flex>
      </Box>
      <Box>
        <Text fontWeight="900" fontSize="14px" mb={4}>Areas to Improve</Text>
        <VStack align="stretch" spacing={4}>{weaknesses.map((item) => <ProgressMetric key={item.label} label={item.label} value={item.value} color="#D64545" />)}</VStack>
        <Flex mt={5} p={3} bg="#FFF0F0" borderRadius="12px" color="brand.danger" fontSize="13px" fontWeight="700">Focus on openings and time management in upcoming classes.</Flex>
      </Box>
    </Grid>
  );
}
