import { describe, it, expect } from 'vitest';
import {
  normalizeChessComHandle,
  parseMonthlyArchiveUrl,
  detectSacrifice,
  detectBrilliantMove,
  normalizeGame,
  calculateWinStreaks,
} from './achievementsApi.js';

describe('normalizeChessComHandle', () => {
  it('strips @ and lowercases', () => {
    expect(normalizeChessComHandle('@Hikaru')).toBe('hikaru');
  });
});

describe('parseMonthlyArchiveUrl', () => {
  it('extracts username, year, month from Chess.com archive URL', () => {
    const url = 'https://api.chess.com/pub/player/Some_User/games/2024/08';
    expect(parseMonthlyArchiveUrl(url)).toEqual({
      username: 'some_user',
      year: '2024',
      month: '08',
    });
  });
});

describe('detectSacrifice', () => {
  it('detects annotated Greek-gift style Bxh7!!', () => {
    expect(detectSacrifice('1. Bxh7!!')).toBe(true);
  });

  it('returns false for normal development without sac markers', () => {
    expect(detectSacrifice('1. e4 e5 2. Nf3 Nc6')).toBe(false);
  });
});

describe('detectBrilliantMove', () => {
  it('detects !! in movetext', () => {
    expect(detectBrilliantMove('1. Qh5!!')).toBe(true);
  });
});

describe('normalizeGame', () => {
  it('returns null when username cannot be matched to either side', () => {
    const game = {
      white: { username: 'alice', result: 'win', rating: 100 },
      black: { username: 'bob', result: 'lose', rating: 100 },
      pgn: '[White "alice"]\n[Black "bob"]\n1. e4 e5',
      end_time: 1700000000,
    };
    expect(normalizeGame(game, 'charlie')).toBe(null);
  });
});

describe('calculateWinStreaks', () => {
  function mk(uuid, endTime, playerResult) {
    return {
      uuid,
      endTime,
      date: '2024-01-01',
      playerResult,
      hasSacrifice: false,
      hasBrilliantMove: false,
    };
  }

  it('returns only streaks of length >= 2', () => {
    expect(calculateWinStreaks([mk('a', 1, 'win'), mk('b', 2, 'lose'), mk('c', 3, 'win')])).toEqual([]);
    const two = calculateWinStreaks([mk('a', 1, 'win'), mk('b', 2, 'win')]);
    expect(two).toHaveLength(1);
    expect(two[0].length).toBe(2);
  });

  it('breaks streak on loss', () => {
    const streaks = calculateWinStreaks([
      mk('a', 1, 'win'),
      mk('b', 2, 'win'),
      mk('c', 3, 'lose'),
      mk('d', 4, 'win'),
      mk('e', 5, 'win'),
      mk('f', 6, 'win'),
    ]);
    expect(streaks).toHaveLength(2);
    expect(streaks[0].length).toBe(2);
    expect(streaks[1].length).toBe(3);
  });

  it('breaks streak on non-win (e.g. draw)', () => {
    const streaks = calculateWinStreaks([
      mk('a', 1, 'win'),
      mk('b', 2, 'win'),
      mk('c', 3, 'repetition'),
      mk('d', 4, 'win'),
      mk('e', 5, 'win'),
    ]);
    expect(streaks).toHaveLength(1);
    expect(streaks[0].length).toBe(2);
  });
});
