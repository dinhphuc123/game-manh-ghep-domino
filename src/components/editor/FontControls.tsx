import React, { useCallback } from 'react';
import { useEditorStore } from '../../stores/editorStore';

// Danh sách fonts hỗ trợ
export const FONT_OPTIONS = [
  { label: 'Quicksand (mặc định)', value: 'Quicksand, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Be Vietnam Pro', value: '"Be Vietnam Pro", sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Georgia (Serif)', value: 'Georgia, serif' },
];

export const DEFAULT_FONT_SIZE = 13;
export const DEFAULT_FONT_FAMILY = 'Quicksand, sans-serif';

interface FontControlsProps {
  /** Compact: dùng trong FloatingToolbar (ngang) */
  compact?: boolean;
  /** Callback khi giáo viên thay đổi font để trigger preview refresh */
  onChange?: () => void;
}

/**
 * FontControls — controls chỉnh font size + font family
 * Kết nối trực tiếp với editorStore.settings
 */
export const FontControls: React.FC<FontControlsProps> = ({ compact = false, onChange }) => {
  const { settings, setSettings } = useEditorStore();

  const fontSize = settings.globalFontSize ?? DEFAULT_FONT_SIZE;
  const fontFamily = settings.globalFontFamily ?? DEFAULT_FONT_FAMILY;

  const handleFontSizeChange = useCallback((val: number) => {
    setSettings({ globalFontSize: val });
    onChange?.();
  }, [setSettings, onChange]);

  const handleFontFamilyChange = useCallback((val: string) => {
    setSettings({ globalFontFamily: val });
    onChange?.();
  }, [setSettings, onChange]);

  const resetFont = useCallback(() => {
    setSettings({ globalFontSize: DEFAULT_FONT_SIZE, globalFontFamily: DEFAULT_FONT_FAMILY });
    onChange?.();
  }, [setSettings, onChange]);

  if (compact) {
    // ── Compact layout (FloatingToolbar) ────────────────────────────────────
    return (
      <div
        className="font-controls-compact"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '10px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        {/* Font size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            Cỡ chữ
          </span>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleFontSizeChange(Math.max(8, fontSize - 1)); }}
            style={{ ...btnStyle, fontSize: '12px', lineHeight: 1 }}
            title="Giảm cỡ chữ"
          >−</button>
          <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 700, minWidth: '22px', textAlign: 'center', fontFamily: 'monospace' }}>
            {fontSize}
          </span>
          <button
            onMouseDown={(e) => { e.preventDefault(); handleFontSizeChange(Math.min(22, fontSize + 1)); }}
            style={{ ...btnStyle, fontSize: '12px', lineHeight: 1 }}
            title="Tăng cỡ chữ"
          >+</button>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

        {/* Font family */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Font
          </span>
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '5px',
              color: '#e2e8f0',
              fontSize: '10px',
              padding: '2px 4px',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '110px',
            }}
          >
            {FONT_OPTIONS.map(f => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button
          onMouseDown={(e) => { e.preventDefault(); resetFont(); }}
          title="Đặt lại mặc định"
          style={{ ...btnStyle, fontSize: '10px', color: '#64748b' }}
        >
          ↺
        </button>
      </div>
    );
  }

  // ── Full layout (EditorPage sidebar) ─────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Font Size Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Kích cỡ chữ
          </label>
          <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 700, fontFamily: 'monospace' }}>
            {fontSize}px
          </span>
        </div>
        <input
          type="range"
          min={8}
          max={22}
          step={1}
          value={fontSize}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ fontSize: '9px', color: '#475569' }}>8px (Nhỏ)</span>
          <span style={{ fontSize: '9px', color: '#475569' }}>22px (Lớn)</span>
        </div>
      </div>

      {/* Preview chữ */}
      <div style={{
        padding: '6px 10px',
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontSize: `${fontSize}px`, fontFamily, color: '#e2e8f0' }}>
          Abc 123 Phương trình
        </span>
      </div>

      {/* Font Family */}
      <div>
        <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
          Font chữ
        </label>
        <select
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '7px',
            color: '#e2e8f0',
            fontSize: '12px',
            padding: '6px 8px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {FONT_OPTIONS.map(f => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Reset button */}
      <button
        onClick={resetFont}
        style={{
          background: 'rgba(71, 85, 105, 0.2)',
          border: '1px solid rgba(71, 85, 105, 0.3)',
          borderRadius: '6px',
          color: '#64748b',
          fontSize: '10px',
          padding: '4px 8px',
          cursor: 'pointer',
          alignSelf: 'flex-start',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
        onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
      >
        ↺ Đặt lại mặc định ({DEFAULT_FONT_SIZE}px)
      </button>
    </div>
  );
};

// Shared button style
const btnStyle: React.CSSProperties = {
  background: 'rgba(99, 102, 241, 0.12)',
  border: '1px solid rgba(99, 102, 241, 0.25)',
  borderRadius: '5px',
  color: '#a5b4fc',
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s',
  padding: 0,
  flexShrink: 0,
};
