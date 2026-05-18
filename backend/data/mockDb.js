import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminDashboard, coachDashboard, studentDashboard } from './dashboardData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'appDb.json');

export const storyModulesSeed = [
  {
    id: 'module-1',
    title: 'Foundations of Strategy',
    subtitle: 'Begin your chess journey with Panchatantra lessons on patience, awareness, and planning.',
    description: 'This module introduces the core habits of a thoughtful chess player through classic Panchatantra-inspired stories.',
    icon: '♜',
    level: 'Beginner',
    progress: 62,
    totalChapters: 3,
    totalStories: 9,
    unlocked: true,
    chapters: [
      {
        id: 'chapter-1',
        title: 'Chapter 1: Awareness Before Action',
        subtitle: 'Learn why careful observation comes before every strong move.',
        description: 'Stories and chess examples focused on board awareness, threats, and avoiding impulsive decisions.',
        progress: 80,
        totalStories: 3,
        stories: [
          { id: 'story-brahmin-mongoose', title: 'The Brahmin and the Mongoose', subtitle: 'Think before you strike.', tags: ['Tactics', 'Awareness'], progress: 100, status: 'completed', lesson: 'Never move without checking the full board.', chessConcept: 'Blunder prevention and threat detection', body: 'A loyal mongoose saves a child from danger, but the Brahmin acts too quickly and regrets his decision. In chess, the same mistake happens when a player reacts before calculating. This story teaches you to pause, inspect threats, and confirm your move before touching a piece.', relatedPuzzleId: 'puzzle-1' },
          { id: 'story-wise-crow', title: 'The Wise Crow', subtitle: 'Small observations create big victories.', tags: ['Observation', 'Planning'], progress: 60, status: 'in-progress', lesson: 'Notice small details before forming a plan.', chessConcept: 'Candidate moves and board scanning', body: 'The crow survives by noticing what others ignore. Chess rewards the same skill: before choosing a move, scan checks, captures, threats, weak squares, and undefended pieces.', relatedPuzzleId: 'puzzle-2' },
          { id: 'story-deer-and-hunter', title: 'The Deer and the Hunter', subtitle: 'Danger is often hidden in plain sight.', tags: ['Defense', 'Awareness'], progress: 0, status: 'not-started', lesson: 'Identify threats before attacking.', chessConcept: 'Defensive resources', body: 'The deer survives because it senses danger before it appears. In chess, strong players identify the opponent’s idea before pursuing their own attack.', relatedPuzzleId: 'puzzle-3' }
        ]
      },
      {
        id: 'chapter-2',
        title: 'Chapter 2: Patience and Planning',
        subtitle: 'Understand how patience turns small advantages into winning positions.',
        description: 'This chapter focuses on long-term planning, restraint, and positional improvement.',
        progress: 50,
        totalStories: 3,
        stories: [
          { id: 'story-clever-jackal', title: 'The Clever Jackal', subtitle: 'The trap of greed.', tags: ['Strategy', 'Patience'], progress: 75, status: 'in-progress', lesson: 'Greed loses games; patience wins them.', chessConcept: 'Avoiding poisoned pawns and traps', body: 'The clever jackal survives by refusing easy temptation. In chess, not every free pawn is truly free. This story teaches patience, calculation, and strategic restraint.', relatedPuzzleId: 'puzzle-4' },
          { id: 'story-tortoise-geese', title: 'The Tortoise and the Geese', subtitle: 'Discipline protects the plan.', tags: ['Planning', 'Prophylaxis'], progress: 45, status: 'in-progress', lesson: 'A good plan requires self-control.', chessConcept: 'Prophylaxis and positional discipline', body: 'The tortoise has a path to safety but fails because he cannot remain disciplined. In chess, even a good plan collapses when you ignore your opponent’s counterplay.', relatedPuzzleId: 'puzzle-5' },
          { id: 'story-monkey-crocodile', title: 'The Monkey and the Crocodile', subtitle: 'Escape through calm calculation.', tags: ['Calculation', 'Resourcefulness'], progress: 0, status: 'not-started', lesson: 'Stay calm under pressure.', chessConcept: 'Finding defensive tactics', body: 'The monkey escapes danger through quick thinking. In chess, bad positions often contain hidden resources if you calculate calmly.', relatedPuzzleId: 'puzzle-6' }
        ]
      },
      {
        id: 'chapter-3',
        title: 'Chapter 3: Building a Winning Plan',
        subtitle: 'Convert ideas into structured chess plans.',
        description: 'Learn how to combine strategy, tactics, and patience into a complete plan.',
        progress: 30,
        totalStories: 3,
        stories: [
          { id: 'story-lion-clever-rabbit', title: 'The Lion and the Clever Rabbit', subtitle: 'Intelligence defeats force.', tags: ['Strategy', 'Patience'], progress: 20, status: 'in-progress', lesson: 'A smaller force can win with a better plan.', chessConcept: 'Strategic deflection and exploiting overconfidence', body: 'The clever rabbit defeats the lion by using the lion’s pride against him. In chess, direct force is not always enough. A quiet strategic idea can redirect the opponent into defeat.', relatedPuzzleId: 'puzzle-7' },
          { id: 'story-elephant-patience', title: 'The Elephant’s Patience', subtitle: 'Strength waits for the right moment.', tags: ['Endgame', 'Patience'], progress: 0, status: 'not-started', lesson: 'Do not rush a winning position.', chessConcept: 'Technique and conversion', body: 'The elephant succeeds by moving slowly and with purpose. In chess, converting an advantage requires patience, not panic.', relatedPuzzleId: 'puzzle-8' },
          { id: 'story-hare-moon', title: 'The Hare and the Moon', subtitle: 'Use imagination to solve difficult problems.', tags: ['Creativity', 'Strategy'], progress: 0, status: 'not-started', lesson: 'Creative ideas can change the board.', chessConcept: 'Unexpected candidate moves', body: 'The hare uses imagination instead of strength. Chess creativity begins when you look beyond obvious moves.', relatedPuzzleId: 'puzzle-9' }
        ]
      }
    ]
  },
  {
    id: 'module-2',
    title: 'Tactical Wisdom',
    subtitle: 'Learn tactical motifs through animal fables and chess patterns.',
    description: 'This module develops tactical vision using stories about alertness, opportunity, and timing.',
    icon: '♞',
    level: 'Intermediate',
    progress: 35,
    totalChapters: 3,
    totalStories: 9,
    unlocked: true,
    chapters: [
      {
        id: 'chapter-4',
        title: 'Chapter 1: Forks and Double Attacks',
        subtitle: 'One move, two threats.',
        description: 'Use Panchatantra lessons to understand double attacks, forks, and tactical timing.',
        progress: 40,
        totalStories: 3,
        stories: [
          { id: 'story-two-headed-bird', title: 'The Two-Headed Bird', subtitle: 'Division creates weakness.', tags: ['Fork', 'Double Attack'], progress: 40, status: 'in-progress', lesson: 'Attack two weaknesses at once.', chessConcept: 'Knight fork and double attack', body: 'The two-headed bird fails because its parts do not work together. In chess, disconnected pieces become targets for double attacks.', relatedPuzzleId: 'puzzle-10' },
          { id: 'story-clever-fox', title: 'The Clever Fox', subtitle: 'Create two problems at once.', tags: ['Tactics', 'Timing'], progress: 0, status: 'not-started', lesson: 'A strong tactic overloads the opponent.', chessConcept: 'Double attack', body: 'The fox survives by forcing enemies to choose between two dangers. This mirrors a chess double attack.', relatedPuzzleId: 'puzzle-11' },
          { id: 'story-crane-crab', title: 'The Crane and the Crab', subtitle: 'Punish hidden greed.', tags: ['Tactics', 'Punishment'], progress: 0, status: 'not-started', lesson: 'Tactics appear when greed weakens coordination.', chessConcept: 'Fork after overextension', body: 'The crab defeats the greedy crane by recognizing the trap. In chess, greed often creates tactical targets.', relatedPuzzleId: 'puzzle-12' }
        ]
      }
    ]
  },
  {
    id: 'module-3',
    title: 'Endgame Mastery',
    subtitle: 'Master calm conversion, king activity, and pawn endings.',
    description: 'This module teaches endgame patience and precision through slow, wise Panchatantra lessons.',
    icon: '♚',
    level: 'Advanced',
    progress: 15,
    totalChapters: 2,
    totalStories: 6,
    unlocked: true,
    chapters: [
      {
        id: 'chapter-7',
        title: 'Chapter 1: King and Pawn Wisdom',
        subtitle: 'Small advantages need exact technique.',
        description: 'Learn opposition, passed pawns, king activity, and endgame discipline.',
        progress: 15,
        totalStories: 3,
        stories: [
          { id: 'story-turtle-steady', title: 'The Steady Turtle', subtitle: 'Slow steps still reach victory.', tags: ['Endgame', 'Technique'], progress: 15, status: 'in-progress', lesson: 'Improve slowly and avoid rushing.', chessConcept: 'King opposition', body: 'The turtle reaches safety not by speed, but by consistency. Endgames reward the same patience.', relatedPuzzleId: 'puzzle-13' }
        ]
      }
    ]
  },
  {
    id: 'module-4',
    title: 'Tournament Mindset',
    subtitle: 'Build emotional stability, focus, and practical decision-making.',
    description: 'This module prepares students to think clearly during games and recover from mistakes.',
    icon: '♛',
    level: 'Advanced',
    progress: 5,
    totalChapters: 2,
    totalStories: 6,
    unlocked: true,
    chapters: [
      {
        id: 'chapter-9',
        title: 'Chapter 1: Calm Under Pressure',
        subtitle: 'Strong players control emotion before they control the board.',
        description: 'Stories about discipline, focus, time pressure, and practical play.',
        progress: 5,
        totalStories: 3,
        stories: [
          { id: 'story-sage-and-storm', title: 'The Sage and the Storm', subtitle: 'The calm mind sees the winning move.', tags: ['Mindset', 'Focus'], progress: 5, status: 'in-progress', lesson: 'Emotional stability improves calculation.', chessConcept: 'Practical decision-making under pressure', body: 'The sage waits for the storm to pass before acting. Chess players must also pause, breathe, and calculate clearly.', relatedPuzzleId: 'puzzle-14' }
        ]
      }
    ]
  }
];

export function flattenStories(modules = storyModulesSeed) {
  return modules.flatMap((module) => module.chapters.flatMap((chapter) => chapter.stories.map((story) => ({
    ...story,
    moduleId: module.id,
    moduleTitle: module.title,
    chapterId: chapter.id,
    chapterTitle: chapter.title
  }))));
}

const seed = {
  auth: {
    currentUser: null,
    users: [
      { id: 'student-1', name: 'Arjun Sharma', email: 'arjun@panchatantra.test', role: 'student', status: 'active', points: 1850, streak: 12 },
      { id: 'coach-1', name: 'Coach Arvind', email: 'coach@panchatantra.test', role: 'coach', status: 'active' },
      { id: 'admin-1', name: 'Admin', email: 'admin@panchatantra.test', role: 'admin', status: 'active' },
      { id: 'parent-1', name: 'Meera Sharma', email: 'meera@panchatantra.test', role: 'parent', status: 'active' }
    ]
  },
  dashboards: { admin: adminDashboard, coach: coachDashboard, student: studentDashboard },
  student: {
    storyModules: storyModulesSeed,
    stories: flattenStories(storyModulesSeed),
    principles: [
      { id: 'principle-patience', name: 'Patience Before Attack', category: 'Strategy', learned: false, explanation: 'Build pressure before forcing tactics.', examples: ['Improve worst piece', 'Stop counterplay'], relatedStories: ['story-clever-jackal'], relatedPuzzles: ['puzzle-daily'] },
      { id: 'principle-awareness', name: 'Awareness of Threats', category: 'Tactics', learned: true, explanation: 'Every move should answer what changed.', examples: ['Loose pieces', 'King safety'], relatedStories: ['story-brahmin-mongoose'], relatedPuzzles: ['puzzle-fork-forest'] },
      { id: 'principle-endgame-calm', name: 'Endgame Calm', category: 'Endgame', learned: false, explanation: 'Small advantages become wins through clarity.', examples: ['Opposition', 'Passed pawns'], relatedStories: ['story-tortoise-geese'], relatedPuzzles: ['puzzle-pawn-race'] }
    ],
    puzzles: [
      { id: 'puzzle-daily', title: 'Daily Puzzle', difficulty: 'Medium', theme: 'Fork', solved: false, reward: 25, expectedMove: 'e4-e5', hint: 'Look for a forcing pawn break.', explanation: 'The pawn move opens the diagonal and wins material.' },
      { id: 'puzzle-fork-forest', title: 'Fork in the Forest', difficulty: 'Easy', theme: 'Fork', solved: true, reward: 15, expectedMove: 'g1-f3', hint: 'The knight attacks two targets.', explanation: 'A knight fork wins tempo and material.' },
      { id: 'puzzle-pawn-race', title: 'Patient Pawn Race', difficulty: 'Hard', theme: 'Endgame', solved: false, reward: 40, expectedMove: 'a2-a4', hint: 'Create the outside passer.', explanation: 'The outside passer distracts the king.' }
    ],
    achievements: [
      { id: 'ach-first-puzzle', title: 'First Spark', unlocked: true, progress: 100, rule: 'Solve your first puzzle.' },
      { id: 'ach-sacrifice-master', title: 'Sacrifice Master', unlocked: false, progress: 68, rule: 'Solve 25 sacrifice puzzles.' },
      { id: 'ach-story-seeker', title: 'Story Seeker', unlocked: false, progress: 50, rule: 'Complete 24 stories.' }
    ],
    analytics: {
      progress: studentDashboard.progressWeek,
      accuracy: 87,
      storyCompletion: 50,
      weakAreas: ['Time Management', 'Opening Knowledge'],
      strongAreas: ['Endgame Precision', 'Tactical Awareness']
    },
    classes: [
      { id: 'class-advanced-a', title: 'Advanced Tactics - Batch A', coach: 'Coach Arvind', topic: 'Sacrifices & Combinations', date: '2026-05-25', time: '5:00 PM', status: 'Live Soon', meetingLink: 'Live room placeholder', materials: ['Sacrifice Patterns PDF'] },
      { id: 'class-endgame-c', title: 'Endgame Mastery - Batch C', coach: 'Coach Arvind', topic: 'King and Pawn Endgames', date: '2026-05-26', time: '8:00 PM', status: 'Upcoming', meetingLink: 'Live room placeholder', materials: ['Endgame Drill Pack'] }
    ],
    profile: { id: 'student-1', type: 'The Sage', points: 1850, streak: 12, radar: studentDashboard.identity.radar, strengths: ['Endgame Precision', 'Tactical Awareness'], weaknesses: ['Time Management', 'Opening Knowledge'], plan: ['Practice 10-minute puzzle rush twice weekly', 'Review one opening trap per class'] },
    mistakes: [
      { id: 'mistake-1', puzzle: 'Silent Skewer', theme: 'Skewer', note: 'Missed back-rank weakness', reviewed: false }
    ]
  },
  coach: {
    students: coachDashboard.students.map((student, index) => ({ id: `student-${index + 1}`, ...student, status: index < 4 ? 'active' : 'inactive', class: index < 3 ? 'Advanced Tactics - Batch A' : 'Endgame Mastery - Batch C', notes: 'Needs focused calculation drills.' })),
    classes: [
      { id: 'coach-class-1', title: 'Advanced Tactics - Batch A', batch: 'A', topic: 'Sacrifices & Combinations', date: '2026-05-25', time: '5:00 PM', duration: '60 min', students: ['Arjun Sharma', 'Vihaan Mehta'], meetingLink: 'https://meet.example/chess-a', status: 'live', resources: ['Sacrifice Patterns PDF'], attendance: [] },
      { id: 'coach-class-2', title: 'Intermediate Class - Batch B', batch: 'B', topic: 'Positional Play', date: '2026-05-25', time: '6:30 PM', duration: '60 min', students: ['Ananya Singh'], meetingLink: 'https://meet.example/chess-b', status: 'upcoming', resources: [], attendance: [] }
    ],
    liveSessions: [
      { id: 'session-1', title: 'Advanced Tactics - Batch A', status: 'live', attendees: ['Arjun Sharma', 'Vihaan Mehta'] },
      { id: 'session-2', title: 'Endgame Mastery - Batch C', status: 'upcoming', attendees: ['Rohan Verma'] }
    ],
    assignments: [
      { id: 'assign-1', title: 'Knight Fork Drill', description: 'Solve 12 fork puzzles.', dueDate: '2026-05-28', targetClass: 'Advanced Tactics - Batch A', submissions: 8 }
    ],
    submissions: [
      { id: 'sub-1', student: 'Arjun Sharma', assignment: 'Knight Fork Drill', reviewed: false, feedback: '' }
    ],
    resources: [
      { id: 'res-1', title: 'Sacrifice Patterns PDF', type: 'PDF', uploadedAt: '2026-05-18' },
      { id: 'res-2', title: 'Endgame Drill Pack', type: 'Worksheet', uploadedAt: '2026-05-17' }
    ],
    messages: [
      { id: 'conv-1', with: 'Arjun Sharma', messages: [{ from: 'Arjun Sharma', text: 'Can I get extra endgame puzzles?' }, { from: 'Coach Arvind', text: 'Yes, I will assign a set today.' }] }
    ],
    reports: [],
    settings: { name: 'Coach Arvind', email: 'coach@panchatantra.test', notifications: true, theme: 'classic' }
  },
  admin: {
    users: [
      { id: 'user-1', name: 'Arjun Sharma', role: 'student', status: 'active', email: 'arjun@panchatantra.test' },
      { id: 'user-2', name: 'Coach Arvind', role: 'coach', status: 'active', email: 'coach@panchatantra.test' },
      { id: 'user-3', name: 'Admin', role: 'admin', status: 'active', email: 'admin@panchatantra.test' }
    ],
    curriculum: {
      modules: [
        { id: 'module-1', title: "The Lion's Wisdom", order: 1, chapters: 3 },
        { id: 'module-2', title: "The Monkey's Mind", order: 2, chapters: 3 }
      ],
      chapters: [
        { id: 'chapter-1', title: 'Trap of Greed', moduleId: 'module-1', order: 1 }
      ]
    },
    stories: [],
    principles: [],
    puzzles: [],
    classes: [],
    achievements: [],
    analytics: adminDashboard,
    reports: [],
    rolesPermissions: {
      Admin: { users: true, curriculum: true, reports: true, settings: true },
      Coach: { students: true, classes: true, reports: true, settings: false },
      Student: { stories: true, puzzles: true, analytics: true, settings: true },
      Parent: { stories: false, puzzles: false, analytics: true, settings: true }
    },
    settings: { academyName: 'Chess by Panchatantra', tagline: 'Wisdom Meets Strategy', notifications: true }
  },
  actionLog: []
};

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    const db = structuredClone(seed);
    db.admin.stories = structuredClone(seed.student.stories);
    db.admin.principles = structuredClone(seed.student.principles);
    db.admin.puzzles = structuredClone(seed.student.puzzles);
    db.admin.classes = structuredClone(seed.coach.classes);
    db.admin.achievements = structuredClone(seed.student.achievements);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  }
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (!db.student.storyModules) {
    db.student.storyModules = storyModulesSeed;
    db.student.stories = flattenStories(storyModulesSeed);
    db.admin.stories = flattenStories(storyModulesSeed);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  }
}

export function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

export function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  return db;
}

export function resetDb() {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  return readDb();
}

export function logAction(db, role, text) {
  db.actionLog.unshift({ id: `log-${Date.now()}`, role, text, time: new Date().toISOString() });
  db.actionLog = db.actionLog.slice(0, 100);
}

export function findModule(db, moduleId) {
  return db.student.storyModules.find((module) => module.id === moduleId);
}

export function findChapter(db, moduleId, chapterId) {
  return findModule(db, moduleId)?.chapters.find((chapter) => chapter.id === chapterId);
}

export function findStoryById(db, storyId) {
  for (const module of db.student.storyModules) {
    for (const chapter of module.chapters) {
      const story = chapter.stories.find((item) => item.id === storyId);
      if (story) return { story, module, chapter };
    }
  }
  return null;
}

export function updateStoryProgress(db, storyId, progress) {
  const found = findStoryById(db, storyId);
  if (!found) return null;
  found.story.progress = Math.max(0, Math.min(100, Number(progress)));
  found.story.status = found.story.progress >= 100 ? 'completed' : found.story.progress > 0 ? 'in-progress' : 'not-started';
  db.student.stories = flattenStories(db.student.storyModules);
  db.admin.stories = flattenStories(db.student.storyModules);
  return found;
}
