import React from 'react';
import { Grid, Skeleton, SkeletonText, VStack } from '@chakra-ui/react';

export default function LoadingState() {
  return (
    <VStack align="stretch" spacing={5}>
      <Skeleton h="50px" borderRadius="12px" />
      <Grid templateColumns={{ base: '1fr', md: 'repeat(5, 1fr)' }} gap={4}>
        {[1, 2, 3, 4, 5].map((n) => <Skeleton key={n} h="128px" borderRadius="18px" />)}
      </Grid>
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr 1fr' }} gap={5}>
        {[1, 2, 3].map((n) => <SkeletonText key={n} noOfLines={8} spacing={4} p={6} bg="white" borderRadius="18px" />)}
      </Grid>
    </VStack>
  );
}
