import React from 'react';
import { Box, Flex, Text, Heading, Progress } from '@chakra-ui/react';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DiamondIcon from '@mui/icons-material/Diamond';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ExtensionIcon from '@mui/icons-material/Extension';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

const icons = {
  groups: GroupsIcon,
  school: SchoolIcon,
  calendar: CalendarMonthIcon,
  analytics: AnalyticsIcon,
  diamond: DiamondIcon,
  book: MenuBookIcon,
  puzzle: ExtensionIcon,
  trophy: EmojiEventsIcon,
  target: TrackChangesIcon,
};

const palettes = {
  purple: ['#7C5CFF', '#EFEAFF'],
  green: ['#2F9E44', '#E9F7ED'],
  gold: ['#D6A84F', '#FFF5DD'],
  red: ['#D64545', '#FFEDED'],
  blue: ['#3B82F6', '#EAF3FF'],
};

export default function StatCard({ stat }) {
  const Icon = icons[stat.icon] || AnalyticsIcon;
  const [fg, bg] = palettes[stat.color] || palettes.gold;
  return (
    <Box className="card-hover" bg="brand.card" border="1px solid rgba(169,119,33,.14)" borderRadius="18px" p={5} boxShadow="0 12px 28px rgba(17,24,39,.055)">
      <Flex justify="space-between" align="center" gap={4}>
        <Box>
          <Text fontSize="13px" fontWeight="800" color="brand.text">{stat.label}</Text>
          <Heading size="lg" mt={2}>{stat.value}</Heading>
          {stat.trend && (
            <Flex color="brand.success" mt={2} fontSize="12px" align="center" gap={1}>
              <ArrowUpwardIcon style={{ fontSize: 14 }} />
              <Text>{stat.trend.replace(/^\+/, '')}</Text>
            </Flex>
          )}
          {stat.subtitle && <Text color="brand.muted" mt={2} fontSize="12px">{stat.subtitle}</Text>}
        </Box>
        <Flex w="58px" h="58px" borderRadius="50%" bg={bg} color={fg} align="center" justify="center" flexShrink={0}>
          <Icon />
        </Flex>
      </Flex>
      {stat.progress !== undefined && <Progress value={stat.progress} mt={4} h="7px" borderRadius="999px" sx={{ '& > div': { background: '#D6A84F' } }} />}
    </Box>
  );
}
