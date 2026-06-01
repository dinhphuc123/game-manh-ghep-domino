import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathJaxWrapperProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  debounceMs?: number; // Thời gian chờ trước khi render lại khi text thay đổi liên tục
}

export const MathJaxWrapper: React.FC<MathJaxWrapperProps> = ({
  text,
  className = '',
  style = {},
  debounceMs = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [displayText, setDisplayText] = useState(text);
  const [scale, setScale] = useState(1.0);

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
    if (!containerRef.current || !innerRef.current) return;

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
  }, [displayText]);

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

  return (
    <div
      ref={containerRef}
      className={`mathjax-wrapper ${className} select-none notranslate`}
      translate="no"
      style={{
        minHeight: '1.2em',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
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
