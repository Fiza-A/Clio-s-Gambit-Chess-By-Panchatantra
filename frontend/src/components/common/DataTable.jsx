import React from 'react';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr, Box } from '@chakra-ui/react';

export default function DataTable({ items, columns, onView, onEdit, onDelete }) {
  return (
    <Box overflowX="auto">
      <Table size="sm">
        <Thead>
          <Tr>{columns.map((col) => <Th key={col.key}>{col.label}</Th>)}<Th textAlign="right">Actions</Th></Tr>
        </Thead>
        <Tbody>
          {items.map((item) => (
            <Tr key={item.id || item.title || item.name}>
              {columns.map((col) => (
                <Td key={col.key}>
                  {col.badge ? <Badge colorScheme={String(item[col.key]).includes('active') ? 'green' : 'yellow'}>{item[col.key]}</Badge> : String(item[col.key] ?? '')}
                </Td>
              ))}
              <Td textAlign="right">
                {onView && <Button size="xs" mr={2} onClick={() => onView(item)}>View</Button>}
                {onEdit && <Button size="xs" mr={2} onClick={() => onEdit(item)}>Edit</Button>}
                {onDelete && <Button size="xs" colorScheme="red" onClick={() => onDelete(item)}>Delete</Button>}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
