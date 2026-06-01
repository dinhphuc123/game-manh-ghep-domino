import React from 'react';
import { GameSettings } from '../../types';
import { MathJaxWrapper, calculateDynamicFontSize } from '../MathJaxWrapper';

interface PlayablePiece {
  id: string;
  type: string;
  text: string;
  code: string;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  isSnapped: boolean;
  tarsiaTriangleId?: number;
  tarsiaSides?: any[];
  tarsiaIsPointingUp?: boolean;
  tarsiaRotation?: number;
  tarsiaTargetRotation?: number;
}

interface PlayTarsiaBoardProps {
  pieces: PlayablePiece[];
  settings: GameSettings;
  boardSize: { w: number; h: number; offsetX?: number; offsetY?: number };
  activeDraggingId: string | null;
  scaleFactor: number;
  handlePointerDown: (e: React.PointerEvent, id: string) => void;
  handlePointerMove: (e: React.PointerEvent, id: string) => void;
  handlePointerUp: (e: React.PointerEvent, id: string) => void;
}

export const PlayTarsiaBoard: React.FC<PlayTarsiaBoardProps> = ({
  pieces,
  settings,
  boardSize,
  activeDraggingId,
  scaleFactor,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
}) => {
  const renderTarsiaPiece = (piece: PlayablePiece, customScale = 0.95, overrideRot = 0) => {
    const s = 170 * customScale;
    const h = (170 * Math.sqrt(3) / 2) * customScale;
    const rotVal = overrideRot !== 0 ? overrideRot : (piece.tarsiaRotation || 0);

    const innerV_up = [
      { x: 0, y: -h * 2 / 3 },
      { x: s / 2, y: h / 3 },
      { x: -s / 2, y: h / 3 },
    ];

    const vibrantClrs = piece.tarsiaIsPointingUp 
      ? { fill: '#ecfdf5', stroke: '#10b981', text: '#065f46', base: 'rgba(16, 185, 129, 0.08)' } 
      : { fill: '#eff6ff', stroke: '#3b82f6', text: '#1e3a8a', base: 'rgba(59, 130, 246, 0.08)' };
    const colors = settings?.style === 'vibrant' ? vibrantClrs : { fill: '#f8fafc', stroke: '#64748b', text: '#0f172a', base: 'rgba(100, 116, 139, 0.05)' };

    const labelConfigs = [
      { angle: 60, tx: s * 0.17, ty: -h * 0.07, width: s * 0.76, height: 32 },
      { angle: 180, tx: 0, ty: h / 3 - 22, width: s - 20, height: 32 },
      { angle: -60, tx: -s * 0.17, ty: -h * 0.07, width: s * 0.76, height: 32 }
    ];

    if (settings?.tarsiaShape === 'hexagon_core' && piece.tarsiaTriangleId === 0) {
      const hexPoints = Array.from({ length: 6 }).map((_, i) => {
        const theta = (i * Math.PI) / 3;
        return {
          x: s * Math.cos(theta),
          y: s * Math.sin(theta)
        };
      });

      const strokeColor = settings?.saveInk ? '#1e293b' : colors.stroke;

      return (
        <g transform={`rotate(${rotVal})`}>
          <polygon
            points={hexPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill={settings?.saveInk ? '#ffffff' : colors.fill}
            stroke={strokeColor}
            strokeWidth={settings?.saveInk ? 1.5 : 2.5}
            strokeLinejoin="round"
          />
          <circle cx="0" cy="0" r="18" fill={settings?.saveInk ? '#f1f5f9' : colors.base} stroke={settings?.saveInk ? '#cbd5e1' : strokeColor} strokeWidth={1} />
          <text x="0" y="3.5" textAnchor="middle" className="font-mono text-[9px] font-extrabold" fill={settings?.saveInk ? '#475569' : colors.text}>
            ⬢LỤC GIÁC
          </text>
          {piece.tarsiaSides?.map((side, k) => {
            if (!side) return null;
            const angleDeg = k * 60 + 30;
            const angleRad = (angleDeg * Math.PI) / 180;
            const rIn = (s * Math.sqrt(3)) / 2;
            const tx = (rIn - 20) * Math.cos(angleRad);
            const ty = (rIn - 20) * Math.sin(angleRad);
            const width = s - 25;
            const height = 40;
            const textRot = angleDeg + 180;

            return (
              <g key={`hex-playable-side-${k}`} transform={`translate(${tx}, ${ty}) rotate(${textRot})`}>
                <foreignObject x={-width / 2} y={-height / 2} width={width} height={height}>
                  <div xmlns="http://www.w3.org/1999/xhtml" className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-none notranslate px-1" translate="no" style={{ color: settings?.saveInk ? '#1e293b' : colors.text, fontFamily: '"Inter", sans-serif' }}>
                    <MathJaxWrapper text={side.text} className="font-bold text-center w-full" style={{ fontSize: `${calculateDynamicFontSize(side.text, 9, 6, 11)}px`, display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      );
    }

    return (
      <g transform={`rotate(${rotVal})`}>
        <polygon
          points={innerV_up.map(p => `${p.x},${p.y}`).join(' ')}
          fill={settings?.saveInk ? '#ffffff' : colors.fill}
          stroke={settings?.saveInk ? '#1e293b' : colors.stroke}
          strokeWidth={settings?.saveInk ? 1.5 : 2.5}
          strokeLinejoin="round"
        />

        {piece.tarsiaSides?.map((side, sIdx) => {
          if (!side) return null;
          const conf = labelConfigs[sIdx];
          return (
            <g key={`playable-side-${sIdx}`} transform={`translate(${conf.tx}, ${conf.ty}) rotate(${conf.angle})`}>
              <foreignObject x={-conf.width / 2} y={-conf.height / 2} width={conf.width} height={conf.height}>
                <div xmlns="http://www.w3.org/1999/xhtml" className="flex flex-col justify-center items-center h-full text-center leading-[1.1] select-none notranslate px-1" translate="no" style={{ color: settings?.saveInk ? '#1e293b' : colors.text, fontFamily: '"Inter", sans-serif' }}>
                  <MathJaxWrapper text={side.text} className="font-bold text-center w-full" style={{ fontSize: `${calculateDynamicFontSize(side.text, 9, 6, 11)}px`, display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
                </div>
              </foreignObject>
            </g>
          );
        })}
      </g>
    );
  };

  const tarsiaTriangles = pieces.filter(p => p.type === 'tarsia');

  return (
    <>
      {/* 1. Vẽ Outlines nét đứt mờ trên Board */}
      <svg width={boardSize.w} height={boardSize.h} className="absolute inset-0 mx-auto select-none pointer-events-none">
        <g transform={`translate(${boardSize.offsetX || 0}, ${boardSize.offsetY || 0})`}>
          {tarsiaTriangles.map((piece) => {
            if (settings?.tarsiaShape === 'hexagon_core' && piece.tarsiaTriangleId === 0) {
              const s = 170;
              const hexPoints = Array.from({ length: 6 }).map((_, i) => {
                const theta = (i * Math.PI) / 3;
                return {
                  x: s * Math.cos(theta),
                  y: s * Math.sin(theta)
                };
              });
              return (
                <g key={`board-tarsia-outline-${piece.id}`} transform="translate(0, 0)">
                  <polygon
                    points={hexPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(59, 130, 246, 0.01)"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                </g>
              );
            }

            const rotAngle = piece.tarsiaIsPointingUp ? 0 : 180;
            return (
              <g key={`board-tarsia-outline-${piece.id}`} transform={`translate(${piece.targetX}, ${piece.targetY})`}>
                <polygon
                  points={`0,${-(170 * Math.sqrt(3) / 2) * 2 / 3} ${170 / 2},${(170 * Math.sqrt(3) / 2) / 3} ${-170 / 2},${(170 * Math.sqrt(3) / 2) / 3}`}
                  fill="rgba(59, 130, 246, 0.01)"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  transform={`rotate(${rotAngle})`}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* 2. Vẽ các mảnh ghép Tarsia đang kéo thả */}
      {tarsiaTriangles.map((piece) => {
        const isDragging = activeDraggingId === piece.id;
        const finalX = piece.isSnapped ? piece.targetX + (boardSize.offsetX ?? 0) : piece.currentX;
        const finalY = piece.isSnapped ? piece.targetY + (boardSize.offsetY ?? 0) : piece.currentY;

        const snappedRot = piece.isSnapped 
          ? (settings?.tarsiaShape === 'hexagon_core' 
              ? (piece.tarsiaTriangleId === 0 
                  ? 0 
                  : (Math.floor(piece.tarsiaTriangleId! / 2) * 60 + 120) % 360
                )
              : piece.tarsiaTargetRotation
            )
          : undefined;

        const wBox = (settings?.tarsiaShape === 'hexagon_core' && piece.tarsiaTriangleId === 0) ? 220 : 180;
        const hBox = (settings?.tarsiaShape === 'hexagon_core' && piece.tarsiaTriangleId === 0) ? 220 : 160;

        return (
          <div
            key={piece.id}
            className={`absolute select-none ${
              piece.isSnapped ? 'pointer-events-none transition-all duration-300' : isDragging ? 'z-50 filter drop-shadow-2xl scale-[1.05]' : 'z-30 hover:scale-[1.02]'
            }`}
            style={{
              left: `${finalX}px`,
              top: `${finalY}px`,
              width: `${wBox}px`,
              height: `${hBox}px`,
              transform: `translate(${-wBox/2}px, ${-hBox/2}px)`,
              touchAction: 'none',
            }}
            onPointerDown={(e) => handlePointerDown(e, piece.id)}
            onPointerMove={(e) => handlePointerMove(e, piece.id)}
            onPointerUp={(e) => handlePointerUp(e, piece.id)}
          >
            <svg width={wBox} height={hBox} viewBox={`-${wBox/2} -${hBox/2} ${wBox} ${hBox}`} className="overflow-visible">
              {renderTarsiaPiece(piece, 0.95, snappedRot)}
            </svg>
          </div>
        );
      })}
    </>
  );
};
