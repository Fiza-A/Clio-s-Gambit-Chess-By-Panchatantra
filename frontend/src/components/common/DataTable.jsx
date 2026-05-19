import React from 'react';
import { Badge, Button, Table, Tbody, Td, Th, Thead, Tr, Box, Text, HStack } from '@chakra-ui/react';

export default function DataTable({ items = [], columns, onView, onEdit, onDelete, rowKey, extraActions = [] }) {
  const getRowKey = (item, index) => {
    if (rowKey) {
      if (typeof rowKey === 'function') return rowKey(item);
      return item[rowKey];
    }
    return item.id || item._id || item.Chess_com_ID || item.mapping_id || item.chapter_id || item.module_id || item.title || item.name || index;
  };

  return (
    <Box 
      overflowX="auto" 
      borderRadius="16px" 
      border="1px solid" 
      borderColor="rgba(214,168,79,0.15)" 
      bg="white" 
      shadow="0 4px 20px rgba(0,0,0,0.03)"
    >
      <Table size="sm" variant="simple">
        <Thead bg="#F9FAFB">
          <Tr>
            {columns.map((col) => (
              <Th 
                key={col.key} 
                py={5} 
                fontSize="11px" 
                color="brand.navy" 
                fontWeight="800" 
                letterSpacing="0.05em"
                textTransform="uppercase"
                fontFamily="serif"
              >
                {col.label}
              </Th>
            ))}
            <Th textAlign="right" py={5} fontSize="11px" color="brand.navy" fontWeight="800" textTransform="uppercase" fontFamily="serif">ACTIONS</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map((item, index) => (
            <Tr 
              key={getRowKey(item, index)}
              _hover={{ bg: 'rgba(214,168,79,0.04)', transition: 'all 0.2s' }}
              borderBottom="1px solid"
              borderColor="gray.50"
            >
              {columns.map((col) => (
                <Td key={col.key} py={3} verticalAlign="middle">
                  {col.render ? (
                    col.render(item[col.key], item)
                  ) : (
                    <Text 
                      fontSize="13px" 
                      fontWeight={col.bold ? "700" : "400"}
                      color={col.bold ? "brand.navy" : "gray.600"}
                    >
                      {item[col.key]}
                    </Text>
                  )}
                </Td>
              ))}
              <Td textAlign="right" py={3}>
                <HStack justify="flex-end" spacing={1}>
                  {onView && (
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      colorScheme="blue" 
                      onClick={() => onView(item)}
                      _hover={{ bg: 'blue.50' }}
                      borderRadius="full"
                      px={3}
                    >
                      View
                    </Button>
                  )}
                  {onEdit && (
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      colorScheme="brand" 
                      onClick={() => onEdit(item)}
                      _hover={{ bg: 'brand.50' }}
                      borderRadius="full"
                      px={3}
                    >
                      Edit
                    </Button>
                  )}
                  {extraActions.map((action, i) => (
                    <Button
                      key={i}
                      size="xs"
                      variant="ghost"
                      colorScheme={typeof action.colorScheme === 'function' ? action.colorScheme(item) : action.colorScheme || 'gray'}
                      onClick={() => action.onClick(item)}
                      _hover={{ bg: `${action.colorScheme || 'gray'}.50` }}
                      borderRadius="full"
                      px={3}
                    >
                      {typeof action.label === 'function' ? action.label(item) : action.label}
                    </Button>
                  ))}
                  {onDelete && (
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      colorScheme="red" 
                      onClick={() => onDelete(item)}
                      _hover={{ bg: 'red.50' }}
                      borderRadius="full"
                      px={3}
                    >
                      Delete
                    </Button>
                  )}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
