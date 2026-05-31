import React, { useMemo } from 'react';
import { Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
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
}

export const MathMazeView: React.FC<MathMazeViewProps> = ({
  pairs,
  style,
  mazeRows,
  mazeCols,
  mazeStyle,
  saveInk,
  pieceSize,
  activeTab,
}) => {
  const cellW = 125;
  const cellH = 95;
  const gapX = 75;
  const gapY = 70;
  
  const strideX = cellW + gapX;
  const strideY = cellH + gapY;
  const padding = 60; // Extra room for cartoon animals or headers

  // 1. Generate Maze Data
  const maze = useMemo(() => {
    // Creating fake settings object for utility
    const settings = {
      title: '', subject: '', gradeClass: '', teacherName: '',
      style, showMatchCode: false, showDoodleIcons: true,
      activityType: 'Luyện tập' as any, columns: 2, pieceSize: 1, saveInk,
      puzzleType: 'math_maze' as any, tarsiaShape: 'triangle_16' as any,
      numberShape: '', numberScaleX: 1, numberScaleY: 1,
      dominoShape: '', dominoWidth: 1, dominoHeight: 1,
      mazeRows, mazeCols, mazeStyle
    };
    return generateMazeData(pairs, settings);
  }, [pairs, mazeRows, mazeCols, mazeStyle, style, saveInk]);

  // Compute SVG dimensions
  const svgWidth = mazeCols * strideX - gapX + padding * 2;
  const svgHeight = mazeRows * strideY - gapY + padding * 2;

  // Helper to get coordinates of a cell's center
  const getCellCoords = (r: number, c: number) => {
    return {
      x: c * strideX + cellW / 2 + padding,
      y: r * strideY + cellH / 2 + padding
    };
  };

  // 2. Color Palette Styling
  const colors = useMemo(() => {
    const isVibrant = style === 'vibrant';
    return {
      startCell: isVibrant 
        ? { fill: '#fef3c7', stroke: '#d97706', text: '#78350f', label: '#b45309' }
        : { fill: '#fafaf9', stroke: '#78716c', text: '#292524', label: '#78716c' },
      endCell: isVibrant
        ? { fill: '#ecfdf5', stroke: '#10b981', text: '#065f46', label: '#047857' }
        : { fill: '#f4f4f5', stroke: '#71717a', text: '#18181b', label: '#71717a' },
      normalCell: isVibrant
        ? { fill: '#eff6ff', stroke: '#3b82f6', text: '#1e3a8a' }
        : { fill: '#ffffff', stroke: '#e4e4e7', text: '#09090b' },
      edgeCorrect: '#10b981',
      edgeNormal: isVibrant ? '#cbd5e1' : '#e4e4e7',
      textNormal: '#334155',
    };
  }, [style]);

  return (
    <div className="w-full select-none notranslate" translate="no">
      {/* Statistics Header (Teacher View only) */}
      <div className="no-print mb-4 flex justify-between items-center bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-xs text-slate-600">
        <span className="font-semibold flex items-center gap-1.5">
          🌀 Kiểu Lưới Mê Cung: <b className="text-indigo-600">{mazeRows}x{mazeCols}</b>
          ({mazeRows * mazeCols} ô)
        </span>
        <span className="font-mono bg-[#159BAD] text-white font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles size={11} /> Nạp {Math.min(pairs.length, maze.correctPath.length - 1)} câu hỏi của bạn
        </span>
      </div>

      {pairs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <span className="text-5xl text-slate-300 block mb-3">🌀</span>
          <p className="text-xs text-slate-400 font-bold block">Hãy nhập hoặc nạp câu hỏi để tạo mê cung toán học!</p>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          
          {/* Printable Worksheet Header for Cutout view */}
          {activeTab === 'cutout' && (
            <div className="w-full max-w-[800px] bg-white border-2 border-black p-4 mb-4 flex flex-col gap-2.5 font-sans text-black">
              <div className="flex justify-between items-center border-b-2 border-black pb-2">
                <div>
                  <h2 className="text-md font-extrabold uppercase tracking-wide">MÊ CUNG TOÁN HỌC (MATH MAZE)</h2>
                  <p className="text-[10px] text-slate-600 mt-0.5">Tìm đường đi đúng bằng cách giải các phép tính và đi qua đáp án chính xác.</p>
                </div>
                <div className="text-right text-[10px] font-bold">
                  Điểm: ............ / 10
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs font-bold pt-1">
                <div>Họ và tên: ......................................................</div>
                <div>Lớp: .......................................</div>
                <div>Ngày: ....../....../ 20...</div>
              </div>
            </div>
          )}

          {/* Maze Canvas wrapper */}
          <div 
            className="relative w-full mx-auto flex items-center justify-center overflow-auto custom-scroll"
            style={{
              transform: `scale(${pieceSize})`,
              transformOrigin: 'top center',
              paddingTop: '10px',
              paddingBottom: '20px',
              height: `${svgHeight * pieceSize + 10}px`,
            }}
          >
            <svg
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="mx-auto"
              style={{ background: saveInk ? '#ffffff' : 'transparent' }}
            >
              
              {/* 1. DRAW EDGES / CONNECTORS (Underneath cells) */}
              {maze.edges.map((edge) => {
                const coordsA = getCellCoords(edge.rowA, edge.colA);
                const coordsB = getCellCoords(edge.rowB, edge.colB);

                const isHorizontal = edge.rowA === edge.rowB;
                const midX = (coordsA.x + coordsB.x) / 2;
                const midY = (coordsA.y + coordsB.y) / 2;

                const pipeWidth = 22; // Thickness of the path tube
                
                // Color configuration
                const isCorrectSolution = edge.isCorrectPath && activeTab === 'poster';
                const strokeColor = saveInk 
                  ? '#000000' 
                  : (isCorrectSolution ? colors.edgeCorrect : '#94a3b8');
                const strokeW = saveInk ? 1.5 : (isCorrectSolution ? 3.0 : 1.8);
                const fillClr = saveInk 
                  ? '#ffffff' 
                  : (isCorrectSolution ? '#e8f5e9' : '#f8fafc');

                return (
                  <g key={edge.id}>
                    {/* Connective tube path */}
                    {isHorizontal ? (
                      <rect
                        x={coordsA.x + cellW / 2 - 4}
                        y={coordsA.y - pipeWidth / 2}
                        width={gapX + 8}
                        height={pipeWidth}
                        fill={fillClr}
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        rx="4"
                        ry="4"
                      />
                    ) : (
                      <rect
                        x={coordsA.x - pipeWidth / 2}
                        y={coordsA.y + cellH / 2 - 4}
                        width={pipeWidth}
                        height={gapY + 8}
                        fill={fillClr}
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        rx="4"
                        ry="4"
                      />
                    )}

                    {/* Edge Value Text (The Answer) */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      {/* Text Background box to make it readable */}
                      <rect
                        x="-20"
                        y="-10"
                        width="40"
                        height="20"
                        fill="#ffffff"
                        rx="6"
                        ry="6"
                        stroke={saveInk ? '#000000' : (isCorrectSolution ? colors.edgeCorrect : '#e2e8f0')}
                        strokeWidth={saveInk ? 1 : 1.5}
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        className="font-sans font-extrabold select-none notranslate"
                        translate="no"
                        fill={isCorrectSolution ? '#0f766e' : '#1e293b'}
                        style={{ fontSize: '9px' }}
                      >
                        {edge.text}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 2. DRAW SOLUTIONS LINE (For teacher reference only) */}
              {activeTab === 'poster' && !saveInk && (
                <path
                  d={maze.correctPath.map((p, idx) => {
                    const coords = getCellCoords(p.row, p.col);
                    return `${idx === 0 ? 'M' : 'L'} ${coords.x} ${coords.y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.75"
                />
              )}

              {/* 3. DRAW CELLS */}
              {maze.cells.map((rowCells) =>
                rowCells.map((cell) => {
                  const coords = getCellCoords(cell.row, cell.col);
                  
                  const isStart = cell.row === 0 && cell.col === 0;
                  const isEnd = cell.row === mazeRows - 1 && cell.col === mazeCols - 1;
                  
                  let cellColors = colors.normalCell;
                  if (isStart) cellColors = colors.startCell;
                  else if (isEnd) cellColors = colors.endCell;

                  const strokeColor = saveInk ? '#000000' : cellColors.stroke;
                  const strokeW = saveInk ? 1.8 : 2.5;
                  const fillClr = saveInk ? '#ffffff' : cellColors.fill;

                  return (
                    <g key={`cell-${cell.row}-${cell.col}`}>
                      {/* Main Cell Block */}
                      <rect
                        x={coords.x - cellW / 2}
                        y={coords.y - cellH / 2}
                        width={cellW}
                        height={cellH}
                        rx="16"
                        ry="16"
                        fill={fillClr}
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        filter={saveInk ? undefined : 'drop-shadow(0 2px 4px rgba(0,0,0,0.02))'}
                      />

                      {/* Header Badge (Start/End flag labels) */}
                      {isStart && (
                        <g transform={`translate(${coords.x}, ${coords.y - cellH / 2 + 1})`}>
                          <rect x="-24" y="-8" width="48" height="13" rx="4" fill={saveInk ? '#ffffff' : '#f59e0b'} stroke={saveInk ? '#000000' : 'none'} strokeWidth={0.8} />
                          <text x="0" y="1" textAnchor="middle" className="font-sans font-black uppercase text-[8px]" fill={saveInk ? '#000000' : '#ffffff'}>
                            START
                          </text>
                        </g>
                      )}
                      
                      {isEnd && (
                        <g transform={`translate(${coords.x}, ${coords.y - cellH / 2 + 1})`}>
                          <rect x="-24" y="-8" width="48" height="13" rx="4" fill={saveInk ? '#ffffff' : '#10b981'} stroke={saveInk ? '#000000' : 'none'} strokeWidth={0.8} />
                          <text x="0" y="1" textAnchor="middle" className="font-sans font-black uppercase text-[8px]" fill={saveInk ? '#000000' : '#ffffff'}>
                            FINISH!
                          </text>
                        </g>
                      )}

                      {/* Cell Content (Math Formula Wrapper) */}
                      <foreignObject
                        x={coords.x - cellW / 2 + 6}
                        y={coords.y - cellH / 2 + 14}
                        width={cellW - 12}
                        height={cellH - 24}
                      >
                        <div
                          xmlns="http://www.w3.org/1999/xhtml"
                          className="flex flex-col justify-center items-center h-full text-center leading-[1.2] select-none px-1"
                          style={{
                            color: isStart ? cellColors.text : (isEnd ? cellColors.text : '#1e293b'),
                            fontFamily: '"Inter", sans-serif',
                          }}
                        >
                          <MathJaxWrapper
                            text={cell.question}
                            className="font-bold text-center w-full"
                            style={{
                              fontSize: `${calculateDynamicFontSize(
                                cell.question,
                                12,
                                9,
                                16
                              )}px`,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              minHeight: '1.2em'
                            }}
                          />
                        </div>
                      </foreignObject>
                    </g>
                  );
                })
              )}

              {/* 4. CARTOON ANIMAL DECORATIONS (If style is active and not saveInk) */}
              {!saveInk && mazeStyle === 'animal_cartoon' && (
                <>
                  {/* Left bottom penguin or dragon sticker */}
                  <g transform={`translate(${padding - 20}, ${svgHeight - padding + 10})`}>
                    <circle cx="0" cy="0" r="18" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="0" y="5.5" textAnchor="middle" className="text-lg">🐧</text>
                  </g>
                  {/* Right top dinosaur or dragon sticker */}
                  <g transform={`translate(${svgWidth - padding + 20}, ${padding - 15})`}>
                    <circle cx="0" cy="0" r="18" fill="#dcfce7" stroke="#4ade80" strokeWidth="1.5" />
                    <text x="0" y="5.5" textAnchor="middle" className="text-lg">🦖</text>
                  </g>
                </>
              )}
            </svg>
          </div>
          
          {/* Printable Instructions footer */}
          {activeTab === 'cutout' && (
            <div className="w-full max-w-[800px] mt-4 p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-[10px] text-slate-500 font-sans text-center no-print">
              💡 <b>Mẹo cho giáo viên:</b> Bản in đen trắng đã được tối ưu độ sắc nét và căn lề sẵn. Giáo viên có thể trực tiếp xuất bản PDF A4 để phát bài tập cho học sinh làm tại lớp.
            </div>
          )}

        </div>
      )}
    </div>
  );
};
