import React from 'react';
import { Box, Flex, Heading, Select, Text } from '@chakra-ui/react';

export default function DashboardCard({ title, action, children, minH, dark = false, ...props }) {
  return (
    <Box
      className="card-hover"
      bg={dark ? 'brand.navy' : 'brand.card'}
      color={dark ? 'white' : 'brand.text'}
      border="1px solid"
      borderColor={dark ? 'rgba(214,168,79,0.28)' : 'rgba(169,119,33,0.16)'}
      borderRadius="18px"
      boxShadow={dark ? '0 18px 36px rgba(7,17,31,.24)' : '0 12px 30px rgba(17,24,39,.055)'}
      p={{ base: 4, md: 5 }}
      minH={minH}
      overflow="hidden"
      {...props}
    >
      {(title || action) && (
        <Flex align="center" justify="space-between" mb={4} gap={3}>
          {title && <Heading size="sm">{title}</Heading>}
          {action || <Text />}
        </Flex>
      )}
      {children}
    </Box>
  );
}

export function MonthSelect() {
  return (
    <Select size="sm" w="128px" bg="whiteAlpha.700" borderColor="rgba(169,119,33,.16)" borderRadius="10px" fontSize="12px">
      <option>This Month</option>
    </Select>
  );
}
