import React from 'react';
import { Avatar, Box, Flex, Progress, Text, VStack } from '@chakra-ui/react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export default function StudentList({ students, onOpenStudent }) {
  return (
    <VStack spacing={4} align="stretch">
      {students.map((student, index) => (
        <Flex key={student.name} as="button" type="button" onClick={() => onOpenStudent?.(student, index)} align="center" gap={3} textAlign="left" cursor="pointer">
          <Avatar name={student.name} size="md" bg={['#F8D3B2', '#DDEAFF', '#F6D1D9', '#E6D6BB', '#D7E8DC'][index]} color="brand.navy" />
          <Box flex="1">
            <Flex justify="space-between">
              <Box>
                <Text fontSize="14px" fontWeight="900">{student.name}</Text>
                <Text fontSize="12px" color="brand.muted">{student.type}</Text>
              </Box>
              <Flex align="center" gap={2}>
                <Text fontWeight="900" fontSize="13px">{student.progress}%</Text>
                <Flex color={student.trend > 0 ? 'brand.success' : 'brand.danger'} align="center" fontSize="12px">
                  {student.trend > 0 ? <ArrowUpwardIcon style={{ fontSize: 14 }} /> : <ArrowDownwardIcon style={{ fontSize: 14 }} />}
                  {Math.abs(student.trend)}%
                </Flex>
              </Flex>
            </Flex>
            <Progress value={student.progress} mt={2} h="6px" borderRadius="999px" sx={{ '& > div': { background: student.progress >= 70 ? '#2F9E44' : '#D6A84F' } }} />
          </Box>
        </Flex>
      ))}
    </VStack>
  );
}
