import React from 'react';
import { GameSettings, PuzzlePair } from '../../types';
import { MathJaxWrapper, calculateDynamicFontSize } from '../MathJaxWrapper';
import { generateMazeData } from '../../utils/mazeGenerator';

interface PlayablePiece {
  id: string;
  type: string;
  text: string;
  code: string;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  isSnapped: boolean;
  mazeCellRow?: number;
  mazeCellCol?: number;
  mazeCellIsCorrectPath?: boolean;
  mazeCellCorrectPathIndex?: number;
}

interface PlayMazeBoardProps {
  pieces: PlayablePiece[];
  settings: GameSettings;
  boardSize: { w: number; h: number; offsetX?: number; offsetY?: number };
  pairs: PuzzlePair[];
  activeDraggingId: string | null;
  scaleFactor: number;
  handlePointerDown: (e: React.PointerEvent, id: string) => void;
  handlePointerMove: (e: React.PointerEvent, id: string) => void;
  handlePointerUp: (e: React.PointerEvent, id: string) => void;
  getMazeColors: (style: 'vibrant' | 'pastel', saveInk: boolean) => any;
}

export const PlayMazeBoard: React.FC<PlayMazeBoardProps> = ({
  pieces,
  settings,
  boardSize,
  pairs,
  activeDraggingId,
  scaleFactor,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  getMazeColors,
}) => {
  const maze = generateMazeData(pairs, settings);
  const cellW = 125;
  const cellH = 95;
  const gapX = 75;
  const gapY = 70;
  const strideX = cellW + gapX;
  const strideY = cellH + gapY;
  const padding = 60;
  const colors = getMazeColors(settings.style || 'vibrant', settings.saveInk || false);

  const getCenter = (r: number, c: number) => ({
    x: padding + c * strideX + cellW / 2,
    y: padding + r * strideY + cellH / 2,
  });

  const getLeftTop = (r: number, c: number) => ({
    x: padding + c * strideX,
    y: padding + r * strideY,
  });

  const mazeCellPieces = pieces.filter(p => p.type === 'maze_cell');

  return (
    <>
      {/* 1. Vẽ các đường nối & các badge đáp án nét đứt trên Board */}
      <div className="absolute inset-0 select-none pointer-events-none" style={{ width: boardSize.w, height: boardSize.h }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: boardSize.w, height: boardSize.h, pointerEvents: 'none', zIndex: 1 }}>
          {maze.edges.map((edge) => {
            const pA = getCenter(edge.rowA, edge.colA);
            const pB = getCenter(edge.rowB, edge.colB);
            return (
              <line
                key={`play-line-${edge.id}`}
                x1={pA.x}
                y1={pA.y}
                x2={pB.x}
                y2={pB.y}
                stroke={colors.connector}
                strokeWidth={3.5}
                strokeDasharray={settings.saveInk ? '4 4' : 'none'}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {maze.edges.map((edge) => {
          const pA = getCenter(edge.rowA, edge.colA);
          const pB = getCenter(edge.rowB, edge.colB);
          const xMid = (pA.x + pB.x) / 2;
          const yMid = (pA.y + pB.y) / 2;
          const ec = colors.normalEdge;

          return (
            <div
              key={`play-badge-${edge.id}`}
              style={{
                position: 'absolute',
                left: xMid - 25,
                top: yMid - 11,
                zIndex: 3,
                width: 50,
                height: 22,
                background: ec.bg,
                border: `${settings.saveInk ? 1.5 : 2}px solid ${ec.border}`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px 4px',
                boxShadow: settings.saveInk ? 'none' : '0 2px 6px rgba(0,0,0,0.08)',
              }}
            >
              <MathJaxWrapper
                text={edge.text}
                debounceMs={0}
                style={{
                  fontSize: calculateDynamicFontSize(edge.text, 9, 7, 11),
                  fontWeight: 700,
                  color: ec.text,
                  textAlign: 'center',
                  minHeight: 'unset',
                  lineHeight: 1.2,
                  width: '100%',
                }}
              />
            </div>
          );
        })}

        {/* Khởi tạo các ô không đổi chỗ (Start, Finish, Distractor cells) */}
        {(() => {
          const list: React.ReactNode[] = [];
          for (let r = 0; r < settings.mazeRows; r++) {
            for (let c = 0; c < settings.mazeCols; c++) {
              const isStart = r === 0 && c === 0;
              const isEnd = r === settings.mazeRows - 1 && c === settings.mazeCols - 1;
              const cellData = maze.cells[r]?.[c];
              const pos = getLeftTop(r, c);
              const isCorrectPath = maze.correctPath.some(p => p.row === r && p.col === c);

              if (isEnd) {
                list.push(
                  <div
                    key={`play-board-cell-end`}
                    style={{
                      position: 'absolute',
                      left: pos.x,
                      top: pos.y,
                      width: cellW,
                      height: cellH,
                      borderRadius: 14,
                      border: `2px solid ${colors.endCell.border}`,
                      background: colors.endCell.bg,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 3,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: colors.endCell.labelBg,
                      color: colors.endCell.label,
                      fontSize: 8,
                      fontWeight: 900,
                      borderRadius: 4,
                      padding: '1px 6px',
                    }}>
                      FINISH
                    </div>
                    <div className="text-xl">🏁</div>
                  </div>
                );
              } else if (!isCorrectPath) {
                list.push(
                  <div
                    key={`play-board-cell-distractor-${r}-${c}`}
                    style={{
                      position: 'absolute',
                      left: pos.x,
                      top: pos.y,
                      width: cellW,
                      height: cellH,
                      borderRadius: 14,
                      border: `2px solid ${colors.normalCell.border}`,
                      background: colors.normalCell.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px 6px',
                      zIndex: 2,
                    }}
                  >
                    <MathJaxWrapper
                      text={cellData.question}
                      debounceMs={0}
                      style={{
                        fontSize: calculateDynamicFontSize(cellData.question, 12, 8, 15),
                        fontWeight: 750,
                        color: colors.normalCell.text,
                        textAlign: 'center',
                      }}
                    />
                  </div>
                );
              } else {
                const idx = maze.correctPath.findIndex(p => p.row === r && p.col === c);
                list.push(
                  <div
                    key={`play-board-cell-placeholder-${r}-${c}`}
                    style={{
                      position: 'absolute',
                      left: pos.x,
                      top: pos.y,
                      width: cellW,
                      height: cellH,
                      borderRadius: 14,
                      border: '2px dashed rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                  >
                    <span className="text-white/10 font-bold text-lg">{idx + 1}</span>
                  </div>
                );
              }
            }
          }
          return list;
        })()}
      </div>

      {/* 2. Vẽ các ô câu hỏi thuộc đường đi đúng đang kéo thả */}
      {mazeCellPieces.map((piece) => {
        const isDragging = activeDraggingId === piece.id;
        const finalX = piece.currentX;
        const finalY = piece.currentY;
        const isStart = piece.mazeCellRow === 0 && piece.mazeCellCol === 0;
        const cellColor = isStart ? colors.startCell : colors.normalCell;

        return (
          <div
            key={piece.id}
            className={`absolute select-none ${
              piece.isSnapped ? 'pointer-events-none transition-all duration-300' : isDragging ? 'z-50 filter drop-shadow-2xl scale-[1.05]' : 'z-30 hover:scale-[1.02]'
            }`}
            style={{
              left: `${piece.isSnapped ? piece.targetX : finalX}px`,
              top: `${piece.isSnapped ? piece.targetY : finalY}px`,
              width: `${cellW}px`,
              height: `${cellH}px`,
              transform: piece.isSnapped ? 'none' : 'translate(-62.5px, -47.5px)',
              touchAction: 'none',
            }}
            onPointerDown={(e) => handlePointerDown(e, piece.id)}
            onPointerMove={(e) => handlePointerMove(e, piece.id)}
            onPointerUp={(e) => handlePointerUp(e, piece.id)}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 14,
                border: `${settings?.saveInk ? 1.5 : 2.5}px solid ${cellColor.border}`,
                background: cellColor.bg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: settings?.saveInk ? 'none' : '0 4px 12px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}
            >
              {isStart && (
                <div style={{
                  position: 'absolute',
                  top: 3,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: cellColor.labelBg,
                  color: cellColor.label,
                  fontSize: 8,
                  fontWeight: 950,
                  borderRadius: 4,
                  padding: '1px 6px',
                }}>
                  START
                </div>
              )}

              <div style={{
                width: '100%',
                padding: '4px 6px',
                paddingTop: isStart ? 14 : 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
              }}>
                <MathJaxWrapper
                  text={piece.text}
                  debounceMs={0}
                  style={{
                    fontSize: calculateDynamicFontSize(piece.text, 12, 8, 15),
                    fontWeight: 750,
                    color: cellColor.text,
                    textAlign: 'center',
                    lineHeight: 1.3,
                    width: '100%',
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
