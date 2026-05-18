import React, { useState } from 'react';
import { Box, Button, Checkbox, Divider, FormControl, FormLabel, HStack, Link as ChakraLink, Select, SimpleGrid, Text, useToast, VStack } from '@chakra-ui/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout, { AuthCard, AuthHeader } from '../../components/auth/AuthLayout.jsx';
import { AuthInput, emailPattern, GoogleButton, PasswordToggle } from '../../components/auth/AuthControls.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [values, setValues] = useState({ email: '', password: '', role: 'student', remember: true });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (event) => {
    const { name, value, checked, type } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!values.email.trim()) next.email = 'Email address is required.';
    else if (!emailPattern.test(values.email)) next.email = 'Enter a valid email address.';
    if (!values.password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const enterRole = async (role) => {
    setLoading(true);
    try {
      const user = await login({ role, email: values.email, password: values.password });
      navigate(location.state?.from || `/${user.role}/dashboard`, { replace: true });
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
      toast({ title: 'Unable to sign in', description: message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    await enterRole(values.role);
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader title="Welcome Back" subtitle="Sign in to continue your journey" />
        <Box as="form" onSubmit={submit}>
          <VStack spacing={5} align="stretch">
            <AuthInput
              label="Email Address"
              name="email"
              value={values.email}
              onChange={onChange}
              error={errors.email}
              placeholder="Enter your email"
            />
            
            <AuthInput
              label="Password"
              name="password"
              value={values.password}
              onChange={onChange}
              error={errors.password}
              type={showPassword ? 'text' : 'password'}
              icon="lock"
              placeholder="Enter your password"
              rightElement={<PasswordToggle show={showPassword} onClick={() => setShowPassword((show) => !show)} label={showPassword ? 'Hide password' : 'Show password'} />}
            />

            <HStack justify="space-between" fontSize="13px">
              <Checkbox name="remember" isChecked={values.remember} onChange={onChange} colorScheme="yellow">
                <Text fontWeight="600" color="#1A202C">Remember me</Text>
              </Checkbox>
              <ChakraLink as={Link} to="/forgot-password" state={{ email: values.email }} color="#A97721" fontWeight="500">Forgot Password?</ChakraLink>
            </HStack>

            <Button
              type="submit"
              h="52px"
              bg="#0A1428"
              color="white"
              borderRadius="12px"
              fontSize="16px"
              letterSpacing="0.1em"
              isLoading={loading}
              isDisabled={loading}
              _hover={{ bg: "#11203D", transform: 'translateY(-1px)' }}
            >
              <HStack spacing={4}>
                <Text color="brand.gold" fontSize="18px" opacity={0.6}>⊹</Text>
                <Text color="brand.gold" fontWeight="600">SIGN IN</Text>
                <Text color="brand.gold" fontSize="18px" opacity={0.6}>⊹</Text>
              </HStack>
            </Button>

            <HStack py={1}>
              <Divider borderColor="rgba(0,0,0,0.1)" />
              <Text color="brand.muted" fontSize="12px" fontWeight="600" px={2}>OR</Text>
              <Divider borderColor="rgba(0,0,0,0.1)" />
            </HStack>

            <GoogleButton onClick={() => toast({ title: 'Google sign-in is mocked for this demo', status: 'info' })} />

            <Text textAlign="center" color="brand.muted" fontSize="14px" mt={2}>
              New here? <ChakraLink as={Link} to="/register" color="#A97721" fontWeight="600">Create an account</ChakraLink>
            </Text>
          </VStack>
        </Box>
      </AuthCard>
    </AuthLayout>
  );
}
