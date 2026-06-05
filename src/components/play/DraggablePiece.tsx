import React, { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MathJaxWrapper } from '../MathJaxWrapper';

interface DraggablePieceProps {
  /** ID duy nhất của mảnh */
  id: string;
  /** ID của pair mà mảnh này thuộc về */
  pairId: string;
  /** Nội dung (text hoặc LaTeX) */
  text: string;
  /** Loại mảnh: question hay answer */
  type: 'question' | 'answer';
  /** Mảnh này đã được đặt đúng vị trí chưa */
  isSnapped?: boolean;
  /** Màu nền tùy chỉnh */
  color?: { bg: string; border: string; text: string };
  /** Kích thước */
  size?: { width: number; height: number };
  /** Callback khi bắt đầu kéo */
  onPickup?: () => void;
}

const DEFAULT_COLOR = {
  bg: '#f8fafc',
  border: '#94a3b8',
  text: '#1e293b',
};

/**
 * DraggablePiece — mảnh ghép có thể kéo thả
 * Dùng @dnd-kit/core useDraggable
 */
export const DraggablePiece: React.FC<DraggablePieceProps> = ({
  id,
  pairId,
  text,
  type,
  isSnapped = false,
  color = DEFAULT_COLOR,
  size = { width: 120, height: 60 },
  onPickup,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { pairId, type, text },
    disabled: isSnapped,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    width: size.width,
    height: size.height,
    background: isSnapped
      ? `linear-gradient(135deg, ${color.bg} 0%, ${color.bg}dd 100%)`
      : color.bg,
    border: `2px solid ${isSnapped ? '#22c55e' : isDragging ? '#6366f1' : color.border}`,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    cursor: isSnapped ? 'default' : isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
    boxShadow: isDragging
      ? '0 20px 40px rgba(99, 102, 241, 0.4), 0 0 0 2px rgba(99,102,241,0.3)'
      : isSnapped
        ? '0 2px 8px rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(255,255,255,0.5)'
        : '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    transition: isDragging
      ? 'box-shadow 0.2s ease, border-color 0.2s ease'
      : 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring easing
    opacity: isDragging ? 0.95 : 1,
    scale: isDragging ? '1.06' : '1',
    zIndex: isDragging ? 9999 : 1,
    position: 'relative',
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isSnapped) {
      onPickup?.();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        handlePointerDown(e);
        listeners?.onPointerDown?.(e);
      }}
    >
      {/* Snapped indicator */}
      {isSnapped && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: 6,
          fontSize: '10px',
          color: '#22c55e',
        }}>
          ✓
        </div>
      )}

      {/* Label Q/A */}
      <div style={{
        position: 'absolute',
        top: 3,
        left: 6,
        fontSize: '8px',
        fontWeight: '700',
        color: type === 'question' ? '#6366f1' : '#0ea5e9',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        opacity: 0.7,
      }}>
        {type === 'question' ? 'Q' : 'A'}
      </div>

      {/* Content */}
      <MathJaxWrapper
        text={text}
        className="font-semibold"
        style={{
          color: color.text,
          fontSize: '13px',
          textAlign: 'center',
        }}
      />
    </div>
  );
};
