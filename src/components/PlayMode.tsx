import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Key, RefreshCw, Trophy, Home, Sparkles, AlertCircle, Loader2, Users, Timer } from 'lucide-react';
import { loadGameFromCloud, registerTeam, updateTeamProgress, updatePiecePositionOnCloud, listenToSessionRealtime, getFirebaseConfig } from '../firebaseService';
import { PuzzlePair, GameSettings, getPieceContentBox } from '../types';
import { MathJaxWrapper, calculateDynamicFontSize } from './MathJaxWrapper';
import { DIGIT_LAYOUTS } from './DominoView';
import { generateMazeData } from '../utils/mazeGenerator';
import { BingoView } from './BingoView';
import { PlayTarsiaBoard } from './play/PlayTarsiaBoard';
import { PlayDominoBoard } from './play/PlayDominoBoard';
import { PlayNumberBoard } from './play/PlayNumberBoard';
import { PlayMazeBoard } from './play/PlayMazeBoard';
import { PlayJigsawBoard } from './play/PlayJigsawBoard';

const getMazeColors = (style: 'vibrant' | 'pastel', saveInk: boolean) => {
  if (saveInk) {
    return {
      startCell: { bg: '#fff', border: '#000', text: '#000', label: '#000', labelBg: '#fff' },
      endCell: { bg: '#fff', border: '#000', text: '#000', label: '#000', labelBg: '#fff' },
      normalCell: { bg: '#fff', border: '#aaa', text: '#000' },
      correctEdge: { bg: '#fff', border: '#000', text: '#000' },
      normalEdge: { bg: '#fff', border: '#999', text: '#333' },
      connector: '#aaa',
      correctConnector: '#000',
    };
  }
  if (style === 'vibrant') {
    return {
      startCell: { bg: '#fef3c7', border: '#d97706', text: '#78350f', label: '#fff', labelBg: '#f59e0b' },
      endCell: { bg: '#ecfdf5', border: '#10b981', text: '#065f46', label: '#fff', labelBg: '#10b981' },
      normalCell: { bg: '#eff6ff', border: '#3b82f6', text: '#1e3a8a' },
      correctEdge: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
      normalEdge: { bg: '#f8fafc', border: '#cbd5e1', text: '#334155' },
      connector: '#cbd5e1',
      correctConnector: '#10b981',
    };
  }
  return {
    startCell: { bg: '#fafaf9', border: '#78716c', text: '#292524', label: '#fff', labelBg: '#78716c' },
    endCell: { bg: '#f4f4f5', border: '#71717a', text: '#18181b', label: '#fff', labelBg: '#71717a' },
    normalCell: { bg: '#fff', border: '#e4e4e7', text: '#09090b' },
    correctEdge: { bg: '#f1f5f9', border: '#94a3b8', text: '#1e293b' },
    normalEdge: { bg: '#fff', border: '#e4e4e7', text: '#475569' },
    connector: '#e4e4e7',
    correctConnector: '#94a3b8',
  };
};

// Định nghĩa giao diện mảnh ghép kéo thả
interface PlayablePiece {
  id: string;
  type: 'jigsaw' | 'tarsia' | 'number' | 'domino' | 'maze_cell';
  text: string;
  code: string;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  isSnapped: boolean;
  
  // Dữ liệu phụ trợ cho Jigsaw
  jigsawType?: 'question' | 'answer';
  origIndex?: number;

  // Dữ liệu phụ trợ cho Tarsia
  tarsiaTriangleId?: number;
  tarsiaSides?: any[];
  tarsiaIsPointingUp?: boolean;
  tarsiaRotation?: number; // góc xoay thử thách (0, 120, 240)
  tarsiaTargetRotation?: number; // góc xoay khớp mục tiêu (0, 120, 180, 240)

  // Dữ liệu phụ trợ cho Number Jigsaw
  numberPieceId?: string;
  numberPoints?: { x: number; y: number }[];
  numberEdges?: string[];
  numberColorIndex?: number;

  // Dữ liệu phụ trợ cho Domino
  dominoId?: number;
  dominoRotation?: number;
  dominoLeftText?: string;
  dominoRightText?: string;
  dominoLeftCode?: string;
  dominoRightCode?: string;
  dominoHasLeft?: boolean;
  dominoHasRight?: boolean;

  // Dữ liệu phụ trợ cho Mê cung
  mazeCellRow?: number;
  mazeCellCol?: number;
  mazeCellIsCorrectPath?: boolean;
  mazeCellCorrectPathIndex?: number;
}

interface PlayModeProps {
  onBackToTeacher: () => void;
  initialPin?: string;
}

// BULBOUS JIGSAW TAB CONNECTOR GENERATOR (Dùng cho Number Jigsaw)
const getEdgeTabPath = (p1: {x: number, y: number}, p2: {x: number, y: number}, edgeType: string): string => {
  if (edgeType !== 'male' && edgeType !== 'female') {
    return ` L ${p2.x} ${p2.y}`;
  }

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  
  if (len < 5) return ` L ${p2.x} ${p2.y}`;

  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  const hSign = edgeType === 'male' ? 1 : -1;
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;

  const sizeFactor = Math.min(len * 0.35, 23);
  const neckWidth = sizeFactor * 0.7;
  const headWidth = sizeFactor * 1.05;
  const height = sizeFactor * 0.82;

  const ax = mx - ux * neckWidth;
  const ay = my - uy * neckWidth;

  const dx_bulb = mx - ux * headWidth + nx * height * hSign;
  const dy_bulb = my - uy * headWidth + ny * height * hSign;

  const ex = mx + ux * headWidth + nx * height * hSign;
  const ey = my + uy * headWidth + ny * height * hSign;

  const bx = mx + ux * neckWidth;
  const by = my + uy * neckWidth;

  const cp1_x = ax + nx * height * 0.28 * hSign;
  const cp1_y = ay + ny * height * 0.28 * hSign;
  const cp2_x = dx_bulb - ux * sizeFactor * 0.35;
  const cp2_y = dy_bulb - uy * sizeFactor * 0.35;
  const cp3_x = dx_bulb + ux * sizeFactor * 0.55 + nx * height * 0.15 * hSign;
  const cp3_y = dy_bulb + uy * sizeFactor * 0.55 + ny * height * 0.15 * hSign;
  const cp4_x = ex - ux * sizeFactor * 0.55 + nx * height * 0.15 * hSign;
  const cp4_y = ey - uy * sizeFactor * 0.55 + ny * height * 0.15 * hSign;
  const cp5_x = ex + ux * sizeFactor * 0.35;
  const cp5_y = ey + uy * sizeFactor * 0.35;
  const cp6_x = bx + nx * height * 0.28 * hSign;
  const cp6_y = by + ny * height * 0.28 * hSign;

  return ` L ${ax} ${ay} ` +
         `C ${cp1_x} ${cp1_y}, ${cp2_x} ${cp2_y}, ${dx_bulb} ${dy_bulb} ` +
         `C ${cp3_x} ${cp3_y}, ${cp4_x} ${cp4_y}, ${ex} ${ey} ` +
         `C ${cp5_x} ${cp5_y}, ${cp6_x} ${cp6_y}, ${bx} ${by} L ${p2.x} ${p2.y}`;
};

const colorPalettes = [
  { fill: '#f43f5e', border: '#e11d48', shadow: '#be123c', text: '#880d2e', stamp: '#ffe4e6' }, // Rose Red
  { fill: '#eab308', border: '#ca8a04', shadow: '#a16207', text: '#713f12', stamp: '#fef9c3' }, // Amber Yellow
  { fill: '#06b6d4', border: '#0891b2', shadow: '#0e7490', text: '#155e75', stamp: '#ecfeff' }, // Cyan Blue
  { fill: '#10b981', border: '#059669', shadow: '#047857', text: '#064e3b', stamp: '#d1fae5' }, // Emerald Green
  { fill: '#6366f1', border: '#4f46e5', shadow: '#4338ca', text: '#312e81', stamp: '#e0e7ff' }, // Indigo Purple
];

const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const PlayMode: React.FC<PlayModeProps> = ({ onBackToTeacher, initialPin = '' }) => {
  const [pin, setPin] = useState(initialPin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameLoaded, setGameLoaded] = useState(false);

  // States Multiplayer
  const [teamName, setTeamName] = useState('');
  const [teamRegistered, setTeamRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  // States gameplay
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [pairs, setPairs] = useState<PuzzlePair[]>([]);
  const [pieces, setPieces] = useState<PlayablePiece[]>([]);
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);

  // States tính giờ & Responsive Scale
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [scaleFactor, setScaleFactor] = useState(1.0);
  const [errorCell, setErrorCell] = useState<{row: number, col: number} | null>(null);

  // Kích thước Puzzle Jigsaw cơ bản
  const pieceW = 260;
  const pieceH = 130;
  const snapThreshold = 25; // snap distance

  // Lưu trữ vị trí kéo
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ time: 0, x: 0, y: 0 });

  // Định nghĩa tọa độ các chữ số cho Number Jigsaw (để đồng bộ)
  const numberTemplates = useMemo(() => {
    const dict: Record<string, any[]> = {};
    dict['1'] = [
      { pairOffset: 0, isQuestion: true, colorIndex: 0, points: [{x: 40, y: 130}, {x: 100, y: 55}, {x: 160, y: 55}, {x: 160, y: 145}, {x: 100, y: 145}], edges: ['none', 'none', 'none', 'male', 'none'], textCenter: {x: 110, y: 100} },
      { pairOffset: 0, isQuestion: false, colorIndex: 1, points: [{x: 160, y: 145}, {x: 160, y: 55}, {x: 160, y: 225}, {x: 100, y: 225}, {x: 100, y: 145}], edges: ['none', 'none', 'male', 'none', 'female'], textCenter: {x: 135, y: 185} },
      { pairOffset: 1, isQuestion: true, colorIndex: 2, points: [{x: 100, y: 225}, {x: 160, y: 225}, {x: 160, y: 315}, {x: 100, y: 315}], edges: ['female', 'none', 'male', 'none'], textCenter: {x: 130, y: 270} },
      { pairOffset: 1, isQuestion: false, colorIndex: 3, points: [{x: 100, y: 315}, {x: 160, y: 315}, {x: 215, y: 315}, {x: 215, y: 375}, {x: 45, y: 375}, {x: 45, y: 315}], edges: ['none', 'none', 'none', 'none', 'none', 'female'], textCenter: {x: 130, y: 350} }
    ];
    dict['2'] = [
      { pairOffset: 0, isQuestion: true, colorIndex: 0, points: [{x: 40, y: 135}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 125}], edges: ['none', 'none', 'male', 'none'], textCenter: {x: 90, y: 90} },
      { pairOffset: 0, isQuestion: false, colorIndex: 1, points: [{x: 145, y: 125}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 140}, {x: 145, y: 140}], edges: ['female', 'none', 'none', 'male', 'none'], textCenter: {x: 195, y: 90} },
      { pairOffset: 1, isQuestion: true, colorIndex: 2, points: [{x: 145, y: 140}, {x: 245, y: 140}, {x: 245, y: 220}, {x: 145, y: 220}], edges: ['female', 'none', 'male', 'none'], textCenter: {x: 195, y: 180} },
      { pairOffset: 1, isQuestion: false, colorIndex: 3, points: [{x: 145, y: 220}, {x: 245, y: 220}, {x: 245, y: 300}, {x: 145, y: 300}, {x: 80, y: 300}, {x: 80, y: 220}], edges: ['female', 'none', 'none', 'none', 'male', 'none'], textCenter: {x: 175, y: 260} },
      { pairOffset: 2, isQuestion: true, colorIndex: 4, points: [{x: 80, y: 220}, {x: 80, y: 300}, {x: 145, y: 300}, {x: 145, y: 375}, {x: 40, y: 375}, {x: 40, y: 300}], edges: ['none', 'none', 'none', 'none', 'none', 'female'], textCenter: {x: 65, y: 335} },
      { pairOffset: 2, isQuestion: false, colorIndex: 1, points: [{x: 145, y: 300}, {x: 245, y: 300}, {x: 245, y: 375}, {x: 145, y: 375}], edges: ['none', 'none', 'none', 'none'], textCenter: {x: 195, y: 338} }
    ];
    dict['0'] = [
      { pairOffset: 0, isQuestion: true, colorIndex: 0, points: [{x: 40, y: 140}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 140}, {x: 100, y: 140}, {x: 100, y: 110}, {x: 80, y: 110}, {x: 80, y: 140}], edges: ['none', 'none', 'male', 'none', 'none', 'none', 'none', 'none'], textCenter: {x: 95, y: 80} },
      { pairOffset: 0, isQuestion: false, colorIndex: 3, points: [{x: 145, y: 140}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 140}, {x: 205, y: 140}, {x: 205, y: 110}, {x: 185, y: 110}, {x: 185, y: 140}], edges: ['female', 'none', 'none', 'none', 'none', 'none', 'none', 'male'], textCenter: {x: 195, y: 80} },
      { pairOffset: 1, isQuestion: true, colorIndex: 1, points: [{x: 40, y: 265}, {x: 40, y: 140}, {x: 100, y: 140}, {x: 100, y: 265}], edges: ['none', 'none', 'none', 'male'], textCenter: {x: 70, y: 200} },
      { pairOffset: 1, isQuestion: false, colorIndex: 2, points: [{x: 185, y: 265}, {x: 185, y: 140}, {x: 245, y: 140}, {x: 245, y: 265}], edges: ['none', 'none', 'none', 'female'], textCenter: {x: 215, y: 200} },
      { pairOffset: 2, isQuestion: true, colorIndex: 4, points: [{x: 40, y: 375}, {x: 40, y: 265}, {x: 100, y: 265}, {x: 100, y: 315}, {x: 145, y: 315}, {x: 145, y: 375}], edges: ['none', 'none', 'none', 'none', 'male', 'none'], textCenter: {x: 92, y: 345} },
      { pairOffset: 2, isQuestion: false, colorIndex: 0, points: [{x: 145, y: 375}, {x: 145, y: 315}, {x: 185, y: 315}, {x: 185, y: 265}, {x: 245, y: 265}, {x: 245, y: 375}], edges: ['female', 'none', 'none', 'none', 'none', 'none'], textCenter: {x: 195, y: 345} }
    ];
    dict['5'] = [
      { pairOffset: 0, isQuestion: true, colorIndex: 4, points: [{x: 40, y: 135}, {x: 40, y: 50}, {x: 245, y: 50}, {x: 245, y: 110}, {x: 110, y: 110}, {x: 110, y: 135}], edges: ['none', 'none', 'none', 'none', 'male', 'none'], textCenter: {x: 140, y: 80} },
      { pairOffset: 0, isQuestion: false, colorIndex: 2, points: [{x: 110, y: 135}, {x: 110, y: 110}, {x: 245, y: 110}, {x: 245, y: 190}, {x: 110, y: 190}], edges: ['female', 'none', 'none', 'male', 'none'], textCenter: {x: 175, y: 150} },
      { pairOffset: 1, isQuestion: true, colorIndex: 0, points: [{x: 110, y: 190}, {x: 245, y: 190}, {x: 245, y: 270}, {x: 110, y: 270}], edges: ['female', 'none', 'male', 'none'], textCenter: {x: 175, y: 230} },
      { pairOffset: 1, isQuestion: false, colorIndex: 1, points: [{x: 40, y: 190}, {x: 110, y: 190}, {x: 110, y: 270}, {x: 40, y: 270}], edges: ['none', 'none', 'none', 'male'], textCenter: {x: 75, y: 230} },
      { pairOffset: 2, isQuestion: true, colorIndex: 3, points: [{x: 40, y: 270}, {x: 110, y: 270}, {x: 110, y: 375}, {x: 40, y: 375}], edges: ['female', 'none', 'none', 'none'], textCenter: {x: 75, y: 320} },
      { pairOffset: 2, isQuestion: false, colorIndex: 0, points: [{x: 110, y: 270}, {x: 245, y: 270}, {x: 245, y: 375}, {x: 110, y: 375}], edges: ['none', 'none', 'none', 'none'], textCenter: {x: 175, y: 320} }
    ];
    dict['8'] = [
      { pairOffset: 0, isQuestion: true, colorIndex: 0, points: [{x: 40, y: 130}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 130}], edges: ['none', 'none', 'male', 'none'], textCenter: {x: 90, y: 90} },
      { pairOffset: 0, isQuestion: false, colorIndex: 1, points: [{x: 145, y: 130}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 130}], edges: ['female', 'none', 'none', 'male'], textCenter: {x: 195, y: 90} },
      { pairOffset: 1, isQuestion: true, colorIndex: 2, points: [{x: 40, y: 210}, {x: 40, y: 130}, {x: 145, y: 130}, {x: 145, y: 210}], edges: ['none', 'female', 'male', 'none'], textCenter: {x: 90, y: 170} },
      { pairOffset: 1, isQuestion: false, colorIndex: 3, points: [{x: 145, y: 210}, {x: 145, y: 130}, {x: 245, y: 130}, {x: 245, y: 210}], edges: ['female', 'none', 'none', 'male'], textCenter: {x: 195, y: 170} },
      { pairOffset: 2, isQuestion: true, colorIndex: 4, points: [{x: 40, y: 290}, {x: 40, y: 210}, {x: 145, y: 210}, {x: 145, y: 290}], edges: ['none', 'female', 'male', 'none'], textCenter: {x: 90, y: 250} },
      { pairOffset: 2, isQuestion: false, colorIndex: 0, points: [{x: 145, y: 290}, {x: 145, y: 210}, {x: 245, y: 210}, {x: 245, y: 290}], edges: ['female', 'none', 'none', 'male'], textCenter: {x: 195, y: 250} },
      { pairOffset: 3, isQuestion: true, colorIndex: 1, points: [{x: 40, y: 375}, {x: 40, y: 290}, {x: 145, y: 290}, {x: 145, y: 375}], edges: ['none', 'female', 'male', 'none'], textCenter: {x: 90, y: 330} },
      { pairOffset: 3, isQuestion: false, colorIndex: 2, points: [{x: 145, y: 375}, {x: 145, y: 290}, {x: 245, y: 290}, {x: 245, y: 375}], edges: ['female', 'none', 'none', 'none'], textCenter: {x: 195, y: 330} }
    ];
    dict['3'] = [
      { pairOffset: 0, isQuestion: true, colorIndex: 0, points: [{x: 40, y: 120}, {x: 40, y: 50}, {x: 245, y: 50}, {x: 245, y: 120}], edges: ['none', 'none', 'none', 'male'], textCenter: {x: 140, y: 85} },
      { pairOffset: 0, isQuestion: false, colorIndex: 1, points: [{x: 40, y: 120}, {x: 245, y: 120}, {x: 245, y: 190}, {x: 120, y: 190}, {x: 120, y: 120}], edges: ['female', 'none', 'male', 'none', 'none'], textCenter: {x: 180, y: 155} },
      { pairOffset: 1, isQuestion: true, colorIndex: 2, points: [{x: 120, y: 190}, {x: 245, y: 190}, {x: 245, y: 260}, {x: 120, y: 260}], edges: ['female', 'none', 'female', 'none'], textCenter: {x: 180, y: 225} },
      { pairOffset: 1, isQuestion: false, colorIndex: 3, points: [{x: 120, y: 260}, {x: 245, y: 260}, {x: 245, y: 330}, {x: 120, y: 330}], edges: ['male', 'none', 'male', 'none'], textCenter: {x: 180, y: 295} },
      { pairOffset: 2, isQuestion: true, colorIndex: 4, points: [{x: 40, y: 375}, {x: 40, y: 330}, {x: 120, y: 330}, {x: 120, y: 375}], edges: ['none', 'none', 'female', 'none'], textCenter: {x: 80, y: 350} },
      { pairOffset: 2, isQuestion: false, colorIndex: 0, points: [{x: 120, y: 330}, {x: 245, y: 330}, {x: 245, y: 375}, {x: 120, y: 375}], edges: ['female', 'none', 'none', 'none'], textCenter: {x: 180, y: 350} }
    ];
    dict['9'] = [
      { pairOffset: 0, isQuestion: true, colorIndex: 2, points: [{x: 40, y: 140}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 140}], edges: ['none', 'none', 'male', 'none'], textCenter: {x: 90, y: 95} },
      { pairOffset: 0, isQuestion: false, colorIndex: 1, points: [{x: 145, y: 140}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 140}], edges: ['female', 'none', 'none', 'male'], textCenter: {x: 195, y: 95} },
      { pairOffset: 1, isQuestion: true, colorIndex: 0, points: [{x: 40, y: 230}, {x: 40, y: 140}, {x: 145, y: 140}, {x: 145, y: 230}], edges: ['none', 'female', 'male', 'none'], textCenter: {x: 90, y: 185} },
      { pairOffset: 1, isQuestion: false, colorIndex: 3, points: [{x: 145, y: 230}, {x: 145, y: 140}, {x: 245, y: 140}, {x: 245, y: 230}], edges: ['female', 'none', 'none', 'male'], textCenter: {x: 195, y: 185} },
      { pairOffset: 2, isQuestion: true, colorIndex: 4, points: [{x: 145, y: 375}, {x: 145, y: 230}, {x: 245, y: 230}, {x: 245, y: 375}], edges: ['none', 'female', 'none', 'none'], textCenter: {x: 195, y: 300} },
      { pairOffset: 2, isQuestion: false, colorIndex: 2, points: [{x: 45, y: 375}, {x: 45, y: 320}, {x: 145, y: 320}, {x: 145, y: 375}], edges: ['none', 'none', 'none', 'none'], textCenter: {x: 95, y: 348} }
    ];
    dict['4'] = [
      { pairOffset: 0, isQuestion: true, colorIndex: 0, points: [{x: 40, y: 140}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 140}], edges: ['none', 'none', 'male', 'none'], textCenter: {x: 92, y: 95} },
      { pairOffset: 0, isQuestion: false, colorIndex: 1, points: [{x: 145, y: 140}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 140}], edges: ['female', 'none', 'none', 'male'], textCenter: {x: 195, y: 95} },
      { pairOffset: 1, isQuestion: true, colorIndex: 2, points: [{x: 40, y: 220}, {x: 40, y: 140}, {x: 145, y: 140}, {x: 145, y: 220}], edges: ['none', 'female', 'male', 'none'], textCenter: {x: 92, y: 180} },
      { pairOffset: 1, isQuestion: false, colorIndex: 3, points: [{x: 145, y: 220}, {x: 145, y: 140}, {x: 245, y: 140}, {x: 245, y: 220}], edges: ['female', 'none', 'none', 'male'], textCenter: {x: 195, y: 180} },
      { pairOffset: 2, isQuestion: true, colorIndex: 4, points: [{x: 145, y: 375}, {x: 145, y: 220}, {x: 245, y: 220}, {x: 245, y: 375}], edges: ['none', 'female', 'none', 'none'], textCenter: {x: 195, y: 297} },
      { pairOffset: 2, isQuestion: false, colorIndex: 1, points: [{x: 40, y: 300}, {x: 40, y: 220}, {x: 145, y: 220}, {x: 145, y: 300}], edges: ['none', 'none', 'none', 'none'], textCenter: {x: 92, y: 260} }
    ];
    dict['6'] = [
      { pairOffset: 0, isQuestion: true, colorIndex: 4, points: [{x: 40, y: 130}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 130}], edges: ['none', 'none', 'male', 'none'], textCenter: {x: 92, y: 90} },
      { pairOffset: 0, isQuestion: false, colorIndex: 0, points: [{x: 145, y: 130}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 130}], edges: ['female', 'none', 'none', 'none'], textCenter: {x: 195, y: 90} },
      { pairOffset: 1, isQuestion: true, colorIndex: 1, points: [{x: 40, y: 250}, {x: 40, y: 130}, {x: 145, y: 130}, {x: 145, y: 250}], edges: ['none', 'none', 'male', 'none'], textCenter: {x: 92, y: 190} },
      { pairOffset: 1, isQuestion: false, colorIndex: 2, points: [{x: 145, y: 250}, {x: 145, y: 130}, {x: 245, y: 130}, {x: 245, y: 250}], edges: ['female', 'none', 'none', 'male'], textCenter: {x: 195, y: 190} },
      { pairOffset: 2, isQuestion: true, colorIndex: 3, points: [{x: 40, y: 375}, {x: 40, y: 250}, {x: 145, y: 250}, {x: 145, y: 375}], edges: ['none', 'none', 'male', 'none'], textCenter: {x: 92, y: 312} },
      { pairOffset: 2, isQuestion: false, colorIndex: 4, points: [{x: 145, y: 375}, {x: 145, y: 250}, {x: 245, y: 250}, {x: 245, y: 375}], edges: ['female', 'none', 'none', 'none'], textCenter: {x: 195, y: 312} }
    ];
    dict['7'] = [
      { pairOffset: 0, isQuestion: true, colorIndex: 1, points: [{x: 40, y: 120}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 120}], edges: ['none', 'none', 'male', 'none'], textCenter: {x: 92, y: 85} },
      { pairOffset: 0, isQuestion: false, colorIndex: 2, points: [{x: 145, y: 120}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 120}], edges: ['female', 'none', 'none', 'male'], textCenter: {x: 195, y: 85} },
      { pairOffset: 1, isQuestion: true, colorIndex: 3, points: [{x: 145, y: 210}, {x: 245, y: 120}, {x: 245, y: 210}, {x: 145, y: 210}], edges: ['none', 'none', 'none', 'male'], textCenter: {x: 195, y: 165} },
      { pairOffset: 1, isQuestion: false, colorIndex: 4, points: [{x: 100, y: 210}, {x: 145, y: 210}, {x: 245, y: 210}, {x: 200, y: 300}, {x: 100, y: 300}], edges: ['none', 'none', 'none', 'male', 'none'], textCenter: {x: 160, y: 255} },
      { pairOffset: 2, isQuestion: true, colorIndex: 0, points: [{x: 100, y: 300}, {x: 200, y: 300}, {x: 160, y: 375}, {x: 60, y: 375}], edges: ['none', 'none', 'none', 'none'], textCenter: {x: 130, y: 337} },
      { pairOffset: 2, isQuestion: false, colorIndex: 1, points: [{x: 145, y: 120}, {x: 145, y: 210}, {x: 100, y: 210}, {x: 100, y: 120}], edges: ['none', 'male', 'none', 'none'], textCenter: {x: 122, y: 165} }
    ];
    return dict;
  }, []);

  // Tải game từ mã PIN
  const handleLoadGame = async (pinCode: string) => {
    if (!pinCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loadGameFromCloud(pinCode.trim());
      setSettings(data.settings);
      setPairs(data.pairs);
      setGameLoaded(true);
    } catch (err: any) {
      setError(err.message || 'Mã PIN không đúng hoặc đã xảy ra lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPin) {
      handleLoadGame(initialPin);
    }
  }, [initialPin]);

  // Đăng ký tên đội chơi
  const handleRegisterTeam = async () => {
    if (!teamName.trim() || !settings) return;
    setRegistering(true);
    setError(null);
    try {
      // Đăng ký lên Firebase
      const computedPieces = getPlayablePiecesConfig(settings, pairs);
      await registerTeam(pin, teamName.trim(), computedPieces.length);
      setTeamRegistered(true);
      initializePieces(settings, pairs);
      setStartTime(Date.now());
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng ký tên đội chơi.');
    } finally {
      setRegistering(false);
    }
  };

  // Tính toán thời gian trôi qua
  useEffect(() => {
    if (!startTime || gameCompleted) return;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, gameCompleted]);

  // Lắng nghe đồng bộ mảnh ghép thời gian thực từ Realtime Database
  useEffect(() => {
    if (!gameLoaded || !teamRegistered || !pin || !teamName) return;

    const unsubscribe = listenToSessionRealtime(pin, (event) => {
      const targetPathPrefix = `/teams/${teamName}`;
      if (!event.path.startsWith(targetPathPrefix)) return;

      // 1. Cập nhật một mảnh ghép cụ thể
      // path dạng: /teams/Team_A/pieces/pieceId
      const pieceMatch = event.path.match(new RegExp(`^/teams/${teamName}/pieces/([^/]+)$`));
      if (pieceMatch && event.data) {
        const pieceId = pieceMatch[1];
        if (activeDraggingId === pieceId) return;

        const updatedData = event.data;
        setPieces((prev) =>
          prev.map((p) => {
            if (p.id !== pieceId) return p;
            const updated: any = {
              ...p,
              currentX: updatedData.x,
              currentY: updatedData.y,
              isSnapped: updatedData.isSnapped,
            };
            if (updatedData.rotation !== undefined) {
              if (p.type === 'tarsia') {
                updated.tarsiaRotation = updatedData.rotation;
              } else if (p.type === 'domino') {
                updated.dominoRotation = updatedData.rotation;
              }
            }
            return updated;
          })
        );
      }

      // 2. Đồng bộ toàn bộ danh sách mảnh ghép
      // path dạng: /teams/Team_A hoặc /teams/Team_A/pieces
      if (event.path === `/teams/${teamName}` && event.data?.pieces) {
        const incomingPieces = event.data.pieces;
        setPieces((prev) =>
          prev.map((p) => {
            if (activeDraggingId === p.id) return p;
            const incoming = incomingPieces[p.id];
            if (incoming) {
              const updated: any = {
                ...p,
                currentX: incoming.x,
                currentY: incoming.y,
                isSnapped: incoming.isSnapped,
              };
              if (incoming.rotation !== undefined) {
                if (p.type === 'tarsia') {
                  updated.tarsiaRotation = incoming.rotation;
                } else if (p.type === 'domino') {
                  updated.dominoRotation = incoming.rotation;
                }
              }
              return updated;
            }
            return p;
          })
        );
      } else if (event.path === `/teams/${teamName}/pieces` && event.data) {
        const incomingPieces = event.data;
        setPieces((prev) =>
          prev.map((p) => {
            if (activeDraggingId === p.id) return p;
            const incoming = incomingPieces[p.id];
            if (incoming) {
              const updated: any = {
                ...p,
                currentX: incoming.x,
                currentY: incoming.y,
                isSnapped: incoming.isSnapped,
              };
              if (incoming.rotation !== undefined) {
                if (p.type === 'tarsia') {
                  updated.tarsiaRotation = incoming.rotation;
                } else if (p.type === 'domino') {
                  updated.dominoRotation = incoming.rotation;
                }
              }
              return updated;
            }
            return p;
          })
        );
      }

      // 3. Đồng bộ trạng thái hoàn thành game từ máy khác
      if (event.path === `/teams/${teamName}/completed` && event.data === true) {
        setGameCompleted(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [gameLoaded, teamRegistered, pin, teamName, activeDraggingId]);

  // Helpers tính toán tọa độ Tarsia giống TarsiaView
  const getTarsiaTriangles = (tarsiaShape: string) => {
    const list: { vertices: {x: number, y: number}[] }[] = [];
    const sideLength = 170;
    const height = sideLength * Math.sqrt(3) / 2;

    const addTri = (u: number, v: number, isPointingUp: boolean) => {
      const cx = u * (sideLength / 2);
      const cy = v * (height / 3);
      let vertices = [];
      if (isPointingUp) {
        vertices = [
          { x: cx, y: cy - height * 2 / 3 },
          { x: cx + sideLength / 2, y: cy + height / 3 },
          { x: cx - sideLength / 2, y: cy + height / 3 },
        ];
      } else {
        vertices = [
          { x: cx, y: cy + height * 2 / 3 },
          { x: cx - sideLength / 2, y: cy - height / 3 },
          { x: cx + sideLength / 2, y: cy - height / 3 },
        ];
      }
      list.push({ vertices });
    };

    if (tarsiaShape === 'triangle_4') {
      addTri(0, 2, true);
      addTri(-1, 5, true);
      addTri(0, 4, false);
      addTri(1, 5, true);
    } else if (tarsiaShape === 'triangle_9') {
      addTri(0, 2, true);
      addTri(-1, 5, true);
      addTri(0, 4, false);
      addTri(1, 5, true);
      addTri(-2, 8, true);
      addTri(-1, 7, false);
      addTri(0, 8, true);
      addTri(1, 7, false);
      addTri(2, 8, true);
    } else if (tarsiaShape === 'triangle_16') {
      addTri(0, 2, true);
      addTri(-1, 5, true);
      addTri(0, 4, false);
      addTri(1, 5, true);
      addTri(-2, 8, true);
      addTri(-1, 7, false);
      addTri(0, 8, true);
      addTri(1, 7, false);
      addTri(2, 8, true);
      addTri(-3, 11, true);
      addTri(-2, 10, false);
      addTri(-1, 11, true);
      addTri(0, 10, false);
      addTri(1, 11, true);
      addTri(2, 10, false);
      addTri(3, 11, true);
    } else if (tarsiaShape === 'parallelogram_10') {
      addTri(0, 2, true);
      addTri(1, 1, false);
      addTri(2, 2, true);
      addTri(3, 1, false);
      addTri(4, 2, true);
      addTri(0, 4, false);
      addTri(1, 5, true);
      addTri(2, 4, false);
      addTri(3, 5, true);
      addTri(4, 4, false);
    } else if (tarsiaShape === 'hexagon_6') {
      for (let k = 0; k < 6; k++) {
        const theta1 = (k * Math.PI) / 3;
        const theta2 = ((k + 1) * Math.PI) / 3;
        list.push({ vertices: [
          { x: 0, y: 0 },
          { x: sideLength * Math.cos(theta1), y: sideLength * Math.sin(theta1) },
          { x: sideLength * Math.cos(theta2), y: sideLength * Math.sin(theta2) }
        ]});
      }
    } else if (tarsiaShape === 'star') {
      const wingRadius = sideLength * Math.sqrt(3);
      for (let k = 0; k < 6; k++) {
        const theta1 = (k * Math.PI) / 3;
        const theta2 = ((k + 1) * Math.PI) / 3;
        const thetaWing = (k * Math.PI) / 3 + Math.PI / 6;
        const P0 = { x: 0, y: 0 };
        const P1 = { x: sideLength * Math.cos(theta1), y: sideLength * Math.sin(theta1) };
        const P2 = { x: sideLength * Math.cos(theta2), y: sideLength * Math.sin(theta2) };
        const P3 = { x: wingRadius * Math.cos(thetaWing), y: wingRadius * Math.sin(thetaWing) };
        list.push({ vertices: [P0, P1, P2] });
        list.push({ vertices: [P1, P2, P3] });
      }
    } else if (tarsiaShape === 'trapezoid_6') {
      addTri(0, 2, true);
      addTri(1, 1, false);
      addTri(2, 2, true);
      addTri(3, 1, false);
      addTri(4, 2, true);
      addTri(5, 1, false);
    } else if (tarsiaShape === 'chevron_12') {
      // Cánh phải
      addTri(0, 2, true);
      addTri(1, 1, false);
      addTri(2, 2, true);
      addTri(3, 1, false);
      addTri(4, 2, true);
      addTri(5, 1, false);
      // Cánh trái
      addTri(-1, 1, false);
      addTri(-2, 2, true);
      addTri(-3, 1, false);
      addTri(-4, 2, true);
      addTri(-5, 1, false);
      addTri(-6, 2, true);
    } else if (tarsiaShape === 'chevron_8') {
      // Cánh phải
      addTri(0, 2, true);
      addTri(1, 1, false);
      addTri(2, 2, true);
      addTri(3, 1, false);
      // Cánh trái
      addTri(-1, 1, false);
      addTri(-2, 2, true);
      addTri(-3, 1, false);
      addTri(-4, 2, true);
    } else if (tarsiaShape === 'trapezoid_5') {
      addTri(0, 2, true);
      addTri(1, 1, false);
      addTri(2, 2, true);
      addTri(3, 1, false);
      addTri(4, 2, true);
    } else if (tarsiaShape === 'fish_12') {
      addTri(0, 2, true);
      addTri(-1, 5, true);
      addTri(0, 4, false);
      addTri(1, 5, true);
      addTri(-2, 8, true);
      addTri(-1, 7, false);
      addTri(0, 8, true);
      addTri(1, 7, false);
      addTri(2, 8, true);
      addTri(-1, 11, true);
      addTri(0, 10, false);
      addTri(1, 11, true);
    } else if (tarsiaShape === 'rhombus') {
      // Nửa trên
      addTri(0, 2, true);
      addTri(-1, 5, true);
      addTri(0, 4, false);
      addTri(1, 5, true);
      // Nửa dưới
      addTri(0, 10, false);
      addTri(-1, 7, false);
      addTri(0, 8, true);
      addTri(1, 7, false);
    } else if (tarsiaShape === 'heart_12') {
      // Đuôi nhọn dưới (3 mảnh)
      addTri(0, 10, false);
      addTri(-1, 11, true);
      addTri(1, 11, true);
      // Thân giữa (5 mảnh)
      addTri(-2, 8, true);
      addTri(-1, 7, false);
      addTri(0, 8, true);
      addTri(1, 7, false);
      addTri(2, 8, true);
      // Tai trái (2 mảnh)
      addTri(-1, 5, true);
      addTri(-2, 4, false);
      // Tai phải (2 mảnh)
      addTri(1, 5, true);
      addTri(2, 4, false);
    } else if (tarsiaShape === 'heart_18') {
      // Hàng dưới cùng (1 mảnh hướng xuống)
      addTri(0, 11, false);
      // Hàng 3 (3 mảnh)
      addTri(-1, 8, false);
      addTri(0, 9, true);
      addTri(1, 8, false);
      // Hàng 2 (5 mảnh)
      addTri(-2, 5, false);
      addTri(-1, 6, true);
      addTri(0, 5, false);
      addTri(1, 6, true);
      addTri(2, 5, false);
      // Hàng 1 (7 mảnh)
      addTri(-3, 2, false);
      addTri(-2, 3, true);
      addTri(-1, 2, false);
      addTri(0, 3, true);
      addTri(1, 2, false);
      addTri(2, 3, true);
      addTri(3, 2, false);
      // Tai trái (1 mảnh)
      addTri(-2, 0, true);
      // Tai phải (1 mảnh)
      addTri(2, 0, true);
    }
    return list;
  };

  const getTarsiaMappedData = (tarsiaShape: string, gamePairs: PuzzlePair[]) => {
    const rawTriangles = getTarsiaTriangles(tarsiaShape);
    const sideLength = 170;
    const height = sideLength * Math.sqrt(3) / 2;

    const points: {x: number, y: number}[] = [];
    rawTriangles.forEach(t => points.push(...t.vertices));

    const uniquePoints: {x: number, y: number}[] = [];
    const getPointId = (p: {x: number, y: number}): number => {
      for (let i = 0; i < uniquePoints.length; i++) {
        const u = uniquePoints[i];
        if (Math.hypot(p.x - u.x, p.y - u.y) < 1.0) return i;
      }
      uniquePoints.push(p);
      return uniquePoints.length - 1;
    };

    const trisWithIds = rawTriangles.map((t, idx) => {
      const ids = t.vertices.map(v => getPointId(v));
      const cx = (t.vertices[0].x + t.vertices[1].x + t.vertices[2].x) / 3;
      const cy = (t.vertices[0].y + t.vertices[1].y + t.vertices[2].y) / 3;
      const isPointingUp = t.vertices[0].y < t.vertices[1].y;
      return { id: idx, vertices: t.vertices, pointIds: ids, center: { x: cx, y: cy }, isPointingUp };
    });

    const edgeCounts: Record<string, number> = {};
    const edgeTriangles: Record<string, number[]> = {};

    trisWithIds.forEach(t => {
      const sides = [[t.pointIds[0], t.pointIds[1]], [t.pointIds[1], t.pointIds[2]], [t.pointIds[2], t.pointIds[0]]];
      sides.forEach(side => {
        const key = `${Math.min(side[0], side[1])}_${Math.max(side[0], side[1])}`;
        edgeCounts[key] = (edgeCounts[key] || 0) + 1;
        if (!edgeTriangles[key]) edgeTriangles[key] = [];
        edgeTriangles[key].push(t.id);
      });
    });

    const internalEdges = Object.keys(edgeCounts).filter(key => edgeCounts[key] === 2);
    internalEdges.sort((a, b) => {
      const parseEdge = (key: string) => {
        const [id1, id2] = key.split('_').map(Number);
        return { midX: (uniquePoints[id1].x + uniquePoints[id2].x) / 2, midY: (uniquePoints[id1].y + uniquePoints[id2].y) / 2 };
      };
      const edgeA = parseEdge(a);
      const edgeB = parseEdge(b);
      return Math.abs(edgeA.midY - edgeB.midY) > 0.5 ? edgeA.midY - edgeB.midY : edgeA.midX - edgeB.midX;
    });

    const edgeToPairMap: Record<string, any> = {};
    internalEdges.forEach((key, idx) => {
      if (idx < gamePairs.length) {
        edgeToPairMap[key] = { pair: gamePairs[idx], pairIndex: idx };
      }
    });

    return trisWithIds.map(t => {
      const matchedSides: any[] = [null, null, null];
      const sides = [[t.pointIds[0], t.pointIds[1]], [t.pointIds[1], t.pointIds[2]], [t.pointIds[2], t.pointIds[0]]];
      
      sides.forEach((side, sideIdx) => {
        const key = `${Math.min(side[0], side[1])}_${Math.max(side[0], side[1])}`;
        if (edgeToPairMap[key]) {
          const { pair } = edgeToPairMap[key];
          const isQuestion = edgeTriangles[key][0] === t.id;
          matchedSides[sideIdx] = {
            pairId: pair.id,
            isQuestion,
            text: isQuestion ? pair.question : pair.answer,
            code: pair.code,
          };
        }
      });

      return {
        id: t.id,
        vertices: t.vertices,
        center: t.center,
        isPointingUp: t.isPointingUp,
        sides: matchedSides,
      };
    });
  };

  // Helper tính toán các mảnh ghép Number Jigsaw (đã có Dynamic Offset)
  const getNumberPieces = (numberShape: string, gamePairs: PuzzlePair[]) => {
    const cleanShape = numberShape.trim();
    const list: any[] = [];
    const getOffsetPoints = (pts: {x: number, y: number}[], dx: number) => pts.map(p => ({ x: p.x + dx, y: p.y }));

    if (cleanShape.length === 2) {
      const char1 = cleanShape[0];
      const char2 = cleanShape[1];
      const t1 = numberTemplates[char1] || numberTemplates['2'];
      const t2 = numberTemplates[char2] || numberTemplates['0'];
      const t1PairsUsed = Math.max(...t1.map(p => p.pairOffset)) + 1;

      // Dynamic Offset (Phần 4)
      const offsetDx = char1 === '1' ? 220 : 260;

      t1.forEach((p, idx) => {
        list.push({ ...p, id: `digit1-${char1}-${idx}`, pairOffset: p.pairOffset % gamePairs.length, absolutePoints: p.points, absoluteCenter: p.textCenter });
      });

      t2.forEach((p, idx) => {
        list.push({ ...p, id: `digit2-${char2}-${idx}`, pairOffset: (p.pairOffset + t1PairsUsed) % gamePairs.length, absolutePoints: getOffsetPoints(p.points, offsetDx), absoluteCenter: { x: p.textCenter.x + offsetDx, y: p.textCenter.y } });
      });
    } else {
      const singleChar = cleanShape.length > 0 ? cleanShape[0] : '2';
      const tSingle = numberTemplates[singleChar] || numberTemplates['2'];
      tSingle.forEach((p, idx) => {
        list.push({ ...p, id: `single-${singleChar}-${idx}`, pairOffset: p.pairOffset % gamePairs.length, absolutePoints: p.points, absoluteCenter: p.textCenter });
      });
    }
    return list;
  };

  // Trích xuất cấu trúc Playable Pieces của từng loại game phục vụ snap
  const getPlayablePiecesConfig = (gameSettings: GameSettings, gamePairs: PuzzlePair[]): PlayablePiece[] => {
    const list: PlayablePiece[] = [];
    
    if (gameSettings.puzzleType === 'tarsia') {
      const mappedTriangles = getTarsiaMappedData(gameSettings.tarsiaShape, gamePairs);
      
      mappedTriangles.forEach((t) => {
        let targetRot = t.isPointingUp ? 0 : 180;
        if (gameSettings.tarsiaShape === 'hexagon_6') {
          targetRot = (t.id * 60 + 300) % 360;
        } else if (gameSettings.tarsiaShape === 'star') {
          const k = Math.floor(t.id / 2);
          if (t.id % 2 === 0) {
            targetRot = (k * 60 + 300) % 360;
          } else {
            targetRot = (k * 60 + 120) % 360;
          }
        }

        const rotations = [0, 120, 240];
        const offset = rotations[(t.id * 7 + 3) % 3];
        const rotation = (targetRot + offset) % 360;

        list.push({
          id: `tarsia-tri-${t.id}`,
          type: 'tarsia',
          text: `Mảnh ${t.id + 1}`,
          code: '',
          targetX: t.center.x,
          targetY: t.center.y,
          currentX: 0,
          currentY: 0,
          isSnapped: false,
          tarsiaTriangleId: t.id,
          tarsiaSides: t.sides,
          tarsiaIsPointingUp: t.isPointingUp,
          tarsiaRotation: rotation,
          tarsiaTargetRotation: targetRot,
        });
      });
    } else if (gameSettings.puzzleType === 'domino') {
      const digits = (gameSettings.dominoShape || '26').replace(/\s/g, '').split('');
      const piecesList: any[] = [];
      let currentOffset = 50;
      let globalId = 0;

      digits.forEach((digit, dIdx) => {
        const rawLayout = DIGIT_LAYOUTS[digit] || DIGIT_LAYOUTS['2'];
        rawLayout.forEach((raw) => {
          piecesList.push({
            id: globalId++,
            x: raw.x + currentOffset,
            y: raw.y,
            rotation: raw.rotation,
            digitIndex: dIdx,
          });
        });
        currentOffset += 260;
      });

      // Auto-count from layout (no manual dominoPiecesCount needed)
      const dominoWidth = gameSettings.dominoWidth || 160;
      const dominoHeight = gameSettings.dominoHeight || 68;

      // Use all pieces from the layout
      const pieces = [...piecesList];

      const totalPieces = pieces.length;
      pieces.forEach((p, index) => {
        let leftText = '';
        let rightText = '';
        let leftCode = '';
        let rightCode = '';
        let hasLeft = false;
        let hasRight = false;

        if (index === 0) {
          leftText = 'START';
          hasLeft = true;
          if (gamePairs.length > 0) {
            rightText = gamePairs[0].question;
            rightCode = gamePairs[0].code;
            hasRight = true;
          }
        } else if (index === totalPieces - 1) {
          if (index - 1 < gamePairs.length) {
            leftText = gamePairs[index - 1].answer;
            leftCode = gamePairs[index - 1].code;
            hasLeft = true;
          }
          rightText = 'END';
          hasRight = true;
        } else {
          if (index - 1 < gamePairs.length) {
            leftText = gamePairs[index - 1].answer;
            leftCode = gamePairs[index - 1].code;
            hasLeft = true;
          }
          if (index < gamePairs.length) {
            rightText = gamePairs[index].question;
            rightCode = gamePairs[index].code;
            hasRight = true;
          }
        }

        list.push({
          id: `domino-piece-${p.id}`,
          type: 'domino',
          text: '',
          code: '',
          targetX: p.x,
          targetY: p.y,
          currentX: 0,
          currentY: 0,
          isSnapped: false,
          dominoId: p.id,
          dominoRotation: p.rotation,
          dominoLeftText: leftText,
          dominoRightText: rightText,
          dominoLeftCode: leftCode,
          dominoRightCode: rightCode,
          dominoHasLeft: hasLeft,
          dominoHasRight: hasRight,
        });
      });
    } else if (gameSettings.puzzleType === 'number_jigsaw') {
      const mappedNumbers = getNumberPieces(gameSettings.numberShape, gamePairs);
      mappedNumbers.forEach((p) => {
        const pair = gamePairs[p.pairOffset];
        list.push({
          id: `number-piece-${p.id}`,
          type: 'number',
          text: p.isQuestion ? pair.question : pair.answer,
          code: pair.code,
          targetX: p.absoluteCenter.x,
          targetY: p.absoluteCenter.y,
          currentX: 0,
          currentY: 0,
          isSnapped: false,
          numberPieceId: p.id,
          numberPoints: p.absolutePoints,
          numberEdges: p.edges,
          numberColorIndex: p.colorIndex,
          jigsawType: p.isQuestion ? 'question' : 'answer',
        });
      });
    } else if (gameSettings.puzzleType === 'math_maze') {
      const maze = generateMazeData(gamePairs, gameSettings);
      const cellW = 125;
      const cellH = 95;
      const gapX = 75;
      const gapY = 70;
      const strideX = cellW + gapX;
      const strideY = cellH + gapY;
      const padding = 60;

      maze.correctPath.forEach((p, idx) => {
        const isStart = idx === 0;
        const targetX = padding + p.col * strideX;
        const targetY = padding + p.row * strideY;
        const cellData = maze.cells[p.row][p.col];

        list.push({
          id: `maze-cell-${idx}`,
          type: 'maze_cell',
          text: cellData.question,
          code: cellData.answer,
          targetX: targetX,
          targetY: targetY,
          currentX: isStart ? targetX : 0,
          currentY: isStart ? targetY : 0,
          isSnapped: isStart,
          mazeCellRow: p.row,
          mazeCellCol: p.col,
          mazeCellIsCorrectPath: true,
          mazeCellCorrectPathIndex: idx,
        });
      });
    } else {
      // Jigsaw lồi lõm thông thường
      const cols = Math.min(gameSettings.columns || 2, gamePairs.length);
      const paddingX = 40, paddingY = 40;

      gamePairs.forEach((pair, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        list.push({
          id: `piece-q-${pair.id}`,
          type: 'jigsaw',
          jigsawType: 'question',
          origIndex: idx,
          text: pair.question,
          code: pair.code,
          targetX: col * (pieceW * 2 - 20) + paddingX,
          targetY: row * (pieceH + 30) + paddingY,
          currentX: 0,
          currentY: 0,
          isSnapped: false,
        });

        list.push({
          id: `piece-a-${pair.id}`,
          type: 'jigsaw',
          jigsawType: 'answer',
          origIndex: idx,
          text: pair.answer,
          code: pair.code,
          targetX: col * (pieceW * 2 - 20) + pieceW - 20 + paddingX,
          targetY: row * (pieceH + 30) + paddingY,
          currentX: 0,
          currentY: 0,
          isSnapped: false,
        });
      });
    }

    return list;
  };

  const initializePieces = async (gameSettings: GameSettings, gamePairs: PuzzlePair[]) => {
    const list = getPlayablePiecesConfig(gameSettings, gamePairs);
    
    // Xáo trộn vị trí xếp mảnh vào Pool
    const shuffledList = list.map((piece) => {
      const randX = 30 + Math.random() * (boardSize.w - 180);
      const randY = boardSize.h + 20 + Math.random() * 120;
      return {
        ...piece,
        currentX: randX,
        currentY: randY,
      };
    });

    setPieces(shuffledList);
    setGameCompleted(false);

    // Đồng bộ danh sách mảnh ghép khởi tạo lên Realtime Database để đồng đội join sau thấy cùng toạ độ
    if (teamName.trim()) {
      try {
        const config = getFirebaseConfig();
        if (config.projectId && config.projectId !== '') {
          const piecesObj: Record<string, any> = {};
          shuffledList.forEach((p) => {
            piecesObj[p.id] = { 
              x: p.currentX, 
              y: p.currentY, 
              isSnapped: p.isSnapped,
              rotation: p.type === 'tarsia' ? p.tarsiaRotation : p.type === 'domino' ? p.dominoRotation : undefined
            };
          });
          const url = `https://${config.projectId}-default-rtdb.firebaseio.com/sessions/${pin}/teams/${teamName.trim()}/pieces.json`;
          await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(piecesObj),
          });
        }
      } catch (e) {
        console.warn('Error syncing initial pieces to Realtime Database', e);
      }
    }
  };

  // Tính toán kích thước Bàn chơi Board (tự động theo type)
  const boardSize = useMemo(() => {
    if (!settings || pairs.length === 0) return { w: 800, h: 400 };

    if (settings.puzzleType === 'tarsia') {
      const rawTriangles = getTarsiaTriangles(settings.tarsiaShape);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      rawTriangles.forEach(t => {
        t.vertices.forEach(v => {
          if (v.x < minX) minX = v.x;
          if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
        });
      });
      const padding = 60;
      return {
        w: maxX - minX + padding * 2,
        h: maxY - minY + padding * 2,
        offsetX: -minX + padding,
        offsetY: -minY + padding,
      };
    } else if (settings.puzzleType === 'domino') {
      const digits = (settings.dominoShape || '26').replace(/\s/g, '').split('');
      const piecesList: any[] = [];
      let currentOffset = 50;
      let globalId = 0;

      digits.forEach((digit) => {
        const rawLayout = DIGIT_LAYOUTS[digit] || DIGIT_LAYOUTS['2'];
        rawLayout.forEach((raw) => {
          piecesList.push({
            id: globalId++,
            x: raw.x + currentOffset,
            y: raw.y,
            rotation: raw.rotation,
          });
        });
        currentOffset += 260;
      });

      // Auto-count from layout (no manual dominoPiecesCount needed)
      const dominoWidth = settings.dominoWidth || 160;
      const dominoHeight = settings.dominoHeight || 68;

      // Use all pieces from the layout
      const pieces = [...piecesList];

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      pieces.forEach((p) => {
        const halfW = dominoWidth / 2;
        const halfH = dominoHeight / 2;
        const pts = [
          { x: p.x - halfW, y: p.y - halfH },
          { x: p.x + halfW, y: p.y + halfH },
        ];
        pts.forEach(v => {
          if (v.x < minX) minX = v.x;
          if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
        });
      });

      const padding = 60;
      return {
        w: maxX - minX + padding * 2,
        h: maxY - minY + padding * 2,
        offsetX: -minX + padding,
        offsetY: -minY + padding,
      };
    } else if (settings.puzzleType === 'number_jigsaw') {
      const activePieces = getNumberPieces(settings.numberShape, pairs);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      activePieces.forEach(p => {
        p.absolutePoints.forEach((v: any) => {
          if (v.x < minX) minX = v.x;
          if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
        });
      });
      const padding = 60;
      return {
        w: maxX - minX + padding * 2,
        h: maxY - minY + padding * 2,
        offsetX: -minX + padding,
        offsetY: -minY + padding,
      };
    } else if (settings.puzzleType === 'math_maze') {
      const cellW = 125;
      const cellH = 95;
      const gapX = 75;
      const gapY = 70;
      const strideX = cellW + gapX;
      const strideY = cellH + gapY;
      const padding = 60;
      const cols = settings.mazeCols || 5;
      const rows = settings.mazeRows || 4;
      return {
        w: cols * strideX - gapX + padding * 2,
        h: rows * strideY - gapY + padding * 2,
        offsetX: 0,
        offsetY: 0,
      };
    } else {
      const cols = Math.min(settings.columns || 2, pairs.length);
      const rows = Math.ceil(pairs.length / cols);
      return {
        w: cols * (pieceW * 2 - 20) + 80,
        h: rows * (pieceH + 30) + 80,
      };
    }
  }, [settings, pairs]);

  // Giải thuật tự động co giãn Scale Zoom tự động trên di động (Phần 5)
  useEffect(() => {
    if (!gameLoaded || !teamRegistered) return;

    const handleResize = () => {
      const containerW = window.innerWidth - 32; // padding 16px hai bên
      const originalW = boardSize.w;
      if (containerW < originalW) {
        setScaleFactor(containerW / originalW);
      } else {
        setScaleFactor(1.0);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameLoaded, teamRegistered, boardSize.w]);

  // Chơi lại bộ game hiện tại (xáo trộn lại)
  const handleRestart = () => {
    if (settings) {
      initializePieces(settings, pairs);
      setStartTime(Date.now());
    }
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    const piece = pieces.find(p => p.id === id);
    if (!piece || piece.isSnapped) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const clientX = e.clientX;
    const clientY = e.clientY;

    dragStartRef.current = { time: Date.now(), x: clientX, y: clientY };

    dragOffsetRef.current = {
      x: clientX / scaleFactor - piece.currentX,
      y: clientY / scaleFactor - piece.currentY,
    };
    setActiveDraggingId(id);
  };

  const handlePointerMove = (e: React.PointerEvent, id: string) => {
    if (activeDraggingId !== id) return;
    const piece = pieces.find(p => p.id === id);
    if (!piece || piece.isSnapped) return;

    const newX = e.clientX / scaleFactor - dragOffsetRef.current.x;
    const newY = e.clientY / scaleFactor - dragOffsetRef.current.y;

    setPieces(prev => prev.map(p => p.id === id ? { ...p, currentX: newX, currentY: newY } : p));
  };

  const handlePointerUp = async (e: React.PointerEvent, id: string) => {
    if (activeDraggingId !== id) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setActiveDraggingId(null);

    const piece = pieces.find(p => p.id === id);
    if (!piece || piece.isSnapped) return;

    const duration = Date.now() - dragStartRef.current.time;
    const distMoved = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);

    // Phát hiện cử chỉ Click/Tap nhanh (duration < 250ms và hầu như không di chuyển)
    if (duration < 250 && distMoved < 6) {
      if (piece.type === 'tarsia') {
        const nextRot = (piece.tarsiaTriangleId === 0 && settings?.tarsiaShape === 'hexagon_core')
          ? ((piece.tarsiaRotation || 0) + 60) % 360
          : ((piece.tarsiaRotation || 0) + 120) % 360;

        const destX = piece.targetX + (boardSize.offsetX ?? 0);
        const destY = piece.targetY + (boardSize.offsetY ?? 0);
        const dist = Math.hypot(piece.currentX - destX, piece.currentY - destY);
        const targetRot = piece.tarsiaTargetRotation ?? 0;

        let snapNow = false;
        let fX = piece.currentX;
        let fY = piece.currentY;

        if (dist < snapThreshold && (nextRot % 360) === (targetRot % 360)) {
          snapNow = true;
          fX = destX;
          fY = destY;
        }

        const updatedPieces = pieces.map(p => p.id === id ? { 
          ...p, 
          tarsiaRotation: nextRot,
          currentX: fX,
          currentY: fY,
          isSnapped: snapNow 
        } : p);

        setPieces(updatedPieces);

        // Đồng bộ toạ độ và góc xoay mới lên Realtime Database
        updatePiecePositionOnCloud(pin, teamName, id, fX, fY, snapNow, nextRot);

        if (snapNow) {
          const snappedCount = updatedPieces.filter(p => p.isSnapped).length;
          const isCompleted = snappedCount === updatedPieces.length;
          if (teamRegistered && settings) {
            try {
              updateTeamProgress(
                pin,
                teamName,
                snappedCount,
                isCompleted,
                isCompleted ? Math.floor((Date.now() - (startTime ?? Date.now())) / 1000) : null
              );
            } catch (err) {
              console.error('Lỗi cập nhật tiến trình snap', err);
            }
          }
          if (isCompleted) {
            setGameCompleted(true);
          }
        }
        return;
      }
    }

    // Xử lý kéo thả Snap thông thường
    let isSnap = false;
    let finalX = piece.currentX;
    let finalY = piece.currentY;

    if (piece.type === 'jigsaw') {
      const dist = Math.hypot(piece.currentX - piece.targetX, piece.currentY - piece.targetY);
      if (dist < snapThreshold) {
        isSnap = true;
        finalX = piece.targetX;
        finalY = piece.targetY;
      }
    } else if (piece.type === 'tarsia') {
      const destX = piece.targetX + (boardSize.offsetX ?? 0);
      const destY = piece.targetY + (boardSize.offsetY ?? 0);
      const dist = Math.hypot(piece.currentX - destX, piece.currentY - destY);
      const targetRot = piece.tarsiaTargetRotation ?? 0;
      const currentRot = piece.tarsiaRotation ?? 0;

      // Snap chỉ xảy ra khi ở gần đúng vị trí và đã xoay đúng góc khớp
      if (dist < snapThreshold && (currentRot % 360) === (targetRot % 360)) {
        isSnap = true;
        finalX = destX;
        finalY = destY;
      }
    } else if (piece.type === 'domino') {
      const destX = piece.targetX + (boardSize.offsetX ?? 0);
      const destY = piece.targetY + (boardSize.offsetY ?? 0);
      const dist = Math.hypot(piece.currentX - destX, piece.currentY - destY);
      if (dist < snapThreshold) {
        isSnap = true;
        finalX = destX;
        finalY = destY;
      }
    } else if (piece.type === 'number') {
      if (piece.numberPoints) {
        let minX = Infinity, minY = Infinity;
        piece.numberPoints.forEach(v => {
          if (v.x < minX) minX = v.x;
          if (v.y < minY) minY = v.y;
        });
        const destX = (boardSize.offsetX ?? 0) + minX;
        const destY = (boardSize.offsetY ?? 0) + minY;
        const dist = Math.hypot(piece.currentX - destX, piece.currentY - destY);
        if (dist < snapThreshold) {
          isSnap = true;
          finalX = destX;
          finalY = destY;
        }
      }
    } else if (piece.type === 'maze_cell') {
      const dist = Math.hypot(piece.currentX - piece.targetX, piece.currentY - piece.targetY);
      if (dist < snapThreshold) {
        isSnap = true;
        finalX = piece.targetX;
        finalY = piece.targetY;
      }
    }

    if (isSnap) {
      const updatedPieces = pieces.map(p => p.id === id ? { ...p, currentX: finalX, currentY: finalY, isSnapped: true } : p);
      setPieces(updatedPieces);

      // Gửi lên Realtime Database vị trí snap
      updatePiecePositionOnCloud(pin, teamName, id, finalX, finalY, true, piece.type === 'tarsia' ? piece.tarsiaRotation : piece.type === 'domino' ? piece.dominoRotation : undefined);

      const snappedCount = updatedPieces.filter(p => p.isSnapped).length;
      const isCompleted = snappedCount === updatedPieces.length;

      if (teamRegistered && settings) {
        try {
          await updateTeamProgress(
            pin,
            teamName,
            snappedCount,
            isCompleted,
            isCompleted ? Math.floor((Date.now() - (startTime ?? Date.now())) / 1000) : null
          );
        } catch (err) {
          console.error('Lỗi cập nhật tiến trình snap', err);
        }
      }

      if (isCompleted) {
        setGameCompleted(true);
      }
    } else {
      updatePiecePositionOnCloud(pin, teamName, id, finalX, finalY, false, piece.type === 'tarsia' ? piece.tarsiaRotation : piece.type === 'domino' ? piece.dominoRotation : undefined);
    }
  };

  // Helper vẽ đường path của Number Jigsaw
  const drawNumberPiecePath = (points: {x: number, y: number}[], edges: string[]): string => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const eType = edges[i];
      d += getEdgeTabPath(p1, p2, eType);
    }
    d += ' Z';
    return d;
  };

  return (
    <div className="min-h-screen bg-[#0C0A1C] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden relative">
      {/* Nền hiệu ứng gradient mờ hiện đại */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* HEADER */}
      <header className="bg-[#121026]/40 backdrop-blur-md border-b border-indigo-950/60 px-6 py-4 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(99,102,241,0.3)]">🧩</span>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              CANVA PLAYZONE
              <span className="text-[9px] bg-indigo-650 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
                Học Sinh
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Trình chơi game kéo thả online học đường</p>
          </div>
        </div>

        <button
          onClick={onBackToTeacher}
          className="flex items-center gap-2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900/50 hover:border-indigo-700/60 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-md"
        >
          <Home size={14} className="text-indigo-400" />
          Bàn Làm Việc GV
        </button>
      </header>

      {/* CHƯA TẢI GAME: MÀN HÌNH NHẬP MÃ PIN */}
      {!gameLoaded ? (
        <main className="flex-grow flex items-center justify-center p-4 relative z-10">
          <div className="bg-[#13112E]/60 backdrop-blur-md border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center animate-fade-in">
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/5">
              <Key size={30} className="animate-pulse" />
            </div>

            <h2 className="text-lg font-bold text-white mb-1 uppercase tracking-wider">Nhập mã PIN Game</h2>
            <p className="text-xs text-slate-400 mb-6">Mã PIN gồm 6 chữ số do giáo viên của bạn chia sẻ.</p>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center text-3xl font-extrabold py-3.5 bg-slate-950/80 border-2 border-indigo-950/60 focus:border-indigo-500/80 rounded-2xl focus:outline-none text-white tracking-widest transition-all shadow-inner focus:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  placeholder="000000"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs flex items-center gap-2 justify-center">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <button
                disabled={pin.length < 6 || loading}
                onClick={() => handleLoadGame(pin)}
                className={`w-full py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                  pin.length < 6 || loading
                    ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-700/30'
                    : 'bg-indigo-600 hover:bg-indigo-550 hover:shadow-indigo-500/20 cursor-pointer border border-indigo-500/30'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang tìm kiếm...
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    Tiếp Tục
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      ) : !teamRegistered ? (
        /* MÀN HÌNH NHẬP TÊN ĐỘI CHƠI */
        <main className="flex-grow flex items-center justify-center p-4 relative z-10">
          <div className="bg-[#13112E]/60 backdrop-blur-md border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center animate-fade-in">
            <div className="w-16 h-16 bg-yellow-500/10 text-yellow-450 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/5">
              <Users size={30} className="animate-pulse" />
            </div>

            <h2 className="text-lg font-bold text-white mb-1 uppercase tracking-wider">Tên Đội Của Bạn</h2>
            <p className="text-xs text-slate-400 mb-6">
              Nhập tên nhóm/tên cá nhân để giáo viên hiển thị trên Bảng xếp hạng lớp học.
            </p>

            <div className="space-y-4">
              <input
                type="text"
                maxLength={20}
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                className="w-full text-center text-xl font-bold py-3 bg-slate-950/80 border-2 border-indigo-950/60 focus:border-indigo-500/80 rounded-2xl focus:outline-none text-white transition-all shadow-inner focus:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                placeholder="Ví dụ: Đội Sao Mai, Nhóm 1..."
              />

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs flex items-center gap-2 justify-center">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <button
                disabled={!teamName.trim() || registering}
                onClick={handleRegisterTeam}
                className={`w-full py-3.5 rounded-2xl font-extrabold text-sm text-slate-950 flex items-center justify-center gap-2 transition-all shadow-lg ${
                  !teamName.trim() || registering
                    ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-700/30'
                    : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-350 hover:to-yellow-400 hover:shadow-yellow-500/10 cursor-pointer border border-yellow-400/20 font-black'
                }`}
              >
                {registering ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-slate-950" />
                    Đang kết nối...
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" className="text-slate-950" />
                    Bắt Đầu Đua Top 🚀
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      ) : (
        /* BÀN CHƠI GAMEPLAY CHÍNH */
        <main className="flex-grow flex flex-col p-4 relative z-10">

          {/* Bingo Mode: render BingoView interactive thay cho bàn drag-drop */}
          {settings?.puzzleType === 'bingo' ? (
            <div className="max-w-2xl mx-auto w-full">
              <div className="flex items-center justify-between mb-4 px-1 bg-[#121026]/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] bg-indigo-500 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    📖 {settings?.subject}
                  </span>
                  <h2 className="text-base font-extrabold text-white mt-1.5">{settings?.title}</h2>
                </div>
                <span className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full font-bold">
                  👥 {teamName}
                </span>
              </div>
              <BingoView pairs={pairs} settings={settings} interactive={true} />
            </div>
          ) : (
            <>
          
          {/* Game Title Info HUD */}
          <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 bg-[#121026]/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-lg no-print">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-650 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
                  📖 {settings?.subject}
                </span>
                <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2.5 py-0.5 rounded-full font-bold">
                  👥 Đội: {teamName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-1.5 tracking-tight">
                {settings?.title}
              </h2>
            </div>

            {/* Timer & Completion Indicator */}
            <div className="flex items-center gap-4 text-xs font-bold font-mono bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-indigo-950/50 shadow-inner">
              <span className="text-slate-400 flex items-center gap-1.5 border-r border-indigo-950/50 pr-4">
                <Timer size={14} className="text-indigo-400" />
                Thời gian: <span className="text-white text-sm font-black">{formatTimer(elapsedTime)}</span>
              </span>
              <span className="text-slate-400">
                Mảnh ghép: <span className="text-yellow-455 text-sm font-black">{pieces.filter(p => p.isSnapped).length} / {pieces.length}</span>
              </span>
            </div>
          </div>

          {/* MAIN GAMEPLAY WORKSPACE CONTAINER */}
          <div className="flex-grow max-w-6xl w-full mx-auto bg-slate-950/20 backdrop-blur-xs rounded-3xl border border-indigo-950/40 p-4 relative overflow-hidden flex flex-col shadow-2xl">
            
            {/* VÙNG CHƠI CHÍNH (BOARD VÀ POOL CO GIÃN THEO SCALE) */}
            <div 
              className="flex-grow w-full rounded-2xl relative bg-[#090816]/60 border border-indigo-950/30 overflow-auto custom-scroll"
              style={{
                minHeight: '660px',
              }}
            >
              {/* VÙNG BOARD CHƠI NHÚNG SCALE ZOOM */}
              <div
                style={{
                  transform: `scale(${scaleFactor})`,
                  transformOrigin: 'top center',
                  width: `${boardSize.w}px`,
                  height: `${boardSize.h + 240}px`,
                  margin: '0 auto',
                  position: 'relative',
                }}
              >
                {/* 1. HIỂN THỊ CÁC LOẠI BOARD THEO CÁC MÔ-ĐUN */}
                {settings?.puzzleType === 'tarsia' && (
                  <PlayTarsiaBoard
                    pieces={pieces}
                    settings={settings}
                    boardSize={boardSize}
                    activeDraggingId={activeDraggingId}
                    scaleFactor={scaleFactor}
                    handlePointerDown={handlePointerDown}
                    handlePointerMove={handlePointerMove}
                    handlePointerUp={handlePointerUp}
                  />
                )}

                {settings?.puzzleType === 'domino' && (
                  <PlayDominoBoard
                    pieces={pieces}
                    settings={settings}
                    boardSize={boardSize}
                    activeDraggingId={activeDraggingId}
                    scaleFactor={scaleFactor}
                    handlePointerDown={handlePointerDown}
                    handlePointerMove={handlePointerMove}
                    handlePointerUp={handlePointerUp}
                  />
                )}

                {settings?.puzzleType === 'number_jigsaw' && (
                  <PlayNumberBoard
                    pieces={pieces}
                    settings={settings}
                    boardSize={boardSize}
                    activeDraggingId={activeDraggingId}
                    scaleFactor={scaleFactor}
                    handlePointerDown={handlePointerDown}
                    handlePointerMove={handlePointerMove}
                    handlePointerUp={handlePointerUp}
                    drawNumberPiecePath={drawNumberPiecePath}
                    colorPalettes={colorPalettes}
                    getPieceContentBox={getPieceContentBox}
                  />
                )}

                {settings?.puzzleType === 'math_maze' && (
                  <PlayMazeBoard
                    pieces={pieces}
                    settings={settings}
                    boardSize={boardSize}
                    pairs={pairs}
                    activeDraggingId={activeDraggingId}
                    scaleFactor={scaleFactor}
                    handlePointerDown={handlePointerDown}
                    handlePointerMove={handlePointerMove}
                    handlePointerUp={handlePointerUp}
                    getMazeColors={getMazeColors}
                  />
                )}

                {settings?.puzzleType !== 'tarsia' && 
                 settings?.puzzleType !== 'domino' && 
                 settings?.puzzleType !== 'number_jigsaw' && 
                 settings?.puzzleType !== 'math_maze' && (
                  <PlayJigsawBoard
                    pieces={pieces}
                    settings={settings}
                    boardSize={boardSize}
                    pairs={pairs}
                    activeDraggingId={activeDraggingId}
                    scaleFactor={scaleFactor}
                    handlePointerDown={handlePointerDown}
                    handlePointerMove={handlePointerMove}
                    handlePointerUp={handlePointerUp}
                    pieceW={pieceW}
                    pieceH={pieceH}
                  />
                )}

                {/* LAYER 2: KHAY CHỨA MẢNH GHÉP POOL BACKGROUND */}
                <div 
                  className="absolute bg-slate-950/80 backdrop-blur-md border border-white/5 rounded-3xl p-4 shadow-xl"
                  style={{
                    width: `${boardSize.w}px`,
                    height: '180px',
                    top: `${boardSize.h + 20}px`,
                    left: '0',
                    zIndex: 2,
                  }}
                >
                  <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-2 select-none flex justify-between px-1">
                    <span>✂️ Khay chứa mảnh ghép xáo trộn (Kéo thả lên trên để lắp ghép)</span>
                    <span className="text-indigo-400 font-mono">Đã lắp: {pieces.filter(p => p.isSnapped).length} / {pieces.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GAME COMPLETED POPUP */}
          {gameCompleted && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-[#120F30]/90 backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center animate-fade-in relative overflow-hidden">
                <div className="absolute -top-10 -left-10 text-yellow-500/10 rotate-12 scale-150"><Sparkles size={120} /></div>
                
                <div className="w-20 h-20 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
                  <Trophy size={42} className="animate-bounce text-yellow-400" />
                </div>

                <h2 className="text-2xl font-extrabold text-white mb-2 uppercase tracking-wide flex items-center justify-center gap-2">
                  🎉 CHIẾN THẮNG!
                </h2>
                <p className="text-slate-200 font-bold mb-1">Đội {teamName} đã hoàn thành game xuất sắc!</p>
                <p className="text-xs text-slate-400 mb-6">
                  Thời gian giải đố: <span className="text-yellow-455 font-extrabold font-mono text-sm">{formatTimer(elapsedTime)}</span>
                </p>

                <button
                  onClick={onBackToTeacher}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all cursor-pointer text-xs border border-indigo-550 shadow-md"
                >
                  Quay Lại Bảng GV
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </main>
      )}
    </div>
  );
};
