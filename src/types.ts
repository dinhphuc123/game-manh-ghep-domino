/**
 * Types for the Educational Puzzle Generator
 */

export interface PuzzlePair {
  id: string;
  question: string;
  answer: string;
  code: string; // Dynamic verification code (e.g. "A1", "B2") for quick checking
}

export type ThemeStyle = 'vibrant' | 'pastel';

export type ActivityType = 'Khởi động' | 'Luyện tập' | 'Vận dụng';

export type PuzzleType = 'jigsaw' | 'tarsia' | 'number_jigsaw' | 'domino';
export type TarsiaShape = 'triangle_9' | 'triangle_18' | 'hexagon' | 'rhombus' | 'star' | 'hexagon_6' | 'hexagon_core';
export type NumberShape = string;

export interface GameSettings {
  title: string;
  subject: string;
  gradeClass: string;
  teacherName: string;
  style: ThemeStyle;
  showMatchCode: boolean;
  showDoodleIcons: boolean;
  activityType: ActivityType;
  columns: number;
  pieceSize: number; // multiplier or px base width
  saveInk: boolean; // black and white saver mode
  puzzleType: PuzzleType;
  tarsiaShape: TarsiaShape;
  numberShape: NumberShape;      // arbitrary digit string e.g. "20", "2026", "100"
  numberScaleX: number;          // horizontal stretch of each digit (default 1.0)
  numberScaleY: number;          // vertical stretch of each digit (default 1.0)
  dominoShape: string;
  dominoWidth: number;
  dominoHeight: number;
}

export const getPieceContentBox = (points: { x: number; y: number }[]) => {
  if (!points || points.length === 0) {
    return { width: 110, height: 44, xOffset: -55, yOffset: -22 };
  }
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const pieceW = maxX - minX;
  const pieceH = maxY - minY;
  
  // Khoảng lùi an toàn 15px mỗi bên (trừ đi 30px tổng chiều rộng và 24px tổng chiều cao)
  const width = Math.max(80, pieceW - 30);
  const height = Math.max(36, pieceH - 24);
  
  return {
    width,
    height,
    xOffset: -width / 2,
    yOffset: -height / 2
  };
};
