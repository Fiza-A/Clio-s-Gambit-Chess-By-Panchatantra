import React, { useEffect, useState } from 'react';
import { Button, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Textarea, VStack } from '@chakra-ui/react';

export default function FormModal({ isOpen, onClose, title, fields = [], initialValues = {}, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  useEffect(() => setValues(initialValues || {}), [initialValues, isOpen]);

  const submit = () => {
    const missing = fields.find((field) => field.required && !values[field.name]);
    if (missing) return;
    onSubmit(values);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {fields.map((field) => (
              <FormControl key={field.name} isRequired={field.required}>
                <FormLabel>{field.label}</FormLabel>
                {field.type === 'textarea' ? (
                  <Textarea value={values[field.name] || ''} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} />
                ) : field.options ? (
                  <Select value={values[field.name] || ''} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}>
                    <option value="">Choose</option>
                    {field.options.map((option) => {
                      const label = typeof option === 'object' ? option.label : option;
                      const value = typeof option === 'object' ? option.value : option;
                      return <option key={value} value={value}>{label}</option>;
                    })}
                  </Select>
                ) : (
                  <Input type={field.type || 'text'} value={values[field.name] || ''} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} />
                )}
              </FormControl>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button mr={3} variant="ghost" onClick={onClose}>Cancel</Button>
          <Button bg="brand.navy" color="white" onClick={submit}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
