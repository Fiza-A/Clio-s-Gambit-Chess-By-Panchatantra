import React from 'react';
import { Box, Button, Grid, SimpleGrid, Text, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ExtensionIcon from '@mui/icons-material/Extension';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
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
import RadialEngagement from '../components/charts/RadialEngagement.jsx';
import ContentOverview from '../components/admin/ContentOverview.jsx';
import ModuleTable from '../components/admin/ModuleTable.jsx';
import { fetchDashboard } from '../api/client.js';
import useDashboardActions from '../hooks/useDashboardActions.js';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const refresh = async () => {
    const next = await fetchDashboard('admin');
    setData(next);
    return next;
  };
  const { runAction, showCollection, exportReport } = useDashboardActions('admin', refresh);

  useEffect(() => {
    fetchDashboard('admin').then(setData).catch(() => {
      setError('Could not load admin dashboard data. Make sure the Express server is running on port 5000.');
      toast({ status: 'error', title: 'Dashboard API unavailable', duration: 4500 });
    });
  }, [toast]);

  return (
    <DashboardLayout role="admin">
      {!data && !error && <LoadingState />}
      {error && <Text color="brand.danger" fontWeight="800">{error}</Text>}
      {data && (
        <>
          <TopBar role="admin" {...data.topbar} onCta={exportReport} />
          <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={4} mb={5}>{data.stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}</SimpleGrid>
          <Grid templateColumns={{ base: '1fr', xl: '1.5fr 1fr 1fr' }} gap={5}>
            <DashboardCard title="User Growth Overview" action={<MonthSelect />}>
              <LineAreaChart area data={data.userGrowth} lines={[{ key: 'total', name: 'Total Users', color: '#07111F' }, { key: 'active', name: 'Active Students', color: '#D6A84F' }]} height={286} />
            </DashboardCard>
            <DashboardCard title="Users by Role">
              <DonutChart data={data.roles} centerValue="2,458" centerLabel="Total Users" />
            </DashboardCard>
            <DashboardCard title="Recent Activity" action={<Button size="sm" variant="ghost" onClick={() => navigate('/admin/reports')}>View All</Button>}>
              <ActivityList items={data.recentActivity} />
            </DashboardCard>
          </Grid>

          <Grid templateColumns={{ base: '1fr', xl: '.85fr 1.25fr .85fr 1fr' }} gap={5} mt={5}>
            <DashboardCard title="Content Overview" action={<Button size="sm" variant="ghost" onClick={() => navigate('/admin/curriculum')}>View All</Button>}><ContentOverview items={data.content} /></DashboardCard>
            <DashboardCard title="Top Performing Modules" action={<MonthSelect />}><ModuleTable modules={data.topModules} /></DashboardCard>
            <DashboardCard title="Student Engagement" action={<MonthSelect />}>
              <RadialEngagement score={data.engagement.score} />
              <Text color="brand.success" fontWeight="700" textAlign="center">{data.engagement.trend}</Text>
              <Text mt={3} bg="#FFF7E8" p={2} borderRadius="10px" textAlign="center" fontSize="13px">Avg. Session Time: {data.engagement.session}</Text>
            </DashboardCard>
            <Box>
              <DashboardCard title="Quick Actions">
                <SimpleGrid columns={2} spacing={3}>
                  <QuickActionCard icon={MenuBookIcon} title="Add New Story" onClick={() => navigate('/admin/stories')} />
                  <QuickActionCard icon={ExtensionIcon} title="Add New Puzzle" onClick={() => navigate('/admin/puzzles')} />
                  <QuickActionCard icon={CalendarMonthIcon} title="Create Class" onClick={() => navigate('/admin/classes')} />
                  <QuickActionCard icon={PersonAddIcon} title="Invite Users" onClick={() => runAction('invite-users', 'Invite Users', { count: 5 })} />
                  <QuickActionCard icon={AnalyticsIcon} title="View Analytics" wide onClick={() => navigate('/admin/analytics')} />
                </SimpleGrid>
              </DashboardCard>
              <Box mt={5}><QuoteCard quote={data.topbar.title.includes('Admin') ? 'A wise king learns every day.' : ''} by="Panchatantra" /></Box>
            </Box>
          </Grid>

          <DashboardCard title="Academy Performance Overview" action={<MonthSelect />} mt={5}>
            <SimpleGrid columns={{ base: 1, md: 3, xl: 5 }} spacing={4}>
              {data.performance.map((metric) => (
                <Box key={metric.label} borderRight={{ xl: '1px solid rgba(169,119,33,.18)' }} pr={4}>
                  <Text fontSize="13px">{metric.label}</Text>
                  <Text fontFamily="Georgia,serif" fontSize="28px" fontWeight="900">{metric.value} <Text as="span" color="brand.success" fontFamily="Inter" fontSize="12px">{metric.trend}</Text></Text>
                </Box>
              ))}
            </SimpleGrid>
          </DashboardCard>
        </>
      )}
    </DashboardLayout>
  );
}
