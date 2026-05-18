import React from 'react';
import { Flex, Text } from '@chakra-ui/react';

export default function QuickActionCard({ icon: Icon, title, subtitle, wide = false, onClick }) {
  return (
    <Flex
      as="button"
      type="button"
      onClick={onClick}
      className="card-hover"
      align="center"
      gap={3}
      p={4}
      bg="rgba(255,248,235,.8)"
      border="1px solid rgba(169,119,33,.14)"
      borderRadius="12px"
      gridColumn={wide ? '1 / -1' : 'auto'}
      textAlign="left"
      cursor="pointer"
      _hover={{ bg: 'rgba(255,244,216,.95)' }}
    >
      {Icon && <Flex color="brand.goldDark"><Icon /></Flex>}
      <div>
        <Text fontWeight="800" fontSize="13px">{title}</Text>
        {subtitle && <Text color="brand.muted" fontSize="12px">{subtitle}</Text>}
      </div>
    </Flex>
  );
}
