import React from 'react';
import { Flex, Input, Select } from '@chakra-ui/react';

export default function SearchFilterBar({ search, setSearch, filter, setFilter, filters = ['all'], showFilter = true }) {
  return (
    <Flex gap={3} mb={4} direction={{ base: 'column', md: 'row' }}>
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" bg="white" aria-label="Search records" />
      {showFilter && (
        <Select value={filter} onChange={(event) => setFilter(event.target.value)} bg="white" maxW={{ md: '220px' }} aria-label="Filter records">
          {filters.map((item) => <option key={item} value={item}>{item === 'all' ? 'All' : item}</option>)}
        </Select>
      )}
    </Flex>
  );
}
