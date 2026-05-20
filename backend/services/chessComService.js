import fetch from 'node-fetch';
import https from 'https';
import { query } from '../data/database.js';

const CHESS_COM_BASE_URL = 'https://api.chess.com/pub';
const USER_AGENT = 'ChessByPanchatantra/1.0 (contact: info@cliosgambit.com)';

// Use a shared agent for all requests to reuse connections
const agent = new https.Agent({
  keepAlive: true,
  timeout: 60000
});

export const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

export function isValidIsoDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export function normalizeDateInput(dateStr) {
  if (!dateStr) return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // Convert DD-MM-YYYY to YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [dd, mm, yyyy] = dateStr.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

export const isToday = (dateStr) => {
  return formatDate(new Date()) === dateStr;
};

export const monthPad = (month) => {
  return String(month).padStart(2, '0');
};

export const getChessComProfileUrl = (chessComId) => {
  const username = String(chessComId).trim().toLowerCase();
  return `${CHESS_COM_BASE_URL}/player/${encodeURIComponent(username)}`;
};

export const getChessComStatsUrl = (chessComId) => {
  const username = String(chessComId).trim().toLowerCase();
  return `${CHESS_COM_BASE_URL}/player/${encodeURIComponent(username)}/stats`;
};

export const getChessComMonthlyGamesUrl = (chessComId, year, month) => {
  const username = String(chessComId).trim().toLowerCase();
  const yyyy = String(year);
  const mm = String(month).padStart(2, "0");

  return `${CHESS_COM_BASE_URL}/player/${encodeURIComponent(username)}/games/${yyyy}/${mm}`;
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function unixToDateOnly(unixSeconds) {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

export function extractChessData(profile, stats) {
  const rapidRating = stats?.chess_rapid?.last?.rating ?? null;
  const rapidBest = stats?.chess_rapid?.best?.rating ?? null;

  const blitzRating = stats?.chess_blitz?.last?.rating ?? null;
  const blitzBest = stats?.chess_blitz?.best?.rating ?? null;

  const bulletRating = stats?.chess_bullet?.last?.rating ?? null;
  const bulletBest = stats?.chess_bullet?.best?.rating ?? null;

  const fideRating = stats?.fide ?? null;
  const tacticsHighest = stats?.tactics?.highest?.rating ?? null;
  const puzzleRushBest = stats?.puzzle_rush?.best?.score ?? null;

  const currentRatings = [
    rapidRating,
    blitzRating,
    bulletRating
  ].filter(rating => typeof rating === 'number');

  const currentElo = currentRatings.length ? Math.max(...currentRatings) : null;

  return {
    playerName: profile?.name || null,
    joiningDate: unixToDateOnly(profile?.joined),
    currentElo,

    chessProfileUrl: profile?.url || null,
    chessCountryUrl: profile?.country || null,

    rapidRating,
    rapidBest,
    blitzRating,
    blitzBest,
    bulletRating,
    bulletBest,

    fideRating,
    tacticsHighest,
    puzzleRushBest
  };
}

export const fetchChessComJson = async (url, options = {}) => {
  const {
    retries = 3,
    timeoutMs = 15000,
    retryDelayMs = 1500,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[Chess.com] Fetch attempt ${attempt}/${retries}: ${url}`);

      const response = await fetch(url, {
        signal: controller.signal,
        agent,
        headers: {
          "User-Agent": "Chess-by-Panchatantra/1.0 (educational chess dashboard; contact: admin@chessbypanchatantra.com)",
          "Accept": "application/json",
          "Cache-Control": "no-cache"
        }
      });

      const text = await response.text();
      clearTimeout(timeout);

      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }

      if (response.status === 404) {
        return {
          ok: false,
          status: 404,
          data: null,
          error: "Chess.com user not found",
          url
        };
      }

      if (response.status === 429) {
        lastError = new Error("Chess.com rate limit reached");
        lastError.status = 429;
        lastError.body = body;
      } else if (!response.ok) {
        lastError = new Error(`Chess.com API error ${response.status}`);
        lastError.status = response.status;
        lastError.body = body;
      } else {
        return {
          ok: true,
          status: response.status,
          data: body,
          error: null,
          url
        };
      }
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      console.error(`[Chess.com] Attempt ${attempt} failed:`, err.message);
    }

    if (attempt < retries && lastError?.status !== 404) {
      const delay = retryDelayMs * attempt;
      console.log(`[Chess.com] Retrying in ${delay}ms...`);
      await sleep(delay);
    } else if (lastError?.status === 404) {
      break;
    }
  }

  return {
    ok: false,
    status: lastError?.status || 0,
    data: null,
    error: lastError?.message || "Unknown Chess.com fetch error",
    body: lastError?.body || null,
    url
  };
};

export const syncOneChessComPlayer = async (user) => {
  const rawId = user.Chess_com_ID;
  const username = String(rawId || "").trim().toLowerCase();

  if (!username) {
    return {
      ok: false,
      skipped: true,
      player: rawId,
      reason: "Missing Chess.com ID"
    };
  }

  const profileUrl = getChessComProfileUrl(username);
  const statsUrl = getChessComStatsUrl(username);

  const profileResult = await fetchChessComJson(profileUrl, {
    retries: 3,
    timeoutMs: 15000,
    retryDelayMs: 2000
  });

  // Wait before stats request
  await sleep(800);

  const statsResult = await fetchChessComJson(statsUrl, {
    retries: 3,
    timeoutMs: 15000,
    retryDelayMs: 2000
  });

  if (!profileResult.ok && !statsResult.ok) {
    return {
      ok: false,
      player: rawId,
      username,
      reason: "Both profile and stats fetch failed",
      profileError: profileResult.error,
      statsError: statsResult.error,
      profileStatus: profileResult.status,
      statsStatus: statsResult.status,
      profileUrl,
      statsUrl
    };
  }

  const profile = profileResult.data || {};
  const stats = statsResult.data || {};

  const currentElo = 
    stats?.chess_rapid?.last?.rating || 
    stats?.chess_blitz?.last?.rating || 
    stats?.chess_bullet?.last?.rating || 
    0;

  return {
    ok: true,
    player: rawId,
    username,
    profile,
    stats,
    currentElo,
    profileWarning: profileResult.ok ? null : profileResult.error,
    statsWarning: statsResult.ok ? null : statsResult.error
  };
};

export const fetchChessComMonthlyGames = async (chessComId, year, month) => {
  const url = getChessComMonthlyGamesUrl(chessComId, year, month);
  const result = await fetchChessComJson(url);
  if (!result.ok) throw new Error(result.error);
  return result.data;
};

export const processGames = (games, chessComId) => {
  const lowerChessId = chessComId.toLowerCase();
  
  return games
    .filter(g => g.end_time && g.rated)
    .map(g => {
      const isWhite = g.white.username.toLowerCase() === lowerChessId;
      const playerSide = isWhite ? g.white : g.black;
      const opponentSide = isWhite ? g.black : g.white;
      
      return {
        game_id: `${g.end_time}_${lowerChessId}`,
        url: g.url,
        end_time: g.end_time,
        date: formatDate(new Date(g.end_time * 1000)),
        time_class: g.time_class,
        player_rating: playerSide.rating,
        opponent_rating: opponentSide.rating,
        result: playerSide.result,
        white_player: g.white.username,
        black_player: g.black.username,
        pgn: g.pgn
      };
    });
};

export const groupGamesByDate = (processedGames) => {
  const groups = {};
  processedGames.forEach(g => {
    if (!groups[g.date]) {
      groups[g.date] = {
        total_games: 0,
        types: {
          Blitz: { ratings: [], results: [], times: [] },
          Rapid: { ratings: [], results: [], times: [] }
        }
      };
    }
    
    groups[g.date].total_games++;
    const type = g.time_class.charAt(0).toUpperCase() + g.time_class.slice(1);
    if (groups[g.date].types[type]) {
      groups[g.date].types[type].ratings.push(g.player_rating);
      groups[g.date].types[type].results.push(g.result);
      groups[g.date].types[type].times.push(new Date(g.end_time * 1000).toLocaleTimeString());
    }
  });
  return groups;
};

export const upsertPlayerActivity = async (chessComId, date, activity) => {
  const checkRes = await query(
    'SELECT "index" FROM public.players_activity WHERE "Chess_com_ID" = $1 AND date = $2 LIMIT 1',
    [chessComId, date]
  );

  const blitz = activity.types.Blitz;
  const rapid = activity.types.Rapid;
  const lock = !isToday(date);

  if (checkRes.rows.length > 0) {
    await query(
      `UPDATE public.players_activity 
       SET total_games = $1, blitz_rating = $2, rapid_rating = $3, blitz_results = $4, rapid_results = $5, 
           blitz_times = $6, rapid_times = $7, fetch_lock = $8, status = $9
       WHERE "index" = $10`,
      [
        activity.total_games, blitz.ratings, rapid.ratings, blitz.results, rapid.results,
        blitz.times, rapid.times, lock, 'synced', checkRes.rows[0].index
      ]
    );
  } else {
    await query(
      `INSERT INTO public.players_activity 
       ("Chess_com_ID", date, total_games, blitz_rating, rapid_rating, blitz_results, rapid_results, blitz_times, rapid_times, fetch_lock, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        chessComId, date, activity.total_games, blitz.ratings, rapid.ratings, blitz.results, rapid.results,
        blitz.times, rapid.times, lock, 'synced'
      ]
    );
  }
};

export const upsertPlayerGames = async (chessComId, games) => {
  for (const g of games) {
    // Generate a stable numeric ID for game_id if it's a BIGINT
    // end_time is usually ~1716123456 (10 digits)
    // We can add a hash of the URL or just use the end_time + index
    // But since we want to avoid duplicates across different players, 
    // and one game has two players, we should use a unique game identifier if available.
    // Chess.com URLs look like: https://www.chess.com/game/live/10928374655
    const liveMatch = g.url.match(/\/live\/(\d+)/);
    const dailyMatch = g.url.match(/\/daily\/(\d+)/);
    const chessComGameId = liveMatch ? liveMatch[1] : (dailyMatch ? dailyMatch[1] : null);
    
    const gameId = chessComGameId || g.game_id;

    await query(
      `INSERT INTO public.player_games (game_id, chess_com_id, game_date, pgn, white_player, black_player)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (game_id) DO UPDATE SET pgn = EXCLUDED.pgn`,
      [gameId, chessComId, g.date, g.pgn, g.white_player, g.black_player]
    );
  }
};

export const updatePlayerTracker = async (chessComId, date, activity) => {
  const res = await query('SELECT activity_tracker FROM public.players WHERE "Chess_com_ID" = $1', [chessComId]);
  if (res.rows.length === 0) return;

  const tracker = (typeof res.rows[0].activity_tracker === 'string' 
    ? JSON.parse(res.rows[0].activity_tracker) 
    : res.rows[0].activity_tracker) || {};

  tracker[date] = {
    total_games: activity.total_games,
    types: {
      Blitz: {
        ratings: activity.types.Blitz.ratings,
        last_rating: activity.types.Blitz.ratings.length ? activity.types.Blitz.ratings[activity.types.Blitz.ratings.length - 1] : null
      },
      Rapid: {
        ratings: activity.types.Rapid.ratings,
        last_rating: activity.types.Rapid.ratings.length ? activity.types.Rapid.ratings[activity.types.Rapid.ratings.length - 1] : null
      }
    },
    lock: !isToday(date)
  };

  await query('UPDATE public.players SET activity_tracker = $1 WHERE "Chess_com_ID" = $2', [JSON.stringify(tracker), chessComId]);
};
