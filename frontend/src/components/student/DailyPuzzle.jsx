import React from 'react';
import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const pieces = ['♜','♞','♛','','♜','','♞','♜','','','','','♟','','','♟','','','','♟','','','','','','','','','','','','','','','','♙','','','','','','','♙','','♙','♙','♙','♙','♙','♙','♜','♘','♗','♕','♔','','♘','♜'];

export default function DailyPuzzle({ puzzle, onSolve }) {
  return (
    <Grid templateColumns={{ base: '1fr', md: '1.05fr .85fr' }} gap={4}>
      <Grid templateColumns="repeat(8, 1fr)" border="3px solid #22301e" borderRadius="8px" overflow="hidden" aspectRatio="1">
        {Array.from({ length: 64 }).map((_, i) => (
          <Flex key={i} bg={(Math.floor(i / 8) + i) % 2 === 0 ? '#F2E8C7' : '#779867'} align="center" justify="center" fontSize="22px" color="#07111F">{pieces[i]}</Flex>
        ))}
      </Grid>
      <Box>
        <Text fontFamily="Georgia,serif" fontSize="17px">{puzzle.side}</Text>
        <Text fontSize="13px" mt={1}>{puzzle.prompt}</Text>
        <Text mt={4} fontSize="13px">Difficulty</Text>
        <Text fontWeight="900">{puzzle.difficulty}</Text>
        <Text color="brand.goldDark" letterSpacing="3px" fontSize="28px">▁▃▄▅▆</Text>
        <Text mt={4} fontSize="13px">Rewards</Text>
        <Text fontWeight="900">💎 {puzzle.reward}</Text>
      </Box>
      <Button gridColumn={{ base: '1', md: '1 / -1' }} onClick={onSolve} bg="linear-gradient(135deg,#D6A84F,#B7812D)" color="brand.navy" rightIcon={<ArrowForwardIcon />}>Solve Puzzle</Button>
    </Grid>
  );
}
