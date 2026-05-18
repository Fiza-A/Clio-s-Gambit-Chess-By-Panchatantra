import React, { useState } from 'react';
import { Box, Button, Flex, HStack, Text, useToast } from '@chakra-ui/react';
import ChessBoardMock from './ChessBoardMock.jsx';
import { studentApi } from '../../api/studentApi.js';

export default function PuzzlePlayer({ puzzle, onSolved }) {
  const [move, setMove] = useState({ from: '', to: '' });
  const toast = useToast();
  const submit = async () => {
    const result = await studentApi.submitPuzzle(puzzle.id, move);
    toast({ title: result.correct ? 'Correct move' : 'Try again', description: result.message, status: result.correct ? 'success' : 'warning' });
    if (result.correct) onSolved?.(result);
  };
  return (
    <Flex gap={6} direction={{ base: 'column', lg: 'row' }}>
      <ChessBoardMock onMove={(from, to) => setMove({ from, to })} />
      <Box>
        <Text fontWeight="900" fontSize="20px">{puzzle.title}</Text>
        <Text color="brand.muted">{puzzle.difficulty} · {puzzle.theme} · {puzzle.reward} points</Text>
        <Text mt={4}>Selected move: <b>{move.from && move.to ? `${move.from}-${move.to}` : 'Choose a piece and square'}</b></Text>
        <HStack mt={5} flexWrap="wrap">
          <Button onClick={() => toast({ title: 'Hint', description: puzzle.hint, status: 'info' })}>Hint</Button>
          <Button onClick={() => setMove({ from: '', to: '' })}>Reset</Button>
          <Button bg="brand.navy" color="white" onClick={submit}>Submit Move</Button>
        </HStack>
      </Box>
    </Flex>
  );
}
