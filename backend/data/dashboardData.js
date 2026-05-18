export const adminDashboard = {
  topbar: { title: 'Welcome back, Admin 👑', subtitle: "Here's what's happening in your academy today.", cta: 'Export Report' },
  stats: [
    { label: 'Total Users', value: '2,458', trend: '+12.5% vs last month', icon: 'groups', color: 'purple' },
    { label: 'Active Students', value: '1,896', trend: '+9.3% vs last month', icon: 'school', color: 'green' },
    { label: 'Total Stories', value: '48', subtitle: '4 Modules · 12 Chapters', icon: 'book', color: 'blue' },
    { label: 'Total Puzzles', value: '1,284', trend: '+82 added this month', icon: 'puzzle', color: 'gold' },
    { label: 'Achievements Unlocked', value: '8,732', trend: '+18.7% vs last month', icon: 'trophy', color: 'red' }
  ],
  userGrowth: [
    { name: 'Apr 26', total: 1200, active: 700 },
    { name: 'Apr 30', total: 1450, active: 900 },
    { name: 'May 4', total: 1700, active: 1050 },
    { name: 'May 8', total: 1950, active: 1250 },
    { name: 'May 12', total: 2100, active: 1375 },
    { name: 'May 16', total: 2280, active: 1520 },
    { name: 'May 20', total: 2420, active: 1700 },
    { name: 'May 25', total: 2550, active: 1820 }
  ],
  roles: [
    { name: 'Students', value: 1896, percent: '77.1%', color: '#111827' },
    { name: 'Coaches', value: 342, percent: '13.9%', color: '#D6A84F' },
    { name: 'Admins', value: 78, percent: '3.2%', color: '#7C5CFF' },
    { name: 'Parents', value: 142, percent: '5.8%', color: '#45A886' }
  ],
  recentActivity: [
    { title: 'New student registered', detail: 'Arjun Sharma', time: '2 min ago', icon: 'person' },
    { title: 'New story published', detail: 'The Wise Elephant', time: '15 min ago', icon: 'book' },
    { title: 'New puzzle added', detail: 'Fork in the Forest', time: '1 hr ago', icon: 'puzzle' },
    { title: 'New class created', detail: 'Advanced Tactics - Batch 12', time: '2 hr ago', icon: 'school' },
    { title: 'Achievement unlocked', detail: '25 students unlocked “Sacrifice Master”', time: '3 hr ago', icon: 'trophy' }
  ],
  content: [
    { label: 'Modules', value: '4' },
    { label: 'Chapters', value: '12' },
    { label: 'Stories', value: '48' },
    { label: 'Principles', value: '36' },
    { label: 'Puzzles', value: '1,284' }
  ],
  topModules: [
    { module: "The Lion's Wisdom", completion: 78, students: '1,245' },
    { module: "The Monkey's Mind", completion: 68, students: '1,032' },
    { module: "The Elephant's Patience", completion: 65, students: '980' },
    { module: "The Tortoise's Strategy", completion: 59, students: '842' }
  ],
  engagement: { score: 84, trend: '+14% vs last month', session: '32m 45s' },
  performance: [
    { label: 'Completion Rate', value: '72.6%', trend: '+8.4%' },
    { label: 'Puzzles Solved', value: '12,842', trend: '+15.3%' },
    { label: 'Brilliant Moves', value: '1,245', trend: '+22.6%' },
    { label: 'Average Rating', value: '1563', trend: '+41' },
    { label: 'Retention Rate', value: '89.2%', trend: '+6.7%' }
  ]
};

export const coachDashboard = {
  topbar: { title: 'Welcome back, Coach Arvind! 👋', subtitle: "Here's what's happening with your academy today.", cta: 'Create Class' },
  stats: [
    { label: 'Total Students', value: '42', trend: '+4 new this month', icon: 'groups', color: 'purple' },
    { label: 'Active Students', value: '38', subtitle: '90% of total students', icon: 'school', color: 'green' },
    { label: 'Classes This Month', value: '12', trend: '+2 vs last month', icon: 'calendar', color: 'gold' },
    { label: 'Avg. Progress', value: '76%', trend: '+8% vs last month', icon: 'analytics', color: 'red' },
    { label: 'Achievements Unlocked', value: '156', trend: '+22 this month', icon: 'diamond', color: 'blue' }
  ],
  progress: [
    { name: 'Apr 26', classProgress: 50, puzzleAccuracy: 36 },
    { name: 'May 3', classProgress: 56, puzzleAccuracy: 40 },
    { name: 'May 10', classProgress: 73, puzzleAccuracy: 52 },
    { name: 'May 17', classProgress: 76, puzzleAccuracy: 60 },
    { name: 'May 24', classProgress: 80, puzzleAccuracy: 64 }
  ],
  students: [
    { name: 'Arjun Sharma', type: 'Strategic Thinker', progress: 84, trend: 7 },
    { name: 'Vihaan Mehta', type: 'Tactical Hunter', progress: 72, trend: 5 },
    { name: 'Ananya Singh', type: 'Positional Player', progress: 69, trend: -2 },
    { name: 'Rohan Verma', type: 'Endgame Specialist', progress: 63, trend: 6 },
    { name: 'Ishaan Kapoor', type: 'Aggressive Attacker', progress: 58, trend: -1 }
  ],
  schedule: [
    { time: '5:00 PM', title: 'Advanced Tactics - Batch A', topic: 'Sacrifices & Combinations', students: '12 Students', status: 'Live Now' },
    { time: '6:30 PM', title: 'Intermediate Class - Batch B', topic: 'Positional Play', students: '8 Students', status: 'Starts in 1h' },
    { time: '8:00 PM', title: 'Endgame Mastery - Batch C', topic: 'King & Pawn Endgames', students: '10 Students', status: 'Upcoming' }
  ],
  classAnalytics: [
    { name: 'Advanced', value: 4, percent: '33%', color: '#7C5CFF' },
    { name: 'Intermediate', value: 5, percent: '42%', color: '#3B82F6' },
    { name: 'Beginner', value: 2, percent: '17%', color: '#7BCB77' },
    { name: 'Other', value: 1, percent: '8%', color: '#D6A84F' }
  ],
  strengths: [
    { label: 'Tactical Awareness', value: 78 },
    { label: 'Calculation', value: 72 },
    { label: 'Endgame Technique', value: 69 }
  ],
  weaknesses: [
    { label: 'Opening Knowledge', value: 51 },
    { label: 'Positional Play', value: 48 },
    { label: 'Time Management', value: 45 }
  ],
  recentActivity: [
    { title: 'Arjun Sharma solved 15 puzzles', time: '30 min ago', icon: 'puzzle' },
    { title: 'Vihaan Mehta unlocked “Brilliant Move”', time: '1 hr ago', icon: 'diamond' },
    { title: 'Ananya Singh completed “The Lion’s Wisdom”', time: '2 hr ago', icon: 'book' },
    { title: 'Rohan Verma joined the class', time: '3 hr ago', icon: 'calendar' }
  ]
};

export const studentDashboard = {
  topbar: { title: 'Welcome back, Arjun! ♟', subtitle: 'Every move is a step toward mastery.' },
  stats: [
    { label: 'Stories Completed', value: '24 / 48', subtitle: '50%', icon: 'book', color: 'gold', progress: 50 },
    { label: 'Puzzles Solved', value: '342', subtitle: 'This Month: 78', icon: 'puzzle', color: 'purple' },
    { label: 'Accuracy', value: '87%', trend: '+6% vs last month', icon: 'target', color: 'green' },
    { label: 'Rating (Academy)', value: '1560', trend: '+85', icon: 'analytics', color: 'blue' },
    { label: 'Brilliant Moves', value: '18', subtitle: 'Keep shining!', icon: 'diamond', color: 'gold' }
  ],
  progressWeek: [
    { name: 'Mon', value: 280 },
    { name: 'Tue', value: 420 },
    { name: 'Wed', value: 560 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 1050 },
    { name: 'Sat', value: 1260 },
    { name: 'Sun', value: 1500 }
  ],
  recommended: [
    { title: 'The Lion and the Clever Rabbit', tags: ['Strategy', 'Patience'], chapter: 'Chapter 3', art: 'lion' },
    { title: 'The Tortoise and the Geese', tags: ['Planning', 'Prophylaxis'], chapter: 'Chapter 2', art: 'geese' },
    { title: 'The Brahmin and the Mongoose', tags: ['Tactics', 'Awareness'], chapter: 'Chapter 1', art: 'mongoose' }
  ],
  identity: {
    name: 'The Sage',
    description: 'You are a patient strategist who excels in long-term planning and endgame mastery.',
    radar: [
      { subject: 'Tactical Awareness', value: 78 },
      { subject: 'Strategic Depth', value: 72 },
      { subject: 'Endgame Precision', value: 82 },
      { subject: 'Opening Knowledge', value: 64 },
      { subject: 'Time Management', value: 58 },
      { subject: 'Emotional Stability', value: 74 }
    ]
  },
  puzzle: { side: 'White to Move', prompt: 'Find the best move!', difficulty: 'Medium', reward: '25 Points' }
};
