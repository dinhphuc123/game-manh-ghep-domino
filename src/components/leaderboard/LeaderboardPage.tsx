import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { LiveLeaderboard } from '../LiveLeaderboard';

export const LeaderboardPage: React.FC = () => {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy tiêu đề game từ query string
  const queryParams = new URLSearchParams(location.search);
  const gameTitle = queryParams.get('title') || 'Game Ghép Cặp';

  return (
    <LiveLeaderboard
      pin={pin || ''}
      gameTitle={gameTitle}
      onClose={() => {
        // Quay lại trang quản lý của giáo viên
        navigate('/dashboard');
      }}
    />
  );
};
