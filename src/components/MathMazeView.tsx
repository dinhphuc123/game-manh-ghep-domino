import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { PuzzlePair, ThemeStyle, GameSettings } from '../types';
import { MathJaxWrapper, calculateDynamicFontSize } from './MathJaxWrapper';
import { generateMazeData } from '../utils/mazeGenerator';

interface MathMazeViewProps {
  pairs: PuzzlePair[];
  settings: GameSettings;
  activeTab: 'poster' | 'cutout';
  aiDistractors?: Map<string, string[]>;
}

// ── Color palette ─────────────────────────────────────────────────────────────
const getColors = (style: ThemeStyle, saveInk: boolean) => {
  if (saveInk) {
    return {
      startCell: { bg: '#fff', border: '#000', text: '#000', label: '#000', labelBg: '#fff' },
      endCell: { bg: '#fff', border: '#000', text: '#000', label: '#000', labelBg: '#fff' },
      normalCell: { bg: '#fff', border: '#aaa', text: '#000' },
      correctEdge: { bg: '#fff', border: '#000', text: '#000' },
      normalEdge: { bg: '#fff', border: '#999', text: '#333' },
      connector: '#aaa',
      correctConnector: '#000',
    };
  }
  if (style === 'vibrant') {
    return {
      startCell: { bg: '#fef3c7', border: '#d97706', text: '#78350f', label: '#fff', labelBg: '#f59e0b' },
      endCell: { bg: '#ecfdf5', border: '#10b981', text: '#065f46', label: '#fff', labelBg: '#10b981' },
      normalCell: { bg: '#eff6ff', border: '#3b82f6', text: '#1e3a8a' },
      correctEdge: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
      normalEdge: { bg: '#f8fafc', border: '#cbd5e1', text: '#334155' },
      connector: '#cbd5e1',
      correctConnector: '#10b981',
    };
  }
  return {
    startCell: { bg: '#fafaf9', border: '#78716c', text: '#292524', label: '#fff', labelBg: '#78716c' },
    endCell: { bg: '#f4f4f5', border: '#71717a', text: '#18181b', label: '#fff', labelBg: '#71717a' },
    normalCell: { bg: '#fff', border: '#e4e4e7', text: '#09090b' },
    correctEdge: { bg: '#f1f5f9', border: '#94a3b8', text: '#1e293b' },
    normalEdge: { bg: '#fff', border: '#e4e4e7', text: '#475569' },
    connector: '#e4e4e7',
    correctConnector: '#94a3b8',
  };
};

// ── Cell sizes for SVG layout ──────────────────────────────────────────────────
const CELL_W = 110;     // px
const CELL_H = 85;      // px
const EDGE_W = 60;      // horizontal gap size
const VERT_EDGE_H = 50;  // vertical gap size
const EDGE_BOX_W = 50;   // answer badge width
const EDGE_BOX_H = 22;   // answer badge height

const getDirections = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('phân số') || t.includes('frac')) {
    return 'Bắt đầu từ ô START, giải phép tính trong ô và đi theo đường nối có ĐÁP ÁN RÚT GỌN CHÍNH XÁC để tìm đường đến FINISH.';
  }
  if (t.includes('phương trình') || t.includes('eq')) {
    return 'Bắt đầu từ ô START, giải phương trình trong ô và đi theo đường nối có GIÁ TRỊ X CHÍNH XÁC để tìm đường đến FINISH.';
  }
  if (t.includes('bất phương trình') || t.includes('ineq')) {
    return 'Bắt đầu từ ô START, giải bất phương trình và đi theo đường nối có TẬP NGHIỆM CHÍNH XÁC để tìm đường đến FINISH.';
  }
  if (t.includes('phân phối') || t.includes('dist')) {
    return 'Bắt đầu từ ô START, khai triển biểu thức và đi theo đường nối có BIỂU THỨC PHÂN PHỐI CHÍNH XÁC để tìm đường đến FINISH.';
  }
  return 'Bắt đầu từ ô START, hãy giải các câu hỏi toán học ở mỗi ô và đi theo con đường có đáp án đúng để tìm đường đến FINISH.';
};

export const MathMazeView: React.FC<MathMazeViewProps> = ({
  pairs,
  settings,
  activeTab,
  aiDistractors,
}) => {
  const { mazeRows, mazeCols, mazeStyle, saveInk, style, pieceSize } = settings;
  const colors = useMemo(() => getColors(style, saveInk), [style, saveInk]);

  const maze = useMemo(() => generateMazeData(pairs, settings, aiDistractors), [pairs, settings, aiDistractors]);

  // Build lookup for correct path cells
  const correctPathSet = useMemo(() => {
    const s = new Set<string>();
    maze.correctPath.forEach(p => s.add(`${p.row}-${p.col}`));
    return s;
  }, [maze]);

  // Size of the board
  const boardW = mazeCols * 170 - 60;
  const boardH = mazeRows * 135 - 50;

  // Center coordinate of cell (r, c)
  const getCellCenter = (r: number, c: number) => {
    return {
      x: c * 170 + 55,
      y: r * 135 + 42.5
    };
  };

  // Top-left coordinate of cell (r, c)
  const getCellLeftTop = (r: number, c: number) => {
    return {
      x: c * 170,
      y: r * 135
    };
  };

  if (pairs.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
        <span className="text-5xl text-slate-300 block mb-3">🌀</span>
        <p className="text-xs text-slate-400 font-bold block">Hãy nhập hoặc nạp câu hỏi để tạo mê cung toán học!</p>
      </div>
    );
  }

  // ── Render Helpers ────────────────────────────────────────────────────────

  const renderSvgLines = () => {
    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: boardW,
          height: boardH,
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {maze.edges.map((edge) => {
          const pA = getCellCenter(edge.rowA, edge.colA);
          const pB = getCellCenter(edge.rowB, edge.colB);
          const isCorrect = edge.isCorrectPath;
          const showCorrect = activeTab === 'poster' && isCorrect;

          return (
            <line
              key={`line-${edge.id}`}
              x1={pA.x}
              y1={pA.y}
              x2={pB.x}
              y2={pB.y}
              stroke={showCorrect ? colors.correctConnector : colors.connector}
              strokeWidth={showCorrect ? 6 : 3.5}
              strokeDasharray={showCorrect ? 'none' : (saveInk ? '4 4' : 'none')}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    );
  };

  const renderEdgeBadges = () => {
    return maze.edges.map((edge) => {
      const pA = getCellCenter(edge.rowA, edge.colA);
      const pB = getCellCenter(edge.rowB, edge.colB);
      const isCorrect = edge.isCorrectPath;
      const showCorrect = activeTab === 'poster' && isCorrect;
      const ec = showCorrect ? colors.correctEdge : colors.normalEdge;
      const xMid = (pA.x + pB.x) / 2;
      const yMid = (pA.y + pB.y) / 2;

      return (
        <div
          key={`badge-${edge.id}`}
          className="maze-edge-badge"
          style={{
            position: 'absolute',
            left: xMid - EDGE_BOX_W / 2,
            top: yMid - EDGE_BOX_H / 2,
            zIndex: 20,
            width: EDGE_BOX_W,
            minHeight: EDGE_BOX_H,
            background: ec.bg,
            border: `${saveInk ? 1.5 : 2}px solid ${ec.border}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 4px',
            boxShadow: saveInk ? 'none' : '0 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          <MathJaxWrapper
            text={edge.text}
            debounceMs={0}
            style={{
              fontSize: calculateDynamicFontSize(edge.text, 9, 7, 11),
              fontWeight: 700,
              color: ec.text,
              textAlign: 'center',
              minHeight: 'unset',
              lineHeight: 1.2,
              width: '100%',
            }}
          />
        </div>
      );
    });
  };

  const renderCells = () => {
    const cellsList: React.ReactNode[] = [];
    for (let r = 0; r < mazeRows; r++) {
      for (let c = 0; c < mazeCols; c++) {
        const isStart = r === 0 && c === 0;
        const isEnd = r === mazeRows - 1 && c === mazeCols - 1;
        const cellData = maze.cells[r]?.[c];
        const question = cellData?.question ?? '';

        let cellColor = colors.normalCell;
        if (isStart) cellColor = colors.startCell;
        else if (isEnd) cellColor = colors.endCell;

        const isOnPath = activeTab === 'poster' && correctPathSet.has(`${r}-${c}`);
        const pos = getCellLeftTop(r, c);

        cellsList.push(
          <div
            key={`cell-${r}-${c}`}
            className="maze-cell-content"
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: CELL_W,
              height: CELL_H,
              borderRadius: 14,
              border: `${saveInk ? 1.5 : 2.5}px solid ${cellColor.border}`,
              background: cellColor.bg,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: (!saveInk && isOnPath) ? `0 0 0 3px ${colors.correctConnector}40` : (!saveInk ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'),
              overflow: 'hidden',
              zIndex: 10,
            }}
          >
            {/* Badge START / FINISH */}
            {(isStart || isEnd) && (
              <div style={{
                position: 'absolute',
                top: 3,
                left: '50%',
                transform: 'translateX(-50%)',
                background: cellColor.labelBg,
                color: cellColor.label,
                fontSize: 8,
                fontWeight: 900,
                letterSpacing: 1,
                borderRadius: 4,
                padding: '1px 7px',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                border: saveInk ? '1px solid #000' : 'none',
              }}>
                {isStart ? 'START' : 'FINISH!'}
              </div>
            )}

            {/* Question content */}
            <div style={{
              width: '100%',
              padding: '4px 6px',
              paddingTop: (isStart || isEnd) ? 16 : 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            }}>
              <MathJaxWrapper
                text={question}
                debounceMs={0}
                style={{
                  fontSize: calculateDynamicFontSize(question, 12, 8, 15),
                  fontWeight: 700,
                  color: cellColor.text,
                  textAlign: 'center',
                  minHeight: 'unset',
                  lineHeight: 1.3,
                  width: '100%',
                }}
              />
            </div>
          </div>
        );
      }
    }
    return cellsList;
  };

  return (
    <div className="w-full select-none notranslate" translate="no">
      {/* Statistics Header */}
      <div className="no-print mb-4 flex justify-between items-center bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-xs text-slate-600">
        <span className="font-semibold flex items-center gap-1.5">
          🌀 Kiểu Lưới Mê Cung: <b className="text-indigo-600">{mazeRows}x{mazeCols}</b>
          ({mazeRows * mazeCols} ô) {settings.allowDiagonal && <b className="text-purple-600 font-bold ml-1">(Đường đi chéo)</b>}
        </span>
        <span className="font-mono bg-[#159BAD] text-white font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles size={11} /> Nạp {Math.min(pairs.length, maze.correctPath.length - 1)} câu hỏi của bạn
        </span>
      </div>

      {/* Maze HTML/CSS SVG Overlay Container */}
      <div
        style={{
          transform: `scale(${pieceSize})`,
          transformOrigin: 'top center',
          display: 'block',
          margin: '0 auto',
          position: 'relative',
          width: boardW,
          height: boardH,
          paddingBottom: 20,
        }}
      >
        {/* Render lines SVG */}
        {renderSvgLines()}

        {/* Render answer badges absolute */}
        {renderEdgeBadges()}

        {/* Render cells absolute */}
        {renderCells()}
      </div>
    </div>
  );
};
