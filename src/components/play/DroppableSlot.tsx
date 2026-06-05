import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { MathJaxWrapper } from '../MathJaxWrapper';

interface DroppableSlotProps {
  /** ID duy nhất của slot */
  id: string;
  /** ID của pair mà slot này thuộc về */
  pairId: string;
  /** Loại slot: chờ nhận question hay answer */
  accepts: 'question' | 'answer';
  /** Nội dung hiện tại đã được đặt (nếu có) */
  placedText?: string;
  /** Mảnh đã snap đúng hay chưa */
  isCorrect?: boolean;
  /** Màu sắc */
  color?: { bg: string; border: string; accent: string };
  /** Kích thước */
  size?: { width: number; height: number };
  /** Label placeholder */
  placeholder?: string;
}

const DEFAULT_COLOR = {
  bg: '#f1f5f9',
  border: '#cbd5e1',
  accent: '#6366f1',
};

/**
 * DroppableSlot — vị trí đích để thả mảnh ghép vào
 * Dùng @dnd-kit/core useDroppable
 * Highlight khi có mảnh đang kéo qua (over state)
 */
export const DroppableSlot: React.FC<DroppableSlotProps> = ({
  id,
  pairId,
  accepts,
  placedText,
  isCorrect = false,
  color = DEFAULT_COLOR,
  size = { width: 120, height: 60 },
  placeholder,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { pairId, accepts },
    disabled: isCorrect, // Không nhận thêm khi đã snap đúng
  });

  const isEmpty = !placedText;

  const style: React.CSSProperties = {
    width: size.width,
    height: size.height,
    background: isCorrect
      ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
      : isOver
        ? `linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)`
        : isEmpty
          ? color.bg
          : '#fff',
    border: `2px ${isCorrect ? 'solid' : isOver ? 'solid' : 'dashed'} ${
      isCorrect ? '#22c55e' : isOver ? color.accent : color.border
    }`,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
    boxShadow: isOver
      ? `0 0 0 3px rgba(99, 102, 241, 0.25), inset 0 2px 4px rgba(99,102,241,0.1)`
      : isCorrect
        ? '0 2px 8px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.6)'
        : 'inset 0 2px 4px rgba(0,0,0,0.04)',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Shimmer khi hover */}
      {isOver && !isCorrect && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.1), transparent)',
          animation: 'shimmer 1s ease-in-out infinite',
          borderRadius: '10px',
          pointerEvents: 'none',
        }} />
      )}

      {/* Correct indicator */}
      {isCorrect && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: 6,
          fontSize: '12px',
        }}>
          ✅
        </div>
      )}

      {/* Slot type label */}
      {isEmpty && (
        <div style={{
          position: 'absolute',
          top: 3,
          left: 6,
          fontSize: '8px',
          fontWeight: '700',
          color: accepts === 'question' ? '#6366f1' : '#0ea5e9',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          opacity: 0.5,
        }}>
          {accepts === 'question' ? 'Q' : 'A'}
        </div>
      )}

      {/* Content hoặc placeholder */}
      {placedText ? (
        <MathJaxWrapper
          text={placedText}
          className="font-semibold"
          style={{
            color: isCorrect ? '#166534' : '#334155',
            fontSize: '13px',
            textAlign: 'center',
          }}
        />
      ) : (
        <div style={{
          color: isOver ? color.accent : color.border,
          fontSize: '11px',
          fontStyle: 'italic',
          textAlign: 'center',
          transition: 'color 0.2s ease',
          opacity: isOver ? 1 : 0.6,
        }}>
          {isOver ? '↓ Thả vào đây' : (placeholder || '···')}
        </div>
      )}
    </div>
  );
};
