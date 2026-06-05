import React, { useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import { GameSettings, PuzzlePair } from '../../types';
import { PuzzleCard } from '../PuzzleCard';
import { DraggablePiece } from './DraggablePiece';
import { DroppableSlot } from './DroppableSlot';
import { useGameSound } from '../../hooks/useGameSound';
import { useConfetti } from '../../hooks/useConfetti';

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
  /** Callback khi snap đúng (dùng cho Firebase sync) */
  onSnap?: (pieceId: string, targetX: number, targetY: number) => void;
  /** Callback khi tất cả snap đúng */
  onAllSnapped?: () => void;
}

/**
 * PlayJigsawBoard — Board game Jigsaw với dnd-kit
 * Dùng DndContext để bọc board, mảnh là Draggable, slot đích là Droppable
 * Âm thanh: useGameSound | Pháo hoa: useConfetti khi thắng
 */
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
  onSnap,
  onAllSnapped,
}) => {
  const jigsawPieces = pieces.filter(p => p.type === 'jigsaw');
  const { playPickup, playSnap, playWrong } = useGameSound();
  const { fireBurst, fireConfetti } = useConfetti();
  const activeDragPieceRef = useRef<PlayablePiece | null>(null);

  // dnd-kit sensors — hỗ trợ cả mouse và touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4, // Cần di chuyển 4px mới kích hoạt drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const piece = jigsawPieces.find(p => p.id === event.active.id);
    activeDragPieceRef.current = piece || null;
    if (piece && !piece.isSnapped) {
      playPickup();
    }
  }, [jigsawPieces, playPickup]);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback được xử lý bởi DroppableSlot's isOver state
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    activeDragPieceRef.current = null;

    if (!over) {
      // Thả ra ngoài — trả về vị trí cũ (nảy về)
      playWrong();
      return;
    }

    const draggedPiece = jigsawPieces.find(p => p.id === active.id);
    if (!draggedPiece || draggedPiece.isSnapped) return;

    // Kiểm tra slot được thả vào có khớp không
    // Convention: slot-id = `slot-${pairId}-${type}`  (type: 'question' | 'answer')
    const overData = over.data.current as { pairId: string; accepts: 'question' | 'answer' } | undefined;
    const activeData = active.data.current as { pairId: string; type: 'question' | 'answer' } | undefined;

    if (!overData || !activeData) return;

    // Snap đúng: cùng pairId VÀ type khớp với accepts của slot
    const isCorrect =
      overData.pairId === activeData.pairId &&
      overData.accepts === activeData.type;

    if (isCorrect) {
      // Tính vị trí snap thực
      const cols = Math.min(settings?.columns || 2, pairs.length);
      const pairIndex = pairs.findIndex(pair => pair.id === overData.pairId);
      const col = pairIndex % cols;
      const row = Math.floor(pairIndex / cols);

      let snapX: number;
      let snapY: number;

      if (activeData.type === 'question') {
        snapX = col * (pieceW * 2 - 20) + 40;
        snapY = row * (pieceH + 30) + 40;
      } else {
        snapX = col * (pieceW * 2 - 20) + pieceW - 20 + 40;
        snapY = row * (pieceH + 30) + 40;
      }

      playSnap();

      // Particle burst tại vị trí snap
      const boardEl = document.getElementById('jigsaw-board');
      if (boardEl) {
        const rect = boardEl.getBoundingClientRect();
        const burstX = (rect.left + snapX * scaleFactor) / window.innerWidth;
        const burstY = (rect.top + snapY * scaleFactor) / window.innerHeight;
        fireBurst(burstX, burstY);
      }

      // Thông báo cho PlayMode (Firebase sync)
      onSnap?.(draggedPiece.id, snapX, snapY);

      // Kiểm tra tất cả đã snap chưa
      const remainingUnsnapped = jigsawPieces.filter(p => !p.isSnapped && p.id !== draggedPiece.id).length;
      if (remainingUnsnapped === 0) {
        setTimeout(() => {
          fireConfetti({ type: 'school', duration: 4000 });
          onAllSnapped?.();
        }, 300);
      }
    } else {
      // Sai — nảy về
      playWrong();
    }
  }, [jigsawPieces, pairs, settings, pieceW, pieceH, scaleFactor, playPickup, playSnap, playWrong, fireBurst, fireConfetti, onSnap, onAllSnapped]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div id="jigsaw-board" style={{ position: 'relative', width: boardSize.w, height: boardSize.h }}>
        {/* 1. Drop Slots (outline + droppable zone) */}
        {pairs.map((pair, idx) => {
          const cols = Math.min(settings?.columns || 2, pairs.length);
          const col = idx % cols;
          const row = Math.floor(idx / cols);

          const qX = col * (pieceW * 2 - 20) + 40;
          const qY = row * (pieceH + 30) + 40;
          const aX = col * (pieceW * 2 - 20) + pieceW - 20 + 40;
          const aY = row * (pieceH + 30) + 40;

          // Tìm mảnh đã snap vào slot này
          const snappedQ = jigsawPieces.find(p => p.origIndex === idx && p.jigsawType === 'question' && p.isSnapped);
          const snappedA = jigsawPieces.find(p => p.origIndex === idx && p.jigsawType === 'answer' && p.isSnapped);

          return (
            <React.Fragment key={`slots-${pair.id}`}>
              {/* Slot câu hỏi */}
              <div style={{ position: 'absolute', left: qX, top: qY }}>
                <DroppableSlot
                  id={`slot-${pair.id}-question`}
                  pairId={pair.id}
                  accepts="question"
                  placedText={snappedQ?.text}
                  isCorrect={!!snappedQ}
                  size={{ width: pieceW, height: pieceH }}
                  placeholder="Câu hỏi"
                />
              </div>

              {/* Slot đáp án */}
              <div style={{ position: 'absolute', left: aX, top: aY }}>
                <DroppableSlot
                  id={`slot-${pair.id}-answer`}
                  pairId={pair.id}
                  accepts="answer"
                  placedText={snappedA?.text}
                  isCorrect={!!snappedA}
                  size={{ width: pieceW, height: pieceH }}
                  placeholder="Đáp án"
                />
              </div>
            </React.Fragment>
          );
        })}

        {/* 2. Mảnh ghép chưa snap — hiển thị ở pool bên dưới board */}
        {jigsawPieces
          .filter(p => !p.isSnapped)
          .map(piece => (
            <div
              key={piece.id}
              style={{
                position: 'absolute',
                left: piece.currentX,
                top: piece.currentY,
                zIndex: activeDraggingId === piece.id ? 50 : 10,
              }}
              // Giữ lại Pointer Events cũ cho Firebase sync + fallback
              onPointerDown={(e) => handlePointerDown(e, piece.id)}
              onPointerMove={(e) => handlePointerMove(e, piece.id)}
              onPointerUp={(e) => handlePointerUp(e, piece.id)}
            >
              <DraggablePiece
                id={piece.id}
                pairId={pairs.find((_, i) => i === piece.origIndex)?.id || piece.id}
                text={piece.text}
                type={piece.jigsawType!}
                isSnapped={false}
                size={{ width: pieceW, height: pieceH }}
                onPickup={() => playPickup()}
              />
            </div>
          ))}
      </div>

      {/* DragOverlay — hiển thị preview khi đang kéo */}
      <DragOverlay>
        {activeDraggingId ? (() => {
          const dragPiece = jigsawPieces.find(p => p.id === activeDraggingId);
          if (!dragPiece) return null;
          return (
            <div style={{
              opacity: 0.9,
              transform: 'scale(1.06)',
              boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)',
            }}>
              <PuzzleCard
                text={dragPiece.text}
                type={dragPiece.jigsawType!}
                index={dragPiece.origIndex!}
                code={dragPiece.code}
                style={settings?.style || 'vibrant'}
                showCode={false}
                showIcon={settings?.showDoodleIcons || false}
                size={1.0}
                isScrambled={true}
                saveInk={settings?.saveInk || false}
              />
            </div>
          );
        })() : null}
      </DragOverlay>
    </DndContext>
  );
};
