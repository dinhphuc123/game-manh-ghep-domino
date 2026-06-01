import React from 'react';
import { GameSettings } from '../../types';
import { MathJaxWrapper, calculateDynamicFontSize } from '../MathJaxWrapper';

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
  dominoId?: number;
  dominoRotation?: number;
  dominoLeftText?: string;
  dominoRightText?: string;
  dominoLeftCode?: string;
  dominoRightCode?: string;
  dominoHasLeft?: boolean;
  dominoHasRight?: boolean;
}

interface PlayDominoBoardProps {
  pieces: PlayablePiece[];
  settings: GameSettings;
  boardSize: { w: number; h: number; offsetX?: number; offsetY?: number };
  activeDraggingId: string | null;
  scaleFactor: number;
  handlePointerDown: (e: React.PointerEvent, id: string) => void;
  handlePointerMove: (e: React.PointerEvent, id: string) => void;
  handlePointerUp: (e: React.PointerEvent, id: string) => void;
}

export const PlayDominoBoard: React.FC<PlayDominoBoardProps> = ({
  pieces,
  settings,
  boardSize,
  activeDraggingId,
  scaleFactor,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
}) => {
  const renderDominoPieceInPlay = (piece: PlayablePiece, rotation: number) => {
    const w = settings?.dominoWidth || 160;
    const h = settings?.dominoHeight || 68;
    
    const vibrantClrs = { fill: '#f0fdf4', stroke: '#16a34a', text: '#14532d', midLine: '#22c55e', base: 'rgba(22, 163, 74, 0.06)' };
    const pastelClrs = { fill: '#fafaf9', stroke: '#78716c', text: '#44403c', midLine: '#a8a29e', base: 'rgba(120, 113, 108, 0.04)' };
    const clrs = settings?.style === 'vibrant' ? vibrantClrs : pastelClrs;
    
    return (
      <g transform={`rotate(${rotation})`}>
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx="10"
          ry="10"
          fill={settings?.saveInk ? '#ffffff' : clrs.fill}
          stroke={settings?.saveInk ? '#000000' : clrs.stroke}
          strokeWidth={settings?.saveInk ? 1.5 : 2.5}
        />
        <line
          x1="0"
          y1={-h / 2 + 3}
          x2="0"
          y2={h / 2 - 3}
          stroke={settings?.saveInk ? '#000000' : clrs.midLine}
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        
        {/* Left Half (Answer / START) */}
        {(() => {
          const foW = Math.max(50, w / 2 - 30);
          const foH = Math.max(34, h - 30);
          return (
            <g transform={`translate(${-w / 4}, 4)`}>
              {piece.dominoHasLeft && (
                <foreignObject x={-foW / 2} y={-foH / 2} width={foW} height={foH}>
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-none px-0.5"
                    style={{ color: settings?.saveInk ? '#000000' : clrs.text, fontFamily: '"Inter", sans-serif' }}
                  >
                    <MathJaxWrapper
                      text={piece.dominoLeftText || ''}
                      className="font-bold text-center w-full"
                      style={{
                        fontSize: piece.dominoLeftText === 'START' ? '12px' : `${calculateDynamicFontSize(piece.dominoLeftText || '', 9.5, 7.5, 13)}px`,
                        color: piece.dominoLeftText === 'START' ? '#dc2626' : (settings?.saveInk ? '#000000' : clrs.text),
                        fontWeight: 'extrabold',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '1.2em',
                      }}
                    />
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })()}
        
        {/* Right Half (Question / END) */}
        {(() => {
          const foW = Math.max(50, w / 2 - 30);
          const foH = Math.max(34, h - 30);
          return (
            <g transform={`translate(${w / 4}, 4)`}>
              {piece.dominoHasRight && (
                <foreignObject x={-foW / 2} y={-foH / 2} width={foW} height={foH}>
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-none px-0.5"
                    style={{ color: settings?.saveInk ? '#000000' : clrs.text, fontFamily: '"Inter", sans-serif' }}
                  >
                    <MathJaxWrapper
                      text={piece.dominoRightText || ''}
                      className="font-bold text-center w-full"
                      style={{
                        fontSize: piece.dominoRightText === 'END' ? '12px' : `${calculateDynamicFontSize(piece.dominoRightText || '', 9.5, 7.5, 13)}px`,
                        color: piece.dominoRightText === 'END' ? '#dc2626' : (settings?.saveInk ? '#000000' : clrs.text),
                        fontWeight: 'extrabold',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '1.2em',
                      }}
                    />
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })()}
      </g>
    );
  };

  const dominoPieces = pieces.filter(p => p.type === 'domino');

  return (
    <>
      {/* 1. Outline định vị Domino trên board */}
      <svg width={boardSize.w} height={boardSize.h} className="absolute inset-0 mx-auto select-none pointer-events-none">
        <g transform={`translate(${boardSize.offsetX || 0}, ${boardSize.offsetY || 0})`}>
          {dominoPieces.map((piece) => {
            const w = settings?.dominoWidth || 160;
            const h = settings?.dominoHeight || 68;
            return (
              <g key={`board-domino-outline-${piece.id}`} transform={`translate(${piece.targetX}, ${piece.targetY}) rotate(${piece.dominoRotation || 0})`}>
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  rx="10"
                  ry="10"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  className="opacity-60"
                />
                <line
                  x1="0"
                  y1={-h / 2 + 3}
                  x2="0"
                  y2={h / 2 - 3}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  className="opacity-50"
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* 2. Vẽ quân Domino đang kéo thả */}
      {dominoPieces.map((piece) => {
        const isDragging = activeDraggingId === piece.id;
        const finalX = piece.isSnapped ? piece.targetX + (boardSize.offsetX ?? 0) : piece.currentX;
        const finalY = piece.isSnapped ? piece.targetY + (boardSize.offsetY ?? 0) : piece.currentY;
        const rotVal = piece.isSnapped ? (piece.dominoRotation || 0) : 0;
        const dominoW = settings?.dominoWidth || 160;
        const dominoH = settings?.dominoHeight || 68;
        const boxW = dominoW + 20;
        const boxH = dominoH + 22;

        return (
          <div
            key={piece.id}
            className={`absolute select-none ${
              piece.isSnapped ? 'pointer-events-none transition-all duration-300' : isDragging ? 'z-50 filter drop-shadow-2xl scale-[1.05]' : 'z-30 hover:scale-[1.02]'
            }`}
            style={{
              left: `${finalX}px`,
              top: `${finalY}px`,
              width: `${boxW}px`,
              height: `${boxH}px`,
              transform: `translate(${-boxW / 2}px, ${-boxH / 2}px)`,
              touchAction: 'none',
            }}
            onPointerDown={(e) => handlePointerDown(e, piece.id)}
            onPointerMove={(e) => handlePointerMove(e, piece.id)}
            onPointerUp={(e) => handlePointerUp(e, piece.id)}
          >
            <svg width={boxW} height={boxH} viewBox={`-${boxW / 2} -${boxH / 2} ${boxW} ${boxH}`} className="overflow-visible">
              {renderDominoPieceInPlay(piece, rotVal)}
            </svg>
          </div>
        );
      })}
    </>
  );
};
