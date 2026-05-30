import React, { useMemo, useEffect } from 'react';
import { Scissors } from 'lucide-react';
import { PuzzlePair, ThemeStyle } from '../types';

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
  shape: 'triangle_9' | 'triangle_18' | 'hexagon' | 'rhombus';
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

    if (shape === 'triangle_9' || shape === 'triangle_18') {
      const rows = shape === 'triangle_9' ? 3 : 4;
      // Top vertex of the big triangle is at (0, 0)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 2 * r + 1; c++) {
          let cx = 0;
          let cy = 0;
          let vertices: Point[] = [];

          if (c % 2 === 0) {
            // Points UP
            cy = r * height + 2 * height / 3;
            cx = (c / 2 - r / 2) * sideLength;
            vertices = [
              { x: cx, y: cy - height * 2 / 3 }, // Top
              { x: cx + sideLength / 2, y: cy + height / 3 }, // Bottom-Right
              { x: cx - sideLength / 2, y: cy + height / 3 }, // Bottom-Left
            ];
          } else {
            // Points DOWN
            cy = r * height + height / 3;
            cx = ((c - 1) / 2 - r / 2 + 0.5) * sideLength;
            vertices = [
              { x: cx, y: cy + height * 2 / 3 }, // Bottom
              { x: cx - sideLength / 2, y: cy - height / 3 }, // Top-Left
              { x: cx + sideLength / 2, y: cy - height / 3 }, // Top-Right
            ];
          }
          list.push({ vertices });
        }
      }
    } else if (shape === 'hexagon') {
      // 24 triangles forming a side-2 hexagon
      // Programmatic layout sector-by-sector (6 sectors)
      for (let k = 0; k < 6; k++) {
        const theta = (k * Math.PI) / 3;
        const nextTheta = ((k + 1) * Math.PI) / 3;

        // Origin at (0, 0)
        // Outer Hexagon corner 1
        const P_k: Point = { x: 2 * sideLength * Math.cos(theta), y: 2 * sideLength * Math.sin(theta) };
        // Outer Hexagon corner 2
        const P_next: Point = { x: 2 * sideLength * Math.cos(nextTheta), y: 2 * sideLength * Math.sin(nextTheta) };

        // Intermediate division points
        const A: Point = { x: P_k.x / 2, y: P_k.y / 2 };
        const B: Point = { x: P_next.x / 2, y: P_next.y / 2 };
        const C = P_k;
        const E = P_next;
        const D: Point = { x: (P_k.x + P_next.x) / 2, y: (P_k.y + P_next.y) / 2 };
        const O: Point = { x: 0, y: 0 };

        // 4 equilateral triangles for this sector
        list.push({ vertices: [O, B, A] }); // T1: Inner pointing out
        list.push({ vertices: [A, B, D] }); // T2: Inner pointing in
        list.push({ vertices: [A, D, C] }); // T3: Outer-left pointing out
        list.push({ vertices: [B, E, D] }); // T4: Outer-right pointing out
      }
    } else if (shape === 'rhombus') {
      // Rhombus Layout (8 triangles forming a large parallelogram)
      // Represented as 4 rhombus units arranged side-by-side
      const addRhombus = (cx: number, cy: number) => {
        // Triangle 1: Points UP
        const upVertices = [
          { x: cx, y: cy - height * 2 / 3 },
          { x: cx + sideLength / 2, y: cy + height / 3 },
          { x: cx - sideLength / 2, y: cy + height / 3 },
        ];
        // Triangle 2: Points DOWN adjacent to UP
        const downVertices = [
          { x: cx + sideLength / 2, y: cy + height / 3 + height / 3 },
          { x: cx, y: cy + height / 3 - height / 3 },
          { x: cx + sideLength, y: cy + height / 3 - height / 3 },
        ];
        list.push({ vertices: upVertices });
        list.push({ vertices: downVertices });
      };

      // Lay them out to form a perfect 2x2 rhombus grid (8 triangles in total)
      addRhombus(0, 0);
      addRhombus(sideLength, 0);
      addRhombus(sideLength / 2, -height);
      addRhombus(3 * sideLength / 2, -height);
    }

    return list;
  }, [shape, sideLength, height]);

  // 2. CLUSTER VERTICES & MAP INTERNAL EDGES DETERMINISTICALLY
  const trianglesWithMatches = useMemo(() => {
    // Collect all vertex points
    const points: Point[] = [];
    rawTriangles.forEach((t) => points.push(...t.vertices));

    // Cluster points within 1px distance
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

    // Replace vertices in triangles with unique IDs
    const trisWithIds = rawTriangles.map((t, idx) => {
      const ids = t.vertices.map((v) => getPointId(v));
      const cx = (t.vertices[0].x + t.vertices[1].x + t.vertices[2].x) / 3;
      const cy = (t.vertices[0].y + t.vertices[1].y + t.vertices[2].y) / 3;

      // Determine orientation based on vertical delta
      // Pointing up: top point (V0) has lower y than base
      const isPointingUp = t.vertices[0].y < t.vertices[1].y;

      return {
        id: idx,
        vertices: t.vertices,
        pointIds: ids,
        center: { x: cx, y: cy },
        isPointingUp,
      };
    });

    // Count edge frequencies
    const edgeCounts: { [key: string]: number } = {};
    const edgeTriangles: { [key: string]: number[] } = {};

    trisWithIds.forEach((t) => {
      const sides = [
        [t.pointIds[0], t.pointIds[1]],
        [t.pointIds[1], t.pointIds[2]],
        [t.pointIds[2], t.pointIds[0]],
      ];

      sides.forEach((side, sideIdx) => {
        const idMin = Math.min(side[0], side[1]);
        const idMax = Math.max(side[0], side[1]);
        const key = `${idMin}_${idMax}`;

        edgeCounts[key] = (edgeCounts[key] || 0) + 1;
        if (!edgeTriangles[key]) edgeTriangles[key] = [];
        edgeTriangles[key].push(t.id);
      });
    });

    // Filter internal edges (frequency === 2)
    const internalEdges = Object.keys(edgeCounts).filter((key) => edgeCounts[key] === 2);

    // Sort internal edges deterministically to map to user's pairs
    // Sort by: y midpoint of the edge (top-down), then x midpoint (left-to-right)
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

    // Map each internal edge to a question-answer pair from user's lists
    const edgeToPairMap: { [key: string]: { pair: PuzzlePair; pairIndex: number } } = {};
    internalEdges.forEach((key, idx) => {
      if (idx < pairs.length) {
        edgeToPairMap[key] = {
          pair: pairs[idx],
          pairIndex: idx,
        };
      }
    });

    // Construct the finalized list of triangles with mapped side text
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
          const { pair, pairIndex } = edgeToPairMap[key];
          // Determine if we render Question or Answer on this triangle
          // Simple deterministic rule: the triangle with the smaller ID gets the question, the larger gets answer.
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

  // Compute overall viewport bounding box of the Poster layout to auto-scale inside workspace
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

    // Ensure safe default fallback if empty
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

  // Handle MathJax rendering updates elegantly on changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MathJax) {
      try {
        (window as any).MathJax.typesetPromise?.();
      } catch (err) {
        console.warn('MathJax typesetting error on Tarsia layout:', err);
      }
    }
  }, [trianglesWithMatches, activeTab, saveInk, pieceSize]);

  // RENDERING COMPONENT FUNCTION FOR TARSIA SIDE CARD
  const renderSinglePieceSVG = (t: TriangleData, customSize?: number, scrambleRotation = 0) => {
    const sizeFactor = customSize || 1;
    const s = sideLength * sizeFactor;
    const h = height * sizeFactor;

    // Define points of a standardized equilateral triangle centered at (0, 0) pointing UP
    const innerV_up = [
      { x: 0, y: -h * 2 / 3 }, // Top tip (V0)
      { x: s / 2, y: h / 3 }, // Bottom-Right (V1)
      { x: -s / 2, y: h / 3 }, // Bottom-Left (V2)
    ];

    // Simple fill colors
    const vibrantClrs = t.isPointingUp 
      ? { fill: '#ecfdf5', stroke: '#10b981', text: '#065f46', base: 'rgba(16, 185, 129, 0.08)' } 
      : { fill: '#eff6ff', stroke: '#3b82f6', text: '#1e3a8a', base: 'rgba(59, 130, 246, 0.08)' };

    const pastelClrs = t.isPointingUp 
      ? { fill: '#f8fafc', stroke: '#64748b', text: '#0f172a', base: 'rgba(100, 116, 139, 0.05)' } 
      : { fill: '#fcfcfc', stroke: '#475569', text: '#334155', base: 'rgba(71, 85, 105, 0.04)' };

    const colors = style === 'vibrant' ? vibrantClrs : pastelClrs;

    // Side Text Label positioning formulas
    // Placing text inside standard centered triangle UP (facing outward towards the edges)
    // Triangle sides are:
    // Side 0: connects V0 (top) and V1 (bottom-right)
    // Side 1: connects V1 (bottom-right) and V2 (bottom-left) -> this is the bottom edge
    // Side 2: connects V2 (bottom-left) and V0 (top)
    const labelConfigs = [
      {
        // Top-Right edge
        angle: 60,
        tx: s / 4 - 8,
        ty: -h / 6 + 12,
        width: s / 2 + 10,
        height: 48,
      },
      {
        // Bottom edge
        angle: 0,
        tx: 0,
        ty: h / 3 - 18,
        width: s - 20,
        height: 45,
      },
      {
        // Top-Left edge
        angle: -60,
        tx: -s / 4 + 8,
        ty: -h / 6 + 12,
        width: s / 2 + 10,
        height: 48,
      }
    ];

    return (
      <g transform={`rotate(${scrambleRotation})`}>
        {/* Draw the triangle background */}
        <polygon
          points={innerV_up.map(p => `${p.x},${p.y}`).join(' ')}
          fill={saveInk ? '#ffffff' : colors.fill}
          stroke={saveInk ? '#1e293b' : colors.stroke}
          strokeWidth={saveInk ? 1.5 : 2.5}
          strokeLinejoin="round"
        />

        {/* Tiny identifier stamp at the centroid for cutout tracking */}
        <circle cx="0" cy="0" r="14" fill={saveInk ? '#f1f5f9' : colors.base} stroke={saveInk ? '#cbd5e1' : colors.stroke} strokeWidth={1} />
        <text 
          x="0" 
          y="3.5" 
          textAnchor="middle" 
          className="font-mono text-[9px] font-extrabold"
          fill={saveInk ? '#475569' : colors.text}
        >
          ▲{t.id + 1}
        </text>

        {/* Outer Doodle Decorative patterns if enabled */}
        {!saveInk && showDoodleIcons && (
          <circle cx="0" cy={-h*2/3 + 12} r="1.5" fill={colors.stroke} className="opacity-40" />
        )}

        {/* Render the 3 matched side texts rotated to fit along the border */}
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
                  className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-text px-1"
                  style={{
                    color: saveInk ? '#1e293b' : colors.text,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  <span
                    className="font-bold line-clamp-2 hyphens-auto"
                    style={{
                      fontSize: saveInk ? '9px' : '9.5px',
                    }}
                  >
                    {side.text}
                  </span>
                  
                  {/* Matching verification code stamps if enabled */}
                  {showMatchCode && (
                    <span 
                      className="text-[7.5px] font-mono mt-0.5 border px-1 rounded-sm scale-90"
                      style={{
                        backgroundColor: saveInk ? '#f8fafc' : colors.base,
                        borderColor: saveInk ? '#cbd5e1' : 'rgba(0, 0, 0, 0.08)',
                        color: saveInk ? '#64748b' : colors.text,
                        fontWeight: 'bold',
                      }}
                    >
                      {isQuestion ? `P${side.code}` : `S${side.code}`}
                    </span>
                  )}
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
    // Return all triangles with deterministic scrambled placements & random 3-way rotations (0, 120, 240)
    const list = [...trianglesWithMatches.triangles];
    // Seeded shuffle so they stay identical unless pairs list shifts
    const seededShuffled = list.map((tri, index) => {
      // Rotate randomly by either 0, 120, or 240 degrees to challenge students
      const rotations = [0, 120, 240];
      const randRot = rotations[(index * 7 + 3) % 3];
      return {
        tri,
        rotation: randRot,
      };
    });
    
    // Shuffle the items deterministically
    return seededShuffled.sort((a, b) => {
      const hashA = (a.tri.id * 13) % 17;
      const hashB = (b.tri.id * 13) % 17;
      return hashA - hashB;
    });
  }, [trianglesWithMatches.triangles]);

  return (
    <div className="w-full">
      {/* Dynamic Statistics Badge */}
      <div className="no-print mb-4 flex justify-between items-center bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-xs text-slate-600">
        <span className="font-semibold flex items-center gap-1">
          📐 Kiểu Tarsia: {
            shape === 'triangle_9' ? 'Tam Giác Trực Quan (9 mảnh)' :
            shape === 'triangle_18' ? 'Tam Giác Cực Đại (16 mảnh)' :
            shape === 'hexagon' ? 'Sân Chơi Lục Giác (24 mảnh)' : 'Hình Thoi Học Đường (8 mảnh)'
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
          {/* TAB 1: INTEGRATED POSTER DESIGN WITH COMPOSITE CONNECTS */}
          {activeTab === 'poster' ? (
            <div 
              className="relative w-full mx-auto flex items-center justify-center overflow-auto custom-scroll"
              style={{
                transform: `scale(${pieceSize})`,
                transformOrigin: 'top center',
                paddingTop: '20px',
                paddingBottom: '20px',
                // Dynamic sizing box to hold full SVG perfectly without cutoffs, responsive
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
                  {trianglesWithMatches.triangles.map((t) => {
                    // Decide pointing direction
                    // If t.isPointingUp is true, we draw centered at (t.center.x, t.center.y) with rotation 0.
                    // If false, we draw pointing down by rotating the standard UP triangle by 180 degrees!
                    // This is exceptionally beautiful because it reuses a single layout generator!
                    const rotAngle = t.isPointingUp ? 0 : 180;
                    return (
                      <g
                        key={`poster-tri-${t.id}`}
                        transform={`translate(${t.center.x}, ${t.center.y})`}
                      >
                        {renderSinglePieceSVG(t, 1.0, rotAngle)}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          ) : (
            /* TAB 2: DETACHED AND SCRAMBLED PRINT CUTOUT SHEETS */
            <div className="w-full">
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl text-center mb-6 no-print">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1 font-bold">
                  ✂️ Nét Đứt In Ấn: Cắt rời các mảnh tam giác bên dưới theo đường viền nét đứt đen-vàng, phát cho các nhóm để giải đố ghép lại thành Poster giải án chuẩn!
                </p>
              </div>

              {/* Grid representation of individual shattered triangle cards suitable for A4 Print */}
              <div 
                className="grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8 justify-center justify-items-center"
                style={{
                  transform: `scale(${pieceSize})`,
                  transformOrigin: 'top center',
                }}
              >
                {scrambledTriangles.map(({ tri, rotation }) => (
                  <div
                    key={`scram-tri-cell-${tri.id}`}
                    className="relative p-2 rounded-xl border-2 border-dashed border-spacing-2 border-[#FFAE00]/60 bg-yellow-50/20 flex flex-col items-center justify-center min-h-[190px] w-[190px]"
                  >
                    {/* Corner Scissor Guideline stamp */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 border border-slate-300 text-slate-500 z-10 shadow-sm" title="Đường cắt dọc">
                      <Scissors size={11} className="rotate-45" />
                    </div>

                    <span className="absolute bottom-1 right-2 text-[8px] font-bold text-slate-400 font-mono tracking-widest bg-white/80 px-1.5 rounded-full">
                      MẢNH #{tri.id + 1}
                    </span>

                    {/* Miniature interactive graphic block */}
                    <svg
                      width="180"
                      height="160"
                      viewBox="-90 -80 180 160"
                      className="overflow-visible"
                    >
                      {/* Render the standard triangle with randomly chosen challenge rotation angle */}
                      {renderSinglePieceSVG(tri, 0.95, rotation)}
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
