import React from 'react';
import { Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react';

export default function ErrorState({ message = 'Something went wrong.' }) {
  return (
    <Alert status="error" borderRadius="14px">
      <AlertIcon />
      <AlertTitle>Could not load page</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
