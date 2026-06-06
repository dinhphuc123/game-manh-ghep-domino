import React, { useRef, useEffect, useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  FloatingArrow,
} from '@floating-ui/react';
import { FontControls } from './FontControls';

interface FloatingToolbarProps {
  referenceEl: HTMLElement | null;
  isVisible: boolean;
  field: 'question' | 'answer';
  currentText: string;
  onEdit: () => void;
  onBold: () => void;
  onReset: () => void;
}

/**
 * FloatingToolbar — toolbar nổi khi hover mảnh ghép
 * Bao gồm: Sửa (MathLive), Font Aa (size + family), LaTeX badge, Reset
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
  const [showFontPanel, setShowFontPanel] = useState(false);

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

  useEffect(() => {
    refs.setReference(referenceEl);
  }, [referenceEl, refs]);

  useEffect(() => {
    if (!isVisible) setShowFontPanel(false);
  }, [isVisible]);

  if (!isVisible) return null;

  const hasLatex = currentText.includes('$') || currentText.includes('\\');

  return (
    <div
      ref={refs.setFloating}
      style={{ ...floatingStyles, zIndex: 10000, pointerEvents: 'auto' }}
    >
      <div
        className="floating-toolbar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,27,75,0.97) 100%)',
          border: '1px solid rgba(99,102,241,0.5)',
          borderRadius: '10px',
          padding: '5px 7px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(99,102,241,0.1)',
          backdropFilter: 'blur(12px)',
          userSelect: 'none',
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Row 1: Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
          <span style={{
            fontSize: '9px', color: '#6366f1', fontFamily: 'monospace',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            paddingRight: '4px', borderRight: '1px solid rgba(99,102,241,0.2)', marginRight: '2px',
          }}>
            {field === 'question' ? '❓ Q' : '✅ A'}
          </span>

          <ToolbarButton title="Chỉnh sửa công thức (Double-click)" onClick={onEdit} icon="✏️" label="Sửa" primary />
          <Divider />
          <ToolbarButton
            title="Chỉnh font chữ và kích cỡ"
            onClick={() => setShowFontPanel(p => !p)}
            icon="Aa"
            label="Font"
            primary={showFontPanel}
          />

          {hasLatex && (
            <>
              <Divider />
              <span style={{
                fontSize: '9px', color: '#a78bfa', padding: '2px 5px',
                background: 'rgba(139,92,246,0.12)', borderRadius: '4px', fontFamily: 'monospace',
              }}>
                ∑ LaTeX
              </span>
            </>
          )}

          <Divider />
          <ToolbarButton title="Xóa định dạng / Reset" onClick={onReset} icon="↩️" label="Reset" danger />
        </div>

        {/* Row 2: Font panel (collapsible) */}
        {showFontPanel && (
          <div style={{ borderTop: '1px solid rgba(99,102,241,0.15)', paddingTop: '5px' }}>
            <FontControls compact />
          </div>
        )}
      </div>

      <FloatingArrow
        ref={arrowRef}
        context={context}
        fill="rgba(30,27,75,0.97)"
        stroke="rgba(99,102,241,0.5)"
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

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ title, onClick, icon, label, primary, danger }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '3px',
        background: hovered
          ? primary ? 'rgba(99,102,241,0.25)' : danger ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)'
          : primary ? 'rgba(99,102,241,0.08)' : 'transparent',
        border: primary ? '1px solid rgba(99,102,241,0.2)' : 'none',
        borderRadius: '5px',
        color: primary ? '#a5b4fc' : danger ? '#fca5a5' : '#94a3b8',
        fontSize: '11px', fontWeight: '600', padding: '3px 6px',
        cursor: 'pointer', transition: 'all 0.12s ease', lineHeight: 1,
      }}
    >
      <span style={{ fontSize: '12px' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const Divider = () => (
  <div style={{ width: '1px', height: '14px', background: 'rgba(99,102,241,0.2)', margin: '0 2px', flexShrink: 0 }} />
);
