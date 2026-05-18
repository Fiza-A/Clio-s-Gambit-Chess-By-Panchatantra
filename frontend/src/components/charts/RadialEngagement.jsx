import React from 'react';
import { Box, CircularProgress, CircularProgressLabel, Text } from '@chakra-ui/react';

export default function RadialEngagement({ score }) {
  return (
    <Box textAlign="center" py={2}>
      <CircularProgress value={score} size="170px" thickness="9px" color="brand.success" trackColor="rgba(47,158,68,.13)">
        <CircularProgressLabel>
          <Text fontFamily="Georgia,serif" fontSize="30px" fontWeight="900">{score}%</Text>
          <Text fontSize="12px">Engagement Score</Text>
        </CircularProgressLabel>
      </CircularProgress>
    </Box>
  );
}
