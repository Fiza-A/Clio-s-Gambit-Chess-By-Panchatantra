import React, { useState } from 'react';
import { Button, FormControl, FormErrorMessage, FormLabel, Link as ChakraLink, Select, Text, useToast, VStack } from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout, { AuthCard, AuthHeader } from '../../components/auth/AuthLayout.jsx';
import { AuthInput, emailPattern, PasswordToggle } from '../../components/auth/AuthControls.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Register() {
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = 'Full name is required.';
    if (!values.email.trim()) next.email = 'Email address is required.';
    else if (!emailPattern.test(values.email)) next.email = 'Enter a valid email address.';
    if (!values.password) next.password = 'Password is required.';
    else if (values.password.length < 6) next.password = 'Use at least 6 characters.';
    if (values.confirmPassword !== values.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await register(values);
      navigate(`/${user.role}/dashboard`, { replace: true });
    } catch (error) {
      toast({ title: 'Unable to create account', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader title="Create Account" subtitle="Begin your Panchatantra chess journey" />
        <VStack as="form" spacing={4} align="stretch" onSubmit={submit}>
          <AuthInput label="Full name" name="name" value={values.name} onChange={onChange} error={errors.name} icon="person" placeholder="Arjun Sharma" />
          <AuthInput label="Email" name="email" value={values.email} onChange={onChange} error={errors.email} placeholder="you@panchatantra.test" />
          <AuthInput
            label="Password"
            name="password"
            value={values.password}
            onChange={onChange}
            error={errors.password}
            type={showPassword ? 'text' : 'password'}
            icon="lock"
            placeholder="Create a password"
            rightElement={<PasswordToggle show={showPassword} onClick={() => setShowPassword((show) => !show)} label={showPassword ? 'Hide password' : 'Show password'} />}
          />
          <AuthInput label="Confirm password" name="confirmPassword" value={values.confirmPassword} onChange={onChange} error={errors.confirmPassword} type={showPassword ? 'text' : 'password'} icon="lock" placeholder="Confirm your password" />
          <FormControl isInvalid={Boolean(errors.role)}>
            <FormLabel fontWeight="700">Role</FormLabel>
            <Select name="role" value={values.role} onChange={onChange} h="48px" borderRadius="14px" bg="#FFFDF8">
              <option value="student">Student</option>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </Select>
            <FormErrorMessage>{errors.role}</FormErrorMessage>
          </FormControl>
          <Button
            type="submit"
            h="50px"
            bgGradient="linear(135deg, #07111F, #11203D)"
            color="white"
            isLoading={loading}
            isDisabled={loading}
            _hover={{ transform: 'translateY(-1px)', boxShadow: '0 14px 28px rgba(7,17,31,.28)' }}
          >
            Create Account
          </Button>
          <Text textAlign="center" color="brand.muted">
            Already have an account? <ChakraLink as={Link} to="/login" color="brand.goldDark" fontWeight="800">Sign in</ChakraLink>
          </Text>
        </VStack>
      </AuthCard>
    </AuthLayout>
  );
}
