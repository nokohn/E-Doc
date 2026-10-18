import React, { useMemo } from 'react';
import { LHSELogo } from './LHSELogo';

/**
 * Robust, dependency-free QR Code generator for URL and verification codes.
 * Generates standards-compliant QR Code Matrix SVG.
 */

// QR Code Reed-Solomon and format constants
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x = (x << 1) ^ (x & 128 ? 0x11d : 0);
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function polyMul(p: number[], q: number[]): number[] {
  const r = new Array(p.length + q.length - 1).fill(0);
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) {
      r[i + j] ^= gfMul(p[i], q[j]);
    }
  }
  return r;
}

function getGeneratorPoly(degree: number): number[] {
  let g = [1];
  for (let i = 0; i < degree; i++) {
    g = polyMul(g, [1, GF256_EXP[i]]);
  }
  return g;
}

function calculateRS(data: number[], ecCount: number): number[] {
  const gen = getGeneratorPoly(ecCount);
  const msg = [...data, ...new Array(ecCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

// Supports Version 4-M (up to 62 bytes) and Version 5-L (up to 106 bytes, single block)
function generateQRMatrix(text: string): boolean[][] {
  const rawBytes = new TextEncoder().encode(text);
  const useV5 = rawBytes.length > 62;
  const version = useV5 ? 5 : 4;
  const size = 17 + version * 4; // 33 for V4, 37 for V5
  const totalDataCodewords = useV5 ? 108 : 64;
  const ecCodewordCount = useV5 ? 26 : 36;
  const maxBytes = totalDataCodewords - 2;
  const bytes = rawBytes.length > maxBytes ? rawBytes.slice(0, maxBytes) : rawBytes;

  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  // Finder pattern helper
  const addFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const tr = row + r;
        const tc = col + c;
        if (tr < 0 || tr >= size || tc < 0 || tc >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[tr][tc] = true;
          } else {
            matrix[tr][tc] = false;
          }
        } else {
          matrix[tr][tc] = false;
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // Alignment pattern at (24, 24) for Version 4, or (30, 30) for Version 5
  const alignPos = useV5 ? [30] : [24];
  for (const ar of alignPos) {
    for (const ac of alignPos) {
      if (matrix[ar][ac] !== null) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const isBlack = Math.max(Math.abs(r), Math.abs(c)) !== 1;
          matrix[ar + r][ac + c] = isBlack;
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // Dark module
  matrix[size - 8][8] = true;

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }
  for (let i = 0; i < 8; i++) {
    if (matrix[8][size - 1 - i] === null) matrix[8][size - 1 - i] = false;
    if (matrix[size - 1 - i][8] === null) matrix[size - 1 - i][8] = false;
  }

  // Encode payload (Byte mode)
  const bitStream: number[] = [];

  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bitStream.push((val >> i) & 1);
    }
  };

  // Mode: Byte (0100)
  pushBits(0b0100, 4);
  // Character count (8 bits for Version 1-9 in Byte mode)
  pushBits(bytes.length, 8);
  // Data bytes
  for (const b of bytes) {
    pushBits(b, 8);
  }
  // Terminator
  const maxDataBits = totalDataCodewords * 8;
  pushBits(0, Math.min(4, maxDataBits - bitStream.length));
  // Pad to multiple of 8
  while (bitStream.length % 8 !== 0) {
    bitStream.push(0);
  }

  const dataCodewords: number[] = [];
  for (let i = 0; i < bitStream.length; i += 8) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | (bitStream[i + b] || 0);
    }
    dataCodewords.push(byteVal);
  }

  // Pad bytes 0xEC, 0x11
  let padByte = 0xec;
  while (dataCodewords.length < totalDataCodewords) {
    dataCodewords.push(padByte);
    padByte = padByte === 0xec ? 0x11 : 0xec;
  }

  // Reed-Solomon Error Correction
  const ecCodewords = calculateRS(dataCodewords, ecCodewordCount);
  const allCodewords = [...dataCodewords, ...ecCodewords];

  // Convert all codewords to bits
  const finalBits: number[] = [];
  for (const cw of allCodewords) {
    for (let b = 7; b >= 0; b--) {
      finalBits.push((cw >> b) & 1);
    }
  }

  // Placement in matrix (zigzag)
  let bitIdx = 0;
  let dir = -1; // up
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip vertical timing line
    const rStart = dir === -1 ? size - 1 : 0;
    const rEnd = dir === -1 ? -1 : size;
    const step = dir === -1 ? -1 : 1;

    for (let r = rStart; r !== rEnd; r += step) {
      for (const col of [c, c - 1]) {
        if (matrix[r][col] === null) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] === 1 : false;
          // Apply standard Mask 0: (row + col) % 2 == 0
          const mask = (r + col) % 2 === 0;
          matrix[r][col] = bit !== mask;
        }
      }
    }
    dir = -dir;
  }

  // Write format bits:
  // Mask 0 + Error Correction L (V5): 111011111000100
  // Mask 0 + Error Correction M (V4): 101010000010010
  const formatBits = useV5
    ? [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0]
    : [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const formatCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoords[i];
    matrix[r][c] = formatBits[i] === 1;
  }
  const formatCoords2 = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoords2[i];
    matrix[r][c] = formatBits[i] === 1;
  }

  return matrix as boolean[][];
}

interface QRCodeGeneratorProps {
  value?: string;
  text?: string;
  size?: number;
  className?: string;
  showCenterLogo?: boolean;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  text,
  size = 140,
  className = '',
  showCenterLogo = true,
}) => {
  const content = value || text || '';
  const matrix = useMemo(() => {
    try {
      return generateQRMatrix(content);
    } catch (e) {
      console.warn('QR generation fallback:', e);
      return [];
    }
  }, [content]);

  if (!matrix.length) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 border border-slate-200 rounded-lg"
      >
        QR
      </div>
    );
  }

  const modCount = matrix.length;
  const cellSize = size / modCount;

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-block bg-white p-1 rounded-xl shadow-xs border border-slate-200 select-none ${className}`}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="w-full h-full block"
      >
        {matrix.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0f172a"
              />
            );
          })
        )}
      </svg>

      {/* Official State Enterprise Seal in center of QR */}
      {showCenterLogo && (
        <div
          className="absolute inset-0 m-auto flex items-center justify-center bg-white rounded-full shadow-md border border-slate-200 overflow-hidden"
          style={{ width: size * 0.26, height: size * 0.26 }}
        >
          <LHSELogo size={size * 0.26} />
        </div>
      )}
    </div>
  );
};
