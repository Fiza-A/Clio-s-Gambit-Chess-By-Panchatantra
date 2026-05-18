import React, { useState, useEffect } from 'react';
import { Alert, AlertIcon, Button, Link as ChakraLink, Text, useToast, VStack } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import AuthLayout, { AuthCard, AuthHeader } from '../../components/auth/AuthLayout.jsx';
import { AuthInput, emailPattern } from '../../components/auth/AuthControls.jsx';
import { authApi } from '../../api/authApi.js';

export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!emailPattern.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email);
      setSent(true);
      toast({ title: result.message, status: 'success' });
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'An unexpected error occurred';
      toast({ title: 'Unable to send reset link', description: message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard maxW="480px">
        <AuthHeader title="Reset Password" subtitle="Enter your email to receive a reset link" />
        <VStack as="form" spacing={6} align="stretch" onSubmit={submit}>
          {sent && (
            <Alert status="success" borderRadius="14px" bg="#F1FAF3">
              <AlertIcon />
              Check your inbox for the reset link.
            </Alert>
          )}
          <AuthInput
            label="Email Address"
            name="email"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setError(''); }}
            error={error}
            placeholder="Enter your email"
          />
          <Button
            type="submit"
            h="56px"
            bg="#0A1428"
            color="white"
            borderRadius="12px"
            fontSize="16px"
            isLoading={loading}
            isDisabled={loading}
            _hover={{ bg: "#11203D", transform: 'translateY(-1px)' }}
          >
            Send Reset Link
          </Button>
          <Text textAlign="center" color="brand.muted" fontSize="15px">
            Remembered it? <ChakraLink as={Link} to="/login" color="#A97721" fontWeight="600">Back to login</ChakraLink>
          </Text>
        </VStack>
      </AuthCard>
    </AuthLayout>
  );
}
