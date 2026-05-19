import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Flex, FormControl, FormLabel, Grid, Heading, HStack, Input, Progress, Select, SimpleGrid, Spinner, Stat, StatHelpText, StatLabel, StatNumber, Switch, Tab, TabList, TabPanel, TabPanels, Table, Tbody, Td, Th, Thead, Tr, Tabs, Text, Textarea, useDisclosure, useToast, VStack, Divider, Link } from '@chakra-ui/react';
import { ExternalLink } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import DashboardCard from '../components/common/DashboardCard.jsx';
import DataTable from '../components/common/DataTable.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import FormModal from '../components/common/FormModal.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import SearchFilterBar from '../components/common/SearchFilterBar.jsx';
import LineAreaChart from '../components/charts/LineAreaChart.jsx';
import RadarIdentityChart from '../components/charts/RadarIdentityChart.jsx';
import PuzzlePlayer from '../components/chess/PuzzlePlayer.jsx';
import { studentApi } from '../api/studentApi.js';
import { coachApi } from '../api/coachApi.js';
import { adminApi } from '../api/adminApi.js';
import { chessComApi } from '../api/chessComApi.js';
import { downloadTextFile } from '../utils/download.js';
import { getValue, titleCase } from '../utils/formatters.js';

function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const reload = async () => {
    try {
      setError('');
      console.log(`[useLoad] Loading data for ${loader.toString().slice(0, 100)}...`);
      const next = await loader();
      console.log('[useLoad] Data received:', next);
      setData(next);
      return next;
    } catch (err) {
      console.error('[useLoad] Error:', err);
      setError(err.message);
      return null;
    }
  };
  useEffect(() => { reload(); }, deps);
  return { data, error, setData, reload };
}

function PageShell({ role, title, subtitle, children }) {
  return (
    <DashboardLayout role={role}>
      <Flex justify="space-between" align="flex-start" mb={5} gap={4}>
        <Box>
          <Heading>{title}</Heading>
          {subtitle && <Text color="brand.muted" mt={1}>{subtitle}</Text>}
        </Box>
      </Flex>
      {children}
    </DashboardLayout>
  );
}

function filterItems(items, search, filter) {
  return items.filter((item) => {
    const text = JSON.stringify(item).toLowerCase();
    const passesSearch = text.includes(search.toLowerCase());
    const passesFilter = filter === 'all' || text.includes(filter.toLowerCase());
    return passesSearch && passesFilter;
  });
}

function CardGrid({ items, onOpen, extra }) {
  if (!items.length) return <EmptyState />;
  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
      {items.map((item) => (
        <DashboardCard key={item.id} onClick={() => onOpen?.(item)} cursor="pointer">
          <Flex justify="space-between" align="start">
            <Box>
              <Heading size="sm">{item.title || item.name}</Heading>
              <Text color="brand.muted" mt={2}>{item.chapter ? `Chapter ${item.chapter}` : item.category || item.difficulty || item.role || item.topic}</Text>
            </Box>
            <Text fontSize="34px">{item.solved || item.learned || item.unlocked || item.status === 'completed' ? '♛' : '♟'}</Text>
          </Flex>
          {item.tags && <HStack mt={3}>{item.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</HStack>}
          {item.progress !== undefined && <Progress mt={4} value={item.progress} borderRadius="999px" sx={{ '& > div': { background: '#D6A84F' } }} />}
          {extra?.(item)}
        </DashboardCard>
      ))}
    </SimpleGrid>
  );
}

const goldProgress = { '& > div': { background: '#D6A84F' } };
const primaryCtaProps = {
  w: '100%',
  bg: 'brand.navy',
  color: 'white',
  _hover: { bg: 'brand.goldDark', color: 'white' },
};

function statusBadgeProps(status) {
  if (status === 'Completed' || status === 'completed') return { bg: '#BFEACB', color: '#176D31' };
  if (status === 'In Progress' || status === 'in-progress') return { bg: '#E6D7FF', color: '#4D2EA8' };
  return { bg: '#F8CACA', color: '#9E2626' };
}

export function StudentStories() {
  const navigate = useNavigate();
  const { data, error } = useLoad(() => studentApi.getStoryModules(), []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  if (error) return <PageShell role="student" title="Stories"><ErrorState message={error} /></PageShell>;
  const items = (data || []).filter((module) => {
    const text = `${module.title} ${module.subtitle} ${module.level}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (filter === 'all' || module.level === filter);
  });
  return (
    <PageShell role="student" title="Stories" subtitle="Explore Panchatantra wisdom through chess modules.">
      {!data ? <LoadingState /> : <>
        <SearchFilterBar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} filters={['all','Beginner','Intermediate','Advanced']} />
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {items.map((module) => (
            <DashboardCard key={module.id} cursor="pointer" onClick={() => navigate(`/student/stories/module/${module.id}`)}>
              <Flex justify="space-between" align="start">
                <Text fontSize="46px" color="brand.goldDark">{module.icon}</Text>
                <Badge colorScheme={module.level === 'Beginner' ? 'green' : module.level === 'Intermediate' ? 'purple' : 'red'}>{module.level}</Badge>
              </Flex>
              <Heading size="md" mt={3}>{module.title}</Heading>
              <Text color="brand.muted" mt={2}>{module.subtitle}</Text>
              <Progress value={module.progress} mt={4} borderRadius="999px" bg="#EDF2F7" sx={goldProgress} />
              <HStack mt={4} justify="space-between"><Text fontSize="13px">{module.totalChapters} chapters</Text><Text fontSize="13px">{module.totalStories} stories</Text></HStack>
              <Button mt={4} {...primaryCtaProps} onClick={(event) => { event.stopPropagation(); navigate(`/student/stories/module/${module.id}`); }}>Continue Module</Button>
            </DashboardCard>
          ))}
        </SimpleGrid>
        {!items.length && <EmptyState title="No modules found" />}
      </>}
    </PageShell>
  );
}

export function StudentModuleChapters() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { data, error } = useLoad(() => studentApi.getStoryModule(moduleId), [moduleId]);
  const [search, setSearch] = useState('');
  if (error) return <PageShell role="student" title="Stories"><ErrorState message={error} /></PageShell>;
  if (!data) return <PageShell role="student" title="Stories"><LoadingState /></PageShell>;
  const chapters = data.chapters.filter((chapter) => `${chapter.title} ${chapter.subtitle}`.toLowerCase().includes(search.toLowerCase()));
  const status = (progress) => progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started';
  return (
    <PageShell role="student" title={data.title} subtitle={data.subtitle}>
      <Text mb={3} color="brand.muted" fontSize="13px">Student / Stories / {data.title}</Text>
      <Button mb={4} bg="brand.navy" color="white" _hover={{ bg: 'brand.goldDark' }} onClick={() => navigate('/student/stories')}>Back to Modules</Button>
      <DashboardCard mb={5}><Text>{data.description}</Text><Text mt={2}>{data.progress}% complete · {data.totalChapters} chapters · {data.totalStories} stories</Text></DashboardCard>
      <Input mb={4} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chapters" bg="white" h="42px" borderColor="rgba(214,168,79,0.25)" />
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
        {chapters.map((chapter) => (
          <DashboardCard key={chapter.id} cursor="pointer" minH="325px" display="flex" flexDirection="column" onClick={() => navigate(`/student/stories/module/${moduleId}/chapter/${chapter.id}`)}>
            <Flex justify="space-between" align="start">
              <Text fontSize="46px" lineHeight="1" color="brand.goldDark">♙</Text>
              <Badge fontSize="12px" borderRadius="2px" px={2} {...statusBadgeProps(status(chapter.progress))}>{status(chapter.progress).toUpperCase()}</Badge>
            </Flex>
            <Heading size="md" mt={7}>{chapter.title}</Heading>
            <Text color="brand.muted" mt={2} minH="48px">{chapter.subtitle}</Text>
            <Text color="brand.muted" mt={2} noOfLines={2}>{chapter.description}</Text>
            <Progress value={chapter.progress} mt={4} borderRadius="999px" bg="#EDF2F7" sx={goldProgress} />
            <HStack mt={4} justify="space-between">
              <Text fontSize="13px">{chapter.progress}% complete</Text>
              <Text fontSize="13px">{chapter.totalStories} stories</Text>
            </HStack>
            <Button mt="auto" {...primaryCtaProps} onClick={(event) => { event.stopPropagation(); navigate(`/student/stories/module/${moduleId}/chapter/${chapter.id}`); }}>Open Chapter</Button>
          </DashboardCard>
        ))}
      </SimpleGrid>
      {!chapters.length && <EmptyState title="No chapters found" />}
    </PageShell>
  );
}

export function StudentChapterStories() {
  const { moduleId, chapterId } = useParams();
  const navigate = useNavigate();
  const { data, error } = useLoad(() => studentApi.getChapterStories(moduleId, chapterId), [moduleId, chapterId]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  if (error) return <PageShell role="student" title="Stories"><ErrorState message={error} /></PageShell>;
  if (!data) return <PageShell role="student" title="Stories"><LoadingState /></PageShell>;
  const stories = data.stories.filter((story) => {
    const text = `${story.title} ${story.tags.join(' ')}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (filter === 'all' || story.status === filter);
  });
  const label = (story) => story.progress >= 100 ? 'Review' : story.progress > 0 ? 'Continue' : 'Start';
  return (
    <PageShell role="student" title={data.chapter.title} subtitle={data.chapter.subtitle}>
      <Text mb={3} color="brand.muted" fontSize="13px">Student / Stories / {data.module.title} / {data.chapter.title}</Text>
      <Button mb={4} bg="brand.navy" color="white" _hover={{ bg: 'brand.goldDark' }} onClick={() => navigate(`/student/stories/module/${moduleId}`)}>Back to Chapters</Button>
      <DashboardCard mb={5}><Text color="brand.muted">{data.chapter.description}</Text></DashboardCard>
      <SearchFilterBar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} filters={['all','completed','in-progress','not-started']} />
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
        {stories.map((story) => (
          <DashboardCard key={story.id} cursor="pointer" minH="325px" display="flex" flexDirection="column" onClick={() => navigate(`/student/stories/${story.id}`)}>
            <Flex justify="space-between" align="start">
              <Text fontSize="46px" lineHeight="1" color="brand.goldDark">{story.progress >= 100 ? '♕' : '♟'}</Text>
              <Badge fontSize="12px" borderRadius="2px" px={2} {...statusBadgeProps(story.status)}>{story.status.replace('-', ' ').toUpperCase()}</Badge>
            </Flex>
            <Heading size="md" mt={7}>{story.title}</Heading>
            <Text color="brand.muted" mt={2} minH="48px">{story.subtitle}</Text>
            <HStack mt={3} flexWrap="wrap">{story.tags.map((tag) => <Badge key={tag} bg="#FBF1D5" color="brand.goldDark">{tag}</Badge>)}</HStack>
            <Progress value={story.progress} mt={4} borderRadius="999px" bg="#EDF2F7" sx={goldProgress} />
            <HStack mt={4} justify="space-between">
              <Text fontSize="13px">{story.progress}% complete</Text>
              <Text fontSize="13px">{story.tags[0]}</Text>
            </HStack>
            <Text color="brand.muted" mt={2} noOfLines={2}>{story.lesson}</Text>
            <Button mt="auto" {...primaryCtaProps} onClick={(event) => { event.stopPropagation(); navigate(`/student/stories/${story.id}`); }}>{label(story)} Story</Button>
          </DashboardCard>
        ))}
      </SimpleGrid>
      {!stories.length && <EmptyState title="No stories found" />}
    </PageShell>
  );
}

export function StudentStoryDetail() {
  const { storyId } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, reload, error } = useLoad(() => studentApi.getStoryDetail(storyId), [storyId]);
  if (error) return <PageShell role="student" title="Story"><ErrorState message={error} /></PageShell>;
  if (!data) return <PageShell role="student" title="Story"><LoadingState /></PageShell>;
  const { story, module, chapter } = data;
  const complete = async () => { await studentApi.updateStoryProgress(story.id, 100); toast({ title: 'Story complete', status: 'success' }); reload(); };
  const continueReading = async () => { await studentApi.updateStoryProgress(story.id, Math.min(100, story.progress + 25)); toast({ title: 'Progress updated', status: 'success' }); reload(); };
  return (
    <PageShell role="student" title={story.title} subtitle={`${module.title} · ${chapter.title}`}>
      <Text mb={3} color="brand.muted" fontSize="13px">Student / Stories / {module.title} / {chapter.title} / {story.title}</Text>
      <Button mb={4} bg="brand.navy" color="white" _hover={{ bg: 'brand.goldDark' }} onClick={() => navigate(`/student/stories/module/${module.id}/chapter/${chapter.id}`)}>Back to Chapter</Button>
      <DashboardCard>
        <Flex justify="space-between" align="start" gap={4}>
          <Box>
            <Text fontSize="20px" color="brand.muted">{story.subtitle}</Text>
            <HStack mt={3} flexWrap="wrap">{story.tags.map((tag) => <Badge key={tag} bg="#FBF1D5" color="brand.goldDark">{tag}</Badge>)}</HStack>
          </Box>
          <Badge fontSize="12px" borderRadius="2px" px={2} {...statusBadgeProps(story.status)}>{story.status.replace('-', ' ').toUpperCase()}</Badge>
        </Flex>
        <Progress my={5} value={story.progress} borderRadius="999px" bg="#EDF2F7" sx={goldProgress} />
        <Text fontSize="18px" lineHeight="1.8">{story.body}</Text>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} mt={5}>
          <Box p={4} bg="#FFF7E8" borderRadius="14px" border="1px solid rgba(214,168,79,0.18)"><Heading size="sm">Panchatantra Lesson</Heading><Text mt={2}>{story.lesson}</Text></Box>
          <Box p={4} bg="#FFF7E8" borderRadius="14px" border="1px solid rgba(214,168,79,0.18)"><Heading size="sm">Chess Concept</Heading><Text mt={2}>{story.chessConcept}</Text></Box>
        </Grid>
        <HStack flexWrap="wrap" mt={5}>
          <Button bg="brand.navy" color="white" _hover={{ bg: 'brand.goldDark' }} onClick={complete}>Mark Complete</Button>
          <Button bg="brand.navy" color="white" _hover={{ bg: 'brand.goldDark' }} onClick={continueReading}>Continue Reading</Button>
          <Button bg="brand.navy" color="white" _hover={{ bg: 'brand.goldDark' }} onClick={() => navigate(`/student/puzzles/${story.relatedPuzzleId}`)}>Take Related Puzzle</Button>
        </HStack>
      </DashboardCard>
    </PageShell>
  );
}

export function StudentPrinciples() {
  const navigate = useNavigate();
  const { data } = useLoad(() => studentApi.list('principles'), []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const items = filterItems(data || [], search, filter);
  return <PageShell role="student" title="Principles">{!data ? <LoadingState /> : <><SearchFilterBar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} filters={['all','Strategy','Tactics','Endgame']} /><CardGrid items={items} onOpen={(item) => navigate(`/student/principles/${item.id}`)} /></>}</PageShell>;
}

export function StudentPrincipleDetail() {
  const { principleId } = useParams();
  const toast = useToast();
  const { data, reload } = useLoad(() => studentApi.detail('principles', principleId), [principleId]);
  if (!data) return <PageShell role="student" title="Principle"><LoadingState /></PageShell>;
  return (
    <PageShell role="student" title={data.name}>
      <DashboardCard>
        <HStack mt={5}><Button onClick={async () => { await studentApi.learnPrinciple(data.id, { learned: true }); toast({ title: 'Marked as learned', status: 'success' }); reload(); }}>Mark as Learned</Button><Button>Practice Principle</Button><Button>Add to Revision</Button></HStack>
      </DashboardCard>
    </PageShell>
  );
}

export function StudentPuzzles() {
  const navigate = useNavigate();
  const { data } = useLoad(() => studentApi.list('puzzles'), []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const items = filterItems(data || [], search, filter);
  return <PageShell role="student" title="Puzzles">{!data ? <LoadingState /> : <><SearchFilterBar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} filters={['all','Easy','Medium','Hard','Fork','Endgame']} /><CardGrid items={items} onOpen={(item) => navigate(`/student/puzzles/${item.id}`)} /></>}</PageShell>;
}

export function StudentPuzzleDetail() {
  const { puzzleId } = useParams();
  const navigate = useNavigate();
  const { data, reload } = useLoad(() => studentApi.detail('puzzles', puzzleId), [puzzleId]);
  if (!data) return <PageShell role="student" title="Puzzle"><LoadingState /></PageShell>;
  return <PageShell role="student" title={data.title} subtitle="Click a piece, choose a square, then submit your move."><DashboardCard><PuzzlePlayer puzzle={data} onSolved={reload} /><HStack mt={5}><Button onClick={() => navigate('/student/puzzles')}>Next Puzzle</Button><Button onClick={() => navigate('/student/review-mistakes')}>Review Mistake</Button></HStack></DashboardCard></PageShell>;
}

export function StudentAchievements() {
  const { data } = useLoad(() => studentApi.list('achievements'), []);
  return <PageShell role="student" title="Achievements">{!data ? <LoadingState /> : <CardGrid items={data} extra={(item) => <><Text mt={3}>{item.rule}</Text><Progress mt={3} value={item.progress} /></>} />}</PageShell>;
}

export function StudentAnalytics() {
  const { data } = useLoad(() => studentApi.list('analytics'), []);
  const [range, setRange] = useState('week');
  return (
    <PageShell role="student" title="Analytics">
      {!data ? <LoadingState /> : <Grid templateColumns={{ base: '1fr', xl: '2fr 1fr' }} gap={5}>
        <DashboardCard title="Progress"><Select maxW="180px" mb={4} value={range} onChange={(e) => setRange(e.target.value)}><option value="week">This Week</option><option value="month">This Month</option></Select><LineAreaChart area data={data.progress} lines={[{ key: 'value', name: 'Points', color: '#D6A84F' }]} /></DashboardCard>
        <DashboardCard title="Strengths & Weak Areas"><Text>Accuracy: {data.accuracy}%</Text><Text mt={3}>Story completion: {data.storyCompletion}%</Text><Text mt={3}>Strong: {data.strongAreas.join(', ')}</Text><Text mt={3}>Improve: {data.weakAreas.join(', ')}</Text></DashboardCard>
      </Grid>}
    </PageShell>
  );
}

export function StudentClasses() {
  const navigate = useNavigate();
  const { data } = useLoad(() => studentApi.list('classes'), []);
  return <PageShell role="student" title="Classes">{!data ? <LoadingState /> : <CardGrid items={data} onOpen={(item) => navigate(`/student/classes/${item.id}`)} />}</PageShell>;
}

export function StudentClassDetail() {
  const { classId } = useParams();
  const toast = useToast();
  const { data } = useLoad(() => studentApi.detail('classes', classId), [classId]);
  const room = useDisclosure();
  if (!data) return <PageShell role="student" title="Class"><LoadingState /></PageShell>;
  return (
    <PageShell role="student" title={data.title} subtitle={`${data.coach} · ${data.topic}`}>
      <DashboardCard><Text>{data.date} at {data.time}</Text><Text mt={3}>Materials: {data.materials?.join(', ')}</Text><HStack mt={5}><Button onClick={room.onOpen}>Join Class</Button><Button onClick={() => toast({ title: 'Added to calendar', status: 'success' })}>Add to Calendar</Button><Button onClick={() => downloadTextFile('materials.txt', data.materials?.join('\n') || 'Materials')}>Download Materials</Button></HStack></DashboardCard>
      <FormModal isOpen={room.isOpen} onClose={room.onClose} title="Live class room placeholder" fields={[]} onSubmit={room.onClose} />
    </PageShell>
  );
}

export function StrategicProfile() {
  const { data, reload } = useLoad(() => studentApi.list('profile'), []);
  const quiz = useDisclosure();
  const toast = useToast();
  if (!data) return <PageShell role="student" title="Strategic Profile"><LoadingState /></PageShell>;
  const retake = async () => { await studentApi.updateProfile({ radar: data.radar.map((r) => ({ ...r, value: Math.min(95, r.value + 3) })) }); toast({ title: 'Assessment recalculated', status: 'success' }); quiz.onClose(); reload(); };
  return <PageShell role="student" title={`Strategic Profile: ${data.type}`}><Grid templateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={5}><DashboardCard dark><RadarIdentityChart data={data.radar} /></DashboardCard><DashboardCard title="Improvement Plan"><Text>Strengths: {data.strengths.join(', ')}</Text><Text mt={3}>Weaknesses: {data.weaknesses.join(', ')}</Text>{data.plan.map((p) => <Text key={p} mt={2}>• {p}</Text>)}<HStack mt={5}><Button onClick={quiz.onOpen}>Retake Assessment</Button><Button onClick={() => downloadTextFile('strategic-profile.txt', JSON.stringify(data, null, 2))}>Download Profile</Button><Button onClick={() => toast({ title: 'Profile share link copied', status: 'success' })}>Share Profile</Button></HStack></DashboardCard></Grid><FormModal isOpen={quiz.isOpen} onClose={quiz.onClose} title="Retake Assessment" fields={[{ name: 'style', label: 'Preferred style', options: ['Strategic', 'Tactical', 'Endgame'] }]} onSubmit={retake} /></PageShell>;
}

export function ReviewMistakes() {
  const { data } = useLoad(() => studentApi.list('mistakes'), []);
  return <PageShell role="student" title="Review Mistakes">{!data ? <LoadingState /> : <DataTable items={data} columns={[{ key: 'puzzle', label: 'Puzzle' }, { key: 'theme', label: 'Theme' }, { key: 'note', label: 'Note' }]} />}</PageShell>;
}

export function StudentSettings() {
  return <SettingsPage role="student" title="Student Settings" fields={['displayName','email','dailyGoal']} />;
}

export function CoachStudents() {
  const navigate = useNavigate();
  return <EntityListPage role="coach" title="Students" loader={() => coachApi.list('students')} columns={[{ key: 'name', label: 'Name' }, { key: 'type', label: 'Type' }, { key: 'progress', label: 'Progress' }, { key: 'status', label: 'Status', badge: true }]} onView={(item) => navigate(`/coach/students/${item.id}`)} filters={['all','active','inactive','Advanced','Endgame']} />;
}

export function CoachStudentDetail() {
  const { studentId } = useParams();
  const toast = useToast();
  const { data, reload } = useLoad(() => coachApi.detail('students', studentId), [studentId]);
  const [notes, setNotes] = useState('');
  useEffect(() => { if (data) setNotes(data.notes || ''); }, [data]);
  if (!data) return <PageShell role="coach" title="Student"><LoadingState /></PageShell>;
  return <PageShell role="coach" title={data.name} subtitle={data.type}><Grid templateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={5}><DashboardCard title="Progress"><LineAreaChart data={[{ name: 'Week 1', value: 50 }, { name: 'Week 2', value: data.progress }]} lines={[{ key: 'value', name: 'Progress', color: '#D6A84F' }]} /></DashboardCard><DashboardCard title="Coach Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /><HStack mt={4}><Button onClick={async () => { await coachApi.updateNotes(data.id, notes); toast({ title: 'Notes saved', status: 'success' }); reload(); }}>Save Notes</Button><Button>Assign Puzzle</Button><Button>Message Student</Button><Button onClick={() => downloadTextFile(`${data.name}-report.txt`, JSON.stringify(data, null, 2))}>Generate Report</Button></HStack></DashboardCard></Grid></PageShell>;
}

export function CoachClasses() {
  const modal = useDisclosure();
  const [view, setView] = useState('list');
  const toast = useToast();
  const { data, reload } = useLoad(() => coachApi.list('classes'), []);
  const navigate = useNavigate();
  const create = async (values) => { await coachApi.createClass(values); toast({ title: 'Class created', status: 'success' }); modal.onClose(); reload(); };
  return <PageShell role="coach" title="Classes"><HStack mb={4}><Button onClick={modal.onOpen}>Create Class</Button><Button onClick={() => setView(view === 'list' ? 'calendar' : 'list')}>{view === 'list' ? 'Calendar View' : 'List View'}</Button></HStack>{!data ? <LoadingState /> : view === 'list' ? <CardGrid items={data} onOpen={(item) => navigate(`/coach/classes/${item.id}`)} /> : <DashboardCard title="Calendar View">{data.map((c) => <Text key={c.id}>{c.date}: {c.title}</Text>)}</DashboardCard>}<FormModal isOpen={modal.isOpen} onClose={modal.onClose} title="Create Class" fields={[{ name: 'title', label: 'Title', required: true }, { name: 'batch', label: 'Batch' }, { name: 'topic', label: 'Topic' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'time', label: 'Time' }, { name: 'duration', label: 'Duration' }, { name: 'meetingLink', label: 'Meeting Link' }]} onSubmit={create} /></PageShell>;
}

export function CoachClassDetail() {
  const { classId } = useParams();
  const toast = useToast();
  const { data, reload } = useLoad(() => coachApi.detail('classes', classId), [classId]);
  const room = useDisclosure();
  if (!data) return <PageShell role="coach" title="Class"><LoadingState /></PageShell>;
  return <PageShell role="coach" title={data.title} subtitle={data.topic}><DashboardCard><Text>Roster: {data.students?.join(', ')}</Text><Text mt={2}>Resources: {data.resources?.join(', ') || 'None yet'}</Text><HStack mt={5}><Button onClick={room.onOpen}>Start Live Session</Button><Button onClick={() => toast({ title: 'Edit saved', status: 'success' })}>Edit Class</Button><Button colorScheme="red" onClick={async () => { await coachApi.updateClass(data.id, { status: 'cancelled' }); toast({ title: 'Class cancelled', status: 'warning' }); reload(); }}>Cancel Class</Button><Button onClick={() => toast({ title: 'Reminder sent', status: 'success' })}>Send Reminder</Button></HStack></DashboardCard><FormModal isOpen={room.isOpen} onClose={room.onClose} title="Live class room placeholder" fields={[]} onSubmit={room.onClose} /></PageShell>;
}

export function CoachLiveSessions() {
  const toast = useToast();
  return <EntityListPage role="coach" title="Live Sessions" loader={() => coachApi.list('live-sessions')} columns={[{ key: 'title', label: 'Session' }, { key: 'status', label: 'Status', badge: true }]} onView={(item) => toast({ title: `${item.title} room opened`, description: 'Live classroom placeholder', status: 'info' })} />;
}

export function CoachAssignments() {
  return <CreateListPage role="coach" title="Assignments" loader={() => coachApi.list('assignments')} createApi={coachApi.createAssignment} fields={[{ name: 'title', label: 'Title', required: true }, { name: 'description', label: 'Description' }, { name: 'dueDate', label: 'Due Date', type: 'date' }, { name: 'targetClass', label: 'Target Class' }]} />;
}

export function CoachResources() {
  return <CreateListPage role="coach" title="Resources" loader={() => coachApi.list('resources')} createApi={coachApi.createResource} fields={[{ name: 'title', label: 'Title', required: true }, { name: 'type', label: 'Type', options: ['PDF','Video','Worksheet','Link'] }]} />;
}

export function CoachMessages() {
  const { data, reload } = useLoad(() => coachApi.list('messages'), []);
  const [text, setText] = useState('');
  const [active, setActive] = useState(null);
  const conv = active || data?.[0];
  return <PageShell role="coach" title="Messages">{!data ? <LoadingState /> : <Grid templateColumns={{ base: '1fr', xl: '280px 1fr' }} gap={5}><DashboardCard>{data.map((c) => <Button key={c.id} w="100%" mb={2} onClick={() => setActive(c)}>{c.with}</Button>)}</DashboardCard><DashboardCard title={conv?.with}>{conv?.messages.map((m, i) => <Text key={i} mb={2}><b>{m.from}:</b> {m.text}</Text>)}<HStack mt={4}><Input value={text} onChange={(e) => setText(e.target.value)} /><Button onClick={async () => { await coachApi.sendMessage(conv.id, text); setText(''); reload(); }}>Send</Button></HStack></DashboardCard></Grid>}</PageShell>;
}

export function CoachReports() {
  const [report, setReport] = useState(null);
  return <PageShell role="coach" title="Reports"><DashboardCard title="Report Builder"><HStack><Select maxW="220px"><option>Student Report</option><option>Class Report</option></Select><Input type="date" maxW="180px" /><Button onClick={async () => setReport(await coachApi.generateReport({ type: 'Student Report' }))}>Generate Report</Button>{report && <Button onClick={() => downloadTextFile('coach-report.html', `<h1>Coach Report</h1><pre>${JSON.stringify(report, null, 2)}</pre>`, 'text/html')}>Export PDF</Button>}</HStack>{report && <Box mt={5} p={4} bg="#FFF7E8" borderRadius="12px">Generated {report.id}</Box>}</DashboardCard></PageShell>;
}

export function CoachPuzzles() {
  return <EntityListPage role="coach" title="Puzzle Library" loader={() => studentApi.list('puzzles')} columns={[{ key: 'title', label: 'Title' }, { key: 'difficulty', label: 'Difficulty' }, { key: 'theme', label: 'Theme' }]} />;
}

export function CoachSettings() {
  return <SettingsPage role="coach" title="Coach Settings" fields={['name','email','theme']} save={coachApi.saveSettings} />;
}

function EntityListPage({ role, title, loader, columns, onView, filters = ['all'] }) {
  const { data, error } = useLoad(loader, []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const items = filterItems(data || [], search, filter);
  return <PageShell role={role} title={title}>{error ? <ErrorState message={error} /> : !data ? <LoadingState /> : <><SearchFilterBar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} filters={filters} />{items.length ? <DataTable items={items} columns={columns} onView={onView} /> : <EmptyState />}</>}</PageShell>;
}

function CreateListPage({ role, title, loader, createApi, fields }) {
  const modal = useDisclosure();
  const toast = useToast();
  const { data, reload } = useLoad(loader, []);
  const columns = useMemo(() => [{ key: 'title', label: 'Title' }, { key: 'type', label: 'Type' }, { key: 'dueDate', label: 'Due Date' }], []);
  const create = async (values) => { await createApi(values); toast({ title: `${title} created`, status: 'success' }); modal.onClose(); reload(); };
  return <PageShell role={role} title={title}><Button mb={4} onClick={modal.onOpen}>Add {title.slice(0, -1)}</Button>{!data ? <LoadingState /> : <DataTable items={data} columns={columns} />}<FormModal isOpen={modal.isOpen} onClose={modal.onClose} title={`Add ${title}`} fields={fields} onSubmit={create} /></PageShell>;
}

function SettingsPage({ role, title, fields, save }) {
  const toast = useToast();
  const [values, setValues] = useState({});
  const submit = async () => { if (save) await save(values); toast({ title: 'Settings saved', status: 'success' }); };
  return <PageShell role={role} title={title}><DashboardCard><VStack align="stretch">{fields.map((field) => <FormControl key={field}><FormLabel>{titleCase(field)}</FormLabel><Input value={values[field] || ''} onChange={(e) => setValues({ ...values, [field]: e.target.value })} /></FormControl>)}<FormControl display="flex" alignItems="center" gap={3}><FormLabel mb="0">Notifications</FormLabel><Switch defaultChecked /></FormControl><Button alignSelf="start" bg="brand.navy" color="white" onClick={submit}>Save</Button></VStack></DashboardCard></PageShell>;
}

export function AdminUsers() {
  const { data, reload, error } = useLoad(() => adminApi.list('users'), []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  useEffect(() => {
    if (data) {
      console.log('[AdminUsers] Fetched users from API:', data);
    }
  }, [data]);

  const users = filterItems(data || [], search, filter);

  const columns = [
    { key: 'name', label: 'NAME', bold: true },
    { key: 'role', label: 'ROLE', badge: true },
    { key: 'status', label: 'STATUS', status: true },
  ];

  const handleAction = (action, user) => {
    if (action === 'delete') {
      adminApi.remove('users', user.id).then(() => {
        toast({ title: 'User removed', status: 'success' });
        reload();
      });
    }
  };

  return (
    <PageShell role="admin" title="Users">
      {!data && !error && <LoadingState />}
      {error && <ErrorState message={error} />}
      {data && (
        <VStack align="stretch" spacing={5}>
          <SearchFilterBar
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            filters={['all', 'student', 'coach', 'admin']}
          />
          <DataTable
            columns={columns}
            items={users}
            onView={(user) => toast({ title: `Viewing ${user.name}`, status: 'info' })}
            onEdit={(user) => toast({ title: `Editing ${user.name}`, status: 'info' })}
            onDelete={(user) => handleAction('delete', user)}
          />
        </VStack>
      )}
    </PageShell>
  );
}

export function AdminUserDetail() {
  const { userId } = useParams();
  const { data } = useLoad(() => adminApi.detail('users', userId), [userId]);
  const toast = useToast();
  if (!data) return <PageShell role="admin" title="User"><LoadingState /></PageShell>;
  return <PageShell role="admin" title={data.name}><DashboardCard><Text>Email: {data.email}</Text><Text>Role: {data.role}</Text><Text>Status: {data.status}</Text><HStack mt={5}><Button onClick={() => toast({ title: 'Password reset sent', status: 'success' })}>Reset Password</Button><Button onClick={() => toast({ title: 'Role assigned', status: 'success' })}>Assign Role</Button><Button colorScheme="red" onClick={() => toast({ title: 'User status changed', status: 'warning' })}>Suspend/Activate</Button></HStack></DashboardCard></PageShell>;
}

export function AdminCrudPage({ title, resource, fields, onView, columns: customColumns }) {
  const modal = useDisclosure();
  const toast = useToast();
  const { data, reload } = useLoad(() => adminApi.list(resource), [resource]);
  const [editing, setEditing] = useState(null);
  const autoColumns = [{ key: 'title', label: 'Title' }, { key: 'name', label: 'Name' }, { key: 'difficulty', label: 'Difficulty' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status', badge: true }].filter((col) => (data || []).some((item) => item[col.key] !== undefined));
  const columns = customColumns || (autoColumns.length ? autoColumns : [{ key: 'id', label: 'ID' }]);
  const save = async (values) => { editing ? await adminApi.update(resource, editing.id, values) : await adminApi.create(resource, values); toast({ title: `${title} saved`, status: 'success' }); setEditing(null); modal.onClose(); reload(); };
  return <PageShell role="admin" title={title}><Button mb={4} onClick={() => { setEditing(null); modal.onOpen(); }}>Add {title.slice(0, -1)}</Button>{!data ? <LoadingState /> : <DataTable items={data} columns={columns} onView={onView} onEdit={(item) => { setEditing(item); modal.onOpen(); }} onDelete={async (item) => { await adminApi.remove(resource, item.id); toast({ title: 'Deleted', status: 'info' }); reload(); }} />}<FormModal isOpen={modal.isOpen} onClose={modal.onClose} title={`${editing ? 'Edit' : 'Add'} ${title}`} fields={fields} initialValues={editing || {}} onSubmit={save} /></PageShell>;
}

const PrincipleBadges = ({ principleIds, allPrinciples }) => {
  if (!principleIds || principleIds.length === 0) {
    return <Text fontSize="xs" color="brand.muted" fontStyle="italic">No principles</Text>;
  }
  return (
    <HStack spacing={1} flexWrap="wrap">
      {principleIds.map(id => {
        const p = allPrinciples.find(ap => ap.id === id);
        return p ? (
          <Badge key={id} bg="#FBF1D5" color="brand.goldDark" fontSize="2xs" px={2} borderRadius="full">
            {p.name}
          </Badge>
        ) : null;
      })}
    </HStack>
  );
};

const StoryStatusSelect = ({ storyId, currentStatus, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    setLoading(true);
    try {
      await adminApi.updateStoryStatus(storyId, newStatus);
      onUpdate(storyId, newStatus);
      toast({ title: 'Story status updated', status: 'success' });
    } catch (err) {
      toast({ title: 'Error updating status', description: err.response?.data?.error || err.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select 
      size="sm" 
      w="130px" 
      value={currentStatus} 
      onChange={handleChange} 
      disabled={loading}
      bg={currentStatus === 'published' ? 'green.50' : 'orange.50'}
      borderColor={currentStatus === 'published' ? 'green.200' : 'orange.200'}
      fontWeight="bold"
    >
      <option value="published">Published</option>
      <option value="on_hold">On Hold</option>
    </Select>
  );
};

const MappingMessageTable = ({ mappings, onUpdateMapping, principles = [] }) => {
  const modal = useDisclosure();
  const [editingMapping, setEditingMapping] = useState(null);
  const toast = useToast();

  const handleEdit = (mapping) => {
    setEditingMapping(mapping);
    modal.onOpen();
  };

  const handleSave = async (values) => {
    try {
      await adminApi.updateStoryMapping(editingMapping.id, values);
      onUpdateMapping(editingMapping.id, values);
      toast({ title: 'Message updated', status: 'success' });
      modal.onClose();
    } catch (err) {
      toast({ title: 'Error saving', description: err.response?.data?.error || err.message, status: 'error' });
    }
  };

  if (!mappings || mappings.length === 0) {
    return <Text fontSize="sm" color="brand.muted" fontStyle="italic" py={2} pl={6}>No story messages mapped to principles.</Text>;
  }

  return (
    <Box mt={3} pl={6} overflowX="auto">
      <Table variant="simple" size="sm" bg="white" borderRadius="12px" border="1px solid" borderColor="gray.100" overflow="hidden">
        <Thead bg="gray.50">
          <Tr>
            <Th py={3} fontSize="11px" fontWeight="700" color="brand.navy" letterSpacing="0.05em">MESSAGE / STORY TEXT</Th>
            <Th py={3} fontSize="11px" fontWeight="700" color="brand.navy" letterSpacing="0.05em">PRINCIPLE</Th>
            <Th py={3} fontSize="11px" fontWeight="700" color="brand.navy" letterSpacing="0.05em">ACTIONS</Th>
          </Tr>
        </Thead>
        <Tbody>
          {mappings.map(m => {
            const principleName = 
              m.principleName || 
              m.principleLabel || 
              principles.find( 
                p => String(p.id).trim().toLowerCase() === String(m.principleId).trim().toLowerCase() 
              )?.name || 
              `Missing principle name (${m.principleId || 'no principleId'})`;
            return (
              <Tr key={m.id} _hover={{ bg: "gray.50" }}>
                <Td py={4}>
                  <Text fontSize="13px" color="gray.700" lineHeight="1.6" whiteSpace="normal">
                    {m.storyText}
                  </Text>
                </Td>
                <Td py={4}>
                  <Text 
                    fontSize="13px" 
                    fontWeight="600" 
                    color="brand.navy" 
                    lineHeight="1.5" 
                    whiteSpace="normal"
                    title={m.principleId}
                  >
                    {principleName}
                  </Text>
                </Td>
                <Td py={4} whiteSpace="nowrap">
                  <Button 
                    size="xs" 
                    variant="outline" 
                    borderColor="brand.goldDark" 
                    color="brand.goldDark" 
                    _hover={{ bg: "brand.goldDark", color: "white" }}
                    onClick={() => handleEdit(m)}
                  >
                    Edit
                  </Button>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
      <FormModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        title="Edit Story Message"
        fields={[
          { name: 'storyText', label: 'Message Text', type: 'textarea', required: true }
        ]}
        initialValues={{ storyText: editingMapping?.storyText }}
        onSubmit={handleSave}
      />
    </Box>
  );
};

const NestedStoriesView = ({ search, principles = [] }) => {
  const { data, reload, loading, error } = useLoad(() => adminApi.nestedCurriculumStories(), []);
  
  const onUpdateMapping = () => {
    reload();
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data?.modules?.length) return <EmptyState title="No curriculum stories found." />;

  const filteredModules = data.modules.filter(m => {
    const searchLower = search.toLowerCase();
    const moduleMatches = m.name.toLowerCase().includes(searchLower);
    
    const chaptersWithMatches = m.chapters.filter(c => {
      const chapterMatches = c.name.toLowerCase().includes(searchLower);
      const storiesWithMatches = c.stories.filter(s => {
        const storyMatches = s.title.toLowerCase().includes(searchLower) || (s.description || '').toLowerCase().includes(searchLower) || s.status.includes(searchLower);
        const mappingsWithMatches = s.mappings.filter(sm => 
          (sm.storyText || '').toLowerCase().includes(searchLower) || 
          (sm.principleName || '').toLowerCase().includes(searchLower) || 
          (sm.principleLabel || '').toLowerCase().includes(searchLower) ||
          (sm.principleId || '').toLowerCase().includes(searchLower) ||
          (principles.find( 
            p => String(p.id).trim().toLowerCase() === String(sm.principleId).trim().toLowerCase() 
          )?.name || '').toLowerCase().includes(searchLower)
        );
        return storyMatches || mappingsWithMatches.length > 0;
      });
      return chapterMatches || storiesWithMatches.length > 0;
    });
    
    return moduleMatches || chaptersWithMatches.length > 0;
  });

  if (filteredModules.length === 0 && search) {
    return <EmptyState title="No curriculum stories found for this search." />;
  }

  return (
    <VStack align="stretch" spacing={8}>
      {filteredModules.map(module => (
        <Box key={module.id} p={6} bg="#FFFDF8" borderRadius="18px" border="1px solid rgba(214,168,79,0.25)" boxShadow="sm">
          <Flex justify="space-between" align="start" mb={6}>
            <Box>
              <Heading size="lg" color="brand.navy" fontFamily="serif">{module.name}</Heading>
            </Box>
            <HStack>
              <Badge bg="brand.navy" color="white" px={3} py={1} borderRadius="full">{module.chapters.length} Chapters</Badge>
              <Badge bg="brand.goldDark" color="white" px={3} py={1} borderRadius="full">
                {module.chapters.reduce((acc, c) => acc + c.stories.length, 0)} Stories
              </Badge>
            </HStack>
          </Flex>

          <VStack align="stretch" spacing={6}>
            {module.chapters.length === 0 ? (
              <Text color="brand.muted" fontStyle="italic" pl={4}>No chapters in this module.</Text>
            ) : (
              module.chapters.map(chapter => (
                <Box key={chapter.id} p={5} bg="rgba(251, 241, 213, 0.2)" borderRadius="14px" borderLeft="4px solid" borderLeftColor="brand.gold">
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md" color="brand.navy" fontFamily="serif">{chapter.name}</Heading>
                    <Badge variant="outline" colorScheme="brand" borderRadius="full" px={3}>{chapter.stories.length} Stories</Badge>
                  </Flex>

                  <VStack align="stretch" spacing={4}>
                    {chapter.stories.length === 0 ? (
                      <Text color="brand.muted" fontStyle="italic" fontSize="sm" pl={6}>No stories in this chapter.</Text>
                    ) : (
                      chapter.stories.map(story => (
                        <Box key={story.id} p={4} bg="white" borderRadius="10px" border="1px solid" borderColor="gray.100" boxShadow="xs">
                          <Flex justify="space-between" align="start">
                            <Box flex="1">
                              <HStack mb={1}>
                                <Heading size="sm" color="brand.navy">{story.title}</Heading>
                                <Badge colorScheme={story.status === 'published' ? 'green' : 'orange'} fontSize="2xs" borderRadius="full" px={2}>
                                  {story.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </HStack>
                              <Text fontSize="xs" color="brand.muted" noOfLines={2}>{story.description}</Text>
                            </Box>
                            <StoryStatusSelect 
                              storyId={story.id} 
                              currentStatus={story.status} 
                              onUpdate={() => reload()} 
                            />
                          </Flex>
                          
                          <MappingMessageTable 
                            mappings={story.mappings} 
                            onUpdateMapping={onUpdateMapping} 
                            principles={principles}
                          />
                        </Box>
                      ))
                    )}
                  </VStack>
                </Box>
              ))
            )}
          </VStack>
        </Box>
      ))}
    </VStack>
  );
};

const EMPTY_FIELDS = [];
const EMPTY_OBJECT = {};

export function AdminGamesDetails() {
  const toast = useToast();
  const { data: players, reload, loading } = useLoad(() => adminApi.players(), []);
  const [syncing, setSyncing] = useState(false);
  const [syncingActivity, setSyncingActivity] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Edit Modal State
  const editModal = useDisclosure();
  const [editingPlayer, setEditingPlayer] = useState(null);

  // History Modal State
  const historyModal = useDisclosure();
  const [historyData, setHistoryData] = useState([]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await adminApi.syncPlayers();
      
      if (result.errorsCount > 0) {
        toast({ 
          title: 'Profile Sync Complete with Errors', 
          description: `Updated: ${result.updated}, Errors: ${result.errorsCount}`,
          status: 'warning',
        });
      } else {
        toast({ 
          title: 'Profile Sync Successful', 
          description: `Updated: ${result.updated}`,
          status: 'success',
        });
      }
      reload();
    } catch (err) {
      toast({ title: 'Sync Failed', description: err.message, status: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncActivity = async () => {
    setSyncingActivity(true);
    try {
      const result = await chessComApi.autoCompleteActivity();
      toast({ 
        title: 'Activity Sync Complete', 
        description: `Updated: ${result.updatedCount}, Errors: ${result.errorsCount}`,
        status: result.errorsCount > 0 ? 'warning' : 'success',
      });
      reload();
    } catch (err) {
      toast({ title: 'Activity Sync Failed', description: err.message, status: 'error' });
    } finally {
      setSyncingActivity(false);
    }
  };

  const openPlayerDetails = async (player) => {
    try {
      const activity = await chessComApi.getPlayerActivity(player.Chess_com_ID);
      setSelectedPlayer({
        ...activity,
        playerData: player // Pass full row data for detailed stats
      });
      onOpen();
    } catch (err) {
      toast({ title: 'Failed to load activity', description: err.message, status: 'error' });
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    editModal.onOpen();
  };

  const savePlayerEdit = async (values) => {
    try {
      await adminApi.updatePlayer(editingPlayer.Chess_com_ID, values);
      toast({ title: 'Player updated', status: 'success' });
      editModal.onClose();
      reload();
    } catch (err) {
      toast({ title: 'Failed to update player', description: err.message, status: 'error' });
    }
  };

  const handleDeletePlayer = async (player) => {
    if (!window.confirm(`Are you sure you want to delete player ${player.Player_Name}?`)) return;
    try {
      await adminApi.deletePlayer(player.Chess_com_ID);
      toast({ title: 'Player deleted', status: 'success' });
      reload();
    } catch (err) {
      toast({ title: 'Failed to delete player', description: err.message, status: 'error' });
    }
  };

  const handleTogglePause = async (player) => {
    try {
      const res = await adminApi.togglePlayerPause(player.Chess_com_ID);
      toast({ 
        title: res.is_paused ? 'Player paused' : 'Player resumed', 
        status: 'info' 
      });
      reload();
    } catch (err) {
      toast({ title: 'Failed to toggle pause', description: err.message, status: 'error' });
    }
  };

  const handleViewHistory = async (player) => {
    try {
      const activity = await chessComApi.getPlayerActivity(player.Chess_com_ID);
      setHistoryData(activity.activityRows || []);
      setSelectedPlayer(player);
      historyModal.onOpen();
    } catch (err) {
      toast({ title: 'Failed to load history', description: err.message, status: 'error' });
    }
  };

  const filteredPlayers = (players || []).filter(p => 
    p.Player_Name?.toLowerCase().includes(search.toLowerCase()) || 
    p.Chess_com_ID?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell role="admin" title="Games Details">
      <VStack align="stretch" spacing={6}>
        <Flex justify="space-between" align="center" bg="white" p={4} borderRadius="16px" border="1px solid" borderColor="rgba(214,168,79,0.15)" shadow="sm">
          <Box flex="1" maxW="400px">
            <SearchFilterBar search={search} setSearch={setSearch} showFilter={false} />
          </Box>
          <HStack spacing={3}>
            <Button 
              leftIcon={<Spinner size="xs" display={syncingActivity ? 'block' : 'none'} />}
              onClick={handleSyncActivity} 
              isLoading={syncingActivity}
              loadingText="Syncing..."
              variant="outline"
              borderColor="brand.navy"
              color="brand.navy"
              _hover={{ bg: 'brand.navy', color: 'white' }}
              borderRadius="full"
              px={6}
            >
              Sync Activity
            </Button>
            <Button 
              leftIcon={<Spinner size="xs" display={syncing ? 'block' : 'none'} />}
              onClick={handleSync} 
              isLoading={syncing}
              loadingText="Syncing..."
              bg="brand.navy"
              color="white"
              _hover={{ bg: 'brand.goldDark' }}
              borderRadius="full"
              px={6}
            >
              Sync Profiles
            </Button>
          </HStack>
        </Flex>

        {loading ? (
          <LoadingState />
        ) : (
          <DataTable
            items={filteredPlayers}
            onView={openPlayerDetails}
            onEdit={handleEditPlayer}
            onDelete={handleDeletePlayer}
            extraActions={[
              {
                label: (p) => {
                  const tracker = typeof p.activity_tracker === 'string' ? JSON.parse(p.activity_tracker) : p.activity_tracker;
                  return tracker?.is_paused ? 'Resume' : 'Pause';
                },
                colorScheme: (p) => {
                  const tracker = typeof p.activity_tracker === 'string' ? JSON.parse(p.activity_tracker) : p.activity_tracker;
                  return tracker?.is_paused ? 'green' : 'orange';
                },
                onClick: handleTogglePause
              },
              {
                label: 'History',
                colorScheme: 'purple',
                onClick: handleViewHistory
              }
            ]}
            columns={[
              { 
                key: 'Chess_com_ID', 
                label: 'CHESS.COM ID', 
                bold: true,
                render: (val, row) => {
                  const tracker = typeof row.activity_tracker === 'string' ? JSON.parse(row.activity_tracker) : row.activity_tracker;
                  return (
                    <HStack>
                      <Text fontWeight="bold" color="brand.navy">{val}</Text>
                      {tracker?.is_paused && <Badge colorScheme="orange" fontSize="8px">PAUSED</Badge>}
                    </HStack>
                  );
                }
              },
              { key: 'Player_Name', label: 'PLAYER NAME' },
              { 
                key: 'ratings', 
                label: 'RATINGS (R/B/U)', 
                render: (_, row) => (
                  <HStack spacing={1}>
                    <Badge bg="#EBF8FF" color="#2B6CB0" borderRadius="full" px={2} title="Rapid">{row.rapid_rating || '-'}</Badge>
                    <Badge bg="#FFF5F5" color="#C53030" borderRadius="full" px={2} title="Blitz">{row.blitz_rating || '-'}</Badge>
                    <Badge bg="#FAF5FF" color="#6B46C1" borderRadius="full" px={2} title="Bullet">{row.bullet_rating || '-'}</Badge>
                  </HStack>
                )
              },
              { 
                key: 'best', 
                label: 'BEST (R/B/U)', 
                render: (_, row) => (
                  <HStack spacing={1}>
                    <Badge variant="outline" colorScheme="blue" borderRadius="full" px={2} fontSize="10px" title="Best Rapid">{row.rapid_best || '-'}</Badge>
                    <Badge variant="outline" colorScheme="red" borderRadius="full" px={2} fontSize="10px" title="Best Blitz">{row.blitz_best || '-'}</Badge>
                    <Badge variant="outline" colorScheme="purple" borderRadius="full" px={2} fontSize="10px" title="Best Bullet">{row.bullet_best || '-'}</Badge>
                  </HStack>
                )
              },
              { key: 'current_elo', label: 'MAX ELO', render: (val) => <Badge bg="rgba(214,168,79,0.15)" color="brand.goldDark" borderRadius="full" px={3} variant="solid">{val || '-'}</Badge> },
              { key: 'Joining_Date', label: 'JOINED', render: (val) => val ? <Text fontSize="13px" color="gray.600">{new Date(val).toLocaleDateString()}</Text> : 'N/A' },
              { 
                key: 'chess_last_synced_at', 
                label: 'SYNC STATUS', 
                render: (val, row) => {
                  const activity = row.activity_tracker || {};
                  const dates = Object.keys(activity);
                  const locked = dates.filter(d => activity[d]?.lock);
                  const errors = dates.filter(d => activity[d]?.error);

                  if (!val && dates.length === 0) return <Badge variant="subtle" colorScheme="gray" borderRadius="full" px={3}>NOT SYNCED</Badge>;

                  return (
                    <VStack align="start" spacing={1}>
                      <HStack spacing={1}>
                        {locked.length > 0 && <Badge bg="#C6F6D5" color="#22543D" borderRadius="full" fontSize="10px" px={2}>{locked.length}d</Badge>}
                        {errors.length > 0 && <Badge bg="#FED7D7" color="#822727" borderRadius="full" fontSize="10px" px={2} title={activity[errors[0]].error}>ERR</Badge>}
                        {dates.length > (locked.length + errors.length) && (
                          <Badge bg="#FEEBC8" color="#744210" borderRadius="full" fontSize="10px" px={2}>+{dates.length - locked.length - errors.length}p</Badge>
                        )}
                      </HStack>
                      {val && (
                        <Text fontSize="10px" fontWeight="600" color="gray.400" whiteSpace="nowrap">
                          {new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      )}
                    </VStack>
                  );
                } 
              }
            ]}
          />
        )}
      </VStack>

      {/* Edit Player Modal */}
      <FormModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        title="Edit Player Profile"
        fields={[
          { name: 'Player_Name', label: 'Player Name', required: true },
          { name: 'Chess_com_ID', label: 'Chess.com ID', disabled: true }
        ]}
        initialValues={editingPlayer || {}}
        onSubmit={savePlayerEdit}
      />

      {/* Sync History Modal */}
      <FormModal
        isOpen={historyModal.isOpen}
        onClose={historyModal.onClose}
        title={`Sync History: ${selectedPlayer?.Player_Name || ''}`}
        fields={[]}
        onSubmit={historyModal.onClose}
      >
        <Box maxH="400px" overflowY="auto">
          {historyData.length === 0 ? (
            <Text py={10} textAlign="center" color="gray.500">No history found for this player.</Text>
          ) : (
            <Table size="sm" variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Date</Th>
                  <Th>Games</Th>
                  <Th>Ratings (B/R)</Th>
                </Tr>
              </Thead>
              <Tbody>
                {historyData.map((row, i) => {
                  const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
                  return (
                    <Tr key={i}>
                      <Td fontSize="xs">{new Date(row.date).toLocaleDateString()}</Td>
                      <Td fontSize="xs">{data?.total_games || 0}</Td>
                      <Td fontSize="xs">
                        {data?.types?.Blitz?.last_rating || '-'} / {data?.types?.Rapid?.last_rating || '-'}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </Box>
      </FormModal>

      {/* Player Activity Modal (Existing) */}
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title={`Player Details: ${selectedPlayer?.playerName || ''} (${selectedPlayer?.chessComId || ''})`}
        fields={EMPTY_FIELDS}
        onSubmit={onClose}
      >
        <VStack align="stretch" spacing={6}>
          {/* Detailed Stats Grid */}
          <Box p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
            <Heading size="xs" mb={4} textTransform="uppercase" color="brand.navy">Chess.com Stats Summary</Heading>
            <SimpleGrid columns={3} spacing={4}>
              <Stat size="sm">
                <StatLabel fontSize="xs">Rapid</StatLabel>
                <StatNumber fontSize="md">{selectedPlayer?.playerData?.rapid_rating || '-'}</StatNumber>
                <StatHelpText fontSize="10px">Best: {selectedPlayer?.playerData?.rapid_best || '-'}</StatHelpText>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">Blitz</StatLabel>
                <StatNumber fontSize="md">{selectedPlayer?.playerData?.blitz_rating || '-'}</StatNumber>
                <StatHelpText fontSize="10px">Best: {selectedPlayer?.playerData?.blitz_best || '-'}</StatHelpText>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">Bullet</StatLabel>
                <StatNumber fontSize="md">{selectedPlayer?.playerData?.bullet_rating || '-'}</StatNumber>
                <StatHelpText fontSize="10px">Best: {selectedPlayer?.playerData?.bullet_best || '-'}</StatHelpText>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">Tactics</StatLabel>
                <StatNumber fontSize="md">{selectedPlayer?.playerData?.tactics_highest || '-'}</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">Puzzle Rush</StatLabel>
                <StatNumber fontSize="md">{selectedPlayer?.playerData?.puzzle_rush_best || '-'}</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">FIDE</StatLabel>
                <StatNumber fontSize="md">{selectedPlayer?.playerData?.fide_rating || '-'}</StatNumber>
              </Stat>
            </SimpleGrid>
            
            <Divider my={4} />
            
            <VStack align="stretch" spacing={2}>
              <Flex justify="space-between" fontSize="xs">
                <Text color="gray.500">Chess.com Profile:</Text>
                <Link color="blue.500" href={selectedPlayer?.playerData?.chess_profile_url} isExternal>
                  View Profile <Box as={ExternalLink} display="inline" mx="2px" size="14px" />
                </Link>
              </Flex>
              <Flex justify="space-between" fontSize="xs">
                <Text color="gray.500">Country:</Text>
                <Text fontWeight="medium">{selectedPlayer?.playerData?.chess_country_url?.split('/').pop() || '-'}</Text>
              </Flex>
              <Flex justify="space-between" fontSize="xs">
                <Text color="gray.500">Last Synced:</Text>
                <Text fontWeight="medium">
                  {selectedPlayer?.playerData?.chess_last_synced_at 
                    ? new Date(selectedPlayer.playerData.chess_last_synced_at).toLocaleString() 
                    : 'Never'}
                </Text>
              </Flex>
            </VStack>
          </Box>

          <Box>
            <Heading size="xs" mb={3} textTransform="uppercase" color="brand.navy">Recent Activity Records</Heading>
            {selectedPlayer?.activityRows?.length === 0 ? (
              <EmptyState title="No activity data found" />
            ) : (
              <Box maxH="300px" overflowY="auto" borderRadius="md" border="1px solid" borderColor="gray.100">
                <Table size="sm" variant="simple">
                  <Thead bg="gray.100" position="sticky" top={0} zIndex={1}>
                    <Tr>
                      <Th fontSize="10px">Date</Th>
                      <Th fontSize="10px">Games</Th>
                      <Th fontSize="10px">Blitz</Th>
                      <Th fontSize="10px">Rapid</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {selectedPlayer?.activityRows?.map((row, idx) => (
                      <Tr key={idx}>
                        <Td fontSize="xs">{row.date}</Td>
                        <Td fontSize="xs">{row.total_games}</Td>
                        <Td fontSize="xs">{row.blitz_rating?.length ? row.blitz_rating[row.blitz_rating.length - 1] : '-'}</Td>
                        <Td fontSize="xs">{row.rapid_rating?.length ? row.rapid_rating[row.rapid_rating.length - 1] : '-'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </Box>
        </VStack>
      </FormModal>
    </PageShell>
  );
}

export function AdminCurriculum() {
  const modal = useDisclosure();
  const toast = useToast();
  const { data, reload, loading } = useLoad(() => adminApi.curriculum(), []);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseInt(searchParams.get('tab') || '0');
  const setActiveTab = (index) => {
    setSearchParams({ tab: index.toString() });
  };

  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const handleSave = async (values) => {
    try {
      if (activeTab === 0) {
        editing ? await adminApi.updateModule(editing.module_id, values) : await adminApi.createModule(values);
      } else if (activeTab === 1) {
        editing ? await adminApi.updateChapter(editing.chapter_id, values) : await adminApi.createChapter(values);
      } else {
        editing ? await adminApi.updateStory(editing.story_id, values) : await adminApi.createStory(values);
      }
      toast({ title: 'Saved successfully', status: 'success' });
      modal.onClose();
      reload();
    } catch (err) {
      toast({ title: 'Error saving', description: err.response?.data?.error || err.message, status: 'error' });
    }
  };

  const handleDelete = async (item) => {
    try {
      if (activeTab === 0) await adminApi.deleteModule(item.module_id);
      else if (activeTab === 1) await adminApi.deleteChapter(item.chapter_id);
      else await adminApi.deleteStory(item.story_id);
      toast({ title: 'Deleted successfully', status: 'success' });
      reload();
    } catch (err) {
      toast({ title: 'Error deleting', description: err.response?.data?.error || err.message, status: 'error' });
    }
  };

  const fields = useMemo(() => {
    return (currentValues) => {
      if (!data) return [];
      return [
        [
          { name: 'title', label: 'Module Title', required: true },
        ],
        [
          { name: 'title', label: 'Chapter Title', required: true },
          { name: 'module_id', label: 'Module', required: true, options: (data.modules || []).map(m => ({ label: m.title, value: m.module_id })) },
        ],
        [
          { name: 'title', label: 'Story Title', required: true },
          { name: 'module_id', label: 'Module', required: true, options: (data.modules || []).map(m => ({ label: m.title, value: m.module_id })) },
          { 
            name: 'chapter_id', 
            label: 'Chapter', 
            required: true, 
            options: (data.chapters || [])
              .filter(c => !currentValues.module_id || c.module_id === currentValues.module_id)
              .map(c => ({ label: c.title, value: c.chapter_id })) 
          },
          { name: 'description', label: 'Short Description', type: 'textarea' },
          { name: 'status', label: 'Status', options: ['published', 'draft'] },
          { name: 'tags', label: 'Tags (comma separated)' },
        ]
      ][activeTab];
    };
  }, [data, activeTab]);

  const filteredModules = (data?.modules || []).filter(m => m.title.toLowerCase().includes(search.toLowerCase()));
  const filteredChapters = (data?.chapters || []).filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageShell role="admin" title="Curriculum">
      {loading ? (
        <LoadingState />
      ) : (
        <VStack align="stretch" spacing={0} h="calc(100vh - 120px)">
          {/* Sticky Header Section */}
          <Box 
            position="sticky" 
            top="-28px" 
            zIndex="20" 
            bg="#FAF7F0" 
            pt="4"
            pb="4" 
            borderBottom="1px solid rgba(214,168,79,0.2)"
            boxShadow="0 8px 24px rgba(10, 20, 40, 0.04)"
          >
            <VStack align="stretch" spacing={4}>
              <SearchFilterBar search={search} setSearch={setSearch} showFilter={false} />
              
              <Flex justify="space-between" align="center">
                <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" mb="-1px">
                  <TabList borderBottom="none">
                    <Tab _selected={{ color: 'brand.goldDark', borderColor: 'rgba(214,168,79,0.2)', borderBottomColor: '#FAF7F0' }}>Modules</Tab>
                    <Tab _selected={{ color: 'brand.goldDark', borderColor: 'rgba(214,168,79,0.2)', borderBottomColor: '#FAF7F0' }}>Chapters</Tab>
                    <Tab _selected={{ color: 'brand.goldDark', borderColor: 'rgba(214,168,79,0.2)', borderBottomColor: '#FAF7F0' }}>Stories</Tab>
                  </TabList>
                </Tabs>

                <Button 
                  bg="brand.navy" 
                  color="white" 
                  _hover={{ bg: 'brand.goldDark' }} 
                  onClick={() => { setEditing(null); modal.onOpen(); }}
                  size="md"
                  px={8}
                >
                  Add {['Module', 'Chapter', 'Story'][activeTab]}
                </Button>
              </Flex>
            </VStack>
          </Box>

          {/* Scrollable Content Section */}
          <Box overflowY="auto" flex="1" pt={8} pr={2} sx={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(214,168,79,0.2)', borderRadius: '10px' },
          }}>
            <Box pb={10}>
              {activeTab === 0 && (
                <DataTable
                  items={filteredModules}
                  columns={[
                    { key: 'title', label: 'MODULE', bold: true },
                    { key: 'chaptersCount', label: 'CHAPTERS' },
                  ]}
                  onEdit={(item) => { setEditing(item); modal.onOpen(); }}
                  onDelete={handleDelete}
                />
              )}
              
              {activeTab === 1 && (
                <>
                  {filteredModules.map(module => {
                    const moduleChapters = filteredChapters.filter(c => c.module_id === module.module_id);
                    return (
                      <Box key={module.module_id} mb={8} p={5} bg="#FFFDF8" borderRadius="14px" border="1px solid rgba(214,168,79,0.25)">
                        <Flex justify="space-between" align="center" mb={4}>
                          <Box>
                            <Heading size="md" color="brand.navy">{module.title}</Heading>
                          </Box>
                          <Badge bg="brand.navy" color="white" px={3} py={1} borderRadius="full">
                            {moduleChapters.length} Chapters
                          </Badge>
                        </Flex>
                        {moduleChapters.length > 0 ? (
                          <DataTable
                            items={moduleChapters}
                            columns={[
                              { key: 'title', label: 'CHAPTER', bold: true },
                              { key: 'storiesCount', label: 'STORIES' },
                            ]}
                            onEdit={(item) => { setEditing(item); modal.onOpen(); }}
                            onDelete={handleDelete}
                          />
                        ) : (
                          <Text color="brand.muted" fontStyle="italic" py={4}>No chapters added to this module yet.</Text>
                        )}
                      </Box>
                    );
                  })}
                </>
              )}
              
              {activeTab === 2 && (
                <NestedStoriesView search={search} principles={data?.principles} />
              )}
            </Box>
          </Box>
        </VStack>
      )}
      <FormModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        title={`${editing ? 'Edit' : 'Add'} ${['Module', 'Chapter', 'Story'][activeTab]}`}
        fields={fields}
        initialValues={editing || EMPTY_OBJECT}
        onSubmit={handleSave}
      />
    </PageShell>
  );
}

export function AdminAnalytics() {
  const { data } = useLoad(() => adminApi.analytics(), []);
  return <PageShell role="admin" title="Academy Analytics">{!data ? <LoadingState /> : <DashboardCard title="User Growth"><LineAreaChart area data={data.userGrowth} lines={[{ key: 'total', name: 'Total Users', color: '#07111F' }, { key: 'active', name: 'Active Students', color: '#D6A84F' }]} /></DashboardCard>}</PageShell>;
}

export function AdminReports() {
  const [report, setReport] = useState(null);
  return <PageShell role="admin" title="Reports"><DashboardCard title="Generate Admin Report"><HStack><Select maxW="220px"><option>Academy Performance</option><option>Users</option><option>Curriculum</option></Select><Button onClick={async () => setReport(await adminApi.generateReport({ type: 'Academy Performance' }))}>Generate Report</Button>{report && <Button onClick={() => downloadTextFile('admin-report.html', `<h1>Admin Report</h1><pre>${JSON.stringify(report, null, 2)}</pre>`, 'text/html')}>Export Report</Button>}</HStack>{report && <Text mt={4}>{report.summary}</Text>}</DashboardCard></PageShell>;
}

export function RolesPermissions() {
  const toast = useToast();
  const { data, setData } = useLoad(() => adminApi.rolesPermissions(), []);
  if (!data) return <PageShell role="admin" title="Roles & Permissions"><LoadingState /></PageShell>;
  const save = async () => { await adminApi.saveRolesPermissions(data); toast({ title: 'Permissions saved', status: 'success' }); };
  return <PageShell role="admin" title="Roles & Permissions"><DashboardCard><DataTable items={Object.entries(data).map(([role, permissions]) => ({ id: role, role, ...permissions }))} columns={[{ key: 'role', label: 'Role' }, { key: 'users', label: 'Users' }, { key: 'curriculum', label: 'Curriculum' }, { key: 'reports', label: 'Reports' }, { key: 'settings', label: 'Settings' }]} /><Button mt={4} onClick={save}>Save Permissions</Button></DashboardCard></PageShell>;
}

export function AdminSettings() {
  return <SettingsPage role="admin" title="Admin Settings" fields={['academyName','tagline','brandingColor']} save={adminApi.saveSettings} />;
}

export function AdminPuzzles() {
  const { data: principles = [] } = useLoad(() => adminApi.list('principles'), []);
  
  return (
    <AdminCrudPage 
      title="Chess Puzzles" 
      resource="puzzles" 
      columns={[
        { key: 'id', label: 'PUZZLE ID', bold: true },
        { key: 'principle_name', label: 'PRINCIPLE' },
        { key: 'isdone', label: 'STATUS', badge: true },
      ]}
      fields={[
        { name: 'id', label: 'Puzzle ID', required: true }, 
        { 
          name: 'principle_id', 
          label: 'Principle', 
          options: (principles || []).map(p => ({ label: p.name, value: p.id })) 
        }, 
        { name: 'fen_with_move', label: 'FEN with Move' }, 
        { name: 'answer', label: 'Answer' },
        { name: 'isdone', label: 'Done', type: 'checkbox' }
      ]} 
    />
  );
}

export function AdminPositions() {
  return (
    <AdminCrudPage 
      title="Positions" 
      resource="positions" 
      columns={[
        { key: 'id', label: 'ID', bold: true },
        { key: 'principle', label: 'PRINCIPLE' },
        { key: 'isdone', label: 'STATUS', badge: true },
      ]}
      fields={[
        { name: 'id', label: 'ID', required: true }, 
        { name: 'principle', label: 'Principle' }, 
        { name: 'fen_with_move', label: 'FEN with Move' }, 
        { name: 'puzzle_list', label: 'Puzzle List (JSON)' },
        { name: 'isdone', label: 'Done', type: 'checkbox' }
      ]} 
    />
  );
}
export function AdminPrinciples() {
  const { data } = useLoad(() => adminApi.list('principles'), []);
  
  return (
    <AdminCrudPage 
      title="Principles" 
      resource="principles" 
      columns={[
        { key: 'name', label: 'Name', bold: true }
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true }
      ]} 
    />
  );
}
export function AdminClasses() {
  return <AdminCrudPage title="Classes" resource="classes" fields={[{ name: 'title', label: 'Title', required: true }, { name: 'topic', label: 'Topic' }, { name: 'coach', label: 'Coach' }, { name: 'status', label: 'Status', options: ['upcoming','live','cancelled'] }]} />;
}
export function AdminAchievements() {
  return <AdminCrudPage title="Achievements" resource="achievements" fields={[{ name: 'title', label: 'Title', required: true }, { name: 'rule', label: 'Unlock Rule', type: 'textarea' }, { name: 'progress', label: 'Progress' }]} />;
}
