import { api, API_BASE_URL } from './client.js';

const CACHE_KEY = 'cliosGambitAchievements';

/**
 * Chess.com Published Data (Pub) API — read-only JSON the app consumes via our backend proxy:
 *
 * - GET https://api.chess.com/pub/player/{username}/games/archives
 *   → { "archives": [ "https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}", ... ] }
 *
 * - GET https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}
 *   → { "games": [ { "url", "pgn", "end_time", "rated", "time_class", "time_control", "rules",
 *       "uuid", "white": { "username", "rating", "result", "@id", ... },
 *       "black": { ... }, "eco" (opening URL), "start_time" (daily), ... }, ... ] }
 *
 * Live and daily games share this envelope; `white` / `black` usernames keep Chess.com casing.
 * @see https://www.chess.com/news/view/published-data-api
 */

/**
 * Turn `public.players.Chess_com_ID` into a Chess.com PubAPI handle: trim, strip @,
 * extract handle from profile URLs, lowercase. Returns "" if nothing usable.
 */
export function normalizeChessComHandle(raw) {
  let s = String(raw ?? '').trim();
  if (!s) return '';
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep */
  }
  s = s.trim();
  if (s.startsWith('@')) s = s.slice(1).trim();

  const urlMatch = s.match(/https?:\/\/(?:www\.)?chess\.com\/(?:member|settings\/(?:profile|account))\/([^/?#]+)/i)
    || s.match(/chess\.com\/(?:member|settings\/(?:profile|account))\/([^/?#]+)/i);
  if (urlMatch) {
    try {
      s = decodeURIComponent(urlMatch[1]);
    } catch {
      s = urlMatch[1];
    }
  }

  s = (s.split(/\s+/)[0] || '').trim();
  return s.toLowerCase();
}

/**
 * Chess.com returns full monthly URLs like:
 * https://api.chess.com/pub/player/{user}/games/{YYYY}/{MM}
 * We reuse them only to extract segments; requests go through our backend proxy
 * so Node can send a proper User-Agent and avoid browser/CORS issues.
 */
export function parseMonthlyArchiveUrl(archiveUrl) {
  if (!archiveUrl || typeof archiveUrl !== 'string') return null;
  const m = archiveUrl.match(/\/player\/([^/]+)\/games\/(\d{4})\/(\d{2})\/?$/i);
  if (!m) return null;
  return {
    username: decodeURIComponent(m[1]).toLowerCase(),
    year: m[2],
    month: m[3],
  };
}

function toMonthKey(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.getFullYear() * 12 + date.getMonth();
}

function endOfDayTimestamp(dateValue) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T23:59:59`);
  return Math.floor(date.getTime() / 1000);
}

function startOfDayTimestamp(dateValue) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T00:00:00`);
  return Math.floor(date.getTime() / 1000);
}

function isInvalidDateOrder(fromDate, toDate) {
  if (!fromDate || !toDate) return false;
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return false;
  return from > to;
}

function archiveMonthKey(archiveUrl) {
  const match = archiveUrl.match(/\/games\/(\d{4})\/(\d{2})\/?$/);
  if (!match) return null;
  return Number(match[1]) * 12 + (Number(match[2]) - 1);
}

function mapAxiosChessError(err, fallbackLabel) {
  const status = err.response?.status;
  const serverMsg = err.response?.data?.error;
  if (status === 404) {
    if (serverMsg) return new Error(serverMsg);
    return new Error(
      'Chess.com returned 404: no public player exists for this username. Confirm the handle at https://www.chess.com/member/<username> (must match Chess.com exactly).',
    );
  }
  if (serverMsg) return new Error(serverMsg);
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return new Error(
      `Could not reach the app server at ${API_BASE_URL}. Start the backend or set VITE_API_BASE_URL in frontend/.env so Chess.com data can be loaded securely.`,
    );
  }
  return new Error(`${fallbackLabel} (${status || err.message || 'unknown'}).`);
}

/** Lists monthly archive URLs via backend proxy → Chess.com PubAPI …/games/archives */
export async function fetchArchives(username) {
  const cleanUsername = normalizeChessComHandle(username);
  if (!cleanUsername) return [];

  try {
    const { data } = await api.get(`chesscom/player/${encodeURIComponent(cleanUsername)}/games/archives`);
    return data.archives || [];
  } catch (err) {
    throw mapAxiosChessError(err, 'Chess.com archive fetch failed');
  }
}

/** Loads one month of games via backend proxy → Chess.com PubAPI …/games/{YYYY}/{MM} */
export async function fetchMonthlyGames(archiveUrl) {
  const parsed = parseMonthlyArchiveUrl(archiveUrl);
  if (!parsed) {
    throw new Error('Unrecognized Chess.com archive URL. Expected …/player/{user}/games/{YYYY}/{MM}.');
  }

  const { username, year, month } = parsed;
  try {
    const { data } = await api.get(
      `chesscom/player/${encodeURIComponent(username)}/games/${year}/${month}`,
    );
    return Array.isArray(data?.games) ? data.games : [];
  } catch (err) {
    throw mapAxiosChessError(err, `Chess.com games fetch failed for ${year}/${month}`);
  }
}

/** YYYY/MM label for progress text from a Chess.com monthly archive URL. */
export function archiveLabel(archiveUrl) {
  const match = archiveUrl.match(/\/games\/(\d{4})\/(\d{2})\/?$/);
  return match ? `${match[1]}/${match[2]}` : 'month';
}

/**
 * Full pipeline for one Chess.com account: archives → monthly games → normalize →
 * filter by end_time → organizeAchievements. `onProgress` receives status strings.
 */
export async function fetchAndOrganizeForUsername(username, fromDate, effectiveToDate, onProgress) {
  const u = normalizeChessComHandle(username);
  if (!u) throw new Error('Missing or invalid Chess.com username.');

  if (isInvalidDateOrder(fromDate, effectiveToDate)) {
    throw new Error('From date cannot be after To date.');
  }

  const report = typeof onProgress === 'function' ? onProgress : () => {};

  report(`[${u}] Fetching archives…`);
  const archives = await fetchArchives(u);
  const filteredArchives = filterArchivesByDate(archives, fromDate, effectiveToDate);
  if (!filteredArchives.length) {
    throw new Error('No archive months were found for the selected date range.');
  }

  const monthlyGames = [];
  for (const archiveUrl of filteredArchives) {
    report(`[${u}] Fetching games for ${archiveLabel(archiveUrl)}…`);
    const games = await fetchMonthlyGames(archiveUrl);
    monthlyGames.push(...games);
  }

  report(`[${u}] Organizing achievements…`);
  const normalizedGames = filterGamesByDate(
    monthlyGames
      .map((game) => normalizeGame(game, u))
      .filter(Boolean),
    fromDate,
    effectiveToDate,
  );

  if (!normalizedGames.length) {
    throw new Error('No games found for this player in the selected date range.');
  }

  return organizeAchievements(normalizedGames);
}

/**
 * Keeps only monthly archive URLs whose YYYY/MM falls inside the inclusive month
 * range implied by fromDate / toDate. Missing fromDate means “from the beginning”;
 * missing toDate should be handled by the caller (e.g. default to today) so we do
 * not pull months after the intended window.
 */
export function filterArchivesByDate(archives, fromDate, toDate) {
  const fromMonth = toMonthKey(fromDate);
  const toMonth = toMonthKey(toDate);

  return archives.filter((archiveUrl) => {
    const monthKey = archiveMonthKey(archiveUrl);
    if (monthKey === null) return false;
    if (fromMonth !== null && monthKey < fromMonth) return false;
    if (toMonth !== null && monthKey > toMonth) return false;
    return true;
  });
}

/**
 * Heuristic sacrifice detector from PGN text/comments. Monthly PubAPI JSON has no
 * structured “sacrifice” flags — we infer from prose comments and a narrow class of
 * annotated Greek-gift–style captures on the h-file so random “!!” brilliant marks
 * do not count as sacrifices (those stay in detectBrilliantMove).
 */
export function detectSacrifice(pgn = '') {
  if (!pgn) return false;
  if (/\b(sac|sacrifice)\b/i.test(pgn)) return true;
  const hFileCaptureAnnotated = /\b[BNRQ]xh[1-8](?:[+#]{1,2})?\s*(?:!!|!\?)/i;
  if (hFileCaptureAnnotated.test(pgn)) return true;
  const hFileCaptureComment = /\b[BNRQ]xh[1-8][^\n{]*\{[^}]*\b(sac|sacrifice)\b[^}]*\}/i;
  return hFileCaptureComment.test(pgn);
}

/**
 * Heuristic brilliant-move detector. Chess.com does not expose per-move brilliant
 * metadata in monthly `games[]` payloads, so we match common comment strings and
 * informant-style “!!” that often (not always) denote brilliancies in exports.
 */
export function detectBrilliantMove(pgn = '') {
  return /brilliant|!!/i.test(pgn);
}

/** PubAPI player block: prefer `username`, else parse handle from `@id` URL. */
function pubSideHandle(side) {
  if (!side || typeof side !== 'object') return '';
  const u = side.username;
  if (u != null && String(u).trim()) return String(u).trim().toLowerCase();
  const atId = side['@id'];
  if (typeof atId === 'string') {
    const m = atId.match(/\/player\/([^/]+)\/?$/i);
    if (m) {
      try {
        return decodeURIComponent(m[1]).toLowerCase();
      } catch {
        return m[1].toLowerCase();
      }
    }
  }
  return '';
}

/** Match PGN `[White "…"]` / `[Black "…"]` when JSON sides omit `username`. */
function playerColorFromPgnHeaders(pgn, cleanUsername) {
  if (!pgn || !cleanUsername) return null;
  const wm = pgn.match(/\[White\s*"([^"]*)"\]/i);
  const bm = pgn.match(/\[Black\s*"([^"]*)"\]/i);
  const w = normalizeChessComHandle(wm?.[1] ?? '');
  const b = normalizeChessComHandle(bm?.[1] ?? '');
  if (w === cleanUsername) return 'white';
  if (b === cleanUsername) return 'black';
  return null;
}

/**
 * Maps one PubAPI `games[]` entry into our normalized row. Returns `null` when the
 * requested username cannot be matched to White or Black (JSON + PGN headers): guessing
 * a color would corrupt wins, streaks, and sacrifice/brilliant flags tied to the player.
 */
export function normalizeGame(game, username) {
  const cleanUsername = normalizeChessComHandle(username);
  if (!cleanUsername) return null;

  const whiteHandle = pubSideHandle(game.white);
  const blackHandle = pubSideHandle(game.black);
  let playerColor =
    whiteHandle === cleanUsername ? 'white'
    : blackHandle === cleanUsername ? 'black'
    : null;
  if (!playerColor) {
    playerColor = playerColorFromPgnHeaders(game.pgn || '', cleanUsername);
  }
  if (!playerColor) return null;

  const player = playerColor === 'white' ? game.white : game.black;
  const opponent = playerColor === 'white' ? game.black : game.white;
  if (!player || typeof player !== 'object') return null;
  const endTime = Number(game.end_time) || 0;
  const hasSacrifice = detectSacrifice(game.pgn || '');
  const hasBrilliantMove = detectBrilliantMove(game.pgn || '');

  const ecoUrl = typeof game.eco === 'string' ? game.eco : '';

  return {
    uuid: game.uuid || game.url,
    url: game.url,
    pgn: game.pgn || '',
    endTime,
    date: endTime ? new Date(endTime * 1000).toLocaleDateString() : 'Unknown',
    timeClass: game.time_class || 'unknown',
    timeControl: game.time_control || 'unknown',
    rated: Boolean(game.rated),
    rules: game.rules || 'chess',
    ecoUrl,
    playerColor,
    playerUsername: player?.username || cleanUsername,
    opponentUsername: opponent?.username || 'Unknown',
    playerRating: player?.rating ?? '-',
    opponentRating: opponent?.rating ?? '-',
    playerResult: player?.result || 'unknown',
    opponentResult: opponent?.result || 'unknown',
    isWin: player?.result === 'win',
    hasSacrifice,
    hasBrilliantMove,
  };
}

export function isPlayerWin(game) {
  return Boolean(game && game.playerResult === 'win');
}

/** Filters normalized games by Unix end_time against optional calendar from/to (inclusive days). */
export function filterGamesByDate(games, fromDate, toDate) {
  const fromTimestamp = startOfDayTimestamp(fromDate);
  const toTimestamp = endOfDayTimestamp(toDate);

  return games.filter((game) => {
    if (!game || !game.endTime) return false;
    if (fromTimestamp !== null && game.endTime < fromTimestamp) return false;
    if (toTimestamp !== null && game.endTime > toTimestamp) return false;
    return true;
  });
}

/**
 * Win streaks (length >= 2). Games are sorted oldest → newest by `endTime` so a streak
 * follows real-world sequence; a loss, draw, timeout, etc. breaks the chain before we
 * emit a streak object.
 */
export function calculateWinStreaks(games) {
  const sortedGames = [...games].sort((a, b) => a.endTime - b.endTime);
  const streaks = [];
  let currentStreak = [];

  // Any non-win result resets the achievement run, so draws, losses, timeouts,
  // resignations, and abandoned games all break a streak.
  sortedGames.forEach((game) => {
    if (isPlayerWin(game)) {
      currentStreak.push(game);
      return;
    }

    if (currentStreak.length >= 2) {
      streaks.push({
        id: `${currentStreak[0].uuid}-${currentStreak[currentStreak.length - 1].uuid}`,
        length: currentStreak.length,
        startDate: currentStreak[0].date,
        endDate: currentStreak[currentStreak.length - 1].date,
        games: currentStreak,
      });
    }
    currentStreak = [];
  });

  if (currentStreak.length >= 2) {
    streaks.push({
      id: `${currentStreak[0].uuid}-${currentStreak[currentStreak.length - 1].uuid}`,
      length: currentStreak.length,
      startDate: currentStreak[0].date,
      endDate: currentStreak[currentStreak.length - 1].date,
      games: currentStreak,
    });
  }

  return streaks;
}

/**
 * Builds all derived achievement views from one normalized game list (no null entries).
 * `allGames` is newest-first for browsing; streak math uses chronological order inside
 * calculateWinStreaks. Sacrifice/brilliant streaks are win streaks (length >= 2) where
 * at least one game in the run matched the respective PGN heuristic.
 */
export function organizeAchievements(games) {
  const winStreaks = calculateWinStreaks(games);
  const sacrificeStreaks = winStreaks.filter((streak) => streak.games.some((game) => game.hasSacrifice));
  const brilliantStreaks = winStreaks.filter((streak) => streak.games.some((game) => game.hasBrilliantMove));

  const allGames = [...games].sort((a, b) => b.endTime - a.endTime);

  return {
    allGames,
    winStreaks,
    sacrificeStreaks,
    brilliantStreaks,
    summary: {
      totalGames: games.length,
      totalWins: games.filter(isPlayerWin).length,
      bestWinStreak: winStreaks.reduce((best, streak) => Math.max(best, streak.length), 0),
      sacrificeStreaks: sacrificeStreaks.length,
      brilliantStreaks: brilliantStreaks.length,
    },
  };
}

export function saveAchievementsCache(payload) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

export function loadAchievementsCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}
