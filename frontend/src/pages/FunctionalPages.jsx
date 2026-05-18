import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Flex, FormControl, FormLabel, Grid, Heading, HStack, Input, Progress, Select, SimpleGrid, Spinner, Switch, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea, useDisclosure, useToast, VStack } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { downloadTextFile } from '../utils/download.js';
import { getValue, titleCase } from '../utils/formatters.js';

function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const reload = async () => {
    try {
      setError('');
      const next = await loader();
      setData(next);
      return next;
    } catch (err) {
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
    <PageShell role="student" title={data.name} subtitle={data.category}>
      <DashboardCard>
        <Text>{data.explanation}</Text>
        <VStack mt={4} align="stretch">{data.examples?.map((example) => <Text key={example}>• {example}</Text>)}</VStack>
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
  const navigate = useNavigate();
  return <AdminCrudPage title="Users" resource="users" fields={[{ name: 'name', label: 'Name', required: true }, { name: 'email', label: 'Email' }, { name: 'role', label: 'Role', options: ['student','coach','admin','parent'] }, { name: 'status', label: 'Status', options: ['active','suspended'] }]} onView={(item) => navigate(`/admin/users/${item.id}`)} />;
}

export function AdminUserDetail() {
  const { userId } = useParams();
  const { data } = useLoad(() => adminApi.detail('users', userId), [userId]);
  const toast = useToast();
  if (!data) return <PageShell role="admin" title="User"><LoadingState /></PageShell>;
  return <PageShell role="admin" title={data.name}><DashboardCard><Text>Email: {data.email}</Text><Text>Role: {data.role}</Text><Text>Status: {data.status}</Text><HStack mt={5}><Button onClick={() => toast({ title: 'Password reset sent', status: 'success' })}>Reset Password</Button><Button onClick={() => toast({ title: 'Role assigned', status: 'success' })}>Assign Role</Button><Button colorScheme="red" onClick={() => toast({ title: 'User status changed', status: 'warning' })}>Suspend/Activate</Button></HStack></DashboardCard></PageShell>;
}

export function AdminCrudPage({ title, resource, fields, onView }) {
  const modal = useDisclosure();
  const toast = useToast();
  const { data, reload } = useLoad(() => adminApi.list(resource), [resource]);
  const [editing, setEditing] = useState(null);
  const columns = [{ key: 'title', label: 'Title' }, { key: 'name', label: 'Name' }, { key: 'difficulty', label: 'Difficulty' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status', badge: true }].filter((col) => (data || []).some((item) => item[col.key] !== undefined));
  const save = async (values) => { editing ? await adminApi.update(resource, editing.id, values) : await adminApi.create(resource, values); toast({ title: `${title} saved`, status: 'success' }); setEditing(null); modal.onClose(); reload(); };
  return <PageShell role="admin" title={title}><Button mb={4} onClick={() => { setEditing(null); modal.onOpen(); }}>Add {title.slice(0, -1)}</Button>{!data ? <LoadingState /> : <DataTable items={data} columns={columns.length ? columns : [{ key: 'id', label: 'ID' }]} onView={onView} onEdit={(item) => { setEditing(item); modal.onOpen(); }} onDelete={async (item) => { await adminApi.remove(resource, item.id); toast({ title: 'Deleted', status: 'info' }); reload(); }} />}<FormModal isOpen={modal.isOpen} onClose={modal.onClose} title={`${editing ? 'Edit' : 'Add'} ${title}`} fields={fields} initialValues={editing || {}} onSubmit={save} /></PageShell>;
}

export function AdminCurriculum() {
  const modal = useDisclosure();
  const toast = useToast();
  const { data, reload } = useLoad(() => adminApi.curriculum(), []);
  const add = async (values) => { await adminApi.createModule(values); toast({ title: 'Module added', status: 'success' }); modal.onClose(); reload(); };
  return <PageShell role="admin" title="Curriculum">{!data ? <LoadingState /> : <Tabs><TabList><Tab>Modules</Tab><Tab>Chapters</Tab></TabList><TabPanels><TabPanel><Button mb={4} onClick={modal.onOpen}>Add Module</Button><DataTable items={data.modules} columns={[{ key: 'title', label: 'Module' }, { key: 'order', label: 'Order' }, { key: 'chapters', label: 'Chapters' }]} onEdit={() => toast({ title: 'Use up/down controls to reorder', status: 'info' })} /></TabPanel><TabPanel><DataTable items={data.chapters} columns={[{ key: 'title', label: 'Chapter' }, { key: 'moduleId', label: 'Module' }, { key: 'order', label: 'Order' }]} /></TabPanel></TabPanels></Tabs>}<FormModal isOpen={modal.isOpen} onClose={modal.onClose} title="Add Module" fields={[{ name: 'title', label: 'Title', required: true }]} onSubmit={add} /></PageShell>;
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
  return <AdminCrudPage title="Puzzles" resource="puzzles" fields={[{ name: 'title', label: 'Title', required: true }, { name: 'difficulty', label: 'Difficulty', options: ['Easy','Medium','Hard'] }, { name: 'theme', label: 'Theme' }, { name: 'expectedMove', label: 'Expected Move' }, { name: 'explanation', label: 'Explanation', type: 'textarea' }]} />;
}
export function AdminStories() {
  return <AdminCrudPage title="Stories" resource="stories" fields={[{ name: 'title', label: 'Title', required: true }, { name: 'chapter', label: 'Chapter' }, { name: 'lesson', label: 'Panchatantra Lesson', type: 'textarea' }, { name: 'chessConcept', label: 'Chess Concept' }, { name: 'body', label: 'Body', type: 'textarea' }, { name: 'status', label: 'Status', options: ['draft','published'] }]} />;
}
export function AdminPrinciples() {
  return <AdminCrudPage title="Principles" resource="principles" fields={[{ name: 'name', label: 'Name', required: true }, { name: 'category', label: 'Category' }, { name: 'explanation', label: 'Explanation', type: 'textarea' }]} />;
}
export function AdminClasses() {
  return <AdminCrudPage title="Classes" resource="classes" fields={[{ name: 'title', label: 'Title', required: true }, { name: 'topic', label: 'Topic' }, { name: 'coach', label: 'Coach' }, { name: 'status', label: 'Status', options: ['upcoming','live','cancelled'] }]} />;
}
export function AdminAchievements() {
  return <AdminCrudPage title="Achievements" resource="achievements" fields={[{ name: 'title', label: 'Title', required: true }, { name: 'rule', label: 'Unlock Rule', type: 'textarea' }, { name: 'progress', label: 'Progress' }]} />;
}
