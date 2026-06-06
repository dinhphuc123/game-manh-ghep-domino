import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { MathLiveEditor } from './editor/MathLiveEditor';
import { FloatingToolbar } from './editor/FloatingToolbar';

interface MathJaxWrapperProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  debounceMs?: number;
  // ── Typography ───────────────────────────────────────────────────────────────
  fontSize?: number;           // px override (bỏ qua calculateDynamicFontSize)
  fontFamily?: string;         // CSS font-family override
  // ── Inline Editing Props ──────────────────────────────────────────────────
  isEditable?: boolean;
  pairId?: string;
  field?: 'question' | 'answer';
  onSave?: (pairId: string, field: 'question' | 'answer', newValue: string) => void;
}

export const MathJaxWrapper: React.FC<MathJaxWrapperProps> = ({
  text,
  className = '',
  style = {},
  debounceMs = 0,
  fontSize,
  fontFamily,
  isEditable = false,
  pairId,
  field,
  onSave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [displayText, setDisplayText] = useState(text);
  const [scale, setScale] = useState(1.0);

  // ── Inline editing state ───────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const [isHovered, setIsHovered] = useState(false);

  // Đồng bộ displayText khi prop `text` thay đổi từ bên ngoài (khi không đang sửa)
  useEffect(() => {
    if (!isEditing) {
      if (debounceMs > 0) {
        const timer = setTimeout(() => setDisplayText(text), debounceMs);
        return () => clearTimeout(timer);
      } else {
        setDisplayText(text);
      }
    }
  }, [text, isEditing, debounceMs]);

  // Auto-scale: giảm font nếu nội dung bị tràn
  useLayoutEffect(() => {
    if (isEditing) return;
    let rafId: number;

    const checkOverflow = () => {
      rafId = requestAnimationFrame(() => {
        const container = containerRef.current;
        const inner = innerRef.current;
        if (!container || !inner) return;

        inner.style.transform = 'none';
        const containerW = container.offsetWidth;
        const innerW = inner.scrollWidth;

        if (innerW > containerW && containerW > 0) {
          const newScale = Math.max(0.55, Math.min(1.0, containerW / innerW));
          setScale(newScale);
        } else {
          setScale(1.0);
        }
      });
    };

    checkOverflow();
    return () => cancelAnimationFrame(rafId);
  }, [displayText, isEditing]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isEditable || !pairId || !field || !onSave) return;
    e.stopPropagation();
    e.preventDefault();
    setEditValue(text);
    setIsEditing(true);
  }, [isEditable, pairId, field, onSave, text]);

  const commitEdit = useCallback((newValue?: string) => {
    if (!isEditable || !pairId || !field || !onSave) return;
    const valueToSave = newValue !== undefined ? newValue : editValue;
    const trimmed = valueToSave.trim();
    if (trimmed !== text) {
      onSave(pairId, field, trimmed || text);
    }
    setIsEditing(false);
  }, [isEditable, pairId, field, onSave, editValue, text]);

  const cancelEdit = useCallback(() => {
    setEditValue(text);
    setIsEditing(false);
  }, [text]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitEdit();
    }
  }, [commitEdit, cancelEdit]);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderContent = () => {
    if (!displayText) return null;

    // Tách chuỗi theo ký tự phân tách LaTeX $$...$$ và $...$
    const parts = displayText.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2);
        try {
          const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
          return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (err) {
          return <span key={idx}>{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1);
        try {
          const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
          return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (err) {
          return <span key={idx}>{part}</span>;
        }
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  // ── Chế độ đang chỉnh sửa (MathLive WYSIWYG Editor) ──────────────────────
  if (isEditing && isEditable && pairId && field && onSave) {
    return (
      <div
        className={`mathjax-wrapper mathjax-editing ${className}`}
        style={{
          minHeight: '1.2em',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          ...style,
        }}
      >
        {/* Overlay mờ để click ra ngoài */}
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
          onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
        />

        {/* MathLive WYSIWYG Editor */}
        <MathLiveEditor
          initialValue={text}
          field={field}
          onSave={(newValue) => commitEdit(newValue)}
          onCancel={cancelEdit}
          autoFocus
        />
      </div>
    );
  }

  // ── Chế độ hiển thị bình thường ──────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`mathjax-wrapper ${className} select-none notranslate ${isEditable ? 'mathjax-editable' : ''}`}
      translate="no"
      title={isEditable ? 'Nhấp đúp để chỉnh sửa' : undefined}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => isEditable && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        minHeight: '1.2em',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: isEditable ? 'text' : 'default',
        borderRadius: isEditable ? '4px' : undefined,
        transition: 'outline 0.15s ease, background 0.15s ease',
        position: 'relative',
        ...style,
      }}
    >
      <div
        ref={innerRef}
        className="mathjax-inner"
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          width: 'max-content',
          transform: scale !== 1.0 ? `scale(${scale})` : 'none',
          transformOrigin: 'center center',
          transition: 'transform 0.12s ease-out',
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontFamily: fontFamily || undefined,
        }}
      >
        {renderContent()}
      </div>

      {/* FloatingToolbar khi hover — chỉ hiện trên poster tab */}
      {isEditable && isHovered && pairId && field && onSave && (
        <FloatingToolbar
          referenceEl={containerRef.current}
          isVisible={isHovered && !isEditing}
          field={field}
          currentText={text}
          onEdit={() => { setEditValue(text); setIsEditing(true); }}
          onBold={() => { /* TODO: wrap in \textbf */ }}
          onReset={() => {
            const stripped = text.replace(/\$\$?/g, '').replace(/\\[a-zA-Z]+/g, '').trim();
            onSave(pairId, field, stripped || text);
          }}
        />
      )}

      {/* Hint icon hiển thị khi isEditable */}
      {isEditable && (
        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            fontSize: '8px',
            opacity: 0,
            color: '#6366f1',
            pointerEvents: 'none',
            transition: 'opacity 0.2s',
          }}
          className="edit-hint-icon"
        >
          ✏️
        </div>
      )}
    </div>
  );
};

export const calculateDynamicFontSize = (
  text: string,
  baseSize: number,
  minSize: number = 7,
  maxSize: number = 14
): number => {
  if (!text) return baseSize;

  const cleanText = text
    .replace(/\\[a-zA-Z]+/g, 'X')
    .replace(/[\{\}\$\_\^]/g, '');

  const displayLen = Math.max(1, cleanText.length);

  if (displayLen <= 10) {
    return maxSize;
  }
  if (displayLen <= 20) {
    return baseSize;
  }

  const calculated = baseSize * Math.sqrt(20 / displayLen);
  return Math.max(minSize, Math.min(maxSize, parseFloat(calculated.toFixed(1))));
};

export const hasMathFormula = (text: string): boolean => {
  if (!text) return false;
  return (
    text.includes('$') ||
    text.includes('\\(') ||
    text.includes('\\[') ||
    text.includes('\\frac') ||
    text.includes('\\sqrt') ||
    text.includes('\\sum') ||
    text.includes('\\int') ||
    text.includes('\\lim') ||
    text.includes('\\vec') ||
    text.includes('\\overline') ||
    text.includes('\\alpha') ||
    text.includes('\\beta') ||
    text.includes('\\pi') ||
    text.includes('^{') ||
    text.includes('_{')
  );
};
