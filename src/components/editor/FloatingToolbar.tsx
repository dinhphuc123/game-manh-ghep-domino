import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  FloatingArrow,
} from '@floating-ui/react';

interface FloatingToolbarProps {
  /** Element tham chiếu (mảnh ghép) */
  referenceEl: HTMLElement | null;
  /** Có hiển thị hay không */
  isVisible: boolean;
  /** Trường đang chỉnh sửa */
  field: 'question' | 'answer';
  /** Text hiện tại */
  currentText: string;
  /** Callback khi nhấn "Chỉnh sửa" */
  onEdit: () => void;
  /** Callback khi nhấn Bold */
  onBold: () => void;
  /** Callback khi nhấn reset */
  onReset: () => void;
}

/**
 * FloatingToolbar — toolbar nổi xuất hiện khi hover mảnh ghép
 * Sử dụng @floating-ui/react để định vị thông minh
 */
export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  referenceEl,
  isVisible,
  field,
  currentText,
  onEdit,
  onBold,
  onReset,
}) => {
  const arrowRef = useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isVisible,
    placement: 'top',
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ['bottom', 'left', 'right'] }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Kết nối reference element từ bên ngoài
  useEffect(() => {
    refs.setReference(referenceEl);
  }, [referenceEl, refs]);

  if (!isVisible) return null;

  const hasLatex = currentText.includes('$') || currentText.includes('\\');

  return (
    <div
      ref={refs.setFloating}
      style={{
        ...floatingStyles,
        zIndex: 10000,
        pointerEvents: 'auto',
      }}
    >
      {/* Toolbar container */}
      <div
        className="floating-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 27, 75, 0.96) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.5)',
          borderRadius: '10px',
          padding: '4px 6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(99,102,241,0.1)',
          backdropFilter: 'blur(12px)',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
        onMouseDown={(e) => e.preventDefault()} // Không mất focus khỏi mảnh
      >
        {/* Label */}
        <span style={{
          fontSize: '9px',
          color: '#6366f1',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          paddingRight: '4px',
          borderRight: '1px solid rgba(99,102,241,0.2)',
          marginRight: '2px',
        }}>
          {field === 'question' ? '❓ Q' : '✅ A'}
        </span>

        {/* Nút Chỉnh sửa (mở MathLive) */}
        <ToolbarButton
          title="Chỉnh sửa (Double-click)"
          onClick={onEdit}
          icon="✏️"
          label="Sửa"
          primary
        />

        <Divider />

        {/* Trạng thái LaTeX */}
        {hasLatex && (
          <span style={{
            fontSize: '9px',
            color: '#a78bfa',
            padding: '2px 5px',
            background: 'rgba(139, 92, 246, 0.12)',
            borderRadius: '4px',
            fontFamily: 'monospace',
          }}>
            ∑ LaTeX
          </span>
        )}

        <Divider />

        {/* Reset về text gốc */}
        <ToolbarButton
          title="Xóa định dạng / Reset"
          onClick={onReset}
          icon="↩️"
          label="Reset"
          danger
        />
      </div>

      {/* Arrow chỉ vào mảnh ghép */}
      <FloatingArrow
        ref={arrowRef}
        context={context}
        fill="rgba(30, 27, 75, 0.96)"
        stroke="rgba(99, 102, 241, 0.5)"
        strokeWidth={1}
        width={10}
        height={5}
      />
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  title: string;
  onClick: () => void;
  icon: string;
  label: string;
  primary?: boolean;
  danger?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  title, onClick, icon, label, primary, danger
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        background: hovered
          ? primary
            ? 'rgba(99, 102, 241, 0.25)'
            : danger
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(255,255,255,0.08)'
          : 'transparent',
        border: 'none',
        borderRadius: '5px',
        color: primary ? '#a5b4fc' : danger ? '#fca5a5' : '#94a3b8',
        fontSize: '11px',
        fontWeight: '600',
        padding: '3px 6px',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        lineHeight: 1,
      }}
    >
      <span style={{ fontSize: '12px' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const Divider = () => (
  <div style={{
    width: '1px',
    height: '14px',
    background: 'rgba(99, 102, 241, 0.2)',
    margin: '0 2px',
    flexShrink: 0,
  }} />
);
