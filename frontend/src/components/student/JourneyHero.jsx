import React from 'react';
import { Box, Button, Flex, Heading, Progress, Text } from '@chakra-ui/react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function JourneyHero({ onContinue }) {
  return (
    <Box minH="292px" borderRadius="18px" p={7} color="white" position="relative" overflow="hidden" bg="radial-gradient(circle at 72% 35%,rgba(214,168,79,.42),transparent 18%),linear-gradient(110deg,rgba(7,17,31,.95),rgba(7,17,31,.72)),linear-gradient(135deg,#102214,#52351b)">
      <Text fontFamily="Georgia,serif" fontSize="18px" color="#F4D27A">Continue Your Journey</Text>
      <Heading mt={4} fontSize="34px">The Clever Jackal</Heading>
      <Text mt={2} fontFamily="Georgia,serif" fontSize="18px">Chapter 2: The Trap of Greed</Text>
      <Text mt={5} maxW="360px" fontSize="16px">Learn how patience and planning turn the simplest idea into victory.</Text>
      <Button mt={6} rightIcon={<ArrowForwardIcon />} onClick={onContinue} bg="linear-gradient(135deg,#fff0bd,#D6A84F)" color="brand.navy" _hover={{ filter: 'brightness(.95)' }}>Continue Story</Button>
      <Text position="absolute" right="66px" top="24px" fontSize="142px" opacity=".72">🦊</Text>
      <Text position="absolute" right="105px" bottom="26px" fontSize="52px" opacity=".72">♟ ♞ ♜ ♛</Text>
      <Box position="absolute" right="26px" bottom="26px" w="180px">
        <Progress value={75} h="6px" borderRadius="999px" bg="rgba(255,255,255,.25)" sx={{ '& > div': { background: '#F4D27A' } }} />
        <Text mt={1} textAlign="right" fontWeight="800">75% Complete</Text>
      </Box>
    </Box>
  );
}
