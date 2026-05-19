import * as service from '../services/chessComService.js';
import { query } from '../data/database.js';

/** Align DB `Chess_com_ID` values with Chess.com PubAPI (trim, URLs, @, decode). */
function normalizeChessComPubUsername(raw) {
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
 * Proxy: GET https://api.chess.com/pub/player/{username}/games/archives
 * (Browser calls are unreliable for PubAPI; server sends a proper User-Agent.)
 */
export const getPlayerGameArchives = async (req, res) => {
  const username = normalizeChessComPubUsername(req.params.username);
  if (!username) return res.status(400).json({ error: 'Username is required' });

  const url = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`;
  const result = await service.fetchChessComJson(url, { timeoutMs: 30000 });

  if (!result.ok) {
    if (result.status === 404) {
      return res.status(404).json({
        error: `Chess.com has no public player "${username}" (404). Use the exact username from the profile URL (chess.com/member/…), not a display name or internal ID.`,
        chessComStatus: 404,
        username,
      });
    }
    const status = 502;
    return res.status(status).json({ error: result.error || 'Chess.com request failed' });
  }
  return res.json(result.data);
};

/**
 * Proxy: GET https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}
 */
export const getPlayerMonthlyGamesJson = async (req, res) => {
  const username = normalizeChessComPubUsername(req.params.username);
  const { year, month } = req.params;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  const y = parseInt(year, 10);
  const mo = parseInt(month, 10);
  if (y < 1970 || y > 2100 || mo < 1 || mo > 12) {
    return res.status(400).json({ error: 'Invalid year or month range' });
  }

  const mm = String(mo).padStart(2, '0');
  const url = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${year}/${mm}`;
  const result = await service.fetchChessComJson(url, { timeoutMs: 45000 });

  if (!result.ok) {
    if (result.status === 404) {
      return res.status(404).json({
        error: `Chess.com has no games archive for "${username}" in ${year}/${mm} (404).`,
        chessComStatus: 404,
        username,
      });
    }
    return res.status(502).json({ error: result.error || 'Chess.com request failed' });
  }
  return res.json(result.data);
};

export const fetchPlayerDate = async (req, res) => {
  const { id, date: inputDate } = req.body;
  const chessComId = id; // Accept 'id' from old working code
  
  if (!chessComId || !inputDate) return res.status(400).json({ ok: false, error: 'Missing id or date' });

  const dateKey = service.normalizeDateInput(inputDate);
  if (!dateKey) return res.status(400).json({ ok: false, error: 'Invalid date format. Expected YYYY-MM-DD.' });

  try {
    const [yyyy, mm] = dateKey.split('-');
    const mmPadded = service.monthPad(mm);
    
    // Use robust fetch
    const url = `https://api.chess.com/pub/player/${chessComId}/games/${yyyy}/${mmPadded}`;
    console.log('[Chess.com Fetch URL]', url);
    
    const result = await service.fetchChessComJson(url);
    if (!result.ok) {
      return res.status(result.status || 500).json({ 
        ok: false, 
        error: result.error,
        url: result.url 
      });
    }

    const data = result.data;
    const games = (data.games || []).filter(g => g.end_time);
    
    // PRESERVE OLD BUSINESS LOGIC EXACTLY
    const gamesOnDate = games.filter(g => {
      const gameDate = new Date(g.end_time * 1000);
      return service.formatDate(gameDate) === dateKey && g.rated === true;
    });

    // 1. Get current tracker
    const { rows } = await query('SELECT "activity_tracker" FROM public.players WHERE "Chess_com_ID" = $1', [chessComId]);
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Player not found' });
    
    let tracker = typeof rows[0].activity_tracker === 'string' ? JSON.parse(rows[0].activity_tracker) : rows[0].activity_tracker;
    if (!tracker) tracker = {};
    if (!tracker[dateKey]) tracker[dateKey] = {};

    const entry = tracker[dateKey];

    if (gamesOnDate.length === 0) {
      entry.total_games = 0;
      entry.types = { Blitz: {}, Rapid: {} };
    } else {
      let blitzRatings = [], rapidRatings = [];
      gamesOnDate.forEach(g => {
        if (g.time_class === 'blitz') {
          if (g.white?.username?.toLowerCase() === chessComId.toLowerCase()) blitzRatings.push(g.white.rating);
          else if (g.black?.username?.toLowerCase() === chessComId.toLowerCase()) blitzRatings.push(g.black.rating);
        }
        if (g.time_class === 'rapid') {
          if (g.white?.username?.toLowerCase() === chessComId.toLowerCase()) rapidRatings.push(g.white.rating);
          else if (g.black?.username?.toLowerCase() === chessComId.toLowerCase()) rapidRatings.push(g.black.rating);
        }
      });
      
      entry.total_games = gamesOnDate.length;
      entry.types = {
        Blitz: {
          ratings: blitzRatings,
          last_rating: blitzRatings.length ? blitzRatings[blitzRatings.length - 1] : null
        },
        Rapid: {
          ratings: rapidRatings,
          last_rating: rapidRatings.length ? rapidRatings[rapidRatings.length - 1] : null
        }
      };
    }

    if (!service.isToday(dateKey)) entry.lock = true;

    // Update database matching by "Chess_com_ID"
    await query('UPDATE public.players SET activity_tracker = $1 WHERE "Chess_com_ID" = $2', [JSON.stringify(tracker), chessComId]);

    res.json({ ok: true, chessComId, date: dateKey, activity: entry });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const fetchPlayerMonth = async (req, res) => {
  const { chessComId, year, month } = req.body;
  if (!chessComId || !year || !month) return res.status(400).json({ ok: false, error: 'Missing params' });

  try {
    const { games } = await service.fetchChessComMonthlyGames(chessComId, year, month);
    const processed = service.processGames(games, chessComId);
    const grouped = service.groupGamesByDate(processed);
    
    const dates = Object.keys(grouped);
    for (const date of dates) {
      await Promise.all([
        service.upsertPlayerActivity(chessComId, date, grouped[date]),
        service.upsertPlayerGames(chessComId, processed.filter(g => g.date === date)),
        service.updatePlayerTracker(chessComId, date, grouped[date])
      ]);
    }

    res.json({ ok: true, chessComId, updated_dates: dates.length, activity: grouped });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const autoCompleteActivity = async (req, res) => {
  const results = {
    ok: true,
    message: "Automation complete",
    scannedPlayers: 0,
    playersWithTracker: 0,
    attemptedDates: 0,
    updatedCount: 0,
    skippedCount: 0,
    errorsCount: 0,
    errors: [],
    skipped: []
  };

  try {
    const playersRes = await query('SELECT "Chess_com_ID", activity_tracker FROM public.players WHERE "Chess_com_ID" IS NOT NULL AND "Chess_com_ID" != \'\'');
    results.scannedPlayers = playersRes.rows.length;

      for (const player of playersRes.rows) {
        const chessId = (player.Chess_com_ID || '').trim();
        if (!chessId) {
          results.skipped.push({ player: 'N/A', reason: 'Empty Chess.com ID' });
          results.skippedCount++;
          continue;
        }

        let tracker = player.activity_tracker;
        if (typeof tracker === 'string') {
          try {
            tracker = JSON.parse(tracker);
          } catch (e) {
            results.skipped.push({ player: chessId, reason: 'Invalid activity_tracker JSON' });
            results.skippedCount++;
            continue;
          }
        }

        if (!tracker || typeof tracker !== 'object') {
          results.skipped.push({ player: chessId, reason: 'Missing activity_tracker' });
          results.skippedCount++;
          continue;
        }

        let needsUpdate = false;
        const datesInTracker = Object.keys(tracker);
        
        // If tracker is empty, we might want to sync today as a default
        if (datesInTracker.length === 0) {
          const today = service.formatDate(new Date());
          tracker[today] = { lock: false };
          datesInTracker.push(today);
        }

        results.playersWithTracker++;

        for (const dateKey of datesInTracker) {
          const entry = tracker[dateKey];
          if (entry && entry.lock === false) {
            results.attemptedDates++;
            
            const [yyyy, mm] = dateKey.split('-');
            const mmPadded = service.monthPad(mm);
            const url = `https://api.chess.com/pub/player/${chessId}/games/${yyyy}/${mmPadded}`;
            
            try {
              // Add delay before each Chess.com call for the same player (if multiple months)
              // but mostly between players in the outer loop
              const result = await service.fetchChessComJson(url);
              
              if (!result.ok) {
                throw new Error(result.error || `Chess.com API error ${result.status}`);
              }

              const data = result.data;
              const games = (data.games || []).filter(g => g.end_time);
              
              // PRESERVE OLD BUSINESS LOGIC EXACTLY
              const gamesOnDate = games.filter(g => {
                const gameDate = new Date(g.end_time * 1000);
                return service.formatDate(gameDate) === dateKey && g.rated === true;
              });

              if (gamesOnDate.length === 0) {
                entry.total_games = 0;
                entry.types = { Blitz: {}, Rapid: {} };
              } else {
                let blitzRatings = [], rapidRatings = [];
                gamesOnDate.forEach(g => {
                  const lowerId = chessId.toLowerCase();
                  if (g.time_class === 'blitz') {
                    if (g.white?.username?.toLowerCase() === lowerId) blitzRatings.push(g.white.rating);
                    else if (g.black?.username?.toLowerCase() === lowerId) blitzRatings.push(g.black.rating);
                  }
                  if (g.time_class === 'rapid') {
                    if (g.white?.username?.toLowerCase() === lowerId) rapidRatings.push(g.white.rating);
                    else if (g.black?.username?.toLowerCase() === lowerId) rapidRatings.push(g.black.rating);
                  }
                });
                
                entry.total_games = gamesOnDate.length;
                entry.types = {
                  Blitz: {
                    ratings: blitzRatings,
                    last_rating: blitzRatings.length ? blitzRatings[blitzRatings.length - 1] : null
                  },
                  Rapid: {
                    ratings: rapidRatings,
                    last_rating: rapidRatings.length ? rapidRatings[rapidRatings.length - 1] : null
                  }
                };
              }

              if (!service.isToday(dateKey)) entry.lock = true;
              needsUpdate = true;
              results.updatedCount++;

              // 800ms delay between multiple Chess.com calls for the same player
              await service.sleep(800);

            } catch (err) {
              results.errors.push({ 
                player: chessId, 
                date: dateKey, 
                reason: err.message,
                url: url
              });
              results.errorsCount++;
              
              // Store error in tracker for visibility
              entry.error = err.message;
              entry.last_attempt = new Date().toISOString();
              needsUpdate = true;
            }
          }
        }

        if (needsUpdate) {
          await query('UPDATE public.players SET activity_tracker = $1 WHERE "Chess_com_ID" = $2', [JSON.stringify(tracker), chessId]);
        }

        // 1.2 seconds delay between players
        await service.sleep(1200);
      }

    res.json(results);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const getPlayerActivity = async (req, res) => {
  const { chessComId } = req.params;
  try {
    const [playerRes, activityRes] = await Promise.all([
      query('SELECT * FROM public.players WHERE "Chess_com_ID" = $1', [chessComId]),
      query('SELECT * FROM public.players_activity WHERE "Chess_com_ID" = $1 ORDER BY date DESC', [chessComId])
    ]);

    if (playerRes.rows.length === 0) return res.status(404).json({ error: 'Player not found' });

    res.json({
      chessComId,
      playerName: playerRes.rows[0].Player_Name,
      activityTracker: playerRes.rows[0].activity_tracker,
      activityRows: activityRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const debugProfileSync = async (req, res) => {
  const { chessComId } = req.body;
  if (!chessComId) return res.status(400).json({ ok: false, error: 'Missing chessComId' });

  try {
    const result = await service.syncOneChessComPlayer({ Chess_com_ID: chessComId });
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const debugFetch = async (req, res) => {
  const { chessComId, date: inputDate } = req.body;
  const debug = [];
  
  const date = service.normalizeDateInput(inputDate);
  if (!date) {
    debug.push(`ERROR: Invalid date format: ${inputDate}`);
    return res.json({ ok: false, error: 'Invalid date format. Expected YYYY-MM-DD.', debug });
  }

  try {
    debug.push(`Starting debug fetch for player: ${chessComId} on date: ${date}`);
    const [year, month] = date.split('-');
    
    const url = service.getChessComMonthlyGamesUrl(chessComId, year, month);
    debug.push(`Target URL: ${url}`);
    console.log("[Chess.com Debug URL]", url);

    try {
      debug.push(`Calling Chess.com API...`);
      const { games } = await service.fetchChessComMonthlyGames(chessComId, year, month);
      debug.push(`SUCCESS: Found ${games?.length || 0} raw games in month ${year}-${month}.`);

      const processed = service.processGames(games || [], chessComId);
      debug.push(`Processing: Found ${processed.length} rated games with valid end_time.`);

      const onDate = processed.filter(g => {
        if (!g.end_time) return false;
        const gameDate = new Date(g.end_time * 1000).toISOString().slice(0, 10);
        return gameDate === date;
      });
      debug.push(`Filter: Found ${onDate.length} rated games on specific date ${date}.`);

      if (onDate.length > 0) {
        const grouped = service.groupGamesByDate(onDate);
        const activity = grouped[date];
        debug.push(`Activity Summary: Total ${activity.total_games} games.`);
        debug.push(`- Blitz: ${activity.types.Blitz.ratings.length} games. Last Elo: ${activity.types.Blitz.ratings[activity.types.Blitz.ratings.length - 1] || 'N/A'}`);
        debug.push(`- Rapid: ${activity.types.Rapid.ratings.length} games. Last Elo: ${activity.types.Rapid.ratings[activity.types.Rapid.ratings.length - 1] || 'N/A'}`);
        
        debug.push(`DB: Upserting player activity into players_activity table...`);
        await service.upsertPlayerActivity(chessComId, date, activity);
        
        debug.push(`DB: Upserting raw games into player_games table...`);
        await service.upsertPlayerGames(chessComId, onDate);
        
        debug.push(`DB: Updating activity_tracker in players table...`);
        await service.updatePlayerTracker(chessComId, date, activity);
        
        debug.push(`DONE: Database updated successfully.`);
      } else {
        debug.push(`SKIP: No rated games found for player ${chessComId} on ${date}.`);
        debug.push(`Action: Marking date as processed in tracker with 0 games.`);
        
        const emptyActivity = { 
          total_games: 0, 
          types: { 
            Blitz: { ratings: [], results: [], times: [] }, 
            Rapid: { ratings: [], results: [], times: [] } 
          } 
        };
        await service.updatePlayerTracker(chessComId, date, emptyActivity);
        await service.upsertPlayerActivity(chessComId, date, emptyActivity);
      }

      res.json({ ok: true, debug });
    } catch (apiErr) {
      debug.push(`ERROR: Chess.com API failed with status ${apiErr.status || 'unknown'}`);
      debug.push(`Reason: ${apiErr.message}`);
      if (apiErr.url) debug.push(`Failed URL: ${apiErr.url}`);
      if (apiErr.body) debug.push(`Response Body: ${apiErr.body}`);
      res.json({ ok: false, error: apiErr.message, debug });
    }
  } catch (err) {
    debug.push(`FATAL ERROR: ${err.message}`);
    res.json({ ok: false, error: err.message, debug });
  }
};
