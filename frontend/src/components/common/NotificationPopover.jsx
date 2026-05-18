import React from 'react';
import { Badge, Box, Flex, Popover, PopoverArrow, PopoverBody, PopoverContent, PopoverTrigger, Text } from '@chakra-ui/react';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

export default function NotificationPopover() {
  return (
    <Popover>
      <PopoverTrigger>
        <Box as="button" position="relative" aria-label="Open notifications">
          <NotificationsNoneIcon style={{ fontSize: 30 }} />
          <Badge position="absolute" top="-6px" right="-8px" bg="#E23D3D" color="white" borderRadius="50%">3</Badge>
        </Box>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>
          {['New puzzle streak milestone', 'Class starts in 1 hour', 'Report is ready'].map((item) => (
            <Flex key={item} py={2} borderBottom="1px solid rgba(169,119,33,.12)">
              <Text fontSize="13px" fontWeight="700">{item}</Text>
            </Flex>
          ))}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
