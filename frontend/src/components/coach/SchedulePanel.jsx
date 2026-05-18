import React from 'react';
import { Badge, Box, Button, Flex, Text, VStack } from '@chakra-ui/react';

export default function SchedulePanel({ schedule, onViewAll, onOpenClass }) {
  return (
    <VStack align="stretch" spacing={0}>
      {schedule.map((item, index) => (
        <Flex key={item.title} as="button" type="button" onClick={() => onOpenClass?.(item, index)} py={4} borderBottom={index === schedule.length - 1 ? '0' : '1px solid rgba(169,119,33,.12)'} gap={4} textAlign="left" cursor="pointer">
          <Flex w="58px" h="58px" borderRadius="10px" bg={index === 0 ? '#EAF8EC' : '#FFF7E8'} align="center" justify="center" direction="column" fontWeight="900" color="brand.navy">
            <Text>{item.time.split(' ')[0]}</Text><Text fontSize="11px">{item.time.split(' ')[1]}</Text>
          </Flex>
          <Box flex="1">
            <Text fontWeight="900" fontSize="14px">{item.title}</Text>
            <Text color="brand.muted" fontSize="12px">Topic: {item.topic}</Text>
            <Text fontSize="12px">{item.students}</Text>
          </Box>
          <Badge h="fit-content" colorScheme={index === 0 ? 'green' : index === 1 ? 'yellow' : 'gray'} borderRadius="8px" px={2} py={1}>{item.status}</Badge>
        </Flex>
      ))}
      <Flex mt={4} p={4} bg="linear-gradient(135deg,#F2ECFF,#FFFDF8)" borderRadius="14px" align="center" justify="space-between">
        <Box><Text fontWeight="900" fontSize="13px">You have 2 classes starting soon</Text><Text fontSize="12px">Prepare your lessons and resources.</Text></Box>
        <Button size="sm" bg="brand.purple" color="white" onClick={onViewAll}>View All Classes</Button>
      </Flex>
    </VStack>
  );
}
