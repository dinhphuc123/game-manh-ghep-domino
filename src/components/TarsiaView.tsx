import React, { useMemo } from 'react';
import { Scissors } from 'lucide-react';
import { PuzzlePair, ThemeStyle, TarsiaShape } from '../types';
import { MathJaxWrapper, calculateDynamicFontSize } from './MathJaxWrapper';

interface Point {
  x: number;
  y: number;
}

interface TriangleData {
  id: number;
  vertices: Point[];
  center: Point;
  isPointingUp: boolean; // relative designation for coloring
  sides: (SideMatch | null)[];
}

interface SideMatch {
  pairId: string;
  isQuestion: boolean;
  text: string;
  code: string;
}

interface TarsiaViewProps {
  pairs: PuzzlePair[];
  shape: TarsiaShape;
  style: ThemeStyle;
  showMatchCode: boolean;
  showDoodleIcons: boolean;
  saveInk: boolean;
  pieceSize: number;
  activeTab: 'poster' | 'cutout';
}

export const TarsiaView: React.FC<TarsiaViewProps> = ({
  pairs,
  shape,
  style,
  showMatchCode,
  showDoodleIcons,
  saveInk,
  pieceSize,
  activeTab,
}) => {
  const sideLength = 170; // Side length of each equilateral triangle in pixels
  const height = sideLength * Math.sqrt(3) / 2;

  // 1. GENERATE RAW TRIANGLES FOR EACH SHAPE
  const rawTriangles = useMemo(() => {
    const list: { vertices: Point[] }[] = [];

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

    if (shape === 'triangle_4') {
      addTri(0, 2, true);
      addTri(-1, 5, true);
      addTri(0, 4, false);
      addTri(1, 5, true);
    } else if (shape === 'triangle_9') {
      addTri(0, 2, true);
      addTri(-1, 5, true);
      addTri(0, 4, false);
      addTri(1, 5, true);
      addTri(-2, 8, true);
      addTri(-1, 7, false);
      addTri(0, 8, true);
      addTri(1, 7, false);
      addTri(2, 8, true);
    } else if (shape === 'triangle_16') {
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
    } else if (shape === 'parallelogram_10') {
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
    } else if (shape === 'hexagon_6') {
      for (let k = 0; k < 6; k++) {
        const theta1 = (k * Math.PI) / 3;
        const theta2 = ((k + 1) * Math.PI) / 3;
        list.push({ vertices: [
          { x: 0, y: 0 },
          { x: sideLength * Math.cos(theta1), y: sideLength * Math.sin(theta1) },
          { x: sideLength * Math.cos(theta2), y: sideLength * Math.sin(theta2) }
        ]});
      }
    } else if (shape === 'star') {
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
    } else if (shape === 'trapezoid_6') {
      addTri(0, 2, true);
      addTri(1, 1, false);
      addTri(2, 2, true);
      addTri(3, 1, false);
      addTri(4, 2, true);
      addTri(5, 1, false);
    } else if (shape === 'chevron_12') {
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
    } else if (shape === 'chevron_8') {
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
    } else if (shape === 'trapezoid_5') {
      addTri(0, 2, true);
      addTri(1, 1, false);
      addTri(2, 2, true);
      addTri(3, 1, false);
      addTri(4, 2, true);
    } else if (shape === 'fish_12') {
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
    } else if (shape === 'rhombus') {
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
    } else if (shape === 'heart_12') {
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
    } else if (shape === 'heart_18') {
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
  }, [shape, sideLength, height]);

  // 2. CLUSTER VERTICES & MAP INTERNAL EDGES DETERMINISTICALLY
  const trianglesWithMatches = useMemo(() => {
    const points: Point[] = [];
    rawTriangles.forEach((t) => points.push(...t.vertices));

    const uniquePoints: Point[] = [];
    const getPointId = (p: Point): number => {
      for (let i = 0; i < uniquePoints.length; i++) {
        const u = uniquePoints[i];
        const dist = Math.hypot(p.x - u.x, p.y - u.y);
        if (dist < 1.0) return i;
      }
      uniquePoints.push(p);
      return uniquePoints.length - 1;
    };

    const trisWithIds = rawTriangles.map((t, idx) => {
      const ids = t.vertices.map((v) => getPointId(v));
      const cx = (t.vertices[0].x + t.vertices[1].x + t.vertices[2].x) / 3;
      const cy = (t.vertices[0].y + t.vertices[1].y + t.vertices[2].y) / 3;
      const isPointingUp = t.vertices[0].y < t.vertices[1].y;

      return {
        id: idx,
        vertices: t.vertices,
        pointIds: ids,
        center: { x: cx, y: cy },
        isPointingUp,
      };
    });

    const edgeCounts: { [key: string]: number } = {};
    const edgeTriangles: { [key: string]: number[] } = {};

    trisWithIds.forEach((t) => {
      const sides = [
        [t.pointIds[0], t.pointIds[1]],
        [t.pointIds[1], t.pointIds[2]],
        [t.pointIds[2], t.pointIds[0]],
      ];

      sides.forEach((side) => {
        const idMin = Math.min(side[0], side[1]);
        const idMax = Math.max(side[0], side[1]);
        const key = `${idMin}_${idMax}`;

        edgeCounts[key] = (edgeCounts[key] || 0) + 1;
        if (!edgeTriangles[key]) edgeTriangles[key] = [];
        edgeTriangles[key].push(t.id);
      });
    });

    const internalEdges = Object.keys(edgeCounts).filter((key) => edgeCounts[key] === 2);

    internalEdges.sort((a, b) => {
      const parseEdge = (key: string) => {
        const [id1, id2] = key.split('_').map(Number);
        const p1 = uniquePoints[id1];
        const p2 = uniquePoints[id2];
        return {
          midX: (p1.x + p2.x) / 2,
          midY: (p1.y + p2.y) / 2,
        };
      };

      const edgeA = parseEdge(a);
      const edgeB = parseEdge(b);

      if (Math.abs(edgeA.midY - edgeB.midY) > 0.5) {
        return edgeA.midY - edgeB.midY;
      }
      return edgeA.midX - edgeB.midX;
    });

    const edgeToPairMap: { [key: string]: { pair: PuzzlePair; pairIndex: number } } = {};
    internalEdges.forEach((key, idx) => {
      if (idx < pairs.length) {
        edgeToPairMap[key] = {
          pair: pairs[idx],
          pairIndex: idx,
        };
      }
    });

    const finalTriangles: TriangleData[] = trisWithIds.map((t) => {
      const matchedSides: (SideMatch | null)[] = [null, null, null];

      const sides = [
        [t.pointIds[0], t.pointIds[1]],
        [t.pointIds[1], t.pointIds[2]],
        [t.pointIds[2], t.pointIds[0]],
      ];

      sides.forEach((side, sideIdx) => {
        const idMin = Math.min(side[0], side[1]);
        const idMax = Math.max(side[0], side[1]);
        const key = `${idMin}_${idMax}`;

        if (edgeToPairMap[key]) {
          const { pair } = edgeToPairMap[key];
          const sharingTris = edgeTriangles[key];
          const isQuestion = sharingTris[0] === t.id;

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

    return { triangles: finalTriangles, totalInternal: internalEdges.length };
  }, [rawTriangles, pairs]);

  const boundingBox = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    trianglesWithMatches.triangles.forEach((t) => {
      t.vertices.forEach((v) => {
        if (v.x < minX) minX = v.x;
        if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
      });
    });

    if (minX === Infinity) {
      return { width: 500, height: 400, offsetX: 250, offsetY: 200, minX: 0, minY: 0 };
    }

    const padding = 45;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    return {
      width,
      height,
      offsetX: -minX + padding,
      offsetY: -minY + padding,
      minX,
      minY,
    };
  }, [trianglesWithMatches.triangles]);

  // RENDERING COMPONENT FUNCTION FOR TARSIA SIDE CARD
  const renderSinglePieceSVG = (t: TriangleData, customSize?: number, scrambleRotation = 0) => {
    const sizeFactor = customSize || 1;
    const s = sideLength * sizeFactor;
    const h = height * sizeFactor;

    // Standard equilateral triangle pointing UP centered at (0, 0)
    const innerV_up = [
      { x: 0, y: -h * 2 / 3 }, // Top tip (V0)
      { x: s / 2, y: h / 3 }, // Bottom-Right (V1)
      { x: -s / 2, y: h / 3 }, // Bottom-Left (V2)
    ];

    const vibrantClrs = t.isPointingUp 
      ? { fill: '#ecfdf5', stroke: '#10b981', text: '#065f46', base: 'rgba(16, 185, 129, 0.08)' } 
      : { fill: '#eff6ff', stroke: '#3b82f6', text: '#1e3a8a', base: 'rgba(59, 130, 246, 0.08)' };

    const pastelClrs = t.isPointingUp 
      ? { fill: '#f8fafc', stroke: '#64748b', text: '#0f172a', base: 'rgba(100, 116, 139, 0.05)' } 
      : { fill: '#fcfcfc', stroke: '#475569', text: '#334155', base: 'rgba(71, 85, 105, 0.04)' };

    const colors = style === 'vibrant' ? vibrantClrs : pastelClrs;

    // For printing cutout sheets, force crisp black borders to help scissors
    const strokeColor = (activeTab === 'cutout' || saveInk) ? '#000000' : colors.stroke;
    const strokeW = (activeTab === 'cutout' || saveInk) ? 1.8 : 2.5;
    const labelConfigs = [
      {
        angle: 60,
        tx: s * 0.17,
        ty: -h * 0.07,
        width: s * 0.76,
        height: 32,
      },
      {
        angle: 180,
        tx: 0,
        ty: h / 3 - 22,
        width: s - 20,
        height: 32,
      },
      {
        angle: -60,
        tx: -s * 0.17,
        ty: -h * 0.07,
        width: s * 0.76,
        height: 32,
      }
    ];

    return (
      <g transform={`rotate(${scrambleRotation})`}>
        <polygon
          points={innerV_up.map(p => `${p.x},${p.y}`).join(' ')}
          fill={(saveInk || activeTab === 'cutout') ? '#ffffff' : colors.fill}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />

        {!saveInk && activeTab !== 'cutout' && showDoodleIcons && (
          <circle cx="0" cy={-h*2/3 + 12} r="1.5" fill={colors.stroke} className="opacity-40" />
        )}

        {t.sides.map((side, sIdx) => {
          if (!side) return null;
          const conf = labelConfigs[sIdx];
          const isQuestion = side.isQuestion;

          return (
            <g
              key={`side-${t.id}-${sIdx}`}
              transform={`translate(${conf.tx}, ${conf.ty}) rotate(${conf.angle})`}
            >
              <foreignObject
                x={-conf.width / 2}
                y={-conf.height / 2}
                width={conf.width}
                height={conf.height}
              >
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-none notranslate px-1"
                  translate="no"
                  style={{
                    color: (saveInk || activeTab === 'cutout') ? '#000000' : colors.text,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  <MathJaxWrapper
                    text={side.text}
                    className="font-bold text-center w-full"
                    style={{
                      fontSize: `${calculateDynamicFontSize(
                        side.text,
                        activeTab === 'cutout' ? 11 : 9,
                        activeTab === 'cutout' ? 10 : 6,
                        activeTab === 'cutout' ? 12 : 11
                      )}px`,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: '1.2em'
                    }}
                  />
                </div>
              </foreignObject>
            </g>
          );
        })}
      </g>
    );
  };

  // RENDER CENTRAL BIG HEXAGON PIECE FOR HEXAGON_CORE
  const renderCentralHexagon = (customSize = 1.0, rotation = 0) => {
    const s = sideLength * customSize;
    
    // 6 outer corners of a flat-topped hexagon
    const hexPoints = Array.from({ length: 6 }).map((_, i) => {
      const theta = (i * Math.PI) / 3;
      return {
        x: s * Math.cos(theta),
        y: s * Math.sin(theta)
      };
    });

    const colors = style === 'vibrant'
      ? { fill: '#f0fdf4', stroke: '#16a34a', text: '#14532d', base: 'rgba(22, 163, 74, 0.08)' }
      : { fill: '#fafaf9', stroke: '#78716c', text: '#44403c', base: 'rgba(120, 113, 108, 0.04)' };

    const strokeColor = (activeTab === 'cutout' || saveInk) ? '#000000' : colors.stroke;
    const strokeW = (activeTab === 'cutout' || saveInk) ? 1.8 : 2.5;

    return (
      <g transform={`rotate(${rotation})`}>
        <polygon
          points={hexPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill={(saveInk || activeTab === 'cutout') ? '#ffffff' : colors.fill}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />

        <circle cx="0" cy="0" r="18" fill={(saveInk || activeTab === 'cutout') ? '#f1f5f9' : colors.base} stroke={saveInk ? '#cbd5e1' : strokeColor} strokeWidth={1} />
        <text 
          x="0" 
          y="3.5" 
          textAnchor="middle" 
          className="font-mono text-[9px] font-extrabold"
          fill={(saveInk || activeTab === 'cutout') ? '#000000' : colors.text}
        >
          ⬢LỤC GIÁC
        </text>

        {Array.from({ length: 6 }).map((_, k) => {
          // Get matching pair from inner triangle (2 * k) side 1
          const innerTri = trianglesWithMatches.triangles[2 * k];
          const side = innerTri ? innerTri.sides[1] : null;
          if (!side) return null;

          const angleDeg = k * 60 + 30;
          const angleRad = (angleDeg * Math.PI) / 180;
          // Apothem of the hexagon
          const rIn = (s * Math.sqrt(3)) / 2;
          // Translate text inside hexagon
          const tx = (rIn - 20) * Math.cos(angleRad);
          const ty = (rIn - 20) * Math.sin(angleRad);

          const width = s - 25;
          const height = 40;

          // Rotate text so that its feet point towards the center of the hexagon
          // Standard angleDeg has feet pointing to k*60+30-90 = k*60-60.
          // To ensure it's not upside down, if rotation is between 90 and 270 (k=2,3,4), we rotate by 180.
          let textRot = angleDeg;
          // For hexagon center, standard angleDeg + 180 makes the text feet point inwards.
          textRot = angleDeg + 180;

          return (
            <g
              key={`hex-side-${k}`}
              transform={`translate(${tx}, ${ty}) rotate(${textRot})`}
            >
              <foreignObject
                x={-width / 2}
                y={-height / 2}
                width={width}
                height={height}
              >
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-none notranslate px-1"
                  translate="no"
                  style={{
                    color: (saveInk || activeTab === 'cutout') ? '#000000' : colors.text,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  <MathJaxWrapper
                    text={side.text}
                    className="font-bold text-center w-full"
                    style={{
                      fontSize: `${calculateDynamicFontSize(
                        side.text,
                        activeTab === 'cutout' ? 11 : 9,
                        activeTab === 'cutout' ? 10 : 6,
                        activeTab === 'cutout' ? 12 : 11
                      )}px`,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: '1.2em'
                    }}
                  />
                </div>
              </foreignObject>
            </g>
          );
        })}
      </g>
    );
  };

  // SCRAMBLE LOGIC FOR THE INDIVIDUAL PIECES PRINT SHEET
  const scrambledTriangles = useMemo(() => {
    let list = [...trianglesWithMatches.triangles];
    
    // For Hexagon Core, we only print the 6 outer wing triangles (odd indexes: 1, 3, 5, 7, 9, 11)
    if (shape === 'hexagon_core') {
      list = list.filter(t => t.id % 2 === 1);
    }

    const seededShuffled = list.map((tri, index) => {
      const rotations = [0, 120, 240];
      const randRot = rotations[(index * 7 + 3) % 3];
      return {
        tri,
        rotation: randRot,
      };
    });
    
    return seededShuffled.sort((a, b) => {
      const hashA = (a.tri.id * 13) % 17;
      const hashB = (b.tri.id * 13) % 17;
      return hashA - hashB;
    });
  }, [trianglesWithMatches.triangles, shape]);

  return (
    <div className="w-full">
      {/* Dynamic Statistics Badge */}
      <div className="no-print mb-4 flex justify-between items-center bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-xs text-slate-600">
        <span className="font-semibold flex items-center gap-1">
          📐 Kiểu Tarsia: {
            shape === 'triangle_4' ? 'Tam Giác Nhỏ (4 mảnh)' :
            shape === 'triangle_9' ? 'Tam Giác Vừa (9 mảnh)' :
            shape === 'triangle_16' ? 'Tam Giác Lớn (16 mảnh)' :
            shape === 'parallelogram_10' ? 'Hình Bình Hành (10 mảnh)' :
            shape === 'hexagon_6' ? 'Lục Giác Đơn Giản (6 mảnh)' :
            shape === 'star' ? 'Ngôi Sao 6 Cánh (12 mảnh)' :
            shape === 'trapezoid_6' ? 'Hình Thang Lớn (6 mảnh)' :
            shape === 'chevron_12' ? 'Hình Chữ V Lớn (12 mảnh)' :
            shape === 'chevron_8' ? 'Hình Chữ V Nhỏ (8 mảnh)' :
            shape === 'trapezoid_5' ? 'Hình Thang Nhỏ (5 mảnh)' :
            shape === 'fish_12' ? 'Hình Cá / Cây Thông (12 mảnh)' :
            shape === 'rhombus' ? 'Hình Thoi Đối Xứng (8 mảnh)' :
            shape === 'heart_12' ? 'Trái Tim Nhỏ (12 mảnh)' : 'Trái Tim Lớn (18 mảnh)'
          }
        </span>
        <span className="font-mono bg-[#159BAD] text-white font-extrabold px-2.5 py-0.5 rounded-full">
          Nạp {Math.min(pairs.length, trianglesWithMatches.totalInternal)} / {trianglesWithMatches.totalInternal} cặp ghép
        </span>
      </div>

      {pairs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <span className="text-5xl text-slate-300 block mb-3">📐</span>
          <p className="text-xs text-slate-400 font-bold block">Hãy nạp hoặc thêm danh sách câu hỏi để tự động sinh thiết kế!</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: INTEGRATED POSTER DESIGN */}
          {activeTab === 'poster' ? (
            <div 
              className="relative w-full mx-auto flex items-center justify-center overflow-auto custom-scroll"
              style={{
                transform: `scale(${pieceSize})`,
                transformOrigin: 'top center',
                paddingTop: '20px',
                paddingBottom: '20px',
                height: `${boundingBox.height * pieceSize + 10}px`,
              }}
            >
              <svg
                width={boundingBox.width}
                height={boundingBox.height}
                viewBox={`0 0 ${boundingBox.width} ${boundingBox.height}`}
                className="mx-auto"
              >
                <g transform={`translate(${boundingBox.offsetX}, ${boundingBox.offsetY})`}>
                  {shape === 'hexagon_core' ? (
                    <>
                      {/* Big Hexagon at center */}
                      <g transform="translate(0, 0)">
                        {renderCentralHexagon(1.0, 0)}
                      </g>
                      {/* Outer Wing Triangles */}
                      {trianglesWithMatches.triangles.map((t) => {
                        if (t.id % 2 === 0) return null;
                        const k = Math.floor(t.id / 2);
                        const rotAngle = k * 60 + 120;
                        return (
                          <g
                            key={`poster-tri-${t.id}`}
                            transform={`translate(${t.center.x}, ${t.center.y})`}
                          >
                            {renderSinglePieceSVG(t, 1.0, rotAngle)}
                          </g>
                        );
                      })}
                    </>
                  ) : (
                    trianglesWithMatches.triangles.map((t) => {
                      let rotAngle = t.isPointingUp ? 0 : 180;
                      if (shape === 'hexagon_6') {
                        rotAngle = (t.id * 60 + 300) % 360;
                      } else if (shape === 'star') {
                        const k = Math.floor(t.id / 2);
                        if (t.id % 2 === 0) {
                          rotAngle = (k * 60 + 300) % 360;
                        } else {
                          rotAngle = (k * 60 + 120) % 360;
                        }
                      }
                      return (
                        <g
                          key={`poster-tri-${t.id}`}
                          transform={`translate(${t.center.x}, ${t.center.y})`}
                        >
                          {renderSinglePieceSVG(t, 1.0, rotAngle)}
                        </g>
                      );
                    })
                  )}
                </g>
              </svg>
            </div>
          ) : (
            /* TAB 2: DETACHED PRINT CUTOUT SHEETS - Nền trắng tinh, viền đen sắc nét */
            <div className="w-full">
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl text-center mb-6 no-print">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1 font-bold">
                  ✂️ Bản In Cắt Tinh Giản: Dùng kéo cắt rời trực tiếp các mảnh ghép theo viền màu đen nét liền bên dưới để phát cho học sinh lắp ráp.
                </p>
              </div>

              {/* Grid layout for A4 Print */}
              <div 
                className="flex flex-wrap gap-y-12 gap-x-8 justify-center items-center"
                style={{
                  transform: `scale(${pieceSize})`,
                  transformOrigin: 'top center',
                }}
              >
                {/* For hexagon_core, we print the central hexagon first */}
                {shape === 'hexagon_core' && (
                  <div className="relative flex flex-col items-center justify-center min-h-[240px] w-[240px] bg-white">
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 border border-slate-300 text-slate-500 z-10 shadow-sm" title="Đường cắt dọc">
                      <Scissors size={11} className="rotate-45" />
                    </div>
                    <span className="absolute bottom-1 right-2 text-[8px] font-bold text-slate-400 font-mono tracking-widest bg-white px-1.5 rounded-full">
                      MẢNH LỤC GIÁC TÂM
                    </span>
                    <svg
                      width="230"
                      height="230"
                      viewBox="-115 -115 230 230"
                      className="overflow-visible"
                    >
                      {renderCentralHexagon(1.1, 0)}
                    </svg>
                  </div>
                )}

                {/* Print other scrambled triangles */}
                {scrambledTriangles.map(({ tri, rotation }) => (
                  <div
                    key={`scram-tri-cell-${tri.id}`}
                    className="relative flex flex-col items-center justify-center min-h-[210px] w-[210px] bg-white"
                  >
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 border border-slate-300 text-slate-500 z-10 shadow-sm" title="Đường cắt dọc">
                      <Scissors size={11} className="rotate-45" />
                    </div>

                    <span className="absolute bottom-1 right-2 text-[8px] font-bold text-slate-400 font-mono tracking-widest bg-white px-1.5 rounded-full">
                      MẢNH #{tri.id + 1}
                    </span>

                    <svg
                      width="200"
                      height="180"
                      viewBox="-100 -90 200 180"
                      className="overflow-visible"
                    >
                      {renderSinglePieceSVG(tri, 1.1, rotation)}
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
