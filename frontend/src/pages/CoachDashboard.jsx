import React from 'react';
import { Box, Button, Flex, Grid, SimpleGrid, Text, useDisclosure, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CampaignIcon from '@mui/icons-material/Campaign';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import TopBar from '../components/layout/TopBar.jsx';
import StatCard from '../components/common/StatCard.jsx';
import DashboardCard, { MonthSelect } from '../components/common/DashboardCard.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ActivityList from '../components/common/ActivityList.jsx';
import QuickActionCard from '../components/common/QuickActionCard.jsx';
import QuoteCard from '../components/common/QuoteCard.jsx';
import LineAreaChart from '../components/charts/LineAreaChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import StudentList from '../components/coach/StudentList.jsx';
import SchedulePanel from '../components/coach/SchedulePanel.jsx';
import StrengthWeaknessCard from '../components/coach/StrengthWeaknessCard.jsx';
import { API_BASE_URL, fetchDashboard } from '../api/client.js';
import useDashboardActions from '../hooks/useDashboardActions.js';
import FormModal from '../components/common/FormModal.jsx';
import { coachApi } from '../api/coachApi.js';

export default function CoachDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const createClassModal = useDisclosure();
  const refresh = async () => {
    const next = await fetchDashboard('coach');
    setData(next);
    return next;
  };
  const { runAction, showCollection } = useDashboardActions('coach', refresh);

  useEffect(() => {
    fetchDashboard('coach').then(setData).catch(() => {
      setError(`Could not load coach dashboard data. Make sure the API is running and reachable at ${API_BASE_URL}.`);
      toast({ status: 'error', title: 'Dashboard API unavailable', duration: 4500 });
    });
  }, [toast]);

  return (
    <DashboardLayout role="coach">
      {!data && !error && <LoadingState />}
      {error && <Text color="brand.danger" fontWeight="800">{error}</Text>}
      {data && (
        <>
          <TopBar role="coach" {...data.topbar} onCta={createClassModal.onOpen} />
          <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={4} mb={5}>{data.stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}</SimpleGrid>
          <Grid templateColumns={{ base: '1fr', xl: '1.45fr 1.05fr 1fr' }} gap={5}>
            <DashboardCard title="Student Progress Overview" action={<MonthSelect />} minH="354px">
              <LineAreaChart data={data.progress} lines={[{ key: 'classProgress', name: 'Average Class Progress', color: '#D6A84F' }, { key: 'puzzleAccuracy', name: 'Average Puzzle Accuracy', color: '#07111F' }]} />
            </DashboardCard>
            <DashboardCard title="Your Students" action={<Button size="sm" variant="ghost" onClick={() => navigate('/coach/students')}>View All</Button>} minH="354px">
              <StudentList students={data.students} onOpenStudent={(_student, index) => navigate(`/coach/students/student-${index + 1}`)} />
            </DashboardCard>
            <DashboardCard title="Today’s Schedule" action={<Button size="sm" variant="ghost" onClick={() => navigate('/coach/classes')}>View Calendar</Button>} minH="354px">
              <SchedulePanel schedule={data.schedule} onViewAll={() => navigate('/coach/classes')} onOpenClass={(_item, index) => navigate(`/coach/classes/coach-class-${index + 1}`)} />
            </DashboardCard>
          </Grid>

          <Grid templateColumns={{ base: '1fr', xl: '1.05fr 1.45fr 1fr' }} gap={5} mt={5}>
            <DashboardCard title="Class Analytics" action={<MonthSelect />}>
              <DonutChart data={data.classAnalytics} centerValue="12" centerLabel="Classes" />
              <SimpleGrid columns={3} mt={4} pt={4} borderTop="1px solid rgba(169,119,33,.14)">
                <Box><Text fontSize="12px">Total Attendance</Text><Text fontSize="22px" fontWeight="900">92%</Text></Box>
                <Box><Text fontSize="12px">Avg. Engagement</Text><Text fontSize="22px" fontWeight="900">85%</Text></Box>
                <Box><Text fontSize="12px">On-time Start Rate</Text><Text fontSize="22px" fontWeight="900">100%</Text></Box>
              </SimpleGrid>
            </DashboardCard>
            <DashboardCard title="Top Strengths & Weaknesses" action={<MonthSelect />}>
              <StrengthWeaknessCard strengths={data.strengths} weaknesses={data.weaknesses} />
            </DashboardCard>
            <Box>
              <DashboardCard title="Recent Activity" action={<Button size="sm" variant="ghost" onClick={() => navigate('/coach/reports')}>View All</Button>}>
                <ActivityList items={data.recentActivity} />
              </DashboardCard>
              <Box mt={5}><QuoteCard quote="Every pawn has potential. Guidance reveals the champion." by="Chess by Panchatantra" dark={false} /></Box>
            </Box>
          </Grid>

          <DashboardCard title="Teacher’s Command Center" mt={5}>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={4}>
              <QuickActionCard icon={AssignmentIcon} title="Create Assignment" subtitle="Assign puzzles or stories" onClick={() => runAction('create-assignment', 'Create Assignment', { title: 'Knight Fork Drill' })} />
              <QuickActionCard icon={MenuBookIcon} title="Share Resource" subtitle="Upload study materials" onClick={() => runAction('share-resource', 'Share Resource', { title: 'Sacrifice Patterns PDF' })} />
              <QuickActionCard icon={CampaignIcon} title="Send Announcement" subtitle="Notify your students" onClick={() => runAction('send-announcement', 'Send Announcement', { message: 'Prepare puzzle notebooks.' })} />
              <QuickActionCard icon={FactCheckIcon} title="Review Submissions" subtitle="Check student work" onClick={() => runAction('review-submissions', 'Review Submissions')} />
              <QuickActionCard icon={AnalyticsIcon} title="Generate Report" subtitle="Detailed student insights" onClick={() => runAction('generate-report', 'Generate Report')} />
            </SimpleGrid>
          </DashboardCard>
          <FormModal
            isOpen={createClassModal.isOpen}
            onClose={createClassModal.onClose}
            title="Create Class"
            fields={[{ name: 'title', label: 'Title', required: true }, { name: 'batch', label: 'Batch' }, { name: 'topic', label: 'Topic' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'time', label: 'Time' }, { name: 'duration', label: 'Duration' }, { name: 'meetingLink', label: 'Meeting Link' }]}
            onSubmit={async (values) => { await coachApi.createClass(values); toast({ title: 'Class created', status: 'success' }); createClassModal.onClose(); }}
          />
        </>
      )}
    </DashboardLayout>
  );
}
