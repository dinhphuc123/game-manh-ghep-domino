import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PuzzlePair, GameSettings } from '../types';

// ── Helpers ─────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a single bingo card: fills rows×cols cells with shuffled answers, center = FREE */
function buildCard(answers: string[], rows: number, cols: number, seed?: number): string[] {
  const total = rows * cols;
  const freeIdx = Math.floor(total / 2); // giữa bảng
  const rng = seed !== undefined ? seededShuffle(answers, seed) : shuffleArray(answers);
  // lấy đủ ô (lặp lại nếu thiếu)
  const pool: string[] = [];
  while (pool.length < total - 1) {
    pool.push(...rng.slice(0, Math.min(rng.length, total - 1 - pool.length)));
  }
  const card: string[] = [];
  let ai = 0;
  for (let i = 0; i < total; i++) {
    if (i === freeIdx) {
      card.push('⭐ FREE');
    } else {
      card.push(pool[ai++] ?? '?');
    }
  }
  return card;
}

function seededShuffle(arr: string[], seed: number): string[] {
  const a = [...arr];
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Check bingo: hàng, cột, đường chéo */
function checkBingo(checked: boolean[], rows: number, cols: number): boolean {
  // Kiểm tra hàng
  for (let r = 0; r < rows; r++) {
    if (Array.from({ length: cols }, (_, c) => checked[r * cols + c]).every(Boolean)) return true;
  }
  // Kiểm tra cột
  for (let c = 0; c < cols; c++) {
    if (Array.from({ length: rows }, (_, r) => checked[r * cols + c]).every(Boolean)) return true;
  }
  // Đường chéo chính
  if (rows === cols) {
    if (Array.from({ length: rows }, (_, i) => checked[i * cols + i]).every(Boolean)) return true;
    if (Array.from({ length: rows }, (_, i) => checked[i * cols + (cols - 1 - i)]).every(Boolean)) return true;
  }
  return false;
}

// ── Color palette ────────────────────────────────────────────────────────────

const VIBRANT_PALETTE = [
  '#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF',
  '#C77DFF', '#FF6FD8', '#00C9FF', '#F9A826', '#43E97B',
];

const PASTEL_PALETTE = [
  '#FFB3B3', '#FFCBA4', '#FFF3A3', '#B3E5B3', '#B3D1FF',
  '#DDB3FF', '#FFB3EC', '#B3EEFF', '#FFD9A3', '#B3F5D1',
];

function getHeaderColor(style: 'vibrant' | 'pastel', colIdx: number): string {
  const palette = style === 'vibrant' ? VIBRANT_PALETTE : PASTEL_PALETTE;
  return palette[colIdx % palette.length];
}

// ── Single Bingo Card ────────────────────────────────────────────────────────

interface BingoCardProps {
  cells: string[];
  rows: number;
  cols: number;
  settings: GameSettings;
  interactive?: boolean;
  cardIndex?: number;
  showCardNumber?: boolean;
}

const BingoCard: React.FC<BingoCardProps> = ({
  cells,
  rows,
  cols,
  settings,
  interactive = false,
  cardIndex = 0,
  showCardNumber = false,
}) => {
  const total = rows * cols;
  const freeIdx = Math.floor(total / 2);
  const [checked, setChecked] = useState<boolean[]>(() => {
    const arr = Array(total).fill(false);
    arr[freeIdx] = true;
    return arr;
  });
  const [bingo, setBingo] = useState(false);

  const toggle = (idx: number) => {
    if (!interactive || idx === freeIdx) return;
    setChecked(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      if (checkBingo(next, rows, cols)) setBingo(true);
      return next;
    });
  };

  const palette = settings.style === 'vibrant' ? VIBRANT_PALETTE : PASTEL_PALETTE;
  const headerColors = Array.from({ length: cols }, (_, i) => palette[i % palette.length]);
  const headerLetters = ['B', 'I', 'N', 'G', 'O', 'X', 'Y', 'Z', 'W', 'V'].slice(0, cols);

  const cellSize = Math.min(120, Math.floor(580 / cols));
  const fontSize = cellSize < 80 ? 11 : cellSize < 100 ? 12 : 13;

  return (
    <div
      className="bingo-card-wrapper"
      style={{
        display: 'inline-block',
        fontFamily: "'Nunito', 'Inter', sans-serif",
      }}
    >
      {/* Card header */}
      <div style={{
        background: 'linear-gradient(135deg, #6C63FF 0%, #FF6B9D 100%)',
        borderRadius: '12px 12px 0 0',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#fff',
      }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>🎯 {settings.title}</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{settings.gradeClass}</div>
        {showCardNumber && (
          <div style={{
            background: 'rgba(255,255,255,0.3)',
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 12,
            fontWeight: 700,
          }}>
            Phiếu #{cardIndex + 1}
          </div>
        )}
      </div>

      {/* BINGO banner */}
      {bingo && interactive && (
        <div style={{
          background: 'linear-gradient(90deg, #FFD700, #FF6B35)',
          color: '#fff',
          fontWeight: 900,
          fontSize: 24,
          textAlign: 'center',
          padding: '8px',
          letterSpacing: 4,
          animation: 'bingoFlash 0.5s ease-in-out',
        }}>
          🎉 BINGO! 🎉
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        border: '2px solid #E2E8F0',
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        overflow: 'hidden',
      }}>
        {/* Column headers */}
        {headerColors.map((color, ci) => (
          <div key={`h${ci}`} style={{
            background: color,
            color: settings.style === 'vibrant' ? '#fff' : '#333',
            fontWeight: 900,
            fontSize: 20,
            textAlign: 'center',
            padding: '6px 0',
            borderRight: ci < cols - 1 ? '1px solid rgba(255,255,255,0.4)' : 'none',
            textShadow: settings.style === 'vibrant' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            letterSpacing: 2,
          }}>
            {headerLetters[ci]}
          </div>
        ))}

        {/* Cells */}
        {cells.map((cell, idx) => {
          const isFree = idx === freeIdx;
          const isChecked = checked[idx];
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          const bgColor = isFree
            ? (settings.style === 'vibrant' ? '#FFD700' : '#FFF3A3')
            : isChecked
            ? (settings.style === 'vibrant' ? headerColors[col] + 'CC' : headerColors[col] + '88')
            : '#fff';

          return (
            <div
              key={idx}
              onClick={() => toggle(idx)}
              style={{
                width: cellSize,
                height: cellSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '4px',
                fontSize,
                fontWeight: isFree ? 800 : 600,
                color: isFree ? '#7B4F00' : isChecked ? '#fff' : '#2D3748',
                background: bgColor,
                border: '1px solid #E2E8F0',
                borderRight: col < cols - 1 ? '1px solid #E2E8F0' : 'none',
                borderBottom: row < rows - 1 ? '1px solid #E2E8F0' : 'none',
                cursor: interactive && !isFree ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxSizing: 'border-box',
                wordBreak: 'break-word',
                lineHeight: 1.3,
                userSelect: 'none',
              }}
            >
              {isChecked && !isFree && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: cellSize * 0.5,
                  opacity: 0.25,
                  pointerEvents: 'none',
                }}>✕</div>
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {isFree ? '⭐\nFREE' : cell}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        fontSize: 11,
        color: '#A0AEC0',
        marginTop: 4,
        fontStyle: 'italic',
      }}>
        {settings.teacherName && `GV: ${settings.teacherName}`}
        {settings.teacherName && ' • '}
        {settings.subject}
      </div>
    </div>
  );
};

// ── Question Sheet ───────────────────────────────────────────────────────────

const QuestionSheet: React.FC<{ pairs: PuzzlePair[]; settings: GameSettings }> = ({ pairs, settings }) => (
  <div style={{
    fontFamily: "'Nunito', 'Inter', sans-serif",
    border: '2px solid #6C63FF',
    borderRadius: 12,
    overflow: 'hidden',
    pageBreakInside: 'avoid',
  }}>
    <div style={{
      background: 'linear-gradient(135deg, #6C63FF 0%, #FF6B9D 100%)',
      color: '#fff',
      padding: '8px 16px',
      fontWeight: 800,
      fontSize: 15,
    }}>
      📋 Danh sách câu hỏi — {settings.title}
    </div>
    <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
      {pairs.map((p, i) => (
        <div key={p.id} style={{
          display: 'flex',
          gap: 8,
          fontSize: 13,
          color: '#2D3748',
          padding: '3px 0',
          borderBottom: '1px dashed #E2E8F0',
        }}>
          <span style={{ fontWeight: 700, color: '#6C63FF', minWidth: 24 }}>{i + 1}.</span>
          <span>{p.question}</span>
        </div>
      ))}
    </div>
  </div>
);

// ── Main BingoView ───────────────────────────────────────────────────────────

interface BingoViewProps {
  pairs: PuzzlePair[];
  settings: GameSettings;
  interactive?: boolean; // true = chế độ học sinh chơi online
}

export const BingoView: React.FC<BingoViewProps> = ({ pairs, settings, interactive = false }) => {
  const rows = settings.bingoRows || 5;
  const cols = settings.bingoCols || 5;
  const [printCount, setPrintCount] = useState(1);
  const [seeds, setSeeds] = useState<number[]>(() => Array.from({ length: 8 }, () => Math.floor(Math.random() * 1e9)));
  const [projectionIdx, setProjectionIdx] = useState(0);
  const [showProjection, setShowProjection] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const answers = pairs.map(p => p.answer).filter(Boolean);

  const regenerate = useCallback(() => {
    setSeeds(Array.from({ length: 8 }, () => Math.floor(Math.random() * 1e9)));
  }, []);

  // Build cards based on seeds
  const cards = seeds.slice(0, printCount).map(seed => buildCard(answers, rows, cols, seed));

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Not enough answers
  const minAnswers = Math.ceil((rows * cols - 1) * 0.5);
  const hasEnoughData = answers.length >= minAnswers;

  if (!hasEnoughData) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        color: '#A0AEC0',
        gap: 12,
        fontFamily: "'Nunito', 'Inter', sans-serif",
      }}>
        <div style={{ fontSize: 48 }}>🎱</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#4A5568' }}>Chưa đủ dữ liệu</div>
        <div style={{ textAlign: 'center', fontSize: 14 }}>
          Bảng Bingo {rows}×{cols} cần ít nhất <strong>{minAnswers}</strong> cặp câu hỏi–đáp án.
          <br />Hiện có: <strong>{answers.length}</strong> đáp án.
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Nunito', 'Inter', sans-serif" }}>
      {/* ── CSS for print ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes bingoFlash {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @media print {
          .bingo-no-print { display: none !important; }
          .bingo-print-area { display: block !important; }
          body { margin: 0; }
          .bingo-page-break { page-break-after: always; }
        }
        @media screen {
          .bingo-print-area { display: none; }
        }
      `}</style>

      {/* ── Toolbar (no-print) ── */}
      {!interactive && (
        <div className="bingo-no-print" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 20,
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #F7F3FF, #FFF3F8)',
          borderRadius: 12,
          border: '1px solid #E9D5FF',
        }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#6C63FF' }}>🎯 Math Bingo</div>

          {/* Số bảng in */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#4A5568', fontWeight: 600 }}>Số phiếu in:</span>
            {[1, 2, 4, 6, 8].map(n => (
              <button
                key={n}
                onClick={() => setPrintCount(n)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '2px solid',
                  borderColor: printCount === n ? '#6C63FF' : '#E2E8F0',
                  background: printCount === n ? '#6C63FF' : '#fff',
                  color: printCount === n ? '#fff' : '#4A5568',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={regenerate}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                border: '2px solid #6C63FF',
                background: '#fff',
                color: '#6C63FF',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              🔀 Xáo trộn lại
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                border: 'none',
                background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(108,99,255,0.4)',
                transition: 'all 0.15s',
              }}
            >
              🖨️ In PDF
            </button>
            <button
              onClick={() => setShowProjection(!showProjection)}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                border: '2px solid #FF8E53',
                background: showProjection ? '#FF8E53' : '#fff',
                color: showProjection ? '#fff' : '#FF8E53',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              📡 Chiếu câu hỏi
            </button>
          </div>
        </div>
      )}

      {/* ── Projection Mode ── */}
      {showProjection && !interactive && (
        <div className="bingo-no-print" style={{
          background: 'linear-gradient(135deg, #1A1A2E, #16213E)',
          borderRadius: 16,
          padding: '24px 32px',
          marginBottom: 20,
          color: '#fff',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8 }}>
            Câu hỏi {projectionIdx + 1} / {pairs.length}
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            lineHeight: 1.4,
            marginBottom: 20,
            color: '#FFD700',
          }}>
            {pairs[projectionIdx]?.question || '—'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              onClick={() => setProjectionIdx(i => Math.max(0, i - 1))}
              disabled={projectionIdx === 0}
              style={{
                padding: '10px 24px', borderRadius: 20, border: 'none',
                background: projectionIdx === 0 ? '#333' : '#6C63FF',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: projectionIdx === 0 ? 'default' : 'pointer',
              }}
            >← Trước</button>
            <div style={{
              padding: '10px 20px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.1)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
            }}>
              Đáp án: <strong style={{ marginLeft: 8, color: '#6BCB77' }}>{pairs[projectionIdx]?.answer}</strong>
            </div>
            <button
              onClick={() => setProjectionIdx(i => Math.min(pairs.length - 1, i + 1))}
              disabled={projectionIdx === pairs.length - 1}
              style={{
                padding: '10px 24px', borderRadius: 20, border: 'none',
                background: projectionIdx === pairs.length - 1 ? '#333' : '#FF6B9D',
                color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: projectionIdx === pairs.length - 1 ? 'default' : 'pointer',
              }}
            >Tiếp →</button>
          </div>
        </div>
      )}

      {/* ── Preview cards (screen) ── */}
      {!interactive && (
        <div className="bingo-no-print" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          {cards.slice(0, Math.min(printCount, 2)).map((cellData, ci) => (
            <BingoCard
              key={ci}
              cells={cellData}
              rows={rows}
              cols={cols}
              settings={settings}
              interactive={false}
              cardIndex={ci}
              showCardNumber={printCount > 1}
            />
          ))}
          {printCount > 2 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              color: '#A0AEC0',
              fontSize: 14,
              fontStyle: 'italic',
            }}>
              + {printCount - 2} phiếu nữa (xem khi in)
            </div>
          )}
        </div>
      )}

      {/* ── Interactive mode (học sinh chơi) ── */}
      {interactive && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <BingoCard
            cells={buildCard(answers, rows, cols)}
            rows={rows}
            cols={cols}
            settings={settings}
            interactive={true}
            cardIndex={0}
            showCardNumber={false}
          />
        </div>
      )}

      {/* ── Question list (screen) ── */}
      {!interactive && (
        <div className="bingo-no-print">
          <QuestionSheet pairs={pairs} settings={settings} />
        </div>
      )}

      {/* ── Print area ── */}
      <div className="bingo-print-area" ref={printRef}>
        {cards.map((cellData, ci) => (
          <div key={ci} className={ci < cards.length - 1 ? 'bingo-page-break' : ''} style={{ padding: 16 }}>
            <BingoCard
              cells={cellData}
              rows={rows}
              cols={cols}
              settings={settings}
              interactive={false}
              cardIndex={ci}
              showCardNumber={true}
            />
          </div>
        ))}
        {/* Danh sách câu hỏi cuối cùng (trang riêng cho GV) */}
        <div style={{ padding: 16 }}>
          <QuestionSheet pairs={pairs} settings={settings} />
        </div>
      </div>
    </div>
  );
};

export default BingoView;
