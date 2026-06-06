/**
 * Types for the Educational Puzzle Generator
 */

export interface PuzzlePair {
  id: string;
  question: string;
  answer: string;
  code: string; // Dynamic verification code (e.g. "A1", "B2") for quick checking
  stepNumber?: number;      // Sequence order of the step in a real-world scenario
  stepDescription?: string; // Description or application of the formula for this step
}


export type ThemeStyle = 'vibrant' | 'pastel';

export type ActivityType = 'Khởi động' | 'Luyện tập' | 'Vận dụng';

export type PuzzleType = 'jigsaw' | 'tarsia' | 'number_jigsaw' | 'domino' | 'math_maze' | 'bingo';
export type TarsiaShape = 
  | 'triangle_4' 
  | 'triangle_9' 
  | 'triangle_16' 
  | 'parallelogram_10' 
  | 'hexagon_6' 
  | 'star' 
  | 'trapezoid_6' 
  | 'chevron_12' 
  | 'chevron_8' 
  | 'trapezoid_5' 
  | 'fish_12' 
  | 'rhombus'
  | 'heart_12'
  | 'heart_18';
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
  mazeRows: number;
  mazeCols: number;
  mazeStyle: 'animal_cartoon' | 'classic';
  allowDiagonal?: boolean;
  bingoRows: number;
  bingoCols: number;
  showHeader: boolean;
  hasScenario?: boolean;
  scenarioTitle?: string;
  // ── Typography ──────────────────────────────────────────────────────────────
  globalFontSize?: number;       // px, range 8-22, default 13. Áp dụng toàn bộ mảnh ghép
  globalFontFamily?: string;     // CSS font-family. Default: 'Quicksand'
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
  
  // Khoảng lùi an toàn tăng lên để chữ không chạm chốt ghép (trừ đi 42px tổng chiều rộng và 34px tổng chiều cao)
  const width = Math.max(70, pieceW - 42);
  const height = Math.max(28, pieceH - 34);
  
  return {
    width,
    height,
    xOffset: -width / 2,
    yOffset: -height / 2
  };
};
