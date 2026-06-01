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
  jigsawType?: 'question' | 'answer';
  numberPieceId?: string;
  numberPoints?: { x: number; y: number }[];
  numberEdges?: string[];
  numberColorIndex?: number;
  points?: any[];
}

interface PlayNumberBoardProps {
  pieces: PlayablePiece[];
  settings: GameSettings;
  boardSize: { w: number; h: number; offsetX?: number; offsetY?: number };
  activeDraggingId: string | null;
  scaleFactor: number;
  handlePointerDown: (e: React.PointerEvent, id: string) => void;
  handlePointerMove: (e: React.PointerEvent, id: string) => void;
  handlePointerUp: (e: React.PointerEvent, id: string) => void;
  drawNumberPiecePath: (points: { x: number; y: number }[], edges: string[]) => string;
  colorPalettes: { fill: string; border: string; shadow: string; text: string; stamp: string }[];
  getPieceContentBox: (points: { x: number; y: number }[]) => { xOffset: number; yOffset: number; width: number; height: number };
}

export const PlayNumberBoard: React.FC<PlayNumberBoardProps> = ({
  pieces,
  settings,
  boardSize,
  activeDraggingId,
  scaleFactor,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  drawNumberPiecePath,
  colorPalettes,
  getPieceContentBox,
}) => {
  const numberPieces = pieces.filter(p => p.type === 'number');

  return (
    <>
      {/* 1. Lưới định vị mờ 3D của số trên Board */}
      <svg width={boardSize.w} height={boardSize.h} className="absolute inset-0 mx-auto select-none pointer-events-none overflow-visible">
        <g transform={`translate(${boardSize.offsetX || 0}, ${boardSize.offsetY || 0})`}>
          {/* Lớp bóng đặc 3D mờ định vị */}
          {!settings.saveInk && numberPieces.map((piece) => {
            if (!piece.numberPoints || !piece.numberEdges) return null;
            const pPath = drawNumberPiecePath(piece.numberPoints, piece.numberEdges);
            const colors = colorPalettes[(piece.numberColorIndex ?? 0) % colorPalettes.length];
            return (
              <React.Fragment key={`board-number-depth-${piece.id}`}>
                {[1, 2, 3, 4, 5, 6].map((depth) => (
                  <path
                    key={`board-depth-${piece.id}-${depth}`}
                    d={pPath}
                    fill={colors.shadow}
                    transform={`translate(${depth * 0.8}, ${depth * 1.2})`}
                    opacity={0.12}
                  />
                ))}
              </React.Fragment>
            );
          })}

          {/* Outline chính của số */}
          {numberPieces.map((piece) => {
            if (!piece.numberPoints || !piece.numberEdges) return null;
            const pPath = drawNumberPiecePath(piece.numberPoints, piece.numberEdges);
            return (
              <path
                key={`board-number-outline-${piece.id}`}
                d={pPath}
                fill="rgba(255, 255, 255, 0.01)"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            );
          })}
        </g>
      </svg>

      {/* 2. Vẽ các mảnh ghép Number Jigsaw đang chơi */}
      {numberPieces.map((piece) => {
        const isDragging = activeDraggingId === piece.id;
        if (!piece.numberPoints || !piece.numberEdges) return null;
        const pPath = drawNumberPiecePath(piece.numberPoints, piece.numberEdges);
        const colors = colorPalettes[(piece.numberColorIndex ?? 0) % colorPalettes.length];

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        piece.numberPoints.forEach(v => {
          if (v.x < minX) minX = v.x;
          if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
        });
        const w = maxX - minX + 20;
        const h = maxY - minY + 20;

        if (piece.isSnapped) {
          return (
            <div
              key={piece.id}
              className="absolute select-none pointer-events-none"
              style={{
                left: `0px`,
                top: `0px`,
                width: `${boardSize.w}px`,
                height: `${boardSize.h}px`,
              }}
            >
              <svg width={boardSize.w} height={boardSize.h} className="absolute inset-0 overflow-visible pointer-events-none">
                <g transform={`translate(${boardSize.offsetX || 0}, ${boardSize.offsetY || 0})`}>
                  {/* Khối 3D đặc đa tầng khi snap */}
                  {!settings?.saveInk && (
                    <React.Fragment>
                      {[1, 2, 3, 4, 5, 6].map((depth) => (
                        <path
                          key={`snapped-depth-${piece.id}-${depth}`}
                          d={pPath}
                          fill={colors.shadow}
                          transform={`translate(${depth * 0.8}, ${depth * 1.2})`}
                          opacity={0.85}
                        />
                      ))}
                    </React.Fragment>
                  )}

                  <path
                    d={pPath}
                    fill={settings?.saveInk ? '#ffffff' : colors.fill}
                    stroke={settings?.saveInk ? '#1e293b' : colors.border}
                    strokeWidth={settings?.saveInk ? 1.5 : 3.2}
                    strokeLinejoin="round"
                  />

                  {/* Render text MathJax */}
                  {(() => {
                    const cBox = getPieceContentBox(piece.points || []);
                    return (
                      <foreignObject
                        x={piece.targetX + cBox.xOffset}
                        y={piece.targetY + cBox.yOffset}
                        width={cBox.width}
                        height={cBox.height}
                      >
                        <div xmlns="http://www.w3.org/1999/xhtml" className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-none notranslate px-1" translate="no" style={{ color: settings?.saveInk ? '#1e293b' : '#ffffff', textShadow: settings?.saveInk ? 'none' : '0 1px 2px rgba(0,0,0,0.25)', fontFamily: '"Inter", sans-serif' }}>
                          <MathJaxWrapper text={piece.text} className="font-bold text-center w-full" style={{ fontSize: `${calculateDynamicFontSize(piece.text, 9.5, 6.5, 12)}px`, display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                        </div>
                      </foreignObject>
                    );
                  })()}
                </g>
              </svg>
            </div>
          );
        }

        // Chưa snap: vẽ container SVG kéo thả tự do
        return (
          <div
            key={piece.id}
            className={`absolute select-none ${
              isDragging ? 'z-50 filter drop-shadow-2xl scale-[1.05]' : 'z-30 hover:scale-[1.02]'
            }`}
            style={{
              left: `${piece.currentX}px`,
              top: `${piece.currentY}px`,
              width: `${w}px`,
              height: `${h}px`,
              transform: `translate(${-minX}px, ${-minY}px)`,
              touchAction: 'none',
            }}
            onPointerDown={(e) => handlePointerDown(e, piece.id)}
            onPointerMove={(e) => handlePointerMove(e, piece.id)}
            onPointerUp={(e) => handlePointerUp(e, piece.id)}
          >
            <svg
              width={w + 20}
              height={h + 20}
              viewBox={`${minX - 10} ${minY - 10} ${w + 10} ${h + 10}`}
              className="overflow-visible"
            >
              {!settings?.saveInk && (
                <React.Fragment>
                  {[1, 2, 3, 4, 5, 6].map((depth) => (
                    <path
                      key={`pool-depth-${piece.id}-${depth}`}
                      d={pPath}
                      fill={colors.shadow}
                      transform={`translate(${depth * 0.8}, ${depth * 1.2})`}
                      opacity={0.85}
                    />
                  ))}
                </React.Fragment>
              )}

              <path
                d={pPath}
                fill={settings?.saveInk ? '#ffffff' : colors.fill}
                stroke={settings?.saveInk ? '#1e293b' : colors.border}
                strokeWidth={settings?.saveInk ? 1.5 : 3.2}
                strokeLinejoin="round"
              />

              {(() => {
                const cBox = getPieceContentBox(piece.points || []);
                return (
                  <foreignObject
                    x={piece.targetX + cBox.xOffset}
                    y={piece.targetY + cBox.yOffset}
                    width={cBox.width}
                    height={cBox.height}
                  >
                    <div xmlns="http://www.w3.org/1999/xhtml" className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-none notranslate px-1" translate="no" style={{ color: settings?.saveInk ? '#1e293b' : '#ffffff', textShadow: settings?.saveInk ? 'none' : '0 1px 2px rgba(0,0,0,0.25)', fontFamily: '"Inter", sans-serif' }}>
                      <MathJaxWrapper text={piece.text} className="font-bold text-center w-full" style={{ fontSize: `${calculateDynamicFontSize(piece.text, 9.5, 6.5, 12)}px`, display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                    </div>
                  </foreignObject>
                );
              })()}
            </svg>
          </div>
        );
      })}
    </>
  );
};
