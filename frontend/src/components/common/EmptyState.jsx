import React from 'react';
import { Box, Button, Heading, Text } from '@chakra-ui/react';

export default function EmptyState({ title = 'No records found', message = 'Try changing filters or adding a new item.', actionLabel, onAction }) {
  return (
    <Box border="1px dashed rgba(169,119,33,.35)" borderRadius="16px" p={8} textAlign="center" bg="rgba(255,253,248,.7)">
      <Heading size="sm">{title}</Heading>
      <Text color="brand.muted" mt={2}>{message}</Text>
      {actionLabel && <Button mt={4} onClick={onAction} bg="brand.navy" color="white">{actionLabel}</Button>}
    </Box>
  );
}
