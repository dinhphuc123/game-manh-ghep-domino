import React, { useMemo, useEffect } from 'react';
import { Scissors, HelpCircle, CheckCircle2, Sparkles, BookOpen, Star } from 'lucide-react';
import { PuzzlePair, ThemeStyle, getPieceContentBox } from '../types';
import { MathJaxWrapper, calculateDynamicFontSize } from './MathJaxWrapper';

interface Point {
  x: number;
  y: number;
}

interface JigsawPieceTemplate {
  pairOffset: number; // Index in the Q-A pairs list
  isQuestion: boolean; // Is Q or A
  colorIndex: number;  // Palette color choice
  points: Point[];
  edges: string[];     // 'none' | 'male' | 'female'
  textCenter: Point;   // Manually specified visual center for label text
  labelAngle?: number; // Optional text rotation
}

interface NumberJigsawViewProps {
  pairs: PuzzlePair[];
  numberShape: string;
  style: ThemeStyle;
  showMatchCode: boolean;
  showDoodleIcons: boolean;
  saveInk: boolean;
  pieceSize: number;
  activeTab: 'poster' | 'cutout';
  numberScaleX?: number;   // Horizontal stretch factor (default 1.0)
  numberScaleY?: number;   // Vertical stretch factor (default 1.0)
}

// BULBOUS JIGSAW TAB CONNECTOR GENERATOR
const getEdgeTabPath = (p1: Point, p2: Point, edgeType: string): string => {
  if (edgeType !== 'male' && edgeType !== 'female') {
    return ` L ${p2.x} ${p2.y}`;
  }

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  
  if (len < 5) return ` L ${p2.x} ${p2.y}`;

  // Unit directions
  const ux = dx / len;
  const uy = dy / len;
  // Outward normal (vector pointing to the right of travel)
  const nx = -uy;
  const ny = ux;

  const hSign = edgeType === 'male' ? 1 : -1;

  // Center midpoint
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;

  // bulb constants
  const sizeFactor = Math.min(len * 0.35, 23); // Scale tab for tiny lines
  const neckWidth = sizeFactor * 0.7;
  const headWidth = sizeFactor * 1.05;
  const height = sizeFactor * 0.82;

  // Key nodes along the curve
  // Neck starts on the edge
  const ax = mx - ux * neckWidth;
  const ay = my - uy * neckWidth;

  const dx_bulb = mx - ux * headWidth + nx * height * hSign;
  const dy_bulb = my - uy * headWidth + ny * height * hSign;

  const ex = mx + ux * headWidth + nx * height * hSign;
  const ey = my + uy * headWidth + ny * height * hSign;

  const bx = mx + ux * neckWidth;
  const by = my + uy * neckWidth;

  // Control points for neck curvature & balloon effect
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

  // Path commands concatenating the three cubic Beziers
  return ` L ${ax} ${ay} ` +
         `C ${cp1_x} ${cp1_y}, ${cp2_x} ${cp2_y}, ${dx_bulb} ${dy_bulb} ` +
         `C ${cp3_x} ${cp3_y}, ${cp4_x} ${cp4_y}, ${ex} ${ey} ` +
         `C ${cp5_x} ${cp5_y}, ${cp6_x} ${cp6_y}, ${bx} ${by} L ${p2.x} ${p2.y}`;
};

export const NumberJigsawView: React.FC<NumberJigsawViewProps> = ({
  pairs,
  numberShape,
  style,
  showMatchCode,
  showDoodleIcons,
  saveInk,
  pieceSize,
  activeTab,
  numberScaleX = 1.0,
  numberScaleY = 1.0,
}) => {

  // DEFINITION OF MASTER DESIGN DIGITS
  const rawTemplates = useMemo(() => {
    const dict: { [key: string]: JigsawPieceTemplate[] } = {};

    // DIGIT 1 (4 pieces = 2 pairs)
    dict['1'] = [
      {
        pairOffset: 0, isQuestion: true, colorIndex: 0,
        points: [{x: 40, y: 130}, {x: 100, y: 55}, {x: 160, y: 55}, {x: 160, y: 145}, {x: 100, y: 145}],
        edges: ['none', 'none', 'none', 'male', 'none'],
        textCenter: {x: 110, y: 100}
      },
      {
        pairOffset: 0, isQuestion: false, colorIndex: 1,
        points: [{x: 160, y: 145}, {x: 160, y: 55}, {x: 160, y: 225}, {x: 100, y: 225}, {x: 100, y: 145}],
        edges: ['none', 'none', 'male', 'none', 'female'],
        textCenter: {x: 135, y: 185}
      },
      {
        pairOffset: 1, isQuestion: true, colorIndex: 2,
        points: [{x: 100, y: 225}, {x: 160, y: 225}, {x: 160, y: 315}, {x: 100, y: 315}],
        edges: ['female', 'none', 'male', 'none'],
        textCenter: {x: 130, y: 270}
      },
      {
        pairOffset: 1, isQuestion: false, colorIndex: 3,
        points: [{x: 100, y: 315}, {x: 160, y: 315}, {x: 215, y: 315}, {x: 215, y: 375}, {x: 45, y: 375}, {x: 45, y: 315}],
        edges: ['none', 'none', 'none', 'none', 'none', 'female'],
        textCenter: {x: 130, y: 350}
      }
    ];

    // DIGIT 2 (6 pieces = 3 pairs)
    dict['2'] = [
      {
        pairOffset: 0, isQuestion: true, colorIndex: 0,
        points: [{x: 40, y: 135}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 125}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 90, y: 90}
      },
      {
        pairOffset: 0, isQuestion: false, colorIndex: 1,
        points: [{x: 145, y: 125}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 140}, {x: 145, y: 140}],
        edges: ['female', 'none', 'none', 'male', 'none'],
        textCenter: {x: 195, y: 90}
      },
      {
        pairOffset: 1, isQuestion: true, colorIndex: 2,
        points: [{x: 145, y: 140}, {x: 245, y: 140}, {x: 245, y: 220}, {x: 145, y: 220}],
        edges: ['female', 'none', 'male', 'none'],
        textCenter: {x: 195, y: 180}
      },
      {
        pairOffset: 1, isQuestion: false, colorIndex: 3,
        points: [{x: 145, y: 220}, {x: 245, y: 220}, {x: 245, y: 300}, {x: 145, y: 300}, {x: 80, y: 300}, {x: 80, y: 220}],
        edges: ['female', 'none', 'none', 'none', 'male', 'none'],
        textCenter: {x: 175, y: 260}
      },
      {
        pairOffset: 2, isQuestion: true, colorIndex: 4,
        points: [{x: 80, y: 220}, {x: 80, y: 300}, {x: 145, y: 300}, {x: 145, y: 375}, {x: 40, y: 375}, {x: 40, y: 300}],
        edges: ['none', 'none', 'none', 'none', 'none', 'female'],
        textCenter: {x: 65, y: 335}
      },
      {
        pairOffset: 2, isQuestion: false, colorIndex: 1,
        points: [{x: 145, y: 300}, {x: 245, y: 300}, {x: 245, y: 375}, {x: 145, y: 375}],
        edges: ['none', 'none', 'none', 'none'], // Interlocked bottom base edges
        textCenter: {x: 195, y: 338}
      }
    ];

    // DIGIT 0 (6 pieces = 3 pairs)
    dict['0'] = [
      {
        pairOffset: 0, isQuestion: true, colorIndex: 0,
        points: [{x: 40, y: 140}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 140}, {x: 100, y: 140}, {x: 100, y: 110}, {x: 80, y: 110}, {x: 80, y: 140}],
        edges: ['none', 'none', 'male', 'none', 'none', 'none', 'none', 'none'],
        textCenter: {x: 95, y: 80}
      },
      {
        pairOffset: 0, isQuestion: false, colorIndex: 3,
        points: [{x: 145, y: 140}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 140}, {x: 205, y: 140}, {x: 205, y: 110}, {x: 185, y: 110}, {x: 185, y: 140}],
        edges: ['female', 'none', 'none', 'none', 'none', 'none', 'none', 'male'],
        textCenter: {x: 195, y: 80}
      },
      {
        pairOffset: 1, isQuestion: true, colorIndex: 1,
        points: [{x: 40, y: 265}, {x: 40, y: 140}, {x: 100, y: 140}, {x: 100, y: 265}],
        edges: ['none', 'none', 'none', 'male'],
        textCenter: {x: 70, y: 200}
      },
      {
        pairOffset: 1, isQuestion: false, colorIndex: 2,
        points: [{x: 185, y: 265}, {x: 185, y: 140}, {x: 245, y: 140}, {x: 245, y: 265}],
        edges: ['none', 'none', 'none', 'female'],
        textCenter: {x: 215, y: 200}
      },
      {
        pairOffset: 2, isQuestion: true, colorIndex: 4,
        points: [{x: 40, y: 375}, {x: 40, y: 265}, {x: 100, y: 265}, {x: 100, y: 315}, {x: 145, y: 315}, {x: 145, y: 375}],
        edges: ['none', 'none', 'none', 'none', 'male', 'none'],
        textCenter: {x: 92, y: 345}
      },
      {
        pairOffset: 2, isQuestion: false, colorIndex: 0,
        points: [{x: 145, y: 375}, {x: 145, y: 315}, {x: 185, y: 315}, {x: 185, y: 265}, {x: 245, y: 265}, {x: 245, y: 375}],
        edges: ['female', 'none', 'none', 'none', 'none', 'none'],
        textCenter: {x: 195, y: 345}
      }
    ];

    // DIGIT 5 — LED 7-segment style: top bar + left-top stem + middle bar + right-bottom stem + bottom bar
    // Shape: ⌐ on top, └ on bottom — mirror of 2
    dict['5'] = [
      {
        // Top horizontal bar (full width)
        pairOffset: 0, isQuestion: true, colorIndex: 4,
        points: [{x: 40, y: 50}, {x: 245, y: 50}, {x: 245, y: 110}, {x: 40, y: 110}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 142, y: 80}
      },
      {
        // Left-top vertical stem
        pairOffset: 0, isQuestion: false, colorIndex: 2,
        points: [{x: 40, y: 110}, {x: 40, y: 200}, {x: 100, y: 200}, {x: 100, y: 110}],
        edges: ['female', 'none', 'male', 'none'],
        textCenter: {x: 70, y: 155}
      },
      {
        // Middle horizontal bar (full width)
        pairOffset: 1, isQuestion: true, colorIndex: 0,
        points: [{x: 40, y: 200}, {x: 100, y: 200}, {x: 245, y: 200}, {x: 245, y: 260}, {x: 40, y: 260}],
        edges: ['female', 'none', 'none', 'male', 'none'],
        textCenter: {x: 142, y: 230}
      },
      {
        // Right-bottom vertical stem
        pairOffset: 1, isQuestion: false, colorIndex: 1,
        points: [{x: 185, y: 260}, {x: 245, y: 260}, {x: 245, y: 360}, {x: 185, y: 360}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 215, y: 310}
      },
      {
        // Bottom horizontal bar (full width)
        pairOffset: 2, isQuestion: true, colorIndex: 3,
        points: [{x: 40, y: 360}, {x: 185, y: 360}, {x: 245, y: 360}, {x: 245, y: 420}, {x: 40, y: 420}],
        edges: ['none', 'none', 'none', 'none', 'female'],
        textCenter: {x: 142, y: 390}
      },
      {
        // Bottom-left filler (connects left side bottom)
        pairOffset: 2, isQuestion: false, colorIndex: 0,
        points: [{x: 40, y: 260}, {x: 185, y: 260}, {x: 185, y: 360}, {x: 40, y: 360}],
        edges: ['none', 'none', 'none', 'male'],
        textCenter: {x: 112, y: 310}
      }
    ];

    // DIGIT 8 — LED 7-segment: 2 stacked squares with 4 sides + top + middle + bottom bars
    // Clear 2-loop structure: top-left, top-right, mid-left, mid-right, bot-left, bot-right + top + mid + bot bars
    dict['8'] = [
      {
        // Top horizontal bar
        pairOffset: 0, isQuestion: true, colorIndex: 0,
        points: [{x: 40, y: 50}, {x: 245, y: 50}, {x: 245, y: 110}, {x: 145, y: 110}, {x: 40, y: 110}],
        edges: ['none', 'none', 'male', 'none', 'none'],
        textCenter: {x: 142, y: 80}
      },
      {
        // Top-left vertical side
        pairOffset: 0, isQuestion: false, colorIndex: 1,
        points: [{x: 40, y: 110}, {x: 40, y: 210}, {x: 100, y: 210}, {x: 100, y: 110}],
        edges: ['female', 'none', 'male', 'none'],
        textCenter: {x: 70, y: 160}
      },
      {
        // Top-right vertical side
        pairOffset: 1, isQuestion: true, colorIndex: 2,
        points: [{x: 185, y: 110}, {x: 245, y: 110}, {x: 245, y: 210}, {x: 185, y: 210}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 215, y: 160}
      },
      {
        // Middle horizontal bar (full width)
        pairOffset: 1, isQuestion: false, colorIndex: 3,
        points: [{x: 40, y: 210}, {x: 100, y: 210}, {x: 185, y: 210}, {x: 245, y: 210}, {x: 245, y: 270}, {x: 40, y: 270}],
        edges: ['female', 'none', 'none', 'none', 'male', 'none'],
        textCenter: {x: 142, y: 240}
      },
      {
        // Bottom-left vertical side
        pairOffset: 2, isQuestion: true, colorIndex: 4,
        points: [{x: 40, y: 270}, {x: 40, y: 370}, {x: 100, y: 370}, {x: 100, y: 270}],
        edges: ['female', 'none', 'male', 'none'],
        textCenter: {x: 70, y: 320}
      },
      {
        // Bottom-right vertical side
        pairOffset: 2, isQuestion: false, colorIndex: 0,
        points: [{x: 185, y: 270}, {x: 245, y: 270}, {x: 245, y: 370}, {x: 185, y: 370}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 215, y: 320}
      },
      {
        // Bottom horizontal bar
        pairOffset: 3, isQuestion: true, colorIndex: 1,
        points: [{x: 40, y: 370}, {x: 100, y: 370}, {x: 185, y: 370}, {x: 245, y: 370}, {x: 245, y: 430}, {x: 40, y: 430}],
        edges: ['female', 'none', 'none', 'none', 'none', 'none'],
        textCenter: {x: 142, y: 400}
      },
      {
        // Top inner fill (between top-left and top-right stems)
        pairOffset: 3, isQuestion: false, colorIndex: 2,
        points: [{x: 100, y: 110}, {x: 145, y: 110}, {x: 185, y: 110}, {x: 185, y: 210}, {x: 100, y: 210}],
        edges: ['none', 'none', 'none', 'female', 'female'],
        textCenter: {x: 142, y: 160}
      }
    ];

    // DIGIT 3 — LED 7-segment: top bar + right-top stem + middle bar + right-bottom stem + bottom bar
    // Only right side verticals, no left stems
    dict['3'] = [
      {
        // Top horizontal bar (full width)
        pairOffset: 0, isQuestion: true, colorIndex: 0,
        points: [{x: 40, y: 50}, {x: 245, y: 50}, {x: 245, y: 110}, {x: 40, y: 110}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 142, y: 80}
      },
      {
        // Right-top vertical stem
        pairOffset: 0, isQuestion: false, colorIndex: 1,
        points: [{x: 185, y: 110}, {x: 245, y: 110}, {x: 245, y: 210}, {x: 185, y: 210}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 215, y: 160}
      },
      {
        // Middle horizontal bar (full width) + left stub
        pairOffset: 1, isQuestion: true, colorIndex: 2,
        points: [{x: 40, y: 110}, {x: 185, y: 110}, {x: 185, y: 210}, {x: 40, y: 210}, {x: 40, y: 270}, {x: 245, y: 270}, {x: 245, y: 210}],
        edges: ['none', 'none', 'none', 'none', 'none', 'male', 'none'],
        textCenter: {x: 142, y: 190}
      },
      {
        // Right-bottom vertical stem
        pairOffset: 1, isQuestion: false, colorIndex: 3,
        points: [{x: 185, y: 270}, {x: 245, y: 270}, {x: 245, y: 370}, {x: 185, y: 370}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 215, y: 320}
      },
      {
        // Bottom horizontal bar (full width)
        pairOffset: 2, isQuestion: true, colorIndex: 4,
        points: [{x: 40, y: 370}, {x: 245, y: 370}, {x: 245, y: 430}, {x: 40, y: 430}],
        edges: ['none', 'none', 'none', 'female'],
        textCenter: {x: 142, y: 400}
      },
      {
        // Bottom-left filler (space between middle and bottom bar, left side)
        pairOffset: 2, isQuestion: false, colorIndex: 0,
        points: [{x: 40, y: 270}, {x: 185, y: 270}, {x: 185, y: 370}, {x: 40, y: 370}],
        edges: ['none', 'none', 'none', 'male'],
        textCenter: {x: 112, y: 320}
      }
    ];

    // DIGIT 9 (6 pieces = 3 pairs)
    dict['9'] = [
      {
        pairOffset: 0, isQuestion: true, colorIndex: 2,
        points: [{x: 40, y: 140}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 140}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 90, y: 95}
      },
      {
        pairOffset: 0, isQuestion: false, colorIndex: 1,
        points: [{x: 145, y: 140}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 140}],
        edges: ['female', 'none', 'none', 'male'],
        textCenter: {x: 195, y: 95}
      },
      {
        pairOffset: 1, isQuestion: true, colorIndex: 0,
        points: [{x: 40, y: 230}, {x: 40, y: 140}, {x: 145, y: 140}, {x: 145, y: 230}],
        edges: ['none', 'female', 'male', 'none'],
        textCenter: {x: 90, y: 185}
      },
      {
        pairOffset: 1, isQuestion: false, colorIndex: 3,
        points: [{x: 145, y: 230}, {x: 145, y: 140}, {x: 245, y: 140}, {x: 245, y: 230}],
        edges: ['female', 'none', 'none', 'male'],
        textCenter: {x: 195, y: 185}
      },
      {
        pairOffset: 2, isQuestion: true, colorIndex: 4,
        points: [{x: 145, y: 375}, {x: 145, y: 230}, {x: 245, y: 230}, {x: 245, y: 375}],
        edges: ['none', 'female', 'none', 'none'],
        textCenter: {x: 195, y: 300}
      },
      {
        pairOffset: 2, isQuestion: false, colorIndex: 2,
        points: [{x: 45, y: 375}, {x: 45, y: 320}, {x: 145, y: 320}, {x: 145, y: 375}],
        edges: ['none', 'none', 'none', 'none'],
        textCenter: {x: 95, y: 348}
      }
    ];

    // DIGIT 4 (6 pieces = 3 pairs)
    dict['4'] = [
      {
        pairOffset: 0, isQuestion: true, colorIndex: 0,
        points: [{x: 40, y: 140}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 140}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 92, y: 95}
      },
      {
        pairOffset: 0, isQuestion: false, colorIndex: 1,
        points: [{x: 145, y: 140}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 140}],
        edges: ['female', 'none', 'none', 'male'],
        textCenter: {x: 195, y: 95}
      },
      {
        pairOffset: 1, isQuestion: true, colorIndex: 2,
        points: [{x: 40, y: 220}, {x: 40, y: 140}, {x: 145, y: 140}, {x: 145, y: 220}],
        edges: ['none', 'female', 'male', 'none'],
        textCenter: {x: 92, y: 180}
      },
      {
        pairOffset: 1, isQuestion: false, colorIndex: 3,
        points: [{x: 145, y: 220}, {x: 145, y: 140}, {x: 245, y: 140}, {x: 245, y: 220}],
        edges: ['female', 'none', 'none', 'male'],
        textCenter: {x: 195, y: 180}
      },
      {
        pairOffset: 2, isQuestion: true, colorIndex: 4,
        points: [{x: 145, y: 375}, {x: 145, y: 220}, {x: 245, y: 220}, {x: 245, y: 375}],
        edges: ['none', 'female', 'none', 'none'],
        textCenter: {x: 195, y: 297}
      },
      {
        pairOffset: 2, isQuestion: false, colorIndex: 1,
        points: [{x: 40, y: 300}, {x: 40, y: 220}, {x: 145, y: 220}, {x: 145, y: 300}],
        edges: ['none', 'none', 'none', 'none'],
        textCenter: {x: 92, y: 260}
      }
    ];

    // DIGIT 6 — LED 7-segment: top bar + left-top stem + middle bar + left-bottom stem + right-bottom stem + bottom bar
    // Like 8 but no top-right stem
    dict['6'] = [
      {
        // Top horizontal bar (full width)
        pairOffset: 0, isQuestion: true, colorIndex: 4,
        points: [{x: 40, y: 50}, {x: 245, y: 50}, {x: 245, y: 110}, {x: 40, y: 110}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 142, y: 80}
      },
      {
        // Left-top vertical stem
        pairOffset: 0, isQuestion: false, colorIndex: 0,
        points: [{x: 40, y: 110}, {x: 40, y: 210}, {x: 100, y: 210}, {x: 100, y: 110}],
        edges: ['female', 'none', 'male', 'none'],
        textCenter: {x: 70, y: 160}
      },
      {
        // Top-right empty filler (no stem on right top)
        pairOffset: 1, isQuestion: true, colorIndex: 1,
        points: [{x: 100, y: 110}, {x: 245, y: 110}, {x: 245, y: 210}, {x: 100, y: 210}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 172, y: 160}
      },
      {
        // Middle horizontal bar (full width)
        pairOffset: 1, isQuestion: false, colorIndex: 2,
        points: [{x: 40, y: 210}, {x: 100, y: 210}, {x: 245, y: 210}, {x: 245, y: 270}, {x: 40, y: 270}],
        edges: ['female', 'none', 'none', 'male', 'none'],
        textCenter: {x: 142, y: 240}
      },
      {
        // Bottom-left vertical stem
        pairOffset: 2, isQuestion: true, colorIndex: 3,
        points: [{x: 40, y: 270}, {x: 40, y: 370}, {x: 100, y: 370}, {x: 100, y: 270}],
        edges: ['female', 'none', 'male', 'none'],
        textCenter: {x: 70, y: 320}
      },
      {
        // Bottom-right vertical stem
        pairOffset: 2, isQuestion: false, colorIndex: 4,
        points: [{x: 185, y: 270}, {x: 245, y: 270}, {x: 245, y: 370}, {x: 185, y: 370}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 215, y: 320}
      },
      {
        // Bottom horizontal bar (full width)
        pairOffset: 3, isQuestion: true, colorIndex: 0,
        points: [{x: 40, y: 370}, {x: 100, y: 370}, {x: 185, y: 370}, {x: 245, y: 370}, {x: 245, y: 430}, {x: 40, y: 430}],
        edges: ['female', 'none', 'none', 'none', 'none', 'none'],
        textCenter: {x: 142, y: 400}
      },
      {
        // Bottom inner filler (between left and right bottom stems)
        pairOffset: 3, isQuestion: false, colorIndex: 1,
        points: [{x: 100, y: 270}, {x: 185, y: 270}, {x: 185, y: 370}, {x: 100, y: 370}],
        edges: ['none', 'none', 'female', 'female'],
        textCenter: {x: 142, y: 320}
      }
    ];

    // DIGIT 7 (6 pieces = 3 pairs)
    dict['7'] = [
      {
        pairOffset: 0, isQuestion: true, colorIndex: 1,
        points: [{x: 40, y: 120}, {x: 40, y: 50}, {x: 145, y: 50}, {x: 145, y: 120}],
        edges: ['none', 'none', 'male', 'none'],
        textCenter: {x: 92, y: 85}
      },
      {
        pairOffset: 0, isQuestion: false, colorIndex: 2,
        points: [{x: 145, y: 120}, {x: 145, y: 50}, {x: 245, y: 50}, {x: 245, y: 120}],
        edges: ['female', 'none', 'none', 'male'],
        textCenter: {x: 195, y: 85}
      },
      {
        pairOffset: 1, isQuestion: true, colorIndex: 3,
        points: [{x: 145, y: 210}, {x: 245, y: 120}, {x: 245, y: 210}, {x: 145, y: 210}],
        edges: ['none', 'none', 'none', 'male'],
        textCenter: {x: 195, y: 165}
      },
      {
        pairOffset: 1, isQuestion: false, colorIndex: 4,
        points: [{x: 100, y: 210}, {x: 145, y: 210}, {x: 245, y: 210}, {x: 200, y: 300}, {x: 100, y: 300}],
        edges: ['none', 'none', 'none', 'male', 'none'],
        textCenter: {x: 160, y: 255}
      },
      {
        pairOffset: 2, isQuestion: true, colorIndex: 0,
        points: [{x: 100, y: 300}, {x: 200, y: 300}, {x: 160, y: 375}, {x: 60, y: 375}],
        edges: ['none', 'none', 'none', 'none'],
        textCenter: {x: 130, y: 337}
      },
      {
        pairOffset: 2, isQuestion: false, colorIndex: 1,
        points: [{x: 145, y: 120}, {x: 145, y: 210}, {x: 100, y: 210}, {x: 100, y: 120}],
        edges: ['none', 'male', 'none', 'none'],
        textCenter: {x: 122, y: 165}
      }
    ];

    return dict;
  }, []);

  // COMPOSE FULL LAYOUT ON SELECTION
  const activePieces = useMemo(() => {
    if (pairs.length === 0) return [];

    let composed: (JigsawPieceTemplate & { id: string; absolutePoints: Point[]; absoluteCenter: Point })[] = [];


    const cleanShape = numberShape.trim().replace(/[^0-9]/g, '') || '2';

    // GENERAL N-DIGIT LAYOUT: supports 1, 2, 3, 4... arbitrary digits
    let cumulativeOffset = 0;
    let pairCursor = 0;

    cleanShape.split('').forEach((char, dIdx) => {
      const tDigit = rawTemplates[char] || rawTemplates['2'];
      const pairsUsed = Math.max(...tDigit.map(p => p.pairOffset)) + 1;
      const spacingForThisDigit = char === '1' ? 220 : 260;

      tDigit.forEach((p, idx) => {
        const pIdx = (p.pairOffset + pairCursor) % pairs.length;
        const offsetPts = p.points.map(pt => ({ x: pt.x + cumulativeOffset, y: pt.y }));
        const offsetCenter = { x: p.textCenter.x + cumulativeOffset, y: p.textCenter.y };

        composed.push({
          ...p,
          id: `digit${dIdx}-${char}-${idx}`,
          pairOffset: pIdx,
          absolutePoints: offsetPts,
          absoluteCenter: offsetCenter,
        });
      });

      pairCursor += pairsUsed;
      cumulativeOffset += spacingForThisDigit;
    });

    return composed;
  }, [numberShape, pairs, rawTemplates]);

  // Helper: calculate total pieces count for each digit char
  const autoComposedCount = activePieces.length;

  // Viewport setup
  const boundingBox = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    activePieces.forEach((p) => {
      p.absolutePoints.forEach((v) => {
        if (v.x < minX) minX = v.x;
        if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
      });
    });

    if (minX === Infinity) {
      return { width: 600, height: 450, offsetX: 30, offsetY: 30 };
    }

    const padding = 50;
    return {
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
      offsetX: -minX + padding,
      offsetY: -minY + padding,
    };
  }, [activePieces]);

  // Color options
  const colorPalettes = useMemo(() => {
    if (style === 'vibrant') {
      return [
        { fill: '#f43f5e', border: '#e11d48', shadow: '#be123c', text: '#880d2e', stamp: '#ffe4e6' }, // Rose Red
        { fill: '#eab308', border: '#ca8a04', shadow: '#a16207', text: '#713f12', stamp: '#fef9c3' }, // Amber Yellow
        { fill: '#06b6d4', border: '#0891b2', shadow: '#0e7490', text: '#155e75', stamp: '#ecfeff' }, // Cyan Blue
        { fill: '#10b981', border: '#059669', shadow: '#047857', text: '#064e3b', stamp: '#d1fae5' }, // Emerald Green
        { fill: '#6366f1', border: '#4f46e5', shadow: '#4338ca', text: '#312e81', stamp: '#e0e7ff' }, // Indigo Purple
      ];
    } else {
      // Pastel
      return [
        { fill: '#ffe4e6', border: '#fda4af', shadow: '#f43f5e', text: '#880d2e', stamp: '#fff1f2' }, // Soft Pink
        { fill: '#fef9c3', border: '#fde047', shadow: '#ca8a04', text: '#713f12', stamp: '#fefdf0' }, // Soft Yellow
        { fill: '#ecfeff', border: '#67e8f9', shadow: '#0891b2', text: '#155e75', stamp: '#f0fdfa' }, // Soft Blue
        { fill: '#d1fae5', border: '#6ee7b7', shadow: '#059669', text: '#064e3b', stamp: '#f0fdf4' }, // Soft Green
        { fill: '#e0e7ff', border: '#a5b4fc', shadow: '#4f46e5', text: '#312e81', stamp: '#f5f7ff' }, // Soft Purple
      ];
    }
  }, [style]);



  // RENDER SVGs FOR SINGLE PIECES
  const drawPiecePath = (points: Point[], edges: string[]): string => {
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

  const getPiecesWithUniqueKey = useMemo(() => {
    return activePieces.map((piece, pIdx) => {
      const pData = pairs[piece.pairOffset];
      const colors = colorPalettes[piece.colorIndex % colorPalettes.length];
      const pPath = drawPiecePath(piece.absolutePoints, piece.edges);

      return {
        ...piece,
        pData,
        colors,
        pPath,
        index: pIdx,
      };
    });
  }, [activePieces, pairs, colorPalettes]);

  return (
    <div className="w-full">
      {/* Educational Badge */}
      <div className="no-print mb-4 flex flex-col sm:flex-row gap-2 justify-between items-center bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-xs text-slate-600">
        <span className="font-semibold flex items-center gap-1.5 text-[#159BAD]">
          🧩 Kiểu Chữ Số: {
            numberShape === '20' ? 'Nhân Dịp 20/11 (12 mảnh ghép)' :
            numberShape === '10' ? 'Điểm Mười Học Tập (10 mảnh ghép)' :
            `Chữ số "${numberShape}" (${autoComposedCount} mảnh ghép)`
          }
        </span>
        <span className="font-mono bg-[#94BF52] text-white font-extrabold px-3 py-1 rounded-full text-[11px] shadow-sm">
          Phân bổ: {pairs.length} câu hỏi ➔ Lắp đầy {autoComposedCount} mảnh 3D hoàn mỹ
        </span>
      </div>

      {pairs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <span className="text-5xl block mb-3">🧩</span>
          <p className="text-xs text-slate-400 font-bold block">Hãy thêm danh sách câu hỏi để tự động phân bổ vào chữ số 3D!</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: INTEGRATED 3D BOARD GAME SLIDE POSTER */}
          {activeTab === 'poster' ? (
            <div
              className="relative w-full mx-auto flex items-center justify-center overflow-auto custom-scroll"
              style={{
                transform: `scale(${pieceSize})`,
                transformOrigin: 'top center',
                paddingTop: '30px',
                paddingBottom: '30px',
                height: `${boundingBox.height * pieceSize + 10}px`,
              }}
            >
              <svg
                width={boundingBox.width * numberScaleX}
                height={boundingBox.height * numberScaleY}
                viewBox={`0 0 ${boundingBox.width} ${boundingBox.height}`}
                className="mx-auto overflow-visible"
              >
                {/* 3D Extrusion Filters definition */}
                <defs>
                  <filter id="soft-shadow" x="-5%" y="-5%" width="112%" height="112%">
                    <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.12" />
                  </filter>
                </defs>

                <g transform={`translate(${boundingBox.offsetX}, ${boundingBox.offsetY})`}>
                  
                  {/* LAYER 1: MULTI-LAYER 3D SOLID EXTRUSION (Tactile thickness shadow) */}
                  {!saveInk && getPiecesWithUniqueKey.map((p) => (
                    <React.Fragment key={`depth-group-${p.id}`}>
                      {[1, 2, 3, 4, 5, 6].map((depth) => (
                        <path
                          key={`depth-${p.id}-${depth}`}
                          d={p.pPath}
                          fill={p.colors.shadow}
                          transform={`translate(${depth * 0.8}, ${depth * 1.2})`}
                          opacity={0.85}
                        />
                      ))}
                    </React.Fragment>
                  ))}

                  {/* LAYER 2: PRIMARY INTERLOCKING PIECES */}
                  {getPiecesWithUniqueKey.map((p) => {
                    const text = p.isQuestion ? p.pData.question : p.pData.answer;
                    
                    return (
                      <g key={`main-piece-${p.id}`} className="transition-transform duration-300 hover:translate-y-[-2px]">
                        {/* Piece Outline & Color Body */}
                        <path
                          d={p.pPath}
                          fill={saveInk ? '#ffffff' : p.colors.fill}
                          stroke={saveInk ? '#1e293b' : p.colors.border}
                          strokeWidth={saveInk ? 1.5 : 3.2}
                          strokeLinejoin="round"
                        />

                        {/* Top Inner edge bevel line */}
                        {!saveInk && (
                          <path
                            d={p.pPath}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={1.5}
                            opacity="0.25"
                            className="pointer-events-none"
                          />
                        )}

                        {/* TEXT LABEL FITTING CONTAINER */}
                        {(() => {
                          const cBox = getPieceContentBox(p.points);
                          return (
                            <foreignObject
                              x={p.absoluteCenter.x + cBox.xOffset}
                              y={p.absoluteCenter.y + cBox.yOffset}
                              width={cBox.width}
                              height={cBox.height}
                            >
                              <div
                                xmlns="http://www.w3.org/1999/xhtml"
                                className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-text px-1"
                                style={{
                                  color: saveInk ? '#1e293b' : '#ffffff',
                                  textShadow: saveInk ? 'none' : '0 1px 2px rgba(0,0,0,0.25)',
                                  fontFamily: '"Inter", sans-serif',
                                  // Inverse scale text so it looks normal size
                                  transform: `scale(${1/numberScaleX}, ${1/numberScaleY})`,
                                  transformOrigin: 'center center',
                                }}
                              >
                                <MathJaxWrapper
                                  text={text}
                                  className="font-bold text-center w-full"
                                  style={{
                                    fontSize: `${calculateDynamicFontSize(text, 10, 8, 13)}px`,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: '1.2em'
                                  }}
                                />
                              </div>
                            </foreignObject>
                          );
                        })()}

                        {/* MASCOT DECORATIVE sticker if enabled in corner */}
                        {showDoodleIcons && !saveInk && p.index === 0 && (
                          <g transform={`translate(${p.absolutePoints[0].x + 35}, ${p.absolutePoints[0].y + 35})`} className="pointer-events-none select-none">
                            <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth={1} filter="url(#soft-shadow)" />
                            <circle cx="0" cy="0" r="15" fill="#f43f5e" />
                            {/* Star Badge */}
                            <Star size={14} fill="#ffffff" stroke="none" className="mx-auto text-white -mt-0.5" />
                          </g>
                        )}

                        {showDoodleIcons && !saveInk && p.index === getPiecesWithUniqueKey.length - 1 && (
                          <g transform={`translate(${p.absolutePoints[1].x - 30}, ${p.absolutePoints[1].y - 30})`} className="pointer-events-none select-none">
                            <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="#cbd5e1" strokeWidth={1} filter="url(#soft-shadow)" />
                            <circle cx="0" cy="0" r="13" fill="#eab308" />
                            <Sparkles size={11} fill="#ffffff" stroke="none" className="mx-auto text-white -mt-0.5" />
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          ) : (
            /* TAB 2: SEPARATED PRINT CUTOUT SHEET - A4 Print optimized */
            <div className="w-full">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center mb-6 no-print text-[11px] font-semibold text-amber-800 flex items-center justify-center gap-1">
                ✂️ Hướng dẫn: In màu/Trắng-Đen ra giấy bìa dày. Cho học sinh cắt rời 100% theo các viền nét Đứt màu vàng cam để giải mật mã ghép số.
              </div>

              {/* Grid representation of individual shattered puzzle pieces bounding-boxed dynamically */}
              <div
                className="grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8 justify-center justify-items-center"
                style={{
                  transform: `scale(${pieceSize})`,
                  transformOrigin: 'top center',
                }}
              >
                {getPiecesWithUniqueKey.map((p) => {
                  // Compute dynamic local bounding box for individual isolated card box
                  let minX = Infinity;
                  let maxX = -Infinity;
                  let minY = Infinity;
                  let maxY = -Infinity;

                  p.absolutePoints.forEach(v => {
                    if (v.x < minX) minX = v.x;
                    if (v.x > maxX) maxX = v.x;
                    if (v.y < minY) minY = v.y;
                    if (v.y > maxY) maxY = v.y;
                  });

                  const w = maxX - minX + 50;
                  const h = maxY - minY + 50;
                  const dx = -minX + 25;
                  const dy = -minY + 25;

                  const text = p.isQuestion ? p.pData.question : p.pData.answer;

                  return (
                    <div
                      key={`scram-cell-${p.id}`}
                      className="relative p-2 rounded-2xl border-2 border-dashed border-[#FFAE00]/50 bg-amber-50/10 flex flex-col items-center justify-center min-h-[190px] w-[190px]"
                    >
                      {/* Corner Scissor Guideline */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 border border-slate-300 text-slate-500 z-10 shadow-sm">
                        <Scissors size={10} className="rotate-45" />
                      </div>

                      <span className="absolute bottom-1 right-2 text-[8px] font-bold text-slate-400 font-mono tracking-wider">
                        MẢNH {p.isQuestion ? 'HỎI' : 'ĐÁP'} #{p.index + 1}
                      </span>

                      {/* SVG Canvas specifically sized for this piece */}
                      <svg
                        width="170"
                        height="150"
                        viewBox={`0 0 ${w} ${h}`}
                        className="overflow-visible"
                      >
                        <g transform={`translate(${dx}, ${dy})`}>
                          
                          {/* 3D Cast shadow for cutout card for visualization */}
                          {!saveInk && (
                            <path
                              d={drawPiecePath(p.absolutePoints, p.edges)}
                              fill={p.colors.shadow}
                              transform="translate(2, 4)"
                              opacity="0.8"
                            />
                          )}

                          {/* Piece Main */}
                          <path
                            d={drawPiecePath(p.absolutePoints, p.edges)}
                            fill={saveInk ? '#ffffff' : p.colors.fill}
                            stroke={saveInk ? '#1e293b' : p.colors.border}
                            strokeWidth={saveInk ? 1.5 : 3.0}
                            strokeLinejoin="round"
                          />

                          {/* Fit label */}
                          {(() => {
                            const cBox = getPieceContentBox(p.points);
                            return (
                              <foreignObject
                                x={p.absoluteCenter.x + cBox.xOffset}
                                y={p.absoluteCenter.y + cBox.yOffset}
                                width={cBox.width}
                                height={cBox.height}
                              >
                                <div
                                  xmlns="http://www.w3.org/1999/xhtml"
                                  className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-text px-1"
                                  style={{
                                    color: saveInk ? '#1e293b' : '#ffffff',
                                    fontFamily: '"Inter", sans-serif',
                                  }}
                                >
                                  <MathJaxWrapper
                                    text={text}
                                    className="font-bold text-center w-full"
                                    style={{
                                      fontSize: `${calculateDynamicFontSize(text, 11, 10, 13.5)}px`,
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      minHeight: '1.2em'
                                    }}
                                  />
                                </div>
                              </foreignObject>
                            );
                          })()}
                        </g>
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
