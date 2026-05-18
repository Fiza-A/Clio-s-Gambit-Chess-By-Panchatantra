import React from 'react';
import { Box, Flex, HStack, Text, VStack, Divider } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { roleConfig } from '../../data/roleConfig.js';

function Portrait({ profile }) {
  const bg = profile.portrait === 'sage'
    ? 'linear-gradient(135deg,#f6e3b1,#6d5130)'
    : profile.portrait === 'student'
      ? 'linear-gradient(135deg,#dce9ff,#d6a84f)'
      : 'linear-gradient(135deg,#f8d7b4,#22324a)';
  return (
    <Flex w="58px" h="58px" borderRadius="50%" bg={bg} align="center" justify="center" border="2px solid rgba(214,168,79,.7)" fontWeight="900" color="brand.navy">
      {profile.initials}
    </Flex>
  );
}

export default function Sidebar({ role }) {
  const config = roleConfig[role];
  return (
    <Box
      as="aside"
      position={{ base: 'relative', lg: 'fixed' }}
      left="0"
      top="0"
      w={{ base: '100%', lg: '280px' }}
      h={{ base: 'auto', lg: '100vh' }}
      bg="linear-gradient(180deg,#07111F 0%,#08111E 58%,#040A12 100%)"
      color="white"
      px={4}
      py={6}
      overflowY="auto"
      className="sidebar-scroll"
      zIndex="10"
    >
      <HStack spacing={3} mb={8} px={2}>
        <Text fontSize="58px" lineHeight="1" className="gold-text">♜</Text>
        <Box>
          <Text fontFamily="Georgia,serif" fontSize="18px" lineHeight="1" letterSpacing=".4px">CHESS BY</Text>
          <Text fontFamily="Georgia,serif" fontSize="24px" color="brand.gold" lineHeight="1.05">PANCHATANTRA</Text>
          <Text fontSize="10px" color="rgba(255,255,255,.72)" fontWeight="800" mt={1}>WISDOM MEETS STRATEGY</Text>
        </Box>
      </HStack>

      <VStack align="stretch" spacing={2}>
        {config.nav.map(([label, Icon, href], index) => (
          <Flex
            key={label}
            as={NavLink}
            to={href}
            align="center"
            gap={4}
            px={4}
            py={3}
            borderRadius="10px"
            bg="transparent"
            color="rgba(255,255,255,.9)"
            fontWeight="700"
            _hover={{ bg: 'rgba(255,255,255,.07)' }}
            _activeLink={{ bg: 'linear-gradient(135deg,#B88934,#F1D17A)', color: 'white' }}
          >
            <Icon style={{ fontSize: 23 }} />
            <Text>{label}</Text>
          </Flex>
        ))}
      </VStack>

      {config.quick && (
        <>
          <Divider borderColor="rgba(255,255,255,.12)" my={7} />
          <Text color="rgba(255,255,255,.7)" fontSize="12px" fontWeight="800" mb={3} px={3}>QUICK ACTIONS</Text>
          <VStack align="stretch" spacing={2}>
            {config.quick.map(([label, Icon, href]) => (
              <Flex key={label} as={NavLink} to={href} align="center" gap={4} px={4} py={3} borderRadius="10px" color="rgba(255,255,255,.9)" fontWeight="700" _hover={{ bg: 'rgba(255,255,255,.07)' }} _activeLink={{ bg: 'linear-gradient(135deg,#B88934,#F1D17A)', color: 'white' }}>
                <Icon style={{ fontSize: 23 }} />
                <Text>{label}</Text>
              </Flex>
            ))}
          </VStack>
        </>
      )}

      <Box mt={8} border="1px solid rgba(255,255,255,.14)" borderRadius="12px" p={3}>
        <HStack spacing={3}>
          <Portrait profile={config.profile} />
          <Box>
            <Text fontFamily="Georgia,serif" fontSize="17px" fontWeight="700">{config.profile.name}</Text>
            <Text fontSize="12px" color="rgba(255,255,255,.75)">{config.profile.role}</Text>
            <HStack mt={1} spacing={1}><Box w="8px" h="8px" borderRadius="50%" bg="#36C56A" /><Text fontSize="12px">Online</Text></HStack>
          </Box>
        </HStack>
      </Box>

      <Box mt={6} p={4} minH="170px" bg="linear-gradient(180deg,rgba(255,255,255,.02),rgba(214,168,79,.05))" borderRadius="14px" position="relative" overflow="hidden">
        <Text fontSize="34px" color="brand.gold" lineHeight="1">“</Text>
        <Text fontFamily="Georgia,serif" fontSize="15px" color="rgba(255,255,255,.9)" position="relative">{config.quote}</Text>
        <Text mt={3} fontSize="13px" color="rgba(255,255,255,.78)">– {config.quoteBy}</Text>
        <Text position="absolute" bottom="-22px" right="-8px" fontSize="92px" opacity=".18">♞♛</Text>
      </Box>
    </Box>
  );
}
