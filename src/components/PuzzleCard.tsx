import React from 'react';
import { LightbulbIcon, SparklesIcon, StarIcon, BookIcon } from './Doodles';
import { MathJaxWrapper } from './MathJaxWrapper';

interface PuzzleProps {
  text: string;
  type: 'question' | 'answer';
  index: number;
  code: string;
  style: 'vibrant' | 'pastel';
  showCode: boolean;
  showIcon: boolean;
  size: number; // base size modifier, usually 1
  isScrambled?: boolean;
  saveInk?: boolean;
}

export const getPuzzleGradients = (index: number, style: 'vibrant' | 'pastel') => {
  const vibrantGradients = [
    { from: '#159BAD', to: '#0B7382', text: '#FFFFFF', accent: '#FFC928' }, // Teal
    { from: '#F54B32', to: '#C92F18', text: '#FFFFFF', accent: '#FFC928' }, // Coral
    { from: '#94BF52', to: '#6D9E2E', text: '#FFFFFF', accent: '#FFC928' }, // Green
    { from: '#FFC928', to: '#DCA008', text: '#2F2A40', accent: '#F54B32' }, // Yellow (dark text)
    { from: '#2F2A40', to: '#1C1929', text: '#FFFFFF', accent: '#FFC928' }, // Navy / Purple
    { from: '#4E87EE', to: '#2461D3', text: '#FFFFFF', accent: '#FFC928' }, // Bright Blue
    { from: '#EC4899', to: '#C026D3', text: '#FFFFFF', accent: '#FFC928' }, // Pink/Magenta
    { from: '#10B981', to: '#047857', text: '#FFFFFF', accent: '#FFC928' }, // Emerald
  ];

  const pastelGradients = [
    { from: '#D4EBF0', to: '#A4D5DF', text: '#1E5863', accent: '#F54B32' }, // Soft Teal
    { from: '#FFDFDB', to: '#FFB8B1', text: '#8D2F23', accent: '#159BAD' }, // Soft Coral
    { from: '#E8F5D8', to: '#CFE8B2', text: '#4C6C22', accent: '#F54B32' }, // Soft Green
    { from: '#FFF7D6', to: '#FFEAB1', text: '#6D5100', accent: '#2F2A40' }, // Soft Yellow
    { from: '#E6E4F0', to: '#CBC8E0', text: '#3E3A5A', accent: '#FFC928' }, // Soft Purple/Navy
    { from: '#E0EBFF', to: '#B3CCFF', text: '#1E3E80', accent: '#F54B32' }, // Soft Blue
    { from: '#FCE7F3', to: '#F9A8D4', text: '#831843', accent: '#159BAD' }, // Soft Pink
    { from: '#D1FAE5', to: '#A7F3D0', text: '#064E3B', accent: '#FFC928' }, // Soft Mint
  ];

  const list = style === 'vibrant' ? vibrantGradients : pastelGradients;
  return list[index % list.length];
};

export const PuzzleCard: React.FC<PuzzleProps> = ({
  text,
  type,
  index,
  code,
  style,
  showCode,
  showIcon,
  size,
  isScrambled = false,
  saveInk = false,
}) => {
  // Compute size. Standard dimension: W=260px, H=130px.
  const baseW = 260;
  const baseH = 130;
  
  const w = baseW * size;
  const h = baseH * size;
  const cy = h / 2;

  const gradient = getPuzzleGradients(index, style);

  // SVG parameters based on size multiplier
  const isQuestion = type === 'question';
  
  // Left piece path generator (Question, out-ward tab on right boundary)
  const getQuestionPath = () => {
    // scale factor
    const s = size;
    return `
      M 0,0
      L ${w},0
      L ${w},${cy - 20 * s}
      C ${w - 2 * s},${cy - 16 * s}  ${w + 10 * s},${cy - 18 * s}  ${w + 12 * s},${cy - 12 * s}
      C ${w + 14 * s},${cy - 6 * s}   ${w + 22 * s},${cy - 10 * s}  ${w + 22 * s},${cy}
      C ${w + 22 * s},${cy + 10 * s}  ${w + 14 * s},${cy + 6 * s}   ${w + 12 * s},${cy + 12 * s}
      C ${w + 10 * s},${cy + 18 * s}  ${w - 2 * s},${cy + 16 * s}  ${w},${cy + 20 * s}
      L ${w},${h}
      L 0,${h}
      Z
    `.replace(/\s+/g, ' ').trim();
  };

  // Right piece path generator (Answer, in-ward blank/socket on left boundary)
  const getAnswerPath = () => {
    const s = size;
    return `
      M 0,0
      L ${w},0
      L ${w},${h}
      L 0,${h}
      L 0,${cy + 20 * s}
      C ${0 - 2 * s},${cy + 16 * s}  ${0 + 10 * s},${cy + 18 * s}  ${0 + 12 * s},${cy + 12 * s}
      C ${0 + 14 * s},${cy + 6 * s}   ${0 + 22 * s},${cy + 10 * s}  ${0 + 22 * s},${cy}
      C ${0 + 22 * s},${cy - 10 * s}  ${0 + 14 * s},${cy - 6 * s}   ${0 + 12 * s},${cy - 12 * s}
      C ${0 + 10 * s},${cy - 18 * s}  ${0 - 2 * s},${cy - 16 * s}  ${0},${cy - 20 * s}
      L 0,0
      Z
    `.replace(/\s+/g, ' ').trim();
  };

  const path = isQuestion ? getQuestionPath() : getAnswerPath();
  
  // Add margin / view bounds to avoid clipping the outward tab for left piece.
  // Left piece needs 30px extra space on the right of SVG.
  // Right piece needs no extra horizontal padding because outer layout has side-by-side overlap.
  const svgW = isQuestion ? w + 24 * size : w;
  const svgH = h;

  // Choose a random-ish cute icon for this index
  const renderCardIcon = () => {
    if (!showIcon) return null;
    const iconSize = 16 * size;
    const iconColor = saveInk ? '#475569' : gradient.accent;
    const iconIndex = (index + (isQuestion ? 0 : 3)) % 4;

    switch (iconIndex) {
      case 0:
        return <StarIcon color={iconColor} size={iconSize} className="opacity-80" />;
      case 1:
        return <LightbulbIcon color={iconColor} size={iconSize} className="opacity-80" />;
      case 2:
        return <SparklesIcon color={iconColor} size={iconSize} className="opacity-80" />;
      default:
        return <BookIcon color={iconColor} size={iconSize} className="opacity-80" />;
    }
  };

  // Linear gradient ID unique to both pieces
  const gradId = `grad-${isQuestion ? 'q' : 'a'}-${index}`;



  return (
    <div
      className="relative select-none transition-transform duration-300 hover:scale-[1.03] active:scale-95 filter drop-shadow-md hover:drop-shadow-xl"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        // In scrambled mode, we don't need interlocking negative margin.
        // In locked side-by-side mode, right piece gets -20px margin-left to slot perfectly under Left piece's tab
        marginLeft: (!isScrambled && !isQuestion) ? `-${20 * size}px` : '0px',
        zIndex: isQuestion ? 20 : 10,
      }}
      id={`puzzle-${isQuestion ? 'q' : 'a'}-${index}`}
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor={gradient.from} />
            <stop offset="100%" stopColor={gradient.to} />
          </linearGradient>
          {/* Soft inner glow / border shadow effect */}
          <filter id={`shadow-${gradId}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Puzzle piece shape */}
        <path
          d={path}
          fill={saveInk ? '#FFFFFF' : `url(#${gradId})`}
          stroke={saveInk ? '#1e293b' : '#FFFFFF'}
          strokeWidth={saveInk ? 2 * size : 3 * size}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={saveInk ? 'none' : `drop-shadow(0px ${2 * size}px ${4 * size}px rgba(0, 0, 0, 0.12))`}
        />

        {/* ForeignObject allows HTML rendering inside SVG path directly, perfect for multi-line wrapping */}
        <foreignObject
          x={isQuestion ? 12 * size : 20 * size}
          y={10 * size}
          width={(w - 32 * size)}
          height={(h - 20 * size)}
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            className="flex flex-col justify-between h-full select-text text-center px-2 py-1 leading-snug"
            style={{ color: saveInk ? '#1e293b' : gradient.text }}
          >
            {/* Top row: piece indicator & code option */}
            <div className="flex justify-between items-center text-[9px] sm:text-[11px] font-sans font-medium tracking-wide opacity-90">
              <span 
                className="uppercase text-[9px] tracking-widest px-2 py-0.5 rounded font-extrabold"
                style={{
                  backgroundColor: saveInk ? '#f1f5f9' : 'rgba(0, 0, 0, 0.1)',
                  color: saveInk ? '#334155' : 'inherit',
                  border: saveInk ? '1px solid #cbd5e1' : 'none'
                }}
              >
                {isQuestion ? 'CÂU HỎI' : 'ĐÁP ÁN'}
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                {renderCardIcon()}
              </div>
            </div>

            {/* Middle row: content text */}
            <div className="flex-grow flex items-center justify-center py-2 w-full">
              <MathJaxWrapper
                text={text}
                className="font-sans font-bold leading-relaxed break-words text-center w-full"
                style={{
                  fontSize: `${Math.max(11, Math.min(18, 14 * size))}px`,
                  textShadow: saveInk ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%'
                }}
              />
            </div>

            {/* Bottom info decoration */}
            <div className="flex justify-center items-center opacity-70 gap-1 text-[8px] tracking-wide uppercase">
              <div className="w-1 h-1 rounded-full bg-current" style={{ color: saveInk ? '#475569' : 'inherit' }} />
              <span style={{ color: saveInk ? '#475569' : 'inherit' }}>{isQuestion ? 'Ghép để giải' : 'Mảnh khớp'}</span>
              <div className="w-1 h-1 rounded-full bg-current" style={{ color: saveInk ? '#475569' : 'inherit' }} />
            </div>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};
