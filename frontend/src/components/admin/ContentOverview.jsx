import React from 'react';
import { Flex, Text, VStack } from '@chakra-ui/react';
import LayersIcon from '@mui/icons-material/Layers';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ExtensionIcon from '@mui/icons-material/Extension';

const icons = [LayersIcon, MenuBookIcon, AutoStoriesIcon, PsychologyIcon, ExtensionIcon];
const colors = ['#3B82F6', '#F2A51A', '#2F9E44', '#7C5CFF', '#D64545'];

export default function ContentOverview({ items }) {
  return (
    <VStack align="stretch" spacing={4}>
      {items.map((item, index) => {
        const Icon = icons[index];
        return (
          <Flex key={item.label} align="center" justify="space-between">
            <Flex align="center" gap={3}>
              <Flex w="30px" h="30px" borderRadius="9px" bg={`${colors[index]}18`} color={colors[index]} align="center" justify="center"><Icon style={{ fontSize: 18 }} /></Flex>
              <Text fontWeight="800" fontSize="14px">{item.label}</Text>
            </Flex>
            <Text fontWeight="900" fontSize="18px">{item.value}</Text>
          </Flex>
        );
      })}
    </VStack>
  );
}
