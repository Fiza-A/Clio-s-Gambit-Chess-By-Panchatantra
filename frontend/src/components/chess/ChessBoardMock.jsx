import React, { useState } from 'react';
import { Grid, Flex } from '@chakra-ui/react';

const pieces = ['r','n','b','q','k','b','n','r','p','p','p','','','p','p','p','','','','p','','','','','','','','','P','','','','','','','','','','','','P','P','P','','','P','P','P','R','N','B','Q','K','B','N','R'];

export default function ChessBoardMock({ onMove }) {
  const [from, setFrom] = useState('');
  const files = ['a','b','c','d','e','f','g','h'];
  const click = (index) => {
    const square = `${files[index % 8]}${8 - Math.floor(index / 8)}`;
    if (!from && pieces[index]) setFrom(square);
    else {
      onMove?.(from, square);
      setFrom('');
    }
  };
  return (
    <Grid templateColumns="repeat(8, 1fr)" border="3px solid #22301e" borderRadius="8px" overflow="hidden" aspectRatio="1" maxW="430px">
      {Array.from({ length: 64 }).map((_, i) => {
        const square = `${files[i % 8]}${8 - Math.floor(i / 8)}`;
        return (
          <Flex key={square} as="button" type="button" onClick={() => click(i)} bg={from === square ? '#F4D27A' : (Math.floor(i / 8) + i) % 2 === 0 ? '#F2E8C7' : '#779867'} align="center" justify="center" fontSize="24px" color="#07111F" aria-label={`Square ${square}`}>
            {pieces[i]}
          </Flex>
        );
      })}
    </Grid>
  );
}
