import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { PuzzlePair, ThemeStyle } from '../types';
import { MathJaxWrapper, calculateDynamicFontSize } from './MathJaxWrapper';
import { generateMazeData } from '../utils/mazeGenerator';

interface MathMazeViewProps {
  pairs: PuzzlePair[];
  style: ThemeStyle;
  mazeRows: number;
  mazeCols: number;
  mazeStyle: 'animal_cartoon' | 'classic';
  saveInk: boolean;
  pieceSize: number;
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

// ── Cell sizes ────────────────────────────────────────────────────────────────
const CELL_W = 110;   // px
const CELL_H = 85;    // px
const EDGE_W = 60;    // horizontal connector width
const EDGE_H = 12;    // horizontal connector height (thin bar)
const VERT_EDGE_W = 12;
const VERT_EDGE_H = 50; // vertical connector height
const EDGE_BOX_W = 50;  // answer badge inside edge
const EDGE_BOX_H = 22;

export const MathMazeView: React.FC<MathMazeViewProps> = ({
  pairs,
  style,
  mazeRows,
  mazeCols,
  mazeStyle,
  saveInk,
  pieceSize,
  activeTab,
  aiDistractors,
}) => {
  const colors = useMemo(() => getColors(style, saveInk), [style, saveInk]);

  const fakeSettings = useMemo(() => ({
    title: '', subject: '', gradeClass: '', teacherName: '',
    style, showMatchCode: false, showDoodleIcons: true,
    activityType: 'Luyện tập' as any, columns: 2, pieceSize: 1, saveInk,
    puzzleType: 'math_maze' as any, tarsiaShape: 'triangle_16' as any,
    numberShape: '', numberScaleX: 1, numberScaleY: 1,
    dominoShape: '', dominoWidth: 1, dominoHeight: 1,
    mazeRows, mazeCols, mazeStyle,
    bingoRows: 5, bingoCols: 5,
  }), [style, saveInk, mazeRows, mazeCols, mazeStyle]);

  const maze = useMemo(() => generateMazeData(pairs, fakeSettings, aiDistractors), [pairs, fakeSettings, aiDistractors]);


  // Build lookup: is this cell on correct path?
  const correctPathSet = useMemo(() => {
    const s = new Set<string>();
    maze.correctPath.forEach(p => s.add(`${p.row}-${p.col}`));
    return s;
  }, [maze]);

  // Build lookup: is edge (rowA,colA)-(rowB,colB) on correct path?
  const correctEdgeSet = useMemo(() => {
    const s = new Set<string>();
    maze.edges.forEach(e => {
      if (e.isCorrectPath) s.add(`${e.rowA}-${e.colA}|${e.rowB}-${e.colB}`);
    });
    return s;
  }, [maze]);

  // Build a map edge: key = "rowA-colA|rowB-colB" → edge object
  const edgeMap = useMemo(() => {
    const m = new Map<string, typeof maze.edges[0]>();
    maze.edges.forEach(e => m.set(`${e.rowA}-${e.colA}|${e.rowB}-${e.colB}`, e));
    return m;
  }, [maze]);

  if (pairs.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
        <span className="text-5xl text-slate-300 block mb-3">🌀</span>
        <p className="text-xs text-slate-400 font-bold block">Hãy nhập hoặc nạp câu hỏi để tạo mê cung toán học!</p>
      </div>
    );
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderCell = (row: number, col: number) => {
    const isStart = row === 0 && col === 0;
    const isEnd = row === mazeRows - 1 && col === mazeCols - 1;
    const cellData = maze.cells[row]?.[col];
    const question = cellData?.question ?? '';

    let cellColor = colors.normalCell;
    if (isStart) cellColor = colors.startCell;
    else if (isEnd) cellColor = colors.endCell;

    const isOnPath = activeTab === 'poster' && correctPathSet.has(`${row}-${col}`);

    return (
      <div
        key={`cell-${row}-${col}`}
        style={{
          width: CELL_W,
          height: CELL_H,
          borderRadius: 14,
          border: `${saveInk ? 1.5 : 2.5}px solid ${cellColor.border}`,
          background: cellColor.bg,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: (!saveInk && isOnPath) ? `0 0 0 3px ${colors.correctConnector}40` : (!saveInk ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'),
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* Badge START / FINISH */}
        {(isStart || isEnd) && (
          <div style={{
            position: 'absolute',
            top: 3,
            left: '50%',
            transform: 'translateX(-50%)',
            background: isStart ? cellColor.labelBg : cellColor.labelBg,
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
  };

  const renderHEdge = (row: number, col: number) => {
    // Edge between (row,col) and (row, col+1)
    if (col >= mazeCols - 1) return null;
    const key1 = `${row}-${col}|${row}-${col + 1}`;
    const key2 = `${row}-${col + 1}|${row}-${col}`;
    const edge = edgeMap.get(key1) || edgeMap.get(key2);
    const isCorrect = correctEdgeSet.has(key1) || correctEdgeSet.has(key2);
    const showCorrect = activeTab === 'poster' && isCorrect;
    const ec = showCorrect ? colors.correctEdge : colors.normalEdge;
    const edgeText = edge?.text ?? '';

    return (
      <div
        key={`hedge-${row}-${col}`}
        style={{
          width: EDGE_W,
          height: CELL_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Connector line */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: EDGE_H,
          transform: 'translateY(-50%)',
          background: showCorrect ? colors.correctConnector + '33' : colors.connector + '66',
          border: `1px solid ${showCorrect ? colors.correctConnector : colors.connector}`,
          borderRadius: 4,
        }} />
        {/* Answer badge */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          width: EDGE_BOX_W,
          minHeight: EDGE_BOX_H,
          background: ec.bg,
          border: `1.5px solid ${ec.border}`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px 4px',
          boxShadow: saveInk ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <MathJaxWrapper
            text={edgeText}
            debounceMs={0}
            style={{
              fontSize: calculateDynamicFontSize(edgeText, 9, 7, 11),
              fontWeight: 700,
              color: ec.text,
              textAlign: 'center',
              minHeight: 'unset',
              lineHeight: 1.2,
              width: '100%',
            }}
          />
        </div>
      </div>
    );
  };

  const renderVEdgeRow = (row: number) => {
    // Row of vertical edges between row and row+1
    return (
      <div
        key={`vedge-row-${row}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {Array.from({ length: mazeCols }, (_, col) => {
          const key1 = `${row}-${col}|${row + 1}-${col}`;
          const key2 = `${row + 1}-${col}|${row}-${col}`;
          const edge = edgeMap.get(key1) || edgeMap.get(key2);
          const isCorrect = correctEdgeSet.has(key1) || correctEdgeSet.has(key2);
          const showCorrect = activeTab === 'poster' && isCorrect;
          const ec = showCorrect ? colors.correctEdge : colors.normalEdge;
          const edgeText = edge?.text ?? '';

          const colGapW = col < mazeCols - 1 ? EDGE_W : 0;

          return (
            <React.Fragment key={`vedge-${row}-${col}`}>
              {/* Vertical edge column */}
              <div style={{
                width: CELL_W,
                height: VERT_EDGE_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
              }}>
                {/* Connector bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: VERT_EDGE_W,
                  background: showCorrect ? colors.correctConnector + '33' : colors.connector + '66',
                  border: `1px solid ${showCorrect ? colors.correctConnector : colors.connector}`,
                  borderRadius: 4,
                }} />
                {/* Answer badge */}
                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  width: EDGE_BOX_W,
                  minHeight: EDGE_BOX_H,
                  background: ec.bg,
                  border: `1.5px solid ${ec.border}`,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 4px',
                  boxShadow: saveInk ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  <MathJaxWrapper
                    text={edgeText}
                    debounceMs={0}
                    style={{
                      fontSize: calculateDynamicFontSize(edgeText, 9, 7, 11),
                      fontWeight: 700,
                      color: ec.text,
                      textAlign: 'center',
                      minHeight: 'unset',
                      lineHeight: 1.2,
                      width: '100%',
                    }}
                  />
                </div>
              </div>
              {/* Spacer for horizontal gap between columns */}
              {col < mazeCols - 1 && (
                <div style={{ width: colGapW, height: VERT_EDGE_H, flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full select-none notranslate" translate="no">
      {/* Statistics Header */}
      <div className="no-print mb-4 flex justify-between items-center bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-xs text-slate-600">
        <span className="font-semibold flex items-center gap-1.5">
          🌀 Kiểu Lưới Mê Cung: <b className="text-indigo-600">{mazeRows}x{mazeCols}</b>
          ({mazeRows * mazeCols} ô)
        </span>
        <span className="font-mono bg-[#159BAD] text-white font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles size={11} /> Nạp {Math.min(pairs.length, maze.correctPath.length - 1)} câu hỏi của bạn
        </span>
      </div>

      {/* Printable Worksheet Header for Cutout view */}
      {activeTab === 'cutout' && (
        <div className="w-full bg-white border-2 border-black p-4 mb-4 flex flex-col gap-2.5 font-sans text-black">
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <div>
              <h2 className="text-md font-extrabold uppercase tracking-wide">MÊ CUNG TOÁN HỌC (MATH MAZE)</h2>
              <p className="text-[10px] text-slate-600 mt-0.5">Tìm đường đi đúng bằng cách giải các phép tính và đi qua đáp án chính xác.</p>
            </div>
            <div className="text-right text-[10px] font-bold">Điểm: ............ / 10</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs font-bold pt-1">
            <div>Họ và tên: ......................................................</div>
            <div>Lớp: .......................................</div>
            <div>Ngày: ....../....../ 20...</div>
          </div>
        </div>
      )}

      {/* Maze HTML/CSS Grid */}
      <div
        style={{
          transform: `scale(${pieceSize})`,
          transformOrigin: 'top center',
          display: 'inline-block',
          paddingBottom: 20,
        }}
      >
        {/* Decorative animals (top-right) */}
        {!saveInk && mazeStyle === 'animal_cartoon' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>🦖</span>
          </div>
        )}

        {/* Maze rows */}
        {Array.from({ length: mazeRows }, (_, row) => (
          <React.Fragment key={`maze-row-${row}`}>
            {/* Cell row with horizontal edges */}
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {Array.from({ length: mazeCols }, (_, col) => (
                <React.Fragment key={`cell-group-${row}-${col}`}>
                  {renderCell(row, col)}
                  {col < mazeCols - 1 && renderHEdge(row, col)}
                </React.Fragment>
              ))}
            </div>

            {/* Vertical edge row (between this row and next) */}
            {row < mazeRows - 1 && renderVEdgeRow(row)}
          </React.Fragment>
        ))}

        {/* Decorative animals (bottom-left) */}
        {!saveInk && mazeStyle === 'animal_cartoon' && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}>
            <span style={{ fontSize: 28 }}>🐧</span>
          </div>
        )}
      </div>

      {/* Printable Instructions footer */}
      {activeTab === 'cutout' && (
        <div className="w-full mt-4 p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-[10px] text-slate-500 font-sans text-center no-print">
          💡 <b>Mẹo cho giáo viên:</b> Bản in đen trắng đã được tối ưu độ sắc nét và căn lề sẵn. Giáo viên có thể trực tiếp xuất bản PDF A4 để phát bài tập cho học sinh làm tại lớp.
        </div>
      )}
    </div>
  );
};
