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

export type PuzzleType = 'jigsaw' | 'tarsia' | 'number_jigsaw';
export type TarsiaShape = 'triangle_9' | 'triangle_18' | 'hexagon' | 'rhombus';
export type NumberShape = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '20';

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
  numberShape: NumberShape;
}
