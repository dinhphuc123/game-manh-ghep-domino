import React, { useMemo } from 'react';
import { Scissors } from 'lucide-react';
import { PuzzlePair, ThemeStyle } from '../types';
import { MathJaxWrapper, calculateDynamicFontSize } from './MathJaxWrapper';

interface DominoPiece {
  id: number;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  digitIndex: number;
}

interface DominoViewProps {
  pairs: PuzzlePair[];
  style: ThemeStyle;
  showDoodleIcons: boolean;
  saveInk: boolean;
  pieceSize: number;
  activeTab: 'poster' | 'cutout';
  dominoShape: string;
  dominoWidth: number;
  dominoHeight: number;
  // ── Typography ───────────────────────────────────────────────────────────────
  fontSize?: number;
  fontFamily?: string;
  // ── Inline Editing ──────────────────────────────────────────────────────────
  isEditable?: boolean;
  onSave?: (pairId: string, field: 'question' | 'answer', newValue: string) => void;
}

// Predefined layouts for digits 0-9
export const DIGIT_LAYOUTS: { [key: string]: Omit<DominoPiece, 'id' | 'digitIndex'>[] } = {
  '0': [
    { x: 100, y: 50, rotation: 0 },
    { x: 200, y: 120, rotation: 90 },
    { x: 200, y: 240, rotation: 90 },
    { x: 200, y: 360, rotation: 90 },
    { x: 130, y: 430, rotation: 180 },
    { x: 30, y: 360, rotation: 270 },
    { x: 30, y: 240, rotation: 270 },
    { x: 30, y: 120, rotation: 270 },
  ],
  '1': [
    { x: 65, y: 90, rotation: 45 },
    { x: 110, y: 120, rotation: 90 },
    { x: 110, y: 240, rotation: 90 },
    { x: 110, y: 360, rotation: 90 },
    { x: 110, y: 450, rotation: 0 },
  ],
  '2': [
    { x: 50, y: 70, rotation: 0 },
    { x: 150, y: 100, rotation: 90 },
    { x: 130, y: 200, rotation: 135 },
    { x: 70, y: 290, rotation: 135 },
    { x: 50, y: 380, rotation: 90 },
    { x: 110, y: 440, rotation: 0 },
    { x: 210, y: 440, rotation: 0 },
  ],
  '3': [
    { x: 60, y: 60, rotation: 0 },
    { x: 160, y: 110, rotation: 90 },
    { x: 130, y: 210, rotation: 180 },
    { x: 160, y: 300, rotation: 90 },
    { x: 160, y: 400, rotation: 90 },
    { x: 80, y: 450, rotation: 180 },
  ],
  '4': [
    { x: 40, y: 110, rotation: 90 },
    { x: 40, y: 230, rotation: 90 },
    { x: 90, y: 280, rotation: 0 },
    { x: 190, y: 280, rotation: 0 },
    { x: 160, y: 160, rotation: 90 },
    { x: 160, y: 370, rotation: 90 },
  ],
  '5': [
    { x: 150, y: 60, rotation: 180 },
    { x: 50, y: 120, rotation: 90 },
    { x: 100, y: 200, rotation: 0 },
    { x: 180, y: 270, rotation: 90 },
    { x: 180, y: 380, rotation: 90 },
    { x: 90, y: 440, rotation: 180 },
  ],
  '6': [
    { x: 130, y: 60, rotation: 180 },
    { x: 50, y: 120, rotation: 90 },
    { x: 50, y: 240, rotation: 90 },
    { x: 50, y: 360, rotation: 90 },
    { x: 120, y: 420, rotation: 0 },
    { x: 190, y: 350, rotation: 270 },
    { x: 140, y: 280, rotation: 180 },
  ],
  '7': [
    { x: 60, y: 60, rotation: 0 },
    { x: 160, y: 60, rotation: 0 },
    { x: 190, y: 150, rotation: 90 },
    { x: 150, y: 260, rotation: 120 },
    { x: 100, y: 370, rotation: 120 },
    { x: 60, y: 460, rotation: 90 },
  ],
  '8': [
    { x: 100, y: 50, rotation: 0 },
    { x: 170, y: 120, rotation: 90 },
    { x: 100, y: 200, rotation: 180 },
    { x: 30, y: 120, rotation: 270 },
    { x: 170, y: 300, rotation: 90 },
    { x: 170, y: 410, rotation: 90 },
    { x: 100, y: 470, rotation: 180 },
    { x: 30, y: 410, rotation: 270 },
    { x: 30, y: 300, rotation: 270 },
  ],
  '9': [
    { x: 100, y: 50, rotation: 0 },
    { x: 170, y: 120, rotation: 90 },
    { x: 170, y: 240, rotation: 90 },
    { x: 100, y: 300, rotation: 180 },
    { x: 30, y: 200, rotation: 270 },
    { x: 30, y: 90, rotation: 270 },
    { x: 170, y: 360, rotation: 90 },
    { x: 110, y: 430, rotation: 180 },
  ],
};

export const DominoView: React.FC<DominoViewProps> = ({
  pairs,
  style,
  showDoodleIcons,
  saveInk,
  pieceSize,
  activeTab,
  dominoShape,
  dominoWidth,
  dominoHeight,
  fontSize,
  fontFamily,
  isEditable = false,
  onSave,
}) => {

  // Build the list of active pieces based on the input digits - auto-count from layout
  const layoutData = useMemo(() => {
    const digits = (dominoShape || '26').replace(/\s/g, '').split('');
    const piecesList: DominoPiece[] = [];
    let currentOffset = 50;
    let globalId = 0;

    digits.forEach((digit, dIdx) => {
      const rawLayout = DIGIT_LAYOUTS[digit] || DIGIT_LAYOUTS['2'];
      rawLayout.forEach((raw) => {
        piecesList.push({
          id: globalId++,
          x: raw.x + currentOffset,
          y: raw.y,
          rotation: raw.rotation,
          digitIndex: dIdx,
        });
      });
      currentOffset += 260; // Safe offset spacing between digits
    });

    // Auto-computed count = total pieces in the shape layout
    const dominoPiecesCount = piecesList.length;

    let pieces = [...piecesList];

    // Recalculate max bounding width and height dynamically based on coordinates
    let maxX = 0;
    let maxY = 0;
    pieces.forEach(p => {
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });

    return { 
      pieces, 
      dominoPiecesCount,
      width: Math.max(maxX + dominoWidth + 50, currentOffset + 50), 
      height: Math.max(maxY + dominoHeight + 100, 600) 
    };
  }, [dominoShape, dominoWidth, dominoHeight]);

  const mappedPieces = useMemo(() => {
    const pieces = layoutData.pieces;
    const totalPieces = pieces.length;

    return pieces.map((piece, index) => {
      let leftText = '';
      let rightText = '';
      let hasLeft = false;
      let hasRight = false;
      let leftPairId: string | undefined;
      let leftField: 'question' | 'answer' | undefined;
      let rightPairId: string | undefined;
      let rightField: 'question' | 'answer' | undefined;

      // Start Piece
      if (index === 0) {
        leftText = 'START';
        hasLeft = true;
        
        if (pairs.length > 0) {
          rightText = pairs[0].question;
          rightPairId = pairs[0].id;
          rightField = 'question';
          hasRight = true;
        }
      } 
      // End Piece
      else if (index === totalPieces - 1) {
        if (index - 1 < pairs.length) {
          leftText = pairs[index - 1].answer;
          leftPairId = pairs[index - 1].id;
          leftField = 'answer';
          hasLeft = true;
        }
        rightText = 'END';
        hasRight = true;
      } 
      // Intermediate Pieces
      else {
        if (index - 1 < pairs.length) {
          leftText = pairs[index - 1].answer;
          leftPairId = pairs[index - 1].id;
          leftField = 'answer';
          hasLeft = true;
        }
        if (index < pairs.length) {
          rightText = pairs[index].question;
          rightPairId = pairs[index].id;
          rightField = 'question';
          hasRight = true;
        }
      }

      return {
        ...piece,
        leftText,
        rightText,
        hasLeft,
        hasRight,
        leftPairId,
        leftField,
        rightPairId,
        rightField,
      };
    });
  }, [layoutData.pieces, pairs]);

  // Colors mapping for Domino style
  const colors = useMemo(() => {
    if (saveInk) {
      return {
        fill: '#ffffff',
        stroke: '#1e293b',
        text: '#0f172a',
        midLine: '#64748b',
        base: 'rgba(0,0,0,0.02)',
      };
    }
    if (style === 'vibrant') {
      return {
        fill: '#f0fdf4',
        stroke: '#16a34a',
        text: '#14532d',
        midLine: '#22c55e',
        base: 'rgba(22, 163, 74, 0.06)',
      };
    }
    // Pastel Style
    return {
      fill: '#fafaf9',
      stroke: '#78716c',
      text: '#44403c',
      midLine: '#a8a29e',
      base: 'rgba(120, 113, 108, 0.04)',
    };
  }, [style, saveInk]);

  // Render a single domino piece inside its local coordinate space
  const renderSingleDomino = (piece: typeof mappedPieces[0]) => {
    const w = dominoWidth;
    const h = dominoHeight;

    return (
      <g transform={`rotate(${piece.rotation})`}>
        {/* Domino outer border */}
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx="10"
          ry="10"
          fill={saveInk ? '#ffffff' : colors.fill}
          stroke={saveInk ? '#000000' : colors.stroke}
          strokeWidth={saveInk ? 1.5 : 2.5}
        />

        {/* Vertical divider dashed line in the center */}
        <line
          x1="0"
          y1={-h / 2 + 3}
          x2="0"
          y2={h / 2 - 3}
          stroke={saveInk ? '#000000' : colors.midLine}
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />

        {/* Decorative corner dots if enabled */}
        {!saveInk && showDoodleIcons && (
          <>
            <circle cx={-w / 2 + 10} cy={-h / 2 + 10} r="2.5" fill={colors.stroke} className="opacity-20" />
            <circle cx={w / 2 - 10} cy={h / 2 - 10} r="2.5" fill={colors.stroke} className="opacity-20" />
          </>
        )}

        {/* Piece ID stamp */}
        <rect
          x="-15"
          y={-h / 2 + 2}
          width="30"
          height="12"
          rx="3"
          fill={saveInk ? '#f1f5f9' : colors.base}
          stroke={saveInk ? '#cbd5e1' : 'rgba(0,0,0,0.06)'}
          strokeWidth="0.8"
        />
        <text
          x="0"
          y={-h / 2 + 11}
          textAnchor="middle"
          className="font-mono text-[8px] font-extrabold"
          fill={saveInk ? '#475569' : colors.text}
        >
          #{piece.id + 1}
        </text>

        {/* Left Half (Answer / START) */}
        {(() => {
          const foW = Math.max(48, w / 2 - 36);
          const foH = Math.max(32, h - 36);
          return (
            <g transform={`translate(${-w / 4}, 4)`}>
              {piece.hasLeft && (
                <foreignObject x={-foW / 2} y={-foH / 2} width={foW} height={foH}>
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-none notranslate px-0.5"
                    translate="no"
                    style={{
                      color: saveInk ? '#000000' : colors.text,
                      fontFamily: fontFamily || '"Inter", sans-serif',
                    }}
                  >
                    <MathJaxWrapper
                      text={piece.leftText}
                      className="font-bold text-center w-full"
                      style={{
                        fontSize: piece.leftText === 'START' ? '12px' : fontSize ? `${fontSize}px` : `${calculateDynamicFontSize(piece.leftText, 9, 6.5, 12.5)}px`,
                        color: piece.leftText === 'START' ? '#dc2626' : (saveInk ? '#000000' : colors.text),
                        fontWeight: 'extrabold',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '1.2em',
                      }}
                      isEditable={isEditable && piece.leftText !== 'START' && !!piece.leftPairId}
                      pairId={piece.leftPairId}
                      field={piece.leftField}
                      onSave={onSave}
                    />
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })()}

        {/* Right Half (Question / END) */}
        {(() => {
          const foW = Math.max(48, w / 2 - 36);
          const foH = Math.max(32, h - 36);
          return (
            <g transform={`translate(${w / 4}, 4)`}>
              {piece.hasRight && (
                <foreignObject x={-foW / 2} y={-foH / 2} width={foW} height={foH}>
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-none notranslate px-0.5"
                    translate="no"
                    style={{
                      color: saveInk ? '#000000' : colors.text,
                      fontFamily: fontFamily || '"Inter", sans-serif',
                    }}
                  >
                    <MathJaxWrapper
                      text={piece.rightText}
                      className="font-bold text-center w-full"
                      style={{
                        fontSize: piece.rightText === 'END' ? '12px' : fontSize ? `${fontSize}px` : `${calculateDynamicFontSize(piece.rightText, 9, 6.5, 12.5)}px`,
                        color: piece.rightText === 'END' ? '#dc2626' : (saveInk ? '#000000' : colors.text),
                        fontWeight: 'extrabold',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '1.2em',
                      }}
                      isEditable={isEditable && piece.rightText !== 'END' && !!piece.rightPairId}
                      pairId={piece.rightPairId}
                      field={piece.rightField}
                      onSave={onSave}
                    />
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })()}
      </g>
    );
  };

  return (
    <div className="w-full">
      {/* Dynamic Statistics Badge */}
      <div className="no-print mb-4 flex justify-between items-center bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-xs text-slate-600">
        <span className="font-semibold flex items-center gap-1">
          🀄 Kiểu Domino: Xếp chuỗi hình số "{dominoShape || '26'}" ({dominoWidth}x{dominoHeight}px)
        </span>
        <span className="font-mono bg-[#16a34a] text-white font-extrabold px-2.5 py-0.5 rounded-full">
          Cần {layoutData.pieces.length} quân ({Math.min(pairs.length, layoutData.pieces.length - 1)} cặp Q-A, {Math.max(0, layoutData.pieces.length - 1 - pairs.length)} quân trống)
        </span>
      </div>

      {pairs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <span className="text-5xl text-slate-300 block mb-3">🀄</span>
          <p className="text-xs text-slate-400 font-bold block">Hãy nạp hoặc thêm danh sách câu hỏi để tự động sinh thiết kế!</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: INTEGRATED POSTER DESIGN */}
          {activeTab === 'poster' ? (
            <div
              className="relative w-full mx-auto flex items-center justify-center overflow-auto custom-scroll"
              style={{
                transform: `scale(${pieceSize})`,
                transformOrigin: 'top center',
                paddingTop: '20px',
                paddingBottom: '20px',
                height: `${layoutData.height * pieceSize + 10}px`,
              }}
            >
              <svg
                width={layoutData.width}
                height={layoutData.height}
                viewBox={`0 0 ${layoutData.width} ${layoutData.height}`}
                className="mx-auto"
              >
                {mappedPieces.map((piece) => (
                  <g key={`poster-domino-${piece.id}`} transform={`translate(${piece.x}, ${piece.y})`}>
                    {renderSingleDomino(piece)}
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            /* TAB 2: PRINT CUTOUT SHEETS - Nền trắng tinh, viền đen nét liền sắc nét */
            <div className="w-full">
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl text-center mb-6 no-print">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1 font-bold">
                  ✂️ Bản In Cắt Tối Giản: Cắt rời các quân Domino theo viền ngoài màu đen nét liền. Các bạn học sinh sẽ xếp nối đuôi nhau từ START đến END tạo thành hình chữ số!
                </p>
              </div>

              {/* Grid representation of individual domino pieces */}
              <div
                className="flex flex-wrap gap-y-12 gap-x-8 justify-center items-center"
                style={{
                  transform: `scale(${pieceSize})`,
                  transformOrigin: 'top center',
                }}
              >
                {mappedPieces.map((piece) => (
                  <div
                    key={`cutout-domino-${piece.id}`}
                    className="relative flex flex-col items-center justify-center min-h-[140px] w-[220px] bg-white"
                  >
                    {/* Corner Scissor Guideline stamp */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 border border-slate-300 text-slate-500 z-10 shadow-sm" title="Đường cắt dọc">
                      <Scissors size={11} className="rotate-45" />
                    </div>

                    <span className="absolute bottom-1 right-2 text-[8px] font-bold text-slate-400 font-mono tracking-widest bg-white px-1.5 rounded-full">
                      DOMINO #{piece.id + 1}
                    </span>

                    {/* Domino SVG card on white background */}
                    <svg
                      width={dominoWidth + 20}
                      height={dominoHeight + 20}
                      viewBox={`-${dominoWidth/2 + 10} -${dominoHeight/2 + 10} ${dominoWidth + 20} ${dominoHeight + 20}`}
                      className="overflow-visible"
                    >
                      {/* For print layout, always render with rotation = 0 so they print straight */}
                      {renderSingleDomino({ ...piece, rotation: 0 })}
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
