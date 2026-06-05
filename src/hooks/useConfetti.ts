import { useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiOptions {
  /** Kiểu pháo hoa: 'school' (stars + giấy màu), 'burst' (nổ tại chỗ), 'sides' (từ hai bên) */
  type?: 'school' | 'burst' | 'sides';
  /** Màu sắc tùy chỉnh */
  colors?: string[];
  /** Thời gian hiệu ứng (ms) */
  duration?: number;
}

// Màu sắc mặc định theo theme giáo dục (tươi sáng, vui vẻ)
const EDU_COLORS = [
  '#ff6b6b', // đỏ hồng
  '#ffd93d', // vàng
  '#6bcb77', // xanh lá
  '#4d96ff', // xanh dương
  '#ff6bff', // hồng tím
  '#ffffff', // trắng
  '#ffa94d', // cam
];

/**
 * useConfetti — React hook cho hiệu ứng confetti/pháo hoa
 * Dùng canvas-confetti (3KB, zero-dep)
 *
 * @example
 * const { fireConfetti, fireBurst } = useConfetti();
 *
 * // Khi thắng game:
 * fireConfetti({ type: 'school', duration: 4000 });
 *
 * // Khi ghép đúng 1 mảnh:
 * fireBurst(x, y); // tọa độ viewport
 */
export const useConfetti = () => {
  const animFrameRef = useRef<number | null>(null);

  /**
   * Pháo hoa toàn màn hình — dùng khi thắng game
   */
  const fireConfetti = useCallback(({
    type = 'school',
    colors = EDU_COLORS,
    duration = 4000,
  }: ConfettiOptions = {}) => {
    if (type === 'school') {
      // Kiểu 1: Bắn từ hai bên + stars
      const end = Date.now() + duration;

      const frame = () => {
        // Bên trái
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
          shapes: ['star', 'circle', 'square'],
          scalar: 1.2,
        });

        // Bên phải
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
          shapes: ['star', 'circle', 'square'],
          scalar: 1.2,
        });

        if (Date.now() < end) {
          animFrameRef.current = requestAnimationFrame(frame);
        }
      };

      animFrameRef.current = requestAnimationFrame(frame);

    } else if (type === 'burst') {
      // Kiểu 2: Nổ lớn từ giữa
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
        colors,
        shapes: ['star', 'circle'],
        scalar: 1.5,
        ticks: 300,
      });

    } else if (type === 'sides') {
      // Kiểu 3: Hai bên cùng lúc
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 70,
        origin: { x: 0 },
        colors,
        scalar: 1.0,
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 70,
        origin: { x: 1 },
        colors,
        scalar: 1.0,
      });
    }
  }, []);

  /**
   * Particle burst nhỏ tại điểm cụ thể — dùng khi snap đúng 1 mảnh
   * @param x - viewport X (0-1)
   * @param y - viewport Y (0-1)
   */
  const fireBurst = useCallback((x: number = 0.5, y: number = 0.5) => {
    confetti({
      particleCount: 20,
      spread: 45,
      origin: { x, y },
      colors: ['#6bcb77', '#ffd93d', '#4d96ff'],
      shapes: ['circle'],
      scalar: 0.7,
      ticks: 80,
      startVelocity: 15,
      gravity: 1.2,
    });
  }, []);

  /**
   * Dừng hiệu ứng đang chạy
   */
  const stopConfetti = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    confetti.reset();
  }, []);

  return { fireConfetti, fireBurst, stopConfetti };
};
