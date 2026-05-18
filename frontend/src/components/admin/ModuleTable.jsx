import React from 'react';
import { Box, Flex, Grid, Progress, Text, VStack } from '@chakra-ui/react';

export default function ModuleTable({ modules }) {
  return (
    <VStack align="stretch" spacing={4}>
      <Grid templateColumns="1.5fr 1.1fr .8fr" color="brand.muted" fontSize="12px" fontWeight="800">
        <Text>Module</Text><Text>Completion Rate</Text><Text textAlign="right">Students</Text>
      </Grid>
      {modules.map((module) => (
        <Grid key={module.module} templateColumns="1.5fr 1.1fr .8fr" alignItems="center" gap={3}>
          <Text fontSize="13px" fontWeight="700">{module.module}</Text>
          <Flex align="center" gap={3}><Text fontSize="13px" fontWeight="800">{module.completion}%</Text><Box flex="1"><Progress value={module.completion} h="6px" borderRadius="999px" sx={{ '& > div': { background: '#2F9E44' } }} /></Box></Flex>
          <Text textAlign="right" fontSize="13px">{module.students}</Text>
        </Grid>
      ))}
    </VStack>
  );
}
