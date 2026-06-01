import React from 'react';
import { GameSettings, PuzzlePair } from '../../types';
import { PuzzleCard } from '../PuzzleCard';

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
  origIndex?: number;
}

interface PlayJigsawBoardProps {
  pieces: PlayablePiece[];
  settings: GameSettings;
  boardSize: { w: number; h: number; offsetX?: number; offsetY?: number };
  pairs: PuzzlePair[];
  activeDraggingId: string | null;
  scaleFactor: number;
  handlePointerDown: (e: React.PointerEvent, id: string) => void;
  handlePointerMove: (e: React.PointerEvent, id: string) => void;
  handlePointerUp: (e: React.PointerEvent, id: string) => void;
  pieceW: number;
  pieceH: number;
}

export const PlayJigsawBoard: React.FC<PlayJigsawBoardProps> = ({
  pieces,
  settings,
  boardSize,
  pairs,
  activeDraggingId,
  scaleFactor,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  pieceW,
  pieceH,
}) => {
  const jigsawPieces = pieces.filter(p => p.type === 'jigsaw');

  return (
    <>
      {/* 1. Lưới định vị nét đứt của Jigsaw trên board */}
      <div className="absolute inset-0 pointer-events-none">
        {pairs.map((pair, idx) => {
          const cols = Math.min(settings?.columns || 2, pairs.length);
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          
          const qX = col * (pieceW * 2 - 20) + 40;
          const qY = row * (pieceH + 30) + 40;
          const aX = col * (pieceW * 2 - 20) + pieceW - 20 + 40;
          const aY = row * (pieceH + 30) + 40;

          return (
            <React.Fragment key={`board-jigsaw-outline-${pair.id}`}>
              <div className="absolute border border-dashed border-white/10 bg-white/[0.01] rounded-2xl" style={{ width: `${pieceW}px`, height: `${pieceH}px`, left: `${qX}px`, top: `${qY}px` }} />
              <div className="absolute border border-dashed border-white/10 bg-white/[0.01] rounded-2xl" style={{ width: `${pieceW}px`, height: `${pieceH}px`, left: `${aX}px`, top: `${aY}px` }} />
            </React.Fragment>
          );
        })}
      </div>

      {/* 2. Vẽ các mảnh ghép Jigsaw đang kéo thả */}
      {jigsawPieces.map((piece) => {
        const isDragging = activeDraggingId === piece.id;

        return (
          <div
            key={piece.id}
            className={`absolute select-none ${
              piece.isSnapped ? 'pointer-events-none transition-all duration-300' : isDragging ? 'z-50 filter drop-shadow-2xl scale-[1.05]' : 'z-30 hover:scale-[1.02]'
            }`}
            style={{ left: `${piece.currentX}px`, top: `${piece.currentY}px`, touchAction: 'none' }}
            onPointerDown={(e) => handlePointerDown(e, piece.id)}
            onPointerMove={(e) => handlePointerMove(e, piece.id)}
            onPointerUp={(e) => handlePointerUp(e, piece.id)}
          >
            <PuzzleCard
              text={piece.text}
              type={piece.jigsawType!}
              index={piece.origIndex!}
              code={piece.code}
              style={settings?.style || 'vibrant'}
              showCode={false}
              showIcon={settings?.showDoodleIcons || false}
              size={1.0}
              isScrambled={!piece.isSnapped}
              saveInk={settings?.saveInk || false}
            />
          </div>
        );
      })}
    </>
  );
};
