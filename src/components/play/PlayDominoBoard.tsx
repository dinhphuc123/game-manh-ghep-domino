import React, { useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable } from '@dnd-kit/core';
import { GameSettings } from '../../types';
import { MathJaxWrapper, calculateDynamicFontSize } from '../MathJaxWrapper';
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
  /** Callback khi snap đúng (dùng cho Firebase sync) */
  onSnap?: (pieceId: string, targetX: number, targetY: number) => void;
  /** Callback khi tất cả snap đúng */
  onAllSnapped?: () => void;
}

// ── Domino Piece Renderer (SVG) ───────────────────────────────────────────────
const DominoPieceSvg: React.FC<{
  piece: PlayablePiece;
  settings: GameSettings;
  rotation: number;
  isSnapped?: boolean;
  isDragging?: boolean;
}> = ({ piece, settings, rotation, isSnapped, isDragging }) => {
  const w = settings?.dominoWidth || 160;
  const h = settings?.dominoHeight || 68;
  const boxW = w + 20;
  const boxH = h + 22;

  const vibrantClrs = { fill: '#f0fdf4', stroke: '#16a34a', text: '#14532d', midLine: '#22c55e' };
  const pastelClrs = { fill: '#fafaf9', stroke: '#78716c', text: '#44403c', midLine: '#a8a29e' };
  const clrs = settings?.style === 'vibrant' ? vibrantClrs : pastelClrs;

  const snapClrs = { fill: '#dcfce7', stroke: '#22c55e', text: '#166534', midLine: '#4ade80' };
  const activeClrs = isSnapped ? snapClrs : clrs;

  return (
    <svg
      width={boxW}
      height={boxH}
      viewBox={`-${boxW / 2} -${boxH / 2} ${boxW} ${boxH}`}
      className="overflow-visible"
      style={{ filter: isDragging ? 'drop-shadow(0 16px 24px rgba(99,102,241,0.4))' : undefined }}
    >
      <g transform={`rotate(${rotation})`}>
        {/* Main body */}
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx="10"
          ry="10"
          fill={settings?.saveInk ? '#ffffff' : activeClrs.fill}
          stroke={settings?.saveInk ? '#000000' : (isDragging ? '#6366f1' : activeClrs.stroke)}
          strokeWidth={isDragging ? 3 : settings?.saveInk ? 1.5 : 2.5}
        />

        {/* Divider line */}
        <line
          x1="0" y1={-h / 2 + 3}
          x2="0" y2={h / 2 - 3}
          stroke={settings?.saveInk ? '#000000' : activeClrs.midLine}
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />

        {/* Left Half — Answer / START */}
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
                    style={{ color: settings?.saveInk ? '#000000' : activeClrs.text, fontFamily: '"Inter", sans-serif' }}
                  >
                    <MathJaxWrapper
                      text={piece.dominoLeftText || ''}
                      className="font-bold text-center w-full"
                      style={{
                        fontSize: piece.dominoLeftText === 'START' ? '12px' : `${calculateDynamicFontSize(piece.dominoLeftText || '', 9.5, 7.5, 13)}px`,
                        color: piece.dominoLeftText === 'START' ? '#dc2626' : (settings?.saveInk ? '#000000' : activeClrs.text),
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

        {/* Right Half — Question / END */}
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
                    style={{ color: settings?.saveInk ? '#000000' : activeClrs.text, fontFamily: '"Inter", sans-serif' }}
                  >
                    <MathJaxWrapper
                      text={piece.dominoRightText || ''}
                      className="font-bold text-center w-full"
                      style={{
                        fontSize: piece.dominoRightText === 'END' ? '12px' : `${calculateDynamicFontSize(piece.dominoRightText || '', 9.5, 7.5, 13)}px`,
                        color: piece.dominoRightText === 'END' ? '#dc2626' : (settings?.saveInk ? '#000000' : activeClrs.text),
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

        {/* Snap indicator */}
        {isSnapped && (
          <text x={w / 2 - 10} y={-h / 2 + 12} textAnchor="middle" fontSize="10" fill="#22c55e">✓</text>
        )}
      </g>
    </svg>
  );
};

// ── Draggable Domino Wrapper ──────────────────────────────────────────────────
const DraggableDomino: React.FC<{
  piece: PlayablePiece;
  settings: GameSettings;
  isDragging?: boolean;
  onPickup?: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}> = ({ piece, settings, isDragging, onPickup, onPointerDown, onPointerMove, onPointerUp }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: piece.id,
    data: { pieceId: piece.id, dominoId: piece.dominoId },
    disabled: piece.isSnapped,
  });

  const w = settings?.dominoWidth || 160;
  const h = settings?.dominoHeight || 68;
  const boxW = w + 20;
  const boxH = h + 22;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    width: boxW,
    height: boxH,
    cursor: piece.isSnapped ? 'default' : isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        onPickup?.();
        onPointerDown(e);
        listeners?.onPointerDown?.(e);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <DominoPieceSvg
        piece={piece}
        settings={settings}
        rotation={piece.isSnapped ? (piece.dominoRotation || 0) : 0}
        isDragging={isDragging}
      />
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * PlayDominoBoard — Board game Domino với dnd-kit
 * DndContext bọc toàn bộ board
 * Quân domino là Draggable, slot đích là zone collision
 */
export const PlayDominoBoard: React.FC<PlayDominoBoardProps> = ({
  pieces,
  settings,
  boardSize,
  activeDraggingId,
  scaleFactor,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  onSnap,
  onAllSnapped,
}) => {
  const dominoPieces = pieces.filter(p => p.type === 'domino');
  const { playPickup, playSnap, playWrong } = useGameSound();
  const { fireBurst, fireConfetti } = useConfetti();
  const snapThreshold = 40; // pixels — rộng hơn Jigsaw vì domino xoay

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    playPickup();
  }, [playPickup]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active } = event;

    const draggedPiece = dominoPieces.find(p => p.id === active.id);
    if (!draggedPiece || draggedPiece.isSnapped) return;

    // Tính khoảng cách đến target (snap detection bằng tọa độ tương đối)
    const destX = draggedPiece.targetX + (boardSize.offsetX ?? 0);
    const destY = draggedPiece.targetY + (boardSize.offsetY ?? 0);
    const dist = Math.hypot(draggedPiece.currentX - destX, draggedPiece.currentY - destY);

    if (dist < snapThreshold) {
      playSnap();

      // Particle burst tại vị trí snap trên màn hình
      const boardEl = document.getElementById('domino-board');
      if (boardEl) {
        const rect = boardEl.getBoundingClientRect();
        const burstX = (rect.left + destX * scaleFactor) / window.innerWidth;
        const burstY = (rect.top + destY * scaleFactor) / window.innerHeight;
        fireBurst(burstX, burstY);
      }

      // Firebase sync
      onSnap?.(draggedPiece.id, destX, destY);

      // Check all snapped
      const remainingUnsnapped = dominoPieces.filter(p => !p.isSnapped && p.id !== draggedPiece.id).length;
      if (remainingUnsnapped === 0) {
        setTimeout(() => {
          fireConfetti({ type: 'school', duration: 4500 });
          onAllSnapped?.();
        }, 300);
      }
    } else {
      // Sai vị trí
      playWrong();
    }
  }, [dominoPieces, boardSize, snapThreshold, scaleFactor, playSnap, playWrong, fireBurst, fireConfetti, onSnap, onAllSnapped]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div id="domino-board" style={{ position: 'relative' }}>
        {/* 1. Outline định vị Domino trên board */}
        <svg
          width={boardSize.w}
          height={boardSize.h}
          className="absolute inset-0 mx-auto select-none pointer-events-none"
        >
          <g transform={`translate(${boardSize.offsetX || 0}, ${boardSize.offsetY || 0})`}>
            {dominoPieces.map((piece) => {
              const w = settings?.dominoWidth || 160;
              const h = settings?.dominoHeight || 68;
              const isCorrect = piece.isSnapped;
              return (
                <g
                  key={`board-domino-outline-${piece.id}`}
                  transform={`translate(${piece.targetX}, ${piece.targetY}) rotate(${piece.dominoRotation || 0})`}
                >
                  <rect
                    x={-w / 2} y={-h / 2}
                    width={w} height={h}
                    rx="10" ry="10"
                    fill={isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'none'}
                    stroke={isCorrect ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.12)'}
                    strokeWidth={isCorrect ? 2 : 1.5}
                    strokeDasharray={isCorrect ? 'none' : '4 4'}
                    className="opacity-60"
                  />
                  {!isCorrect && (
                    <line
                      x1="0" y1={-h / 2 + 3}
                      x2="0" y2={h / 2 - 3}
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      className="opacity-50"
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* 2. Quân Domino */}
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
                piece.isSnapped
                  ? 'pointer-events-none transition-all duration-300'
                  : isDragging
                    ? 'z-50'
                    : 'z-30'
              }`}
              style={{
                left: `${finalX}px`,
                top: `${finalY}px`,
                width: `${boxW}px`,
                height: `${boxH}px`,
                transform: `translate(${-boxW / 2}px, ${-boxH / 2}px)`,
                touchAction: 'none',
                transition: piece.isSnapped
                  ? 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  : isDragging
                    ? 'none'
                    : undefined,
                filter: isDragging ? 'drop-shadow(0 16px 24px rgba(99,102,241,0.35)) scale(1.05)' : undefined,
              }}
            >
              {piece.isSnapped ? (
                // Đã snap — hiển thị tĩnh với animation
                <DominoPieceSvg
                  piece={piece}
                  settings={settings}
                  rotation={rotVal}
                  isSnapped={true}
                />
              ) : (
                // Chưa snap — Draggable
                <DraggableDomino
                  piece={piece}
                  settings={settings}
                  isDragging={isDragging}
                  onPickup={() => playPickup()}
                  onPointerDown={(e) => handlePointerDown(e, piece.id)}
                  onPointerMove={(e) => handlePointerMove(e, piece.id)}
                  onPointerUp={(e) => handlePointerUp(e, piece.id)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* DragOverlay — ghost khi đang kéo */}
      <DragOverlay>
        {activeDraggingId ? (() => {
          const dragPiece = dominoPieces.find(p => p.id === activeDraggingId);
          if (!dragPiece) return null;
          return (
            <DominoPieceSvg
              piece={dragPiece}
              settings={settings}
              rotation={0}
              isDragging={true}
            />
          );
        })() : null}
      </DragOverlay>
    </DndContext>
  );
};
