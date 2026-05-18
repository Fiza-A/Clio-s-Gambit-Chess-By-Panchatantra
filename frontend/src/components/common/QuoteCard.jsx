import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

export default function QuoteCard({ quote, by, dark = true, banner = false }) {
  return (
    <Box
      bg={dark ? 'linear-gradient(135deg, #07111F, #0b1727)' : 'rgba(255,246,222,.82)'}
      color={dark ? 'white' : 'brand.text'}
      borderRadius="16px"
      border="1px solid rgba(214,168,79,.25)"
      p={banner ? 5 : 4}
      position="relative"
      overflow="hidden"
    >
      <Box position="absolute" right="22px" bottom="-16px" fontSize={banner ? '74px' : '58px'} opacity={dark ? 0.45 : 0.65}>♜♛♚</Box>
      <Flex align="center" gap={4} position="relative">
        {banner && <Flex w="58px" h="58px" borderRadius="50%" bg="rgba(214,168,79,.16)" align="center" justify="center" fontSize="32px">♔</Flex>}
        <Box>
          <Text fontFamily="Georgia, serif" fontSize={banner ? '22px' : '16px'} lineHeight="1.45">“{quote}”</Text>
          <Text mt={2} fontSize="13px" color={dark ? 'rgba(255,255,255,.78)' : 'brand.muted'}>– {by}</Text>
        </Box>
      </Flex>
    </Box>
  );
}
