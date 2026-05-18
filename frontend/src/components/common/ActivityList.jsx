import React from 'react';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ExtensionIcon from '@mui/icons-material/Extension';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DiamondIcon from '@mui/icons-material/Diamond';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const iconMap = { person: PersonAddIcon, book: MenuBookIcon, puzzle: ExtensionIcon, school: SchoolIcon, trophy: EmojiEventsIcon, diamond: DiamondIcon, calendar: CalendarMonthIcon };
const colors = ['#2F9E44', '#F2994A', '#7C5CFF', '#3B82F6', '#D6A84F'];

export default function ActivityList({ items }) {
  return (
    <VStack spacing={3} align="stretch">
      {items.map((item, index) => {
        const Icon = iconMap[item.icon] || ExtensionIcon;
        return (
          <Flex key={`${item.title}-${index}`} gap={3} align="center">
            <Flex w="34px" h="34px" borderRadius="10px" bg={`${colors[index % colors.length]}18`} color={colors[index % colors.length]} align="center" justify="center">
              <Icon style={{ fontSize: 19 }} />
            </Flex>
            <Box flex="1" minW={0}>
              <Text fontSize="13px" fontWeight="800" noOfLines={1}>{item.title}</Text>
              {item.detail && <Text fontSize="12px" color="brand.muted" noOfLines={1}>{item.detail}</Text>}
            </Box>
            <Text fontSize="11px" color="brand.muted" whiteSpace="nowrap">{item.time}</Text>
          </Flex>
        );
      })}
    </VStack>
  );
}
