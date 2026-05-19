import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import Sidebar from './Sidebar.jsx';
import AppBreadcrumbs from './Breadcrumbs.jsx';

export default function DashboardLayout({ role, children }) {
  return (
    <Box minH="100vh">
      <Sidebar role={role} />
      <Box 
        ml={{ base: 0, lg: '280px' }} 
        minH="100vh" 
        w={{ base: '100%', lg: 'calc(100vw - 280px)' }} 
        overflowX="hidden" 
        px={{ base: 4, md: 7 }} 
        py={{ base: 5, md: 7 }}
      >
        <Container maxW="1540px" px="0">
          <Box position="sticky" top="0" zIndex="10" bg="#FCF8F1" py={2} mb={4}>
            <AppBreadcrumbs />
          </Box>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
