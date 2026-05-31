import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherDashboard } from '../TeacherDashboard';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentGameId, setSettings, setPairs } = useEditorStore();
  const { setActiveTab, showFlashMessage } = useUIStore();

  const handleSelectGame = (game: any) => {
    setCurrentGameId(game.id);
    setSettings(game.settings);
    setPairs(game.pairs);
    setActiveTab('cutout');
    navigate('/');
  };

  const handleEditGame = (game: any) => {
    setCurrentGameId(game.id);
    setSettings(game.settings);
    setPairs(game.pairs);
    navigate('/');
  };

  const handleDeleteGame = (id: string) => {
    try {
      const raw = localStorage.getItem('canva_puzzle_teacher_games');
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.filter((g: any) => g.id !== id);
        localStorage.setItem('canva_puzzle_teacher_games', JSON.stringify(updated));
        // Kích hoạt sự kiện storage để TeacherDashboard cập nhật lại danh sách game
        window.dispatchEvent(new Event('storage'));
        showFlashMessage('Đã xóa giáo án thành công!', 'info');
      }
    } catch (e) {
      console.error(e);
      showFlashMessage('Lỗi khi xóa giáo án.', 'error');
    }
  };

  const handleCreateNewGame = () => {
    // Reset configurations về mặc định cho một game mới
    setCurrentGameId('game-' + Date.now());
    setSettings({
      title: 'Bài Học Mới',
      subject: 'Toán học',
      gradeClass: '',
      teacherName: '',
      style: 'vibrant',
      showMatchCode: false,
      showDoodleIcons: true,
      activityType: 'Luyện tập',
      columns: 2,
      pieceSize: 1.0,
      saveInk: false,
      puzzleType: 'jigsaw',
      tarsiaShape: 'triangle_18',
      numberShape: '20',
      numberScaleX: 1.0,
      numberScaleY: 1.0,
      dominoShape: '26',
      dominoWidth: 160,
      dominoHeight: 68,
    });
    setPairs([]);
    navigate('/');
  };

  const handleOpenLeaderboard = (pin: string, title: string) => {
    navigate(`/leaderboard/${pin}?title=${encodeURIComponent(title)}`);
  };

  return (
    <TeacherDashboard
      onSelectGame={handleSelectGame}
      onEditGame={handleEditGame}
      onDeleteGame={handleDeleteGame}
      onCreateNewGame={handleCreateNewGame}
      onOpenLeaderboard={handleOpenLeaderboard}
    />
  );
};
