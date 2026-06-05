import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { MathfieldElement } from 'mathlive';

// Khai báo custom element cho TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement> & {
        value?: string;
        ref?: React.Ref<MathfieldElement>;
      };
    }
  }
}

interface MathLiveEditorProps {
  /** Giá trị LaTeX ban đầu (ví dụ: "\\frac{1}{2}" hoặc text thường) */
  initialValue: string;
  /** Trường đang chỉnh sửa */
  field: 'question' | 'answer';
  /** Callback khi lưu */
  onSave: (newValue: string) => void;
  /** Callback khi hủy */
  onCancel: () => void;
  /** Tự động focus khi mount */
  autoFocus?: boolean;
}

// Nút toolbar toán học
const MATH_SHORTCUTS = [
  { label: '\\frac', display: '¹⁄₂', insert: '\\frac{#@}{#?}', title: 'Phân số' },
  { label: '\\sqrt', display: '√', insert: '\\sqrt{#@}', title: 'Căn bậc hai' },
  { label: 'x^n', display: 'xⁿ', insert: '#@^{#?}', title: 'Số mũ' },
  { label: 'x_n', display: 'x₍ₙ₎', insert: '#@_{#?}', title: 'Chỉ số dưới' },
  { label: '\\int', display: '∫', insert: '\\int_{#?}^{#?}', title: 'Tích phân' },
  { label: '\\sum', display: '∑', insert: '\\sum_{#?}^{#?}', title: 'Tổng Sigma' },
  { label: '\\pi', display: 'π', insert: '\\pi', title: 'Pi' },
  { label: '\\infty', display: '∞', insert: '\\infty', title: 'Vô cực' },
  { label: '\\pm', display: '±', insert: '\\pm', title: 'Cộng trừ' },
  { label: '\\times', display: '×', insert: '\\times', title: 'Nhân' },
  { label: '\\leq', display: '≤', insert: '\\leq', title: 'Nhỏ hơn hoặc bằng' },
  { label: '\\geq', display: '≥', insert: '\\geq', title: 'Lớn hơn hoặc bằng' },
];

/**
 * MathLiveEditor — WYSIWYG editor công thức toán
 * Sử dụng thư viện MathLive (mathlive npm package)
 * Hỗ trợ: LaTeX input, bàn phím ảo, toolbar shortcuts
 */
export const MathLiveEditor: React.FC<MathLiveEditorProps> = ({
  initialValue,
  field,
  onSave,
  onCancel,
  autoFocus = true,
}) => {
  const mathfieldRef = useRef<MathfieldElement>(null);
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load mathlive web component
  useEffect(() => {
    import('mathlive').then(() => {
      setIsLoaded(true);
    });
  }, []);

  // Cấu hình MathField khi loaded
  useEffect(() => {
    if (!isLoaded || !mathfieldRef.current) return;
    const mf = mathfieldRef.current;

    // Cấu hình MathLive
    mf.mathVirtualKeyboardPolicy = 'sandboxed'; // Tắt bàn phím ảo mặc định
    mf.smartMode = true;       // Tự chuyển giữa text và math mode
    mf.smartFence = true;      // Tự thêm fence
    mf.removeExtraneousParentheses = true;

    // Giá trị ban đầu — nếu là LaTeX, set trực tiếp; nếu là text thuần, bọc vào text mode
    const isLatex = initialValue.includes('\\') || initialValue.includes('$') || initialValue.includes('^') || initialValue.includes('_');
    if (isLatex) {
      // Loại bỏ $ wrapper nếu có
      const clean = initialValue.replace(/^\$\$(.*)\$\$$/, '$1').replace(/^\$(.*)\$$/, '$1');
      mf.value = clean;
    } else {
      mf.value = initialValue;
    }

    setCurrentValue(mf.value);

    // Lắng nghe thay đổi
    const handleInput = () => {
      setCurrentValue(mf.value);
    };
    mf.addEventListener('input', handleInput);

    // Focus
    if (autoFocus) {
      setTimeout(() => mf.focus(), 50);
    }

    return () => {
      mf.removeEventListener('input', handleInput);
    };
  }, [isLoaded, initialValue, autoFocus]);

  // Xử lý phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      } else if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        // Enter trong mathfield mặc định là newline, ta dùng Ctrl+Enter để lưu
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [currentValue, onCancel]);

  const handleSave = useCallback(() => {
    if (!mathfieldRef.current) return;
    const latexValue = mathfieldRef.current.value;

    // Nếu là text thuần (không có lệnh LaTeX đặc biệt), trả về text thuần
    const isComplexLatex = latexValue.includes('\\') &&
      !latexValue.match(/^\\text\{([^}]*)\}$/);

    let finalValue: string;
    if (isComplexLatex) {
      // Bọc trong $...$ để MathJaxWrapper nhận dạng
      finalValue = `$${latexValue}$`;
    } else {
      // Lấy text nội dung nếu là text thuần
      finalValue = mathfieldRef.current.getValue('plain-text') || latexValue;
    }

    onSave(finalValue.trim() || initialValue);
  }, [onSave, initialValue]);

  // Chèn shortcut vào mathfield
  const insertShortcut = useCallback((insert: string) => {
    if (!mathfieldRef.current) return;
    mathfieldRef.current.executeCommand(['insert', insert]);
    mathfieldRef.current.focus();
  }, []);

  return (
    <div
      className="mathlive-editor-container"
      style={{
        position: 'absolute',
        zIndex: 9999,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'max(220px, 140%)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 27, 75, 0.98) 100%)',
        border: '1.5px solid rgba(99, 102, 241, 0.7)',
        borderRadius: '14px',
        boxShadow: '0 12px 48px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
        padding: '10px',
        backdropFilter: 'blur(20px)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '10px', color: '#818cf8', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', userSelect: 'none' }}>
          ✏️ {field === 'question' ? 'Câu hỏi' : 'Đáp án'}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: '9px', color: '#475569', userSelect: 'none' }}>
          Ctrl+Enter ✓ · Esc ✗
        </span>
      </div>

      {/* Toolbar shortcuts */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '3px',
        marginBottom: '8px',
      }}>
        {MATH_SHORTCUTS.map((sc) => (
          <button
            key={sc.label}
            title={sc.title}
            onMouseDown={(e) => {
              e.preventDefault();
              insertShortcut(sc.insert);
            }}
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '5px',
              color: '#a5b4fc',
              fontSize: '11px',
              fontFamily: 'serif',
              padding: '2px 6px',
              cursor: 'pointer',
              lineHeight: 1.4,
              transition: 'all 0.15s',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(99, 102, 241, 0.3)';
              (e.target as HTMLButtonElement).style.color = '#c7d2fe';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(99, 102, 241, 0.12)';
              (e.target as HTMLButtonElement).style.color = '#a5b4fc';
            }}
          >
            {sc.display}
          </button>
        ))}
      </div>

      {/* MathLive Input */}
      {isLoaded ? (
        <math-field
          ref={mathfieldRef as any}
          style={{
            display: 'block',
            width: '100%',
            minHeight: '40px',
            padding: '6px 8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontSize: '15px',
            lineHeight: 1.5,
            '--caret-color': '#6366f1',
            '--selection-background-color': 'rgba(99, 102, 241, 0.3)',
            '--primary-color': '#6366f1',
            '--text-font-family': '"Be Vietnam Pro", "Quicksand", sans-serif',
          } as React.CSSProperties}
        />
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40px',
          color: '#475569',
          fontSize: '12px',
        }}>
          ⏳ Đang tải editor...
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginTop: '8px',
        justifyContent: 'flex-end',
      }}>
        <button
          onMouseDown={(e) => { e.preventDefault(); onCancel(); }}
          style={{
            background: 'rgba(71, 85, 105, 0.3)',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: '7px',
            color: '#94a3b8',
            fontSize: '11px',
            fontWeight: '600',
            padding: '4px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          ✗ Hủy (Esc)
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            border: 'none',
            borderRadius: '7px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 14px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.15s',
          }}
        >
          ✓ Lưu (Ctrl+↵)
        </button>
      </div>
    </div>
  );
};
