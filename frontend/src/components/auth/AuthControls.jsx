import React from 'react';
import { Button, FormControl, FormErrorMessage, FormLabel, IconButton, Input, InputGroup, InputLeftElement, InputRightElement } from '@chakra-ui/react';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import GoogleIcon from '@mui/icons-material/Google';

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthInput({ label, name, value, onChange, error, type = 'text', icon = 'email', rightElement, placeholder }) {
  const Icon = icon === 'lock' ? LockOutlinedIcon : icon === 'person' ? PersonOutlineOutlinedIcon : EmailOutlinedIcon;
  return (
    <FormControl isInvalid={Boolean(error)}>
      <FormLabel fontWeight="600" color="#0A1428" mb={2} fontSize="16px">{label}</FormLabel>
      <InputGroup size="lg">
        <InputLeftElement pointerEvents="none" color="rgba(0,0,0,0.4)" h="56px">
          <Icon fontSize="small" />
        </InputLeftElement>
        <Input
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          bg="transparent"
          border="1px solid"
          borderColor="rgba(0,0,0,0.12)"
          borderRadius="12px"
          h="56px"
          pl="48px"
          pr={rightElement ? '52px' : undefined}
          fontSize="16px"
          _placeholder={{ color: 'rgba(0,0,0,0.3)' }}
          _hover={{ borderColor: 'rgba(169, 119, 33, 0.4)' }}
          _focus={{ borderColor: '#A97721', boxShadow: 'none' }}
        />
        {rightElement && <InputRightElement h="56px">{rightElement}</InputRightElement>}
      </InputGroup>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  );
}

export function PasswordToggle({ show, onClick, label }) {
  return (
    <IconButton
      aria-label={label}
      icon={show ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
      variant="ghost"
      size="sm"
      color="brand.muted"
      onClick={onClick}
      _hover={{ bg: 'rgba(212,166,74,.12)', color: 'brand.goldDark' }}
    />
  );
}

export function GoogleButton({ onClick }) {
  return (
    <Button
      w="100%"
      h="56px"
      variant="outline"
      leftIcon={<GoogleIcon />}
      borderColor="rgba(0,0,0,0.12)"
      bg="transparent"
      color="#0A1428"
      fontSize="16px"
      borderRadius="12px"
      fontWeight="500"
      _hover={{ bg: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.2)' }}
      onClick={onClick}
    >
      Continue with Google
    </Button>
  );
}
