import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import CloseIcon from '@mui/icons-material/Close';
import {
  formatPrincipleOptionLabel,
  normalizePrinciplesList,
} from '../../utils/principles.js';

const EMPTY_MESSAGE_ROW = { text: '', principleId: '' };

function buildInitialFormValues(initialValues) {
  if (!initialValues?.story_id) {
    return {
      module_id: '',
      chapter_id: '',
      title: '',
      status: 'published',
      messages: [{ ...EMPTY_MESSAGE_ROW }],
    };
  }

  const rows = (initialValues.mappings?.length ? initialValues.mappings : []).map((m) => ({
    id: m.id || m.mappingId,
    text: m.text ?? m.storyText ?? '',
    principleId: m.principleId ?? m.principle_id ?? '',
  }));

  return {
    module_id: initialValues.module_id || '',
    chapter_id: initialValues.chapter_id || '',
    title: initialValues.title || '',
    status: initialValues.status === 'on_hold' ? 'on_hold' : 'published',
    messages: rows.length ? rows : [{ ...EMPTY_MESSAGE_ROW }],
  };
}

const selectFieldSx = {
  bg: 'white',
  border: '1px solid',
  borderColor: 'rgba(169,119,33,0.2)',
  borderRadius: '10px',
  _focus: { borderColor: 'brand.goldDark', boxShadow: '0 0 0 1px rgba(214,168,79,0.35)' },
};

const nativeSelectStyles = {
  width: '100%',
  bg: 'white',
  border: '1px solid',
  borderColor: 'rgba(169,119,33,0.2)',
  borderRadius: '10px',
  h: '40px',
  px: 3,
  fontSize: 'sm',
  color: 'brand.text',
  _focusVisible: {
    borderColor: 'brand.goldDark',
    boxShadow: '0 0 0 1px rgba(214,168,79,0.35)',
    outline: 'none',
  },
  _disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

export default function StoryFormModal({
  isOpen,
  onClose,
  title,
  modules = [],
  chapters = [],
  principles,
  principlesLoading = false,
  initialValues = {},
  onSubmit,
}) {
  const [values, setValues] = useState(() => buildInitialFormValues(initialValues));
  const [errors, setErrors] = useState({});

  const normalizedPrinciples = useMemo(
    () => normalizePrinciplesList(principles),
    [principles],
  );

  const showPrinciplesLoading = principlesLoading && normalizedPrinciples.length === 0;

  useEffect(() => {
    if (isOpen) {
      console.log('[StoryFormModal] Open — raw principles prop:', principles);
      console.log('[StoryFormModal] Normalized principles:', normalizedPrinciples);
      console.log('[StoryFormModal] showPrinciplesLoading:', showPrinciplesLoading);
    }
  }, [isOpen, principles, normalizedPrinciples, showPrinciplesLoading]);

  useEffect(() => {
    if (isOpen) {
      setValues(buildInitialFormValues(initialValues));
      setErrors({});
    }
  }, [isOpen, initialValues]);

  const chapterOptions = useMemo(
    () => chapters.filter((c) => !values.module_id || c.module_id === values.module_id),
    [chapters, values.module_id],
  );

  const updateMessageRow = (index, patch) => {
    setValues((prev) => ({
      ...prev,
      messages: prev.messages.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };

  const addMessageRow = () => {
    setValues((prev) => ({
      ...prev,
      messages: [...prev.messages, { ...EMPTY_MESSAGE_ROW }],
    }));
  };

  const removeMessageRow = (index) => {
    setValues((prev) => {
      if (prev.messages.length <= 1) return prev;
      return { ...prev, messages: prev.messages.filter((_, i) => i !== index) };
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.module_id) nextErrors.module_id = 'Module is required.';
    if (!values.chapter_id) nextErrors.chapter_id = 'Chapter is required.';
    if (!values.title?.trim()) nextErrors.title = 'Story title is required.';
    if (!values.status) nextErrors.status = 'Status is required.';

    const messageErrors = values.messages.map((row) => {
      const rowErrors = {};
      if (!row.text?.trim()) rowErrors.text = 'Message is required.';
      if (!row.principleId) rowErrors.principleId = 'Principle is required.';
      return rowErrors;
    });

    if (messageErrors.some((e) => Object.keys(e).length)) {
      nextErrors.messages = messageErrors;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = () => {
    if (!validate()) return;

    onSubmit({
      story_id: initialValues.story_id,
      title: values.title.trim(),
      module_id: values.module_id,
      chapter_id: values.chapter_id,
      status: values.status,
      description: '',
      messages: values.messages.map((row) => ({
        id: row.id,
        text: row.text.trim(),
        principleId: row.principleId,
      })),
    });
  };

  const inputStyles = {
    bg: 'white',
    border: '1px solid',
    borderColor: 'rgba(169,119,33,0.2)',
    borderRadius: '10px',
    _focus: { borderColor: 'brand.goldDark', boxShadow: '0 0 0 1px rgba(214,168,79,0.35)' },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg="white" borderRadius="16px">
        <ModalHeader color="brand.navy" fontWeight="800">{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired isInvalid={!!errors.module_id}>
              <FormLabel>Module</FormLabel>
              <Select
                sx={selectFieldSx}
                value={values.module_id}
                onChange={(e) => setValues({ ...values, module_id: e.target.value, chapter_id: '' })}
              >
                <option value="">Choose module</option>
                {modules.map((m) => (
                  <option key={m.module_id} value={m.module_id}>{m.title}</option>
                ))}
              </Select>
              {errors.module_id && <Text fontSize="sm" color="red.500" mt={1}>{errors.module_id}</Text>}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.chapter_id}>
              <FormLabel>Chapter</FormLabel>
              <Select
                sx={selectFieldSx}
                value={values.chapter_id}
                onChange={(e) => setValues({ ...values, chapter_id: e.target.value })}
                isDisabled={!values.module_id}
              >
                <option value="">Choose chapter</option>
                {chapterOptions.map((c) => (
                  <option key={c.chapter_id} value={c.chapter_id}>{c.title}</option>
                ))}
              </Select>
              {errors.chapter_id && <Text fontSize="sm" color="red.500" mt={1}>{errors.chapter_id}</Text>}
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.title}>
              <FormLabel>Story Title</FormLabel>
              <Input
                {...inputStyles}
                value={values.title}
                onChange={(e) => setValues({ ...values, title: e.target.value })}
                placeholder="Enter story title"
              />
              {errors.title && <Text fontSize="sm" color="red.500" mt={1}>{errors.title}</Text>}
            </FormControl>

            <Box>
              <FormLabel mb={2}>Messages and Principles</FormLabel>
              {!showPrinciplesLoading && normalizedPrinciples.length === 0 && (
                <Text fontSize="sm" color="orange.600" mb={2}>
                  No principles in the database. Add principles from the Principles tab first.
                </Text>
              )}
              <VStack spacing={4} align="stretch">
                {values.messages.map((row, index) => {
                  const rowErrors = errors.messages?.[index] || {};
                  return (
                    <Box
                      key={row.id || `row-${index}`}
                      p={4}
                      border="1px solid"
                      borderColor="rgba(169,119,33,0.16)"
                      borderRadius="12px"
                      bg="rgba(250,247,240,0.5)"
                    >
                      <Flex justify="space-between" align="center" mb={3}>
                        <Text fontSize="sm" fontWeight="700" color="brand.navy">
                          Message {index + 1}
                        </Text>
                        {values.messages.length > 1 && (
                          <IconButton
                            aria-label="Remove message"
                            size="sm"
                            variant="ghost"
                            color="brand.muted"
                            icon={<CloseIcon fontSize="small" />}
                            onClick={() => removeMessageRow(index)}
                          />
                        )}
                      </Flex>
                      <VStack spacing={3} align="stretch">
                        <FormControl isRequired isInvalid={!!rowErrors.text}>
                          <FormLabel fontSize="sm">Message</FormLabel>
                          <Textarea
                            {...inputStyles}
                            rows={3}
                            value={row.text}
                            onChange={(e) => updateMessageRow(index, { text: e.target.value })}
                            placeholder="Enter message"
                          />
                          {rowErrors.text && <Text fontSize="sm" color="red.500" mt={1}>{rowErrors.text}</Text>}
                        </FormControl>
                        <FormControl isRequired isInvalid={!!rowErrors.principleId}>
                          <FormLabel fontSize="sm">Principle</FormLabel>
                          <Box
                            as="select"
                            value={row.principleId}
                            onChange={(e) => updateMessageRow(index, { principleId: e.target.value })}
                            disabled={showPrinciplesLoading}
                            {...nativeSelectStyles}
                          >
                            {showPrinciplesLoading ? (
                              <option value="">Loading principles…</option>
                            ) : (
                              <>
                                <option value="">Choose principle</option>
                                {normalizedPrinciples.map((principle) => (
                                  <option key={principle.id} value={principle.id}>
                                    {formatPrincipleOptionLabel(principle)}
                                  </option>
                                ))}
                              </>
                            )}
                          </Box>
                          {rowErrors.principleId && <Text fontSize="sm" color="red.500" mt={1}>{rowErrors.principleId}</Text>}
                        </FormControl>
                      </VStack>
                    </Box>
                  );
                })}
              </VStack>
              <Button
                mt={3}
                variant="outline"
                borderColor="rgba(169,119,33,0.35)"
                color="brand.navy"
                fontWeight="600"
                onClick={addMessageRow}
              >
                Add Message
              </Button>
            </Box>

            <Divider borderColor="rgba(214,168,79,0.14)" />

            <FormControl isRequired isInvalid={!!errors.status}>
              <FormLabel>Status</FormLabel>
              <Select
                sx={selectFieldSx}
                value={values.status}
                onChange={(e) => setValues({ ...values, status: e.target.value })}
              >
                <option value="published">Published</option>
                <option value="on_hold">On Hold</option>
              </Select>
              {errors.status && <Text fontSize="sm" color="red.500" mt={1}>{errors.status}</Text>}
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button mr={3} variant="ghost" onClick={onClose}>Cancel</Button>
          <Button bg="brand.navy" color="white" _hover={{ bg: '#122536' }} onClick={submit}>Save</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
