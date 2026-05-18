import React from 'react';
import { Badge, Button, Flex, Text, VStack } from '@chakra-ui/react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const art = { lion: '🦁', geese: '🪿', mongoose: '🦦' };

export default function RecommendedStories({ stories, onOpenStory, onExplore }) {
  return (
    <VStack align="stretch" spacing={3}>
      {stories.map((story) => (
        <Flex key={story.title} as="button" type="button" onClick={() => onOpenStory?.(story)} align="center" gap={3} textAlign="left" cursor="pointer">
          <Flex w="76px" h="58px" borderRadius="10px" bg="linear-gradient(135deg,#e7d5a4,#54735b)" align="center" justify="center" fontSize="34px">{art[story.art]}</Flex>
          <div style={{ flex: 1 }}>
            <Text fontWeight="900" fontSize="14px">{story.title}</Text>
            <Flex gap={2} mt={2} flexWrap="wrap">{story.tags.map((tag) => <Badge key={tag} bg="#FBF1D5" color="brand.text" borderRadius="8px">{tag}</Badge>)}<Text fontSize="12px">{story.chapter}</Text></Flex>
          </div>
          <ArrowForwardIcon />
        </Flex>
      ))}
      <Button variant="outline" rightIcon={<ArrowForwardIcon />} onClick={onExplore} borderColor="rgba(169,119,33,.2)" bg="#FFF7E8">Explore All Stories</Button>
    </VStack>
  );
}
