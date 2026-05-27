import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import StudentDashboard from '../pages/StudentDashboard.jsx';
import CoachDashboard from '../pages/CoachDashboard.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import AchievementsPage from '../pages/AchievementsPage.jsx';
import {
  AdminAchievements,
  AdminClasses,
  AdminCrudPage,
  AdminCurriculum,
  AdminPrinciples,
  AdminPuzzles,
  AdminReports,
  AdminSettings,
  AdminUserDetail,
  AdminUsers,
  AdminGamesDetails,
  CoachAssignments,
  CoachClassDetail,
  CoachClasses,
  CoachLiveSessions,
  CoachMessages,
  CoachPuzzles,
  CoachReports,
  CoachResources,
  CoachSettings,
  CoachStudentDetail,
  CoachStudents,
  ReviewMistakes,
  RolesPermissions,
  StrategicProfile,
  StudentAchievements,
  StudentAnalytics,
  StudentClassDetail,
  StudentClasses,
  StudentChapterStories,
  StudentModuleChapters,
  StudentPuzzleDetail,
  StudentPuzzles,
  StudentSettings,
  StudentStories,
  StudentStoryDetail,
} from '../pages/FunctionalPages.jsx';
import StudentStoryReader from '../pages/StudentStoryReader.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute role="student" />}>
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/stories" element={<StudentStories />} />
        <Route path="/student/stories/module/:moduleId/chapter/:chapterId" element={<StudentChapterStories />} />
        <Route path="/student/stories/module/:moduleId" element={<StudentModuleChapters />} />
        <Route path="/student/stories/:storyId/read" element={<StudentStoryReader />} />
        <Route path="/student/stories/:storyId" element={<StudentStoryDetail />} />
        <Route path="/student/principles" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/principles/:principleId" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/puzzles" element={<StudentPuzzles />} />
        <Route path="/student/puzzles/:puzzleId" element={<StudentPuzzleDetail />} />
        <Route path="/student/achievements" element={<StudentAchievements />} />
        <Route path="/student/analytics" element={<StudentAnalytics />} />
        <Route path="/student/classes" element={<StudentClasses />} />
        <Route path="/student/classes/:classId" element={<StudentClassDetail />} />
        <Route path="/student/strategic-profile" element={<StrategicProfile />} />
        <Route path="/student/review-mistakes" element={<ReviewMistakes />} />
        <Route path="/student/settings" element={<StudentSettings />} />
      </Route>

      <Route element={<ProtectedRoute role="coach" />}>
        <Route path="/coach" element={<Navigate to="/coach/dashboard" replace />} />
        <Route path="/coach/dashboard" element={<CoachDashboard />} />
        <Route path="/coach/students" element={<CoachStudents />} />
        <Route path="/coach/students/:studentId" element={<CoachStudentDetail />} />
        <Route path="/coach/classes" element={<CoachClasses />} />
        <Route path="/coach/classes/:classId" element={<CoachClassDetail />} />
        <Route path="/coach/live-sessions" element={<CoachLiveSessions />} />
        <Route path="/coach/reports" element={<CoachReports />} />
        <Route path="/coach/puzzles" element={<CoachPuzzles />} />
        <Route path="/coach/assignments" element={<CoachAssignments />} />
        <Route path="/coach/resources" element={<CoachResources />} />
        <Route path="/coach/messages" element={<CoachMessages />} />
        <Route path="/coach/settings" element={<CoachSettings />} />
      </Route>

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:id" element={<AdminUserDetail />} />
        <Route path="/admin/games-details" element={<AdminGamesDetails />} />
        <Route path="/admin/curriculum" element={<AdminCurriculum />} />
        <Route path="/admin/positions" element={<Navigate to="/admin/curriculum?tab=principles" replace />} />
        <Route path="/admin/puzzles" element={<AdminPuzzles />} />
        <Route path="/admin/principles" element={<AdminPrinciples />} />
        <Route path="/admin/classes" element={<AdminClasses />} />
        <Route path="/admin/analytics" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/achievement-catalog" element={<AdminAchievements />} />
        <Route path="/admin/achievements/all-games" element={<AchievementsPage view="all" />} />
        <Route path="/admin/achievements/wins-in-row/sacrifices" element={<AchievementsPage view="sacrifices" />} />
        <Route path="/admin/achievements/wins-in-row/brilliant" element={<AchievementsPage view="brilliant" />} />
        <Route path="/admin/achievements/wins-in-row" element={<AchievementsPage view="streaks" />} />
        <Route path="/admin/achievements" element={<AchievementsPage />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/roles-permissions" element={<RolesPermissions />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
