import React from 'react';
import { Box, Flex, Grid, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';

function BrandPanel() {
  const features = [
    { icon: AutoStoriesOutlinedIcon, label: 'Story-driven chess learning' },
    { icon: TrendingUpOutlinedIcon, label: 'Personalized strategic growth' },
    { icon: SchoolOutlinedIcon, label: 'Mentorship from grandmasters' },
  ];

  return (
    <VStack align="stretch" spacing={{ base: 6, lg: 8 }} position="relative" zIndex={1}>
      <HStack spacing={4}>
        <Flex
          w="50px"
          h="50px"
          align="center"
          justify="center"
          color="brand.gold"
          fontSize="36px"
          textShadow="0 0 28px rgba(212,166,74,.5)"
        >
          ♜
        </Flex>
        <Box>
          <Text color="white" fontFamily="Georgia, Cambria, serif" fontSize="13px" letterSpacing="0.08em" lineHeight="1.1">CHESS BY</Text>
          <Text color="brand.gold" fontFamily="Georgia, Cambria, serif" fontSize="24px" letterSpacing="0.03em" lineHeight="1">PANCHATANTRA</Text>
          <Text color="rgba(255,255,255,.68)" fontSize="9px" fontWeight="700" letterSpacing="0.22em" mt={1}>WISDOM MEETS STRATEGY</Text>
        </Box>
      </HStack>

      <Box maxW="580px">
        <Heading
          as="h1"
          color="#F6F2EA"
          fontSize={{ base: '32px', md: '44px', xl: '54px' }}
          lineHeight="1.1"
          letterSpacing="0"
        >
          Where Ancient Wisdom Meets Modern Chess
        </Heading>
        <Text color="rgba(255,255,255,.74)" fontSize={{ base: '16px', md: '18px' }} lineHeight="1.7" mt={4}>
          Learn chess through the timeless stories of Panchatantra.
          <br />
          Every lesson is a story. Every move is wisdom.
        </Text>
      </Box>

      <VStack align="stretch" spacing={3}>
        {features.map(({ icon: Icon, label }) => (
          <HStack key={label} spacing={4}>
            <Flex w="34px" h="34px" align="center" justify="center" borderRadius="999px" bg="rgba(212,166,74,.14)" color="brand.gold">
              <Icon fontSize="small" />
            </Flex>
            <Text color="#F6F2EA" fontWeight="700" fontSize="15px">{label}</Text>
          </HStack>
        ))}
      </VStack>

      <Box
        maxW="480px"
        p={4}
        bg="rgba(7,17,31,.48)"
        border="1px solid rgba(212,166,74,.28)"
        borderLeft="4px solid"
        borderLeftColor="brand.gold"
        borderRadius="18px"
        boxShadow="0 22px 54px rgba(0,0,0,.22)"
        backdropFilter="blur(16px)"
      >
        <Text color="#F6F2EA" fontFamily="Georgia, Cambria, serif" fontSize="18px" lineHeight="1.45">
          “Master the mind, and the moves will follow.”
        </Text>
        <Text color="rgba(255,255,255,.62)" mt={2} fontSize="14px">— Chess by Panchatantra</Text>
      </Box>
    </VStack>
  );
}

export function AuthCard({ children, maxW = '480px' }) {
  return (
    <Box
      w="100%"
      maxW={maxW}
      bg="#FDFCF8"
      color="brand.text"
      border="1px solid rgba(17, 32, 61, 0.12)"
      borderRadius="32px"
      boxShadow="0 20px 50px rgba(0,0,0,0.15)"
      p={{ base: 6, md: 8 }}
      position="relative"
      zIndex={1}
    >
      {children}
    </Box>
  );
}

export function AuthHeader({ title, subtitle }) {
  return (
    <VStack spacing={0} textAlign="center" mb={6}>
      <Flex
        w="64px"
        h="64px"
        align="center"
        justify="center"
        borderRadius="full"
        bg="#0A1428"
        color="brand.gold"
        fontSize="28px"
        mb={3}
        boxShadow="0 8px 16px rgba(0,0,0,0.2)"
      >
        ♔
      </Flex>
      <Heading 
        fontSize="36px" 
        fontFamily="Georgia, serif" 
        color="#0A1428"
        fontWeight="500"
      >
        {title}
      </Heading>
      
      <HStack w="100%" spacing={3} my={2} justify="center" opacity={0.6}>
        <Box h="1px" flex={1} bgGradient="linear(to-r, transparent, #A97721)" />
        <Text color="#A97721" fontSize="16px">✥</Text>
        <Box h="1px" flex={1} bgGradient="linear(to-l, transparent, #A97721)" />
      </HStack>

      <Text color="brand.muted" fontSize="14px" letterSpacing="0.02em">
        {subtitle}
      </Text>
    </VStack>
  );
}

export default function AuthLayout({ children }) {
  return (
    <Box
      h="100vh"
      overflow="hidden"
      position="relative"
      bg="#0A1428"
      _before={{
        content: '""',
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(110deg, rgba(6,12,26,.98) 0%, rgba(10,20,40,.94) 42%, rgba(17,32,61,.92) 70%, rgba(13,23,48,.96) 100%)',
      }}
      _after={{
        content: '""',
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(circle at 24% 24%, rgba(212,166,74,.24), transparent 28%), radial-gradient(circle at 68% 48%, rgba(62,96,161,.36), transparent 32%), radial-gradient(circle at 86% 18%, rgba(212,166,74,.12), transparent 24%)',
      }}
    >
      <Box
        position="absolute"
        inset="0"
        opacity=".13"
        backgroundImage="linear-gradient(45deg, rgba(255,255,255,.14) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,.14) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,.14) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,.14) 75%)"
        backgroundSize="72px 72px"
        backgroundPosition="0 0, 0 36px, 36px -36px, -36px 0"
      />
      <Text
        position="absolute"
        left={{ base: '-70px', lg: '44%' }}
        top={{ base: '120px', lg: '52%' }}
        transform="translateY(-50%)"
        color="rgba(212,166,74,.08)"
        fontSize={{ base: '220px', lg: '360px' }}
        lineHeight="1"
        zIndex={0}
      >
        ♛
      </Text>
      <Grid
        h="100%"
        templateColumns={{ base: '1fr', lg: 'auto auto' }}
        justifyContent="center"
        gap={{ base: 10, lg: 16 }}
        px={{ base: 5, md: 10, xl: 16 }}
        alignItems="center"
        position="relative"
        zIndex={1}
      >
        <Flex align="center" py={{ base: 8, lg: 0 }}>
          <BrandPanel />
        </Flex>
        <Flex align="center" justify="center" py={{ base: 8, lg: 0 }}>
          {children}
        </Flex>
      </Grid>
    </Box>
  );
}
