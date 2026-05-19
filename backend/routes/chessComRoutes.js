import express from 'express';
import * as controller from '../controllers/chessComController.js';

const router = express.Router();

// Published-data (read-only) game archives — must use same paths as Chess.com PubAPI
router.get('/player/:username/games/archives', controller.getPlayerGameArchives);
router.get('/player/:username/games/:year/:month', controller.getPlayerMonthlyGamesJson);

router.post('/fetch-player-date', controller.fetchPlayerDate);
router.post('/fetch-player-month', controller.fetchPlayerMonth);
router.post('/auto-complete-activity', controller.autoCompleteActivity);
router.get('/player/:chessComId/activity', controller.getPlayerActivity);
router.post('/debug-profile-sync', controller.debugProfileSync);
router.post('/debug-fetch', controller.debugFetch);

export default router;
