import React from 'react';
import { Box, Button, Flex, Grid, Heading, SimpleGrid, Text, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import TopBar from '../components/layout/TopBar.jsx';
import StatCard from '../components/common/StatCard.jsx';
import DashboardCard from '../components/common/DashboardCard.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import QuoteCard from '../components/common/QuoteCard.jsx';
import LineAreaChart from '../components/charts/LineAreaChart.jsx';
import RadarIdentityChart from '../components/charts/RadarIdentityChart.jsx';
import JourneyHero from '../components/student/JourneyHero.jsx';
import RecommendedStories from '../components/student/RecommendedStories.jsx';
import DailyPuzzle from '../components/student/DailyPuzzle.jsx';
import { API_BASE_URL, fetchDashboard } from '../api/client.js';
import useDashboardActions from '../hooks/useDashboardActions.js';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const refresh = async () => {
    const next = await fetchDashboard('student');
    setData(next);
    return next;
  };
  const { runAction, showCollection } = useDashboardActions('student', refresh);

  useEffect(() => {
    fetchDashboard('student').then(setData).catch(() => {
      setError(`Could not load student dashboard data. Make sure the API is running and reachable at ${API_BASE_URL}.`);
      toast({ status: 'error', title: 'Dashboard API unavailable', duration: 4500 });
    });
  }, [toast]);

  return (
    <DashboardLayout role="student">
      {!data && !error && <LoadingState />}
      {error && <Text color="brand.danger" fontWeight="800">{error}</Text>}
      {data && (
        <>
          <TopBar role="student" {...data.topbar} />
          <Grid templateColumns={{ base: '1fr', xl: '1.08fr 1fr' }} gap={5} mb={5}>
            <JourneyHero onContinue={() => navigate('/student/stories/story-clever-jackal')} />
            <DashboardCard dark>
              <Grid templateColumns={{ base: '1fr', md: '.8fr 1.2fr' }} gap={5} alignItems="center">
                <Box>
                  <Text fontFamily="Georgia,serif" color="#F4D27A">Your Strategic Identity</Text>
                  <Flex align="center" gap={4} my={5}>
                    <Flex w="86px" h="86px" borderRadius="50%" border="2px solid #D6A84F" align="center" justify="center" fontSize="42px">🧘</Flex>
                    <Heading color="#F4D27A" size="md">{data.identity.name}</Heading>
                  </Flex>
                  <Text color="rgba(255,255,255,.86)" fontFamily="Georgia,serif">{data.identity.description}</Text>
                  <Button mt={5} rightIcon={<ArrowForwardIcon />} onClick={() => navigate('/student/strategic-profile')} bg="linear-gradient(135deg,#fff0bd,#D6A84F)" color="brand.navy">View Full Profile</Button>
                </Box>
                <RadarIdentityChart data={data.identity.radar} />
              </Grid>
            </DashboardCard>
          </Grid>

          <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={4} mb={5}>{data.stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}</SimpleGrid>

          <Grid templateColumns={{ base: '1fr', xl: '1fr 1fr 1.18fr' }} gap={5}>
            <DashboardCard title="Recommended For You" action={<Button size="sm" variant="ghost" onClick={() => navigate('/student/stories')}>View All</Button>}>
              <RecommendedStories
                stories={data.recommended}
                onOpenStory={(story) => navigate(`/student/stories/${story.title.includes('Rabbit') ? 'story-lion-clever-rabbit' : story.title.includes('Geese') ? 'story-tortoise-geese' : 'story-brahmin-mongoose'}`)}
                onExplore={() => navigate('/student/stories')}
              />
            </DashboardCard>
            <DashboardCard title="Daily Puzzle">
              <DailyPuzzle puzzle={data.puzzle} onSolve={() => navigate('/student/puzzles/puzzle-daily')} />
            </DashboardCard>
            <DashboardCard title="Your Progress This Week" action={<Button size="sm" variant="ghost" onClick={() => navigate('/student/analytics')}>View Analytics</Button>}>
              <LineAreaChart area data={data.progressWeek} lines={[{ key: 'value', name: 'Academy Points', color: '#D6A84F' }]} height={250} />
              <Text fontSize="13px" mt={1}>You're doing great! Keep the momentum going.</Text>
              <Flex mt={4} p={3} bg="#FFF5DA" border="1px solid rgba(214,168,79,.28)" borderRadius="12px" align="center" gap={3}><Text fontSize="22px">♛</Text><Text fontWeight="800">You're in the top 12% of active learners!</Text></Flex>
            </DashboardCard>
          </Grid>

          <Box mt={5}><QuoteCard quote="Master the mind, and the moves will follow." by="Chess by Panchatantra" banner /></Box>
        </>
      )}
    </DashboardLayout>
  );
}
