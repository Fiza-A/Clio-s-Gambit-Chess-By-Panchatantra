import React from 'react';
import { Box, Button, Flex, HStack, Heading, Input, Popover, PopoverArrow, PopoverBody, PopoverContent, PopoverTrigger, Text } from '@chakra-ui/react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import NotificationPopover from '../common/NotificationPopover.jsx';
import UserMenu from '../common/UserMenu.jsx';

export default function TopBar({ role, title, subtitle, cta, onCta }) {
  const isStudent = role === 'student';
  return (
    <Flex align={{ base: 'flex-start', xl: 'center' }} justify="space-between" gap={4} mb={6} direction={{ base: 'column', xl: 'row' }}>
      <Box>
        <Heading fontSize={{ base: '28px', md: '34px' }}>{title}</Heading>
        <Text color="brand.text" mt={1}>{subtitle}</Text>
      </Box>
      <HStack spacing={{ base: 3, md: 5 }} flexWrap="wrap">
        {isStudent ? (
          <>
            <HStack><Text fontSize="28px">🔥</Text><Box><Text fontWeight="900" fontSize="20px">12</Text><Text fontSize="12px">Day Streak</Text></Box></HStack>
            <HStack><Text fontSize="28px">💎</Text><Box><Text fontWeight="900" fontSize="20px">1850</Text><Text fontSize="12px">Academy Points</Text></Box></HStack>
          </>
        ) : (
          <Popover>
            <PopoverTrigger>
              <Button variant="outline" leftIcon={<CalendarMonthIcon />} rightIcon={<KeyboardArrowDownIcon />} bg="rgba(255,253,248,.72)" borderColor="rgba(169,119,33,.16)">May 25, 2025</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverBody><Input type="month" defaultValue="2025-05" aria-label="Choose dashboard month" /></PopoverBody>
            </PopoverContent>
          </Popover>
        )}
        <NotificationPopover />
        {isStudent ? (
          <UserMenu />
        ) : (
          <>
            <UserMenu />
            <Button bg="brand.navy" color="white" leftIcon={role === 'admin' ? <DownloadIcon /> : <AddIcon />} px={6} onClick={onCta} _hover={{ bg: 'brand.goldDark' }}>{cta}</Button>
          </>
        )}
      </HStack>
    </Flex>
  );
}
