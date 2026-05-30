import React, { useEffect, useRef, useState } from 'react';

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
  const [displayText, setDisplayText] = useState(text);

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

  // Kích hoạt render MathJax chỉ trên phần tử cục bộ này
  useEffect(() => {
    const renderMath = async () => {
      const MathJax = (window as any).MathJax;
      if (MathJax && MathJax.typesetPromise && containerRef.current) {
        try {
          // Tránh gọi render toàn trang, chỉ typeset chính phần tử này
          await MathJax.typesetPromise([containerRef.current]);
        } catch (err) {
          console.warn('MathJax local typesetting error:', err);
        }
      }
    };

    renderMath();
  }, [displayText]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        minHeight: '1.2em',
        wordBreak: 'break-word',
        ...style,
      }}
    >
      {displayText}
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
  
  // Xóa các ký tự định dạng LaTeX phổ biến để ước lượng chiều dài hiển thị thực tế
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

