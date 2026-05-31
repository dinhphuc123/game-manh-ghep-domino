import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayMode } from '../PlayMode';

export const PlayPage: React.FC = () => {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();

  return (
    <PlayMode
      initialPin={pin || ''}
      onBackToTeacher={() => {
        // Điều hướng học sinh hoặc giáo viên quay về trang chủ soạn thảo
        navigate('/');
      }}
    />
  );
};
