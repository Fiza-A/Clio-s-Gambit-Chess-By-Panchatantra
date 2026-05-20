import React from 'react';
import { Button, Table, Tbody, Td, Th, Thead, Tr, Box, Text, HStack } from '@chakra-ui/react';

/**
 * @param {'default' | 'dashboard' | 'curriculum'} appearance — 'curriculum' matches admin Curriculum tabs (cream thead, navy actions).
 */
export default function DataTable({
  items = [],
  columns,
  onView,
  onEdit,
  onDelete,
  rowKey,
  extraActions = [],
  appearance = 'default',
}) {
  const isDashboard = appearance === 'dashboard';
  const isCurriculum = appearance === 'curriculum';
  const polishedActions = isDashboard || isCurriculum;

  const getRowKey = (item, index) => {
    if (rowKey) {
      if (typeof rowKey === 'function') return rowKey(item);
      return item[rowKey];
    }
    return item.id || item._id || item.Chess_com_ID || item.mapping_id || item.chapter_id || item.module_id || item.title || item.name || index;
  };

  const wrapProps = isDashboard
    ? {
        overflowX: 'auto',
        borderRadius: '18px',
        border: '1px solid',
        borderColor: 'rgba(169,119,33,0.16)',
        bg: 'brand.card',
        boxShadow: '0 12px 30px rgba(17,24,39,0.055)',
      }
    : isCurriculum
      ? {
          overflowX: 'auto',
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'rgba(214,168,79,0.14)',
          bg: 'white',
          boxShadow: '0 8px 28px rgba(7,17,31,0.055)',
        }
      : {
          overflowX: 'auto',
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'rgba(214,168,79,0.15)',
          bg: 'white',
          shadow: '0 4px 20px rgba(0,0,0,0.03)',
        };

  const theadBg = isDashboard
    ? 'rgba(7,17,31,0.045)'
    : isCurriculum
      ? 'rgba(250, 247, 240, 0.95)'
      : '#F9FAFB';
  const rowHoverBg = isDashboard || isCurriculum ? 'rgba(214,168,79,0.07)' : 'rgba(214,168,79,0.04)';
  const rowBorderColor = isCurriculum ? 'rgba(7,17,31,0.06)' : isDashboard ? 'rgba(169,119,33,0.12)' : 'gray.50';
  const tdPy = isDashboard || isCurriculum ? 4 : 3;
  const thFontFamily = isCurriculum ? 'body' : 'serif';

  const actionLabel = (action, item) => (typeof action.label === 'function' ? action.label(item) : action.label);

  return (
    <Box {...wrapProps}>
      <Table size="sm" variant="simple">
        <Thead bg={theadBg}>
          <Tr>
            {columns.map((col) => (
              <Th 
                key={col.key} 
                py={5} 
                fontSize="11px" 
                color="brand.navy" 
                fontWeight="800" 
                letterSpacing={isCurriculum ? '0.07em' : '0.05em'}
                textTransform="uppercase"
                fontFamily={thFontFamily}
              >
                {col.label}
              </Th>
            ))}
            <Th textAlign="right" py={5} fontSize="11px" color="brand.navy" fontWeight="800" textTransform="uppercase" fontFamily={thFontFamily} letterSpacing={isCurriculum ? '0.07em' : '0.05em'}>ACTIONS</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map((item, index) => (
            <Tr 
              key={getRowKey(item, index)}
              _hover={{ bg: rowHoverBg, transition: 'background 0.18s ease' }}
              borderBottom="1px solid"
              borderColor={rowBorderColor}
            >
              {columns.map((col) => (
                <Td key={col.key} py={tdPy} verticalAlign="middle">
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
              <Td textAlign="right" py={tdPy}>
                <HStack justify="flex-end" spacing={1} flexWrap="wrap">
                  {onView && (
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      colorScheme={polishedActions ? undefined : 'blue'}
                      color={polishedActions ? 'brand.navy' : undefined}
                      fontWeight={polishedActions ? '600' : undefined}
                      onClick={() => onView(item)}
                      _hover={polishedActions ? { bg: 'rgba(7,17,31,0.08)' } : { bg: 'blue.50' }}
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
                      colorScheme={polishedActions ? undefined : 'brand'}
                      color={polishedActions ? 'brand.navy' : undefined}
                      fontWeight={polishedActions ? '600' : undefined}
                      onClick={() => onEdit(item)}
                      _hover={polishedActions ? { bg: 'rgba(7,17,31,0.08)' } : { bg: 'brand.50' }}
                      borderRadius="full"
                      px={3}
                    >
                      Edit
                    </Button>
                  )}
                  {extraActions.map((action, i) => {
                    const label = actionLabel(action, item);
                    const scheme = polishedActions
                      ? null
                      : (typeof action.colorScheme === 'function' ? action.colorScheme(item) : action.colorScheme);
                    const dashExtra = polishedActions
                      ? (label === 'Resume'
                        ? { color: 'brand.success', _hover: { bg: 'rgba(47,158,68,0.1)' } }
                        : { color: 'brand.goldDark', _hover: { bg: 'rgba(214,168,79,0.16)' } })
                      : {};
                    return (
                      <Button
                        key={i}
                        size="xs"
                        variant="ghost"
                        colorScheme={polishedActions ? undefined : scheme || 'gray'}
                        color={polishedActions ? dashExtra.color : undefined}
                        onClick={() => action.onClick(item)}
                        _hover={polishedActions ? dashExtra._hover : { bg: `${scheme || 'gray'}.50` }}
                        borderRadius="full"
                        px={3}
                        isDisabled={typeof action.isDisabled === 'function' ? action.isDisabled(item) : Boolean(action.isDisabled)}
                      >
                        {label}
                      </Button>
                    );
                  })}
                  {onDelete && (
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      colorScheme="red"
                      color={polishedActions ? 'brand.danger' : undefined}
                      fontWeight={polishedActions ? '600' : undefined}
                      onClick={() => onDelete(item)}
                      _hover={{ bg: 'rgba(214, 69, 69, 0.1)' }}
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
