import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ExtensionIcon from '@mui/icons-material/Extension';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MessageIcon from '@mui/icons-material/Message';
import SettingsIcon from '@mui/icons-material/Settings';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SecurityIcon from '@mui/icons-material/Security';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PersonIcon from '@mui/icons-material/Person';
import VideocamIcon from '@mui/icons-material/Videocam';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ListAltIcon from '@mui/icons-material/ListAlt';

export const roleConfig = {
  admin: {
    profile: { name: 'Admin', role: 'Super Administrator', initials: 'AD', portrait: 'sage' },
    quote: 'A wise king learns every day.',
    quoteBy: 'Panchatantra',
    nav: [
      ['Dashboard', DashboardIcon, '/admin/dashboard'], ['Users', PeopleAltIcon, '/admin/users'], ['Player Details', SportsEsportsIcon, '/admin/games-details'], ['Curriculum', MenuBookIcon, '/admin/curriculum'],
      ['Chess Puzzles', ExtensionIcon, '/admin/puzzles'],
      ['Classes', CalendarMonthIcon, '/admin/classes'], ['Achievements', EmojiEventsIcon, '/admin/achievements'],
      ['Achievement catalog', ListAltIcon, '/admin/achievement-catalog'],
      ['Reports', AssignmentIcon, '/admin/reports'], ['Roles & Permissions', SecurityIcon, '/admin/roles-permissions'], ['Settings', SettingsIcon, '/admin/settings'],
    ],
  },
  coach: {
    profile: { name: 'Coach Arvind', role: 'Senior Coach ♔', initials: 'CA', portrait: 'coach' },
    quote: 'A good coach can change a game. A great coach can change a life.',
    quoteBy: 'Garry Kasparov',
    nav: [
      ['Dashboard', DashboardIcon, '/coach/dashboard'], ['Students', PeopleAltIcon, '/coach/students'], ['Classes', CalendarMonthIcon, '/coach/classes'],
      ['Live Sessions', VideocamIcon, '/coach/live-sessions'], ['Reports & Analytics', AnalyticsIcon, '/coach/reports'], ['Puzzles', ExtensionIcon, '/coach/puzzles'],
      ['Assignments', AssignmentIcon, '/coach/assignments'], ['Resources', MenuBookIcon, '/coach/resources'], ['Messages', MessageIcon, '/coach/messages'], ['Settings', SettingsIcon, '/coach/settings'],
    ],
  },
  student: {
    profile: { name: 'Arjun', role: 'Student', initials: 'AS', portrait: 'student' },
    quote: 'Strategy without tactics is the slowest route to victory. Tactics without strategy is the noise before defeat.',
    quoteBy: 'Sun Tzu',
    nav: [
      ['Dashboard', DashboardIcon, '/student/dashboard'], ['Stories', AutoStoriesIcon, '/student/stories'],
      ['Puzzles', ExtensionIcon, '/student/puzzles'], ['Achievements', EmojiEventsIcon, '/student/achievements'], ['Analytics', AnalyticsIcon, '/student/analytics'],
      ['Classes', CalendarMonthIcon, '/student/classes'], ['Strategic Profile', PersonIcon, '/student/strategic-profile'],
    ],
    quick: [['Daily Puzzle', ExtensionIcon, '/student/puzzles/puzzle-daily'], ['Review Mistakes', HeadsetMicIcon, '/student/review-mistakes']],
  },
};
