import React, { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Input,
  Link,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { ExternalLink, Medal, Sparkles, Swords, Trophy } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import DashboardCard from '../components/common/DashboardCard.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import {
  fetchAndOrganizeForUsername,
  loadAchievementsCache,
  normalizeChessComHandle,
  saveAchievementsCache,
  todayInputValue,
} from '../api/achievementsApi.js';
import { adminApi } from '../api/adminApi.js';
import { useAuth } from '../context/AuthContext.jsx';

/** Chess.com achievements hub (admin-only routes under this prefix). */
const ACHIEVEMENTS_HUB = '/admin/achievements';

function bulkErrorLooks404ish(message) {
  return /404|no public player|no games archive|username not found|no public profile/i.test(message || '');
}

function PageShell({ children }) {
  const { user } = useAuth();
  return (
    <DashboardLayout role={user?.role || 'admin'}>
      <Flex justify="space-between" align="flex-start" mb={5} gap={4}>
        <Box>
          <Heading fontFamily="Georgia, serif" letterSpacing="-0.02em">Achievements</Heading>
          <Text color="brand.muted" mt={1}>Organize Chess.com games into streak-based milestones.</Text>
        </Box>
      </Flex>
      {children}
    </DashboardLayout>
  );
}

function resultColor(result) {
  if (result === 'win') return 'green';
  if (['checkmated', 'resigned', 'timeout', 'lose', 'abandoned'].includes(result)) return 'red';
  return 'yellow';
}

function GamesTable({ games, showAccount = false }) {
  if (!games.length) return <EmptyState title="No games found" />;

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm" minW={showAccount ? '1040px' : '960px'}>
        <Thead bg="rgba(214,168,79,0.12)">
          <Tr>
            {showAccount && <Th>Account</Th>}
            <Th>Date</Th>
            <Th>Opponent</Th>
            <Th>Color</Th>
            <Th>Result</Th>
            <Th isNumeric>Player</Th>
            <Th isNumeric>Opponent</Th>
            <Th>Time class</Th>
            <Th>Rated</Th>
            <Th>Game</Th>
          </Tr>
        </Thead>
        <Tbody>
          {games.map((game) => (
            <Tr key={`${game.playerUsername || ''}-${game.uuid}`}>
              {showAccount && (
                <Td fontWeight="700">{game.playerUsername || '—'}</Td>
              )}
              <Td>{game.date}</Td>
              <Td fontWeight="700">{game.opponentUsername}</Td>
              <Td textTransform="capitalize">{game.playerColor}</Td>
              <Td><Badge colorScheme={resultColor(game.playerResult)}>{game.playerResult}</Badge></Td>
              <Td isNumeric>{game.playerRating}</Td>
              <Td isNumeric>{game.opponentRating}</Td>
              <Td textTransform="capitalize">{game.timeClass}</Td>
              <Td>{game.rated ? 'Rated' : 'Unrated'}</Td>
              <Td>
                <Link href={game.url} isExternal color="brand.goldDark" fontWeight="700">
                  Open <ExternalLink size={13} style={{ display: 'inline', marginLeft: 4 }} />
                </Link>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

function StreakList({ streaks, emptyTitle }) {
  if (!streaks.length) return <EmptyState title={emptyTitle} />;

  return (
    <VStack align="stretch" spacing={4}>
      {streaks.map((streak, index) => (
        <DashboardCard key={streak.id || index}>
          <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={4} direction={{ base: 'column', md: 'row' }}>
            <Box>
              <Heading size="md">{streak.length} wins in a row</Heading>
              <Text color="brand.muted" mt={1}>{streak.startDate} to {streak.endDate}</Text>
            </Box>
            <HStack>
              {streak.games.some((game) => game.hasSacrifice) && <Badge colorScheme="orange">Sacrifice</Badge>}
              {streak.games.some((game) => game.hasBrilliantMove) && <Badge colorScheme="purple">Brilliant</Badge>}
            </HStack>
          </Flex>
          <Box mt={4}>
            <GamesTable games={streak.games} />
          </Box>
        </DashboardCard>
      ))}
    </VStack>
  );
}

/** Per-player sections so win streaks are never merged across accounts. */
function MultiStreakSections({ byPlayer, pickStreaks }) {
  const entries = Object.entries(byPlayer || {});
  if (!entries.length) return <EmptyState title="No player data" />;

  return (
    <VStack align="stretch" spacing={8}>
      {entries.map(([chessId, row]) => {
        const streaks = pickStreaks(row.organized);
        return (
          <Box key={chessId}>
            <Heading size="md" fontFamily="Georgia, serif" mb={3}>
              {row.playerName || chessId} <Text as="span" fontSize="sm" color="brand.muted" fontWeight="600">({chessId})</Text>
            </Heading>
            <StreakList streaks={streaks} emptyTitle="No streaks for this player" />
          </Box>
        );
      })}
    </VStack>
  );
}

function navItems() {
  return [
    { label: 'All Games', path: `${ACHIEVEMENTS_HUB}/all-games`, icon: Trophy },
    { label: 'Wins in Row', path: `${ACHIEVEMENTS_HUB}/wins-in-row`, icon: Medal },
    { label: 'Wins in Row with Sacrifices', path: `${ACHIEVEMENTS_HUB}/wins-in-row/sacrifices`, icon: Swords },
    { label: 'Wins in Row with Brilliant Moves', path: `${ACHIEVEMENTS_HUB}/wins-in-row/brilliant`, icon: Sparkles },
  ];
}

function NavigationCards() {
  const navigate = useNavigate();
  const disk = loadAchievementsCache();
  const suffix = disk?.mode === 'multi' ? '?player=all' : '';
  return (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
      {navItems().map(({ label, path, icon: Icon }) => (
        <DashboardCard key={path} cursor="pointer" onClick={() => navigate(`${path}${suffix}`)}>
          <Flex align="center" gap={3}>
            <Flex w="42px" h="42px" align="center" justify="center" bg="rgba(214,168,79,0.15)" borderRadius="8px" color="brand.goldDark">
              <Icon size={22} />
            </Flex>
            <Text fontWeight="800">{label}</Text>
          </Flex>
        </DashboardCard>
      ))}
    </SimpleGrid>
  );
}

function PlayerScopeBar() {
  const diskCache = loadAchievementsCache();
  const [searchParams, setSearchParams] = useSearchParams();

  if (diskCache?.mode !== 'multi' || !diskCache.byPlayer) return null;

  const ids = Object.keys(diskCache.byPlayer);
  const raw = (searchParams.get('player') || '').trim().toLowerCase();
  const current = raw && ids.includes(raw) ? raw : 'all';

  return (
    <FormControl maxW="420px" mb={5}>
      <FormLabel>Player scope</FormLabel>
      <Select
        bg="white"
        value={current}
        onChange={(event) => {
          const value = event.target.value;
          if (value === 'all') setSearchParams({}, { replace: true });
          else setSearchParams({ player: value }, { replace: true });
        }}
      >
        <option value="all">All players (combined / stacked)</option>
        {ids.map((id) => (
          <option key={id} value={id}>
            {(diskCache.byPlayer[id].playerName || id)} ({id})
          </option>
        ))}
      </Select>
    </FormControl>
  );
}

function initFromCache() {
  const c = loadAchievementsCache();
  if (!c) {
    return { multi: null, singleOrganized: null, username: '', fromDate: '', toDate: todayInputValue() };
  }
  if (c.mode === 'multi') {
    const playerCount = c.byPlayer && typeof c.byPlayer === 'object' ? Object.keys(c.byPlayer).length : 0;
    if (playerCount > 0) {
      return {
        multi: c,
        singleOrganized: null,
        username: '',
        fromDate: c.fromDate || '',
        toDate: c.toDate || todayInputValue(),
      };
    }
    if (Array.isArray(c.errors) && c.errors.length > 0) {
      return {
        multi: c,
        singleOrganized: null,
        username: '',
        fromDate: c.fromDate || '',
        toDate: c.toDate || todayInputValue(),
      };
    }
  }
  return {
    multi: null,
    singleOrganized: c.organized || null,
    username: c.username || '',
    fromDate: c.fromDate || '',
    toDate: c.toDate || todayInputValue(),
  };
}

export default function AchievementsPage({ view = 'dashboard' }) {
  const navigate = useNavigate();
  const initial = useMemo(() => initFromCache(), []);
  const [username, setUsername] = useState(initial.username);
  const [fromDate, setFromDate] = useState(initial.fromDate);
  const [toDate, setToDate] = useState(initial.toDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progressText, setProgressText] = useState('');
  const [organized, setOrganized] = useState(initial.singleOrganized);
  const [multiCache, setMultiCache] = useState(initial.multi);
  const [dbPlayers, setDbPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState('');

  const sortedGames = useMemo(
    () => [...(organized?.allGames || [])].sort((a, b) => b.endTime - a.endTime),
    [organized],
  );

  async function handleLoadPlayersFromDb() {
    setPlayersLoading(true);
    setPlayersError('');
    try {
      const rows = await adminApi.players();
      const list = Array.isArray(rows) ? rows : [];
      const withChessId = list.filter((p) => p && String(p.Chess_com_ID ?? '').trim());
      setDbPlayers(withChessId);
      if (!withChessId.length) {
        setPlayersError('No players with a Chess.com ID were found in public.players.');
      }
    } catch (err) {
      setDbPlayers([]);
      setPlayersError(
        err.response?.data?.error || err.message || 'Could not load players. Is the API server running?',
      );
    } finally {
      setPlayersLoading(false);
    }
  }

  async function handleFetch() {
    if (!username.trim()) {
      setError('Enter a Chess.com username before fetching games.');
      return;
    }

    const effectiveToDate = toDate || todayInputValue();

    if (fromDate && new Date(fromDate) > new Date(effectiveToDate)) {
      setError('From date must be before To date.');
      return;
    }

    setLoading(true);
    setError('');
    setOrganized(null);
    setMultiCache(null);

    try {
      const nextOrganized = await fetchAndOrganizeForUsername(
        username,
        fromDate,
        effectiveToDate,
        (msg) => setProgressText(msg),
      );

      const payload = {
        mode: 'single',
        username: username.trim(),
        fromDate,
        toDate: effectiveToDate,
        fetchedAt: new Date().toISOString(),
        organized: nextOrganized,
      };

      saveAchievementsCache(payload);
      setOrganized(nextOrganized);
      setProgressText('Done organizing achievements.');
    } catch (err) {
      setError(err.message || 'Unable to fetch Chess.com games.');
      setProgressText('');
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchAllPlayers() {
    const effectiveToDate = toDate || todayInputValue();
    if (fromDate && new Date(fromDate) > new Date(effectiveToDate)) {
      setError('From date must be before To date.');
      return;
    }

    setLoading(true);
    setError('');
    setProgressText('');
    setOrganized(null);
    setMultiCache(null);

    let list = dbPlayers;
    if (!list.length) {
      try {
        const rows = await adminApi.players();
        const arr = Array.isArray(rows) ? rows : [];
        list = arr.filter((p) => p && String(p.Chess_com_ID ?? '').trim());
        setDbPlayers(list);
      } catch (err) {
        setLoading(false);
        setError(err.response?.data?.error || err.message || 'Could not load players from the database.');
        return;
      }
    }

    if (!list.length) {
      setLoading(false);
      setError('No players with a Chess.com ID in public.players. Add Chess_com_ID values first.');
      return;
    }

    const byPlayer = {};
    const errors = [];
    const delayMs = 450;

    try {
      for (let i = 0; i < list.length; i += 1) {
        const p = list[i];
        const rawFromDb = String(p.Chess_com_ID || '').trim();
        const handle = normalizeChessComHandle(p.Chess_com_ID);
        if (!handle) {
          errors.push({
            chessCom: rawFromDb || '(empty)',
            message: 'Could not derive a Chess.com username from Chess_com_ID (empty or invalid).',
          });
          continue;
        }
        const playerName = (p.Player_Name && String(p.Player_Name).trim()) || handle;
        setProgressText(`Player ${i + 1} / ${list.length}: ${playerName} (${handle})…`);

        try {
          const nextOrganized = await fetchAndOrganizeForUsername(
            handle,
            fromDate,
            effectiveToDate,
            (msg) => setProgressText(`${msg} (${i + 1}/${list.length})`),
          );
          byPlayer[handle] = { chessComId: handle, playerName, organized: nextOrganized };
        } catch (err) {
          errors.push({ chessCom: rawFromDb, message: err.message || 'Unknown error' });
        }

        if (i < list.length - 1) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      if (!Object.keys(byPlayer).length) {
        const allRows404ish = errors.length > 0 && errors.every((e) => bulkErrorLooks404ish(e.message));
        const failedPayload = {
          mode: 'multi',
          fromDate,
          toDate: effectiveToDate,
          fetchedAt: new Date().toISOString(),
          byPlayer: {},
          errors,
        };
        saveAchievementsCache(failedPayload);
        setMultiCache(failedPayload);
        setError(
          allRows404ish
            ? 'No data loaded: every Chess.com request for your database players returned 404 (or “no public player”). Open “Bulk fetch failures” below for each Chess_com_ID. Bulk uses only the database column, not the optional username field — compare values to https://www.chess.com/member/ (use the URL slug as the handle).'
            : 'No players returned data for this run. Open “Bulk fetch failures” below for each row.',
        );
        setProgressText('');
        return;
      }

      const payload = {
        mode: 'multi',
        fromDate,
        toDate: effectiveToDate,
        fetchedAt: new Date().toISOString(),
        byPlayer,
        errors,
      };

      saveAchievementsCache(payload);
      setMultiCache(payload);
      setProgressText(
        errors.length
          ? `Finished with ${Object.keys(byPlayer).length} player(s); ${errors.length} failed.`
          : `Finished fetching ${Object.keys(byPlayer).length} player(s).`,
      );
    } catch (err) {
      setError(err.message || 'Bulk fetch failed.');
      setProgressText('');
    } finally {
      setLoading(false);
    }
  }

  if (view !== 'dashboard') {
    const diskCache = loadAchievementsCache();
    const [searchParams] = useSearchParams();
    const playerParam = (searchParams.get('player') || 'all').toLowerCase();

    const hasSingle = diskCache?.mode !== 'multi' && diskCache?.organized;
    const multiPlayerCount = diskCache?.mode === 'multi' && diskCache.byPlayer && typeof diskCache.byPlayer === 'object'
      ? Object.keys(diskCache.byPlayer).length
      : 0;
    const hasMulti = diskCache?.mode === 'multi' && (multiPlayerCount > 0 || (Array.isArray(diskCache.errors) && diskCache.errors.length > 0));

    if (!hasSingle && !hasMulti) {
      return (
        <PageShell>
          <DashboardCard>
            <EmptyState title="No fetched achievements yet" message="Fetch games from the Achievements page first." />
            <Button mt={4} bg="brand.navy" color="white" _hover={{ bg: 'brand.goldDark' }} onClick={() => navigate(ACHIEVEMENTS_HUB)}>
              Go to Achievements
            </Button>
          </DashboardCard>
        </PageShell>
      );
    }

    const subMultiCount = diskCache?.byPlayer && typeof diskCache.byPlayer === 'object'
      ? Object.keys(diskCache.byPlayer).length
      : 0;
    const subtitle = hasSingle
      ? `Showing cached results for ${diskCache.username}.`
      : (subMultiCount > 0
        ? (playerParam === 'all' ? 'All players (cached)' : `Cached: ${diskCache.byPlayer[playerParam]?.playerName || playerParam}`)
        : 'Last bulk fetch had no successful players (errors only — open the hub to review).');

    let content = null;
    if (hasSingle) {
      const o = diskCache.organized;
      const dataByView = {
        all: { title: 'All Games', node: <GamesTable games={[...o.allGames].sort((a, b) => b.endTime - a.endTime)} /> },
        streaks: { title: 'Wins in Row', node: <StreakList streaks={o.winStreaks} emptyTitle="No win streaks of 2 or more found" /> },
        sacrifices: { title: 'Wins in Row with Sacrifices', node: <StreakList streaks={o.sacrificeStreaks} emptyTitle="No sacrifice streaks found" /> },
        brilliant: { title: 'Wins in Row with Brilliant Moves', node: <StreakList streaks={o.brilliantStreaks} emptyTitle="No brilliant move streaks found" /> },
      };
      content = dataByView[view].node;
    } else {
      const { byPlayer } = diskCache;
      const one = playerParam !== 'all' && byPlayer[playerParam] ? byPlayer[playerParam] : null;

      if (view === 'all') {
        if (one) {
          content = (
            <GamesTable games={[...one.organized.allGames].sort((a, b) => b.endTime - a.endTime)} />
          );
        } else {
          const merged = Object.values(byPlayer).flatMap((row) => row.organized.allGames);
          content = (
            <GamesTable
              games={[...merged].sort((a, b) => b.endTime - a.endTime)}
              showAccount
            />
          );
        }
      } else if (view === 'streaks') {
        const pick = (o) => o.winStreaks;
        content = one
          ? <StreakList streaks={pick(one.organized)} emptyTitle="No win streaks of 2 or more found" />
          : <MultiStreakSections byPlayer={byPlayer} pickStreaks={pick} />;
      } else if (view === 'sacrifices') {
        const pick = (o) => o.sacrificeStreaks;
        content = one
          ? <StreakList streaks={pick(one.organized)} emptyTitle="No sacrifice streaks found" />
          : <MultiStreakSections byPlayer={byPlayer} pickStreaks={pick} />;
      } else if (view === 'brilliant') {
        const pick = (o) => o.brilliantStreaks;
        content = one
          ? <StreakList streaks={pick(one.organized)} emptyTitle="No brilliant move streaks found" />
          : <MultiStreakSections byPlayer={byPlayer} pickStreaks={pick} />;
      }
    }

    const titles = {
      all: 'All Games',
      streaks: 'Wins in Row',
      sacrifices: 'Wins in Row with Sacrifices',
      brilliant: 'Wins in Row with Brilliant Moves',
    };

    return (
      <PageShell>
        <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
          <Box>
            <Heading size="lg" fontFamily="Georgia, serif">{titles[view]}</Heading>
            <Text color="brand.muted" mt={1}>{subtitle}</Text>
          </Box>
          <Button bg="brand.navy" color="white" _hover={{ bg: 'brand.goldDark' }} onClick={() => navigate(ACHIEVEMENTS_HUB)}>
            Back to Summary
          </Button>
        </Flex>
        {hasMulti && <PlayerScopeBar />}
        {content}
      </PageShell>
    );
  }

  const aggregateMulti = useMemo(() => {
    if (!multiCache?.byPlayer) return null;
    const rows = Object.values(multiCache.byPlayer);
    if (!rows.length) return null;
    let totalGames = 0;
    let totalWins = 0;
    let bestStreak = 0;
    let sacStreaks = 0;
    let brillStreaks = 0;
    rows.forEach((r) => {
      const s = r.organized.summary;
      totalGames += s.totalGames;
      totalWins += s.totalWins;
      bestStreak = Math.max(bestStreak, s.bestWinStreak);
      sacStreaks += s.sacrificeStreaks;
      brillStreaks += s.brilliantStreaks;
    });
    return { totalGames, totalWins, bestStreak, sacStreaks, brillStreaks, playerCount: rows.length };
  }, [multiCache]);

  return (
    <PageShell>
      <DashboardCard mb={5}>
        <VStack align="stretch" spacing={4} mb={4}>
          <Flex flexWrap="wrap" gap={3} align="center" justify="space-between">
            <Box>
              <Text fontWeight="700" fontSize="sm" color="brand.navy">Players (database)</Text>
              <Text fontSize="xs" color="brand.muted" mt={0.5}>
                Load <Text as="span" fontFamily="mono">public.players</Text>, then fetch Chess.com games for <Text as="span" fontWeight="800">every</Text> row with a <Text as="span" fontFamily="mono">Chess_com_ID</Text> (same date range for all). Bulk fetch does <Text as="span" fontWeight="800">not</Text> use the optional username field — it only calls Chess.com for each DB handle. The app proxies the same public API shape as{' '}
                <Text as="span" fontFamily="mono">https://api.chess.com/pub/player/HANDLE/games/YEAR/MONTH</Text>
                {' '}(games that <Text as="span" fontWeight="800">ended</Text> in that calendar month). If a URL like that works in the browser but bulk fails, your <Text as="span" fontFamily="mono">Chess_com_ID</Text> values do not match those handles (typos, display names, or non-members).
              </Text>
            </Box>
            <Button
              variant="outline"
              borderColor="brand.navy"
              color="brand.navy"
              _hover={{ bg: 'rgba(7,17,31,0.06)' }}
              onClick={handleLoadPlayersFromDb}
              isLoading={playersLoading}
              loadingText="Loading…"
            >
              Load players from database
            </Button>
          </Flex>
          {playersError && (
            <Text fontSize="sm" color="red.600">{playersError}</Text>
          )}
          {dbPlayers.length > 0 && (
            <Text fontSize="sm" color="brand.muted">
              {dbPlayers.length} player(s) with Chess.com IDs loaded — use &quot;Fetch for all players&quot; below.
            </Text>
          )}
        </VStack>

        <Grid templateColumns={{ base: '1fr', md: '1.3fr 1fr 1fr auto' }} gap={4} alignItems="end">
          <FormControl isInvalid={Boolean(error) && !username.trim()}>
            <FormLabel>Optional: one Chess.com username (single fetch only)</FormLabel>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. shreya7483 — used only by “Fetch one username”"
              bg="white"
            />
          </FormControl>
          <FormControl>
            <FormLabel>From date</FormLabel>
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} bg="white" />
          </FormControl>
          <FormControl>
            <FormLabel>To date</FormLabel>
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} bg="white" />
          </FormControl>
          <VStack align="stretch" spacing={2} w="100%">
            <Button
              h="40px"
              w="100%"
              bg="brand.goldDark"
              color="brand.navy"
              fontWeight="800"
              _hover={{ bg: 'brand.navy', color: 'white' }}
              isLoading={loading}
              loadingText="Fetching all"
              onClick={handleFetchAllPlayers}
            >
              Fetch for all players
            </Button>
            <Button
              h="40px"
              w="100%"
              variant="outline"
              borderColor="brand.navy"
              color="brand.navy"
              isLoading={loading}
              loadingText="Fetching"
              onClick={handleFetch}
            >
              Fetch one username only
            </Button>
          </VStack>
        </Grid>
        {progressText && <Text mt={4} color="brand.goldDark" fontWeight="800">{progressText}</Text>}
        {error && <Box mt={4}><ErrorState message={error} /></Box>}
        {multiCache?.mode === 'multi'
          && Array.isArray(multiCache.errors)
          && multiCache.errors.length > 0
          && Object.keys(multiCache.byPlayer || {}).length === 0 && (
            <DashboardCard mt={4} title="Bulk fetch failures">
              <Text fontSize="sm" color="brand.muted" mb={3}>
                Example Pub API month URL:{' '}
                <Link href="https://api.chess.com/pub/player/shreya7483/games/2024/08" isExternal color="brand.navy">
                  api.chess.com/.../shreya7483/games/2024/08 <ExternalLink size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </Link>
                {' '}(handle, then year and month for games that ended in that month). Your rows must use that same handle in{' '}
                <Text as="span" fontFamily="mono">Chess_com_ID</Text>.
              </Text>
              <VStack align="stretch" spacing={2}>
                {multiCache.errors.map((e, idx) => (
                  <Text key={`${e.chessCom}-${idx}`} fontSize="sm">
                    <Text as="span" fontWeight="800" fontFamily="mono">{e.chessCom}</Text>
                    {' — '}
                    {e.message}
                  </Text>
                ))}
              </VStack>
            </DashboardCard>
        )}
      </DashboardCard>

      {loading && (
        <Box mb={6}>
          <Text fontWeight="700" color="brand.muted" mb={3}>Loading</Text>
          <LoadingState />
        </Box>
      )}

      {multiCache?.byPlayer && aggregateMulti && (
        <VStack align="stretch" spacing={5}>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={4}>
            {[
              ['Players fetched', aggregateMulti.playerCount],
              ['Total games (all)', aggregateMulti.totalGames],
              ['Total wins (all)', aggregateMulti.totalWins],
              ['Best single-player streak', aggregateMulti.bestStreak],
              ['Sacrifice streaks (sum)', aggregateMulti.sacStreaks],
              ['Brilliant streaks (sum)', aggregateMulti.brillStreaks],
            ].map(([label, value]) => (
              <DashboardCard key={label}>
                <Stat>
                  <StatLabel>{label}</StatLabel>
                  <StatNumber color="brand.navy">{value}</StatNumber>
                </Stat>
              </DashboardCard>
            ))}
          </SimpleGrid>

          {multiCache.errors?.length > 0 && (
            <DashboardCard title="Players that failed">
              <VStack align="stretch" spacing={1}>
                {multiCache.errors.map((e, idx) => (
                  <Text key={`${e.chessCom}-${idx}`} fontSize="sm">
                    <Text as="span" fontWeight="800">{e.chessCom}</Text>
                    {' — '}
                    {e.message}
                  </Text>
                ))}
              </VStack>
            </DashboardCard>
          )}

          <DashboardCard title="Per-player summary">
            <Box overflowX="auto">
              <Table size="sm" variant="simple" minW="720px">
                <Thead bg="rgba(214,168,79,0.12)">
                  <Tr>
                    <Th>Player</Th>
                    <Th>Chess.com ID</Th>
                    <Th isNumeric>Games</Th>
                    <Th isNumeric>Wins</Th>
                    <Th isNumeric>Best streak</Th>
                    <Th isNumeric>Sac streaks</Th>
                    <Th isNumeric>Brill streaks</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {Object.entries(multiCache.byPlayer).map(([key, row]) => {
                    const s = row.organized.summary;
                    return (
                      <Tr key={key}>
                        <Td fontWeight="700">{row.playerName}</Td>
                        <Td fontFamily="mono">{row.chessComId}</Td>
                        <Td isNumeric>{s.totalGames}</Td>
                        <Td isNumeric>{s.totalWins}</Td>
                        <Td isNumeric>{s.bestWinStreak}</Td>
                        <Td isNumeric>{s.sacrificeStreaks}</Td>
                        <Td isNumeric>{s.brilliantStreaks}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          </DashboardCard>

          <NavigationCards />
        </VStack>
      )}

      {organized && !multiCache && (
        <VStack align="stretch" spacing={5}>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={4}>
            {[
              ['Total games', organized.summary.totalGames],
              ['Total wins', organized.summary.totalWins],
              ['Best win streak', organized.summary.bestWinStreak],
              ['Win streaks with sacrifices', organized.summary.sacrificeStreaks],
              ['Win streaks with brilliant moves', organized.summary.brilliantStreaks],
            ].map(([label, value]) => (
              <DashboardCard key={label}>
                <Stat>
                  <StatLabel>{label}</StatLabel>
                  <StatNumber color="brand.navy">{value}</StatNumber>
                </Stat>
              </DashboardCard>
            ))}
          </SimpleGrid>
          <NavigationCards />
          <DashboardCard title="Recent fetched games">
            <GamesTable games={sortedGames.slice(0, 10)} />
          </DashboardCard>
        </VStack>
      )}
    </PageShell>
  );
}
