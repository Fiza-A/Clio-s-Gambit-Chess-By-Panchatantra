import React, { useEffect, useState } from 'react';
import { Button, Checkbox, CheckboxGroup, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, SimpleGrid, Textarea, VStack } from '@chakra-ui/react';

export default function FormModal({ isOpen, onClose, title, fields = [], initialValues = {}, onSubmit }) {
  const [values, setValues] = useState(initialValues || {});

  // Only update values when initialValues change OR modal opens
  // Use a stringified version or specific trigger to avoid infinite loops with {}
  useEffect(() => {
    if (isOpen) {
      setValues(initialValues || {});
    }
  }, [isOpen, JSON.stringify(initialValues)]);

  const currentFields = typeof fields === 'function' ? fields(values) : fields;

  const submit = () => {
    const missing = currentFields.find((field) => field.required && !values[field.name]);
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
            {currentFields.map((field) => (
              <FormControl key={field.name} isRequired={field.required}>
                <FormLabel>{field.label}</FormLabel>
                {field.type === 'textarea' ? (
                  <Textarea value={values[field.name] || ''} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} />
                ) : field.type === 'multiselect' ? (
                  <CheckboxGroup 
                    value={values[field.name] || []} 
                    onChange={(val) => setValues({ ...values, [field.name]: val })}
                  >
                    <SimpleGrid columns={2} spacing={2} w="100%">
                      {(field.options || []).map((option) => {
                        const label = typeof option === 'object' ? option.label : option;
                        const value = typeof option === 'object' ? option.value : option;
                        return <Checkbox key={value} value={value}>{label}</Checkbox>;
                      })}
                    </SimpleGrid>
                  </CheckboxGroup>
                ) : field.options ? (
                  <Select 
                    value={values[field.name] || ''} 
                    onChange={(event) => {
                      const nextValues = { ...values, [field.name]: event.target.value };
                      // Reset dependent fields if needed
                      if (field.name === 'module_id') nextValues.chapter_id = '';
                      setValues(nextValues);
                    }}
                  >
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
