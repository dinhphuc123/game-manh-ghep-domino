import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EditorPage } from './components/editor/EditorPage';
import { PlayPage } from './components/play/PlayPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { LeaderboardPage } from './components/leaderboard/LeaderboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Editor chính của giáo viên */}
        <Route path="/" element={<EditorPage />} />
        
        {/* Quản lý giáo án đã lưu */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Học sinh chơi game (Hỗ trợ cả trường hợp tự nhập PIN và có sẵn PIN trên URL) */}
        <Route path="/play" element={<PlayPage />} />
        <Route path="/play/:pin" element={<PlayPage />} />
        
        {/* Bảng xếp hạng thời gian thực */}
        <Route path="/leaderboard/:pin" element={<LeaderboardPage />} />
        
        {/* Điều hướng mặc định */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
