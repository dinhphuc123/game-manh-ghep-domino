import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathJaxWrapperProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  debounceMs?: number; // Thời gian chờ trước khi render lại khi text thay đổi liên tục

  // ── Inline Editing Props ──────────────────────────────────────────────────
  isEditable?: boolean;            // Bật chế độ cho phép double-click để sửa
  pairId?: string;                 // ID của PuzzlePair cần cập nhật
  field?: 'question' | 'answer';  // Trường cần cập nhật
  onSave?: (pairId: string, field: 'question' | 'answer', newValue: string) => void;
}

export const MathJaxWrapper: React.FC<MathJaxWrapperProps> = ({
  text,
  className = '',
  style = {},
  debounceMs = 0,
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

  // Đồng bộ displayText khi prop `text` thay đổi từ bên ngoài (khi không đang sửa)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(text);
    }
  }, [text, isEditing]);

  // Xử lý Debounce khi text thay đổi liên tục (ví dụ đang gõ công thức)
  useEffect(() => {
    if (debounceMs <= 0) {
      setDisplayText(text);
      return;
    }

    const handler = setTimeout(() => {
      setDisplayText(text);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [text, debounceMs]);

  // Cơ chế tự động co giãn (Auto-scaling) đo kích thước và scale nếu công thức bị tràn
  useLayoutEffect(() => {
    if (!containerRef.current || !innerRef.current || isEditing) return;

    // Reset scale về 1.0 trước khi đo
    setScale(1.0);

    const measureAndScale = () => {
      if (!containerRef.current || !innerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const innerWidth = innerRef.current.scrollWidth;

      if (innerWidth > containerWidth && containerWidth > 0) {
        const newScale = containerWidth / innerWidth;
        // Giới hạn scale tối thiểu là 0.4 để đảm bảo chữ vẫn đủ đọc được
        setScale(Math.max(0.4, newScale));
      } else {
        setScale(1.0);
      }
    };

    // Chạy đo đạc sau khi DOM đã được cập nhật xong nội dung KaTeX
    const rafId = requestAnimationFrame(measureAndScale);
    return () => cancelAnimationFrame(rafId);
  }, [displayText, isEditing]);

  // Focus textarea khi bắt đầu chỉnh sửa
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Đặt con trỏ về cuối văn bản
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isEditable || !pairId || !field || !onSave) return;
    e.stopPropagation();
    e.preventDefault();
    setEditValue(text);
    setIsEditing(true);
  }, [isEditable, pairId, field, onSave, text]);

  const commitEdit = useCallback(() => {
    if (!isEditable || !pairId || !field || !onSave) return;
    const trimmed = editValue.trim();
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

  // ── Chế độ đang chỉnh sửa (Editing Mode) ────────────────────────────────
  if (isEditing) {
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            commitEdit();
          }}
        />

        {/* Hộp nhập liệu nổi lên */}
        <div
          style={{
            position: 'absolute',
            zIndex: 9999,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'max(120px, 100%)',
            background: 'rgba(15, 23, 42, 0.97)',
            border: '2px solid #6366f1',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99,102,241,0.2)',
            padding: '6px 8px 4px',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Label */}
          <div style={{
            fontSize: '9px',
            color: '#818cf8',
            fontFamily: 'monospace',
            marginBottom: '4px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}>
            ✏️ {field === 'question' ? 'Câu hỏi' : 'Đáp án'} · Enter ✓ · Esc ✗
          </div>

          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            rows={2}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e2e8f0',
              fontSize: '13px',
              fontFamily: 'monospace',
              resize: 'none',
              lineHeight: 1.5,
            }}
            placeholder="Nhập nội dung (hỗ trợ $LaTeX$)..."
          />
        </div>
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
        }}
      >
        {renderContent()}
      </div>

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
