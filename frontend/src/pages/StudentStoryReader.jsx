import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  Progress,
  SimpleGrid,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import DashboardCard from '../components/common/DashboardCard.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import { studentApi } from '../api/studentApi.js';

const goldProgress = { '& > div': { background: '#D6A84F' } };

const outlineBtn = {
  variant: 'outline',
  borderColor: 'rgba(169,119,33,0.35)',
  color: 'brand.navy',
  fontWeight: '600',
  _hover: { bg: 'rgba(214,168,79,0.1)' },
};

const primaryBtn = {
  bg: 'brand.navy',
  color: 'white',
  fontWeight: '600',
  _hover: { bg: 'brand.goldDark', color: 'white' },
};

const insightBox = {
  p: 4,
  bg: '#FFF7E8',
  borderRadius: '14px',
  border: '1px solid',
  borderColor: 'rgba(214,168,79,0.18)',
};

function statusBadgeProps(status) {
  if (status === 'completed') return { bg: '#BFEACB', color: '#176D31' };
  if (status === 'in-progress') return { bg: '#E6D7FF', color: '#4D2EA8' };
  return { bg: '#F8CACA', color: '#9E2626' };
}

function BreadcrumbLink({ label, onClick, isLast }) {
  if (isLast) {
    return (
      <Text color="brand.navy" fontWeight="600">
        {label}
      </Text>
    );
  }
  return (
    <Text
      as="button"
      type="button"
      color="brand.muted"
      _hover={{ color: 'brand.goldDark', textDecoration: 'underline' }}
      onClick={onClick}
    >
      {label}
    </Text>
  );
}

function StoryMessageCard({ message, index }) {
  return (
    <Box
      p={{ base: 4, md: 5 }}
      bg="white"
      borderRadius="14px"
      border="1px solid"
      borderColor="rgba(214,168,79,0.16)"
      boxShadow="0 4px 16px rgba(7,17,31,0.04)"
      transition="all 0.2s ease"
      _hover={{
        borderColor: 'rgba(214,168,79,0.32)',
        boxShadow: '0 10px 28px rgba(7,17,31,0.07)',
      }}
    >
      <HStack justify="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Text fontSize="xs" fontWeight="800" color="brand.goldDark" letterSpacing="0.06em" textTransform="uppercase">
          Message {index + 1}
        </Text>
        {message.storyId && (
          <Badge bg="rgba(7,17,31,0.06)" color="brand.navy" fontSize="10px" borderRadius="full" px={2}>
            {message.storyId}
          </Badge>
        )}
      </HStack>
      <Text fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.85" color="brand.text" whiteSpace="pre-wrap">
        {message.text}
      </Text>
      {message.principleName && (
        <Box mt={4} pt={3} borderTop="1px solid" borderColor="rgba(214,168,79,0.14)">
          <Text fontSize="xs" fontWeight="700" color="brand.goldDark" mb={1}>
            Principle {message.principleId ? `· ${message.principleId}` : ''}
          </Text>
          <Text fontSize="sm" fontWeight="600" color="brand.navy">
            {message.principleName}
          </Text>
        </Box>
      )}
    </Box>
  );
}

function StoryImageGallery({ images }) {
  if (!images?.length) {
    return (
      <Box
        p={8}
        textAlign="center"
        borderRadius="14px"
        border="1px dashed"
        borderColor="rgba(214,168,79,0.35)"
        bg="rgba(250, 247, 240, 0.5)"
      >
        <Text fontSize="3xl" mb={2} aria-hidden>
          🖼
        </Text>
        <Text fontSize="sm" fontWeight="600" color="brand.navy">
          No story images yet
        </Text>
        <Text fontSize="xs" color="brand.muted" mt={1}>
          Illustrations will appear here when added to this story.
        </Text>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
      {images.map((src, index) => (
        <Box
          key={`${src}-${index}`}
          borderRadius="14px"
          overflow="hidden"
          border="1px solid"
          borderColor="rgba(214,168,79,0.16)"
          bg="rgba(250,247,240,0.4)"
          transition="transform 0.2s ease, box-shadow 0.2s ease"
          _hover={{ transform: 'translateY(-2px)', boxShadow: '0 12px 24px rgba(7,17,31,0.08)' }}
        >
          <Image
            src={src}
            alt={`Story illustration ${index + 1}`}
            loading="lazy"
            w="100%"
            h="auto"
            aspectRatio={4 / 3}
            objectFit="cover"
            fallback={
              <Flex h="180px" align="center" justify="center" bg="rgba(214,168,79,0.08)">
                <Text fontSize="xs" color="brand.muted">
                  Image unavailable
                </Text>
              </Flex>
            }
          />
        </Box>
      ))}
    </SimpleGrid>
  );
}

export default function StudentStoryReader() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);

  const loadStory = useCallback(async () => {
    if (!storyId) {
      setError('Story ID is missing.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const payload = await studentApi.getStoryDetail(storyId);
      if (!payload?.story) {
        setError('Story not found');
        setData(null);
        return;
      }
      setData(payload);
      if (Number(payload.story?.progress ?? 0) === 0) {
        studentApi.updateStoryProgress(storyId, { progress: 10, readPage: 0 }).catch(() => {});
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load story');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    loadStory();
  }, [loadStory]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [storyId]);

  const story = data?.story;
  const module = data?.module;
  const chapter = data?.chapter;
  const messages = data?.messages?.length ? data.messages : [];
  const principles = data?.principles || [];
  const storyImages = useMemo(
    () => data?.storyImages || story?.storyImages || [],
    [data?.storyImages, story?.storyImages],
  );
  const navigation = data?.navigation || {};

  const primaryPrinciple = principles[0] || null;
  const moduleName = module?.title || module?.name || 'Module';
  const chapterName = chapter?.title || chapter?.name || 'Chapter';
  const storyTitle = story?.storyTitle || story?.title || 'Story';

  const markComplete = async () => {
    try {
      setMarkingComplete(true);
      await studentApi.updateStoryProgress(storyId, { progress: 100, readPage: 0 });
      toast({ title: 'Story marked complete', status: 'success' });
      await loadStory();
    } catch (err) {
      toast({
        title: 'Could not update progress',
        description: err.response?.data?.error || err.message,
        status: 'error',
      });
    } finally {
      setMarkingComplete(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <LoadingState />
      </DashboardLayout>
    );
  }

  if (error || !story) {
    return (
      <DashboardLayout role="student">
        <ErrorState message={error || 'Story not found'} />
        <Button mt={4} {...primaryBtn} onClick={() => navigate('/student/stories')}>
          Back to Stories
        </Button>
      </DashboardLayout>
    );
  }

  const hasMessages = messages.some((m) => String(m.text || '').trim());

  return (
    <DashboardLayout role="student">
      <Box mb={6}>
        <HStack spacing={1} fontSize="13px" color="brand.muted" flexWrap="wrap" mb={3} rowGap={1}>
          <BreadcrumbLink label="Student" onClick={() => navigate('/student/dashboard')} />
          <Text color="brand.muted">/</Text>
          <BreadcrumbLink label="Stories" onClick={() => navigate('/student/stories')} />
          <Text color="brand.muted">/</Text>
          <BreadcrumbLink
            label={moduleName}
            onClick={() => module?.id && navigate(`/student/stories/module/${module.id}`)}
          />
          <Text color="brand.muted">/</Text>
          <BreadcrumbLink
            label={chapterName}
            onClick={() =>
              module?.id &&
              chapter?.id &&
              navigate(`/student/stories/module/${module.id}/chapter/${chapter.id}`)
            }
          />
          <Text color="brand.muted">/</Text>
          <BreadcrumbLink label={storyTitle} isLast />
        </HStack>

        <Flex justify="space-between" align="flex-start" gap={4} flexWrap="wrap">
          <Box flex="1" minW="240px">
            <HStack spacing={2} mb={2} flexWrap="wrap">
              <Badge bg="brand.navy" color="white" fontSize="11px" borderRadius="full" px={3} py={0.5}>
                {storyId}
              </Badge>
              <Badge fontSize="11px" borderRadius="2px" px={2} {...statusBadgeProps(story.status)}>
                {story.status.replace('-', ' ').toUpperCase()}
              </Badge>
            </HStack>
            <Heading
              size="lg"
              color="brand.navy"
              fontFamily="serif"
              fontWeight="800"
              letterSpacing="-0.02em"
              lineHeight="1.2"
            >
              {storyTitle}
            </Heading>
            <Text mt={2} color="brand.muted" fontSize="sm">
              {moduleName} · {chapterName}
            </Text>
          </Box>
          <Button
            size="sm"
            {...outlineBtn}
            flexShrink={0}
            onClick={() =>
              module?.id && chapter?.id
                ? navigate(`/student/stories/module/${module.id}/chapter/${chapter.id}`)
                : navigate('/student/stories')
            }
          >
            Back to Chapter
          </Button>
        </Flex>
      </Box>

      <Grid templateColumns={{ base: '1fr', xl: '1.15fr 0.85fr' }} gap={{ base: 6, xl: 8 }} alignItems="start">
        <VStack align="stretch" spacing={5}>
          <DashboardCard>
            <Heading size="sm" color="brand.navy" mb={3} fontFamily="serif">
              Story Overview
            </Heading>
            <Text fontSize="md" lineHeight="1.8" color="brand.text">
              {story.introduction || story.subtitle || story.body?.slice(0, 320) || 'Explore this Panchatantra tale and its chess lessons.'}
            </Text>
            <Box mt={5}>
              <Flex justify="space-between" align="center" mb={2} flexWrap="wrap" gap={2}>
                <Text fontSize="sm" fontWeight="700" color="brand.navy">
                  Your reading progress
                </Text>
                <Text fontSize="sm" color="brand.muted">
                  {story.progress}%
                </Text>
              </Flex>
              <Progress value={story.progress} borderRadius="999px" bg="#EDF2F7" sx={goldProgress} />
            </Box>
          </DashboardCard>

          <Box>
            <Heading size="sm" color="brand.navy" mb={4} fontFamily="serif">
              Story Messages
            </Heading>
            {!hasMessages ? (
              <EmptyState
                title="No story content yet"
                message="This story does not have messages yet. Check back later or choose another story."
              />
            ) : (
              <VStack align="stretch" spacing={4}>
                {messages.map((message, index) => (
                  <StoryMessageCard key={message.storyId || index} message={message} index={index} />
                ))}
              </VStack>
            )}
          </Box>

          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
            <Box {...insightBox}>
              <Heading size="sm" color="brand.navy" fontFamily="serif">
                Panchatantra Lesson
              </Heading>
              <Text mt={2} fontSize="sm" lineHeight="1.75" color="brand.text">
                {story.panchatantraLesson || story.lesson || 'Wisdom grows when we pause, observe, and choose our moves carefully.'}
              </Text>
            </Box>
            <Box {...insightBox}>
              <Heading size="sm" color="brand.navy" fontFamily="serif">
                Chess Concept
              </Heading>
              <Text mt={2} fontSize="sm" lineHeight="1.75" color="brand.text">
                {story.chessConcept || 'Strategy and reflection'}
              </Text>
            </Box>
          </Grid>

          {primaryPrinciple && (
            <DashboardCard>
              <Heading size="sm" color="brand.navy" mb={2} fontFamily="serif">
                Key Moral / Principle
              </Heading>
              <Text fontSize="xs" fontWeight="700" color="brand.goldDark" mb={1}>
                {primaryPrinciple.id}
              </Text>
              <Text fontSize="md" lineHeight="1.75" color="brand.text">
                {primaryPrinciple.name}
              </Text>
              {principles.length > 1 && (
                <VStack align="stretch" mt={4} spacing={2}>
                  {principles.slice(1).map((p) => (
                    <Box
                      key={p.id}
                      p={3}
                      borderRadius="10px"
                      bg="rgba(250,247,240,0.65)"
                      border="1px solid rgba(214,168,79,0.12)"
                    >
                      <Text fontSize="xs" fontWeight="700" color="brand.goldDark">
                        {p.id}
                      </Text>
                      <Text fontSize="sm" mt={0.5}>
                        {p.name}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </DashboardCard>
          )}

          <DashboardCard>
            <Flex flexWrap="wrap" gap={3}>
              <Button {...primaryBtn} isLoading={markingComplete} onClick={markComplete}>
                Mark Complete
              </Button>
              <Button
                {...outlineBtn}
                isDisabled={!navigation.prevStoryId}
                onClick={() => navigation.prevStoryId && navigate(`/student/stories/${navigation.prevStoryId}/read`)}
              >
                Previous Story
              </Button>
              <Button
                {...outlineBtn}
                isDisabled={!navigation.nextStoryId}
                onClick={() => navigation.nextStoryId && navigate(`/student/stories/${navigation.nextStoryId}/read`)}
              >
                Next Story
              </Button>
              <Button
                {...outlineBtn}
                onClick={() =>
                  module?.id && chapter?.id
                    ? navigate(`/student/stories/module/${module.id}/chapter/${chapter.id}`)
                    : navigate('/student/stories')
                }
              >
                Back to Chapter
              </Button>
            </Flex>
          </DashboardCard>
        </VStack>

        <Box position={{ xl: 'sticky' }} top={{ xl: '24px' }}>
          <DashboardCard title="Story Gallery">
            <StoryImageGallery images={storyImages} />
          </DashboardCard>
        </Box>
      </Grid>
    </DashboardLayout>
  );
}
