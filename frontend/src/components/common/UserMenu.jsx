import React from 'react';
import { Flex, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  return (
    <Menu>
      <MenuButton aria-label="Open user menu">
        <Flex align="center" gap={2}>
          <Flex w="54px" h="54px" borderRadius="50%" bg="linear-gradient(135deg,#e8f0ff,#d6a84f)" align="center" justify="center" border="2px solid #D6A84F" fontWeight="900">
            {user?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2) || 'AS'}
          </Flex>
          <KeyboardArrowDownIcon />
        </Flex>
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => navigate(`/${user.role}/${user.role === 'student' ? 'strategic-profile' : 'settings'}`)}>Profile</MenuItem>
        <MenuItem onClick={() => navigate(`/${user.role}/settings`)}>Settings</MenuItem>
        <MenuItem onClick={() => navigate('/login')}>Switch Role</MenuItem>
        <MenuItem onClick={async () => { await logout(); navigate('/login'); }}>Logout</MenuItem>
      </MenuList>
    </Menu>
  );
}
