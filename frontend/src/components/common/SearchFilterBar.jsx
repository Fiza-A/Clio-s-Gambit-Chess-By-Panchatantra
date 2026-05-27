import React from 'react';
import { Box, Flex, Input, Select } from '@chakra-ui/react';

const ADMIN_CONTROL_PROPS = {
  h: '42px',
  bg: 'white',
  borderRadius: '10px',
  border: '1px solid',
  borderColor: 'rgba(214,168,79,0.22)',
  fontSize: 'sm',
  _placeholder: { color: 'brand.muted' },
  _hover: { borderColor: 'rgba(214,168,79,0.38)' },
  _focusVisible: {
    borderColor: 'brand.goldDark',
    boxShadow: '0 0 0 1px rgba(214,168,79,0.35)',
  },
};

/**
 * @param {'default' | 'admin'} variant — 'admin' wraps controls in a toolbar card (Users, etc.).
 */
export default function SearchFilterBar({
  search,
  setSearch,
  filter,
  setFilter,
  filters = ['all'],
  showFilter = true,
  variant = 'default',
  placeholder = 'Search…',
}) {
  const isAdmin = variant === 'admin';

  const controls = (
    <Flex gap={3} direction={{ base: 'column', md: 'row' }} align={{ md: 'center' }} w="100%">
      <Input
        flex={{ md: 1 }}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={placeholder}
        aria-label="Search records"
        {...(isAdmin ? ADMIN_CONTROL_PROPS : { bg: 'white' })}
      />
      {showFilter && (
        <Select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          maxW={{ md: '220px' }}
          w={{ base: '100%', md: 'auto' }}
          flexShrink={0}
          aria-label="Filter records"
          {...(isAdmin ? ADMIN_CONTROL_PROPS : { bg: 'white', maxW: { md: '220px' } })}
        >
          {filters.map((item) => (
            <option key={item} value={item}>
              {item === 'all' ? 'All roles' : item.charAt(0).toUpperCase() + item.slice(1)}
            </option>
          ))}
        </Select>
      )}
    </Flex>
  );

  if (isAdmin) {
    return (
      <Box
        w="100%"
        bg="brand.card"
        borderRadius="16px"
        border="1px solid"
        borderColor="rgba(214,168,79,0.16)"
        boxShadow="0 10px 32px rgba(7, 17, 31, 0.06)"
        px={{ base: 4, md: 5 }}
        py={{ base: 4, md: 4 }}
      >
        {controls}
      </Box>
    );
  }

  return (
    <Flex gap={3} mb={4} direction={{ base: 'column', md: 'row' }}>
      {controls}
    </Flex>
  );
}
