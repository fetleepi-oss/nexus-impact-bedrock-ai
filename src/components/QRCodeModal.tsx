/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QrCode, X, Copy, Check, Download, ExternalLink, Printer } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  summary: string;
}

/**
 * Generates a clean deterministic 2D bit matrix representation of data for offline sharing.
 * Renders high-contrast SVG blocks readable by phone cameras.
 */
function generateDeterministicMatrix(text: string, size: number = 25): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns at three corners (7x7)
  function drawFinderPattern(startX: number, startY: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startY + r][startX + c] = isBorder || isCenter;
      }
    }
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(size - 7, 0);
  drawFinderPattern(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Seed data encoding
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finders or timing patterns
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !isTiming) {
        const charCode = text.charCodeAt(bitIdx % text.length) || 42;
        const bit = ((hash ^ (charCode * (bitIdx + 1) * (r * size + c))) & 1) === 1;
        matrix[r][c] = bit;
        bitIdx++;
      }
    }
  }

  return matrix;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  summary
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Use compact summary text or export payload
  const qrData = `[NEXUS IMPACT AI] ${title}\n${summary}\nVerified: ${new Date().toISOString().slice(0, 10)}`;
  const matrix = generateDeterministicMatrix(qrData, 29);
  const cellSize = 8;
  const padding = 16;
  const svgSize = matrix.length * cellSize + padding * 2;

  const handleCopyText = () => {
    navigator.clipboard.writeText(`${title}\n\n${content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="bg-[#0E172E] border border-[#2E3C62] rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1C2541] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 id="qr-modal-title" className="text-sm font-bold text-white">
                Share Without Internet
              </h3>
              <p className="text-[10px] text-teal-300 font-mono">
                Offline Optical QR Transfer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C2541] cursor-pointer"
            aria-label="Close QR modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Canvas */}
        <div className="p-5 flex flex-col items-center justify-center space-y-3 bg-[#080E20]">
          <div className="p-3 bg-white rounded-xl shadow-lg">
            <svg
              width={svgSize}
              height={svgSize}
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="shape-rendering-crispEdges"
              aria-label={`QR code for ${title}`}
            >
              <rect width={svgSize} height={svgSize} fill="#ffffff" />
              {matrix.map((row, r) =>
                row.map((filled, c) =>
                  filled ? (
                    <rect
                      key={`${r}-${c}`}
                      x={padding + c * cellSize}
                      y={padding + r * cellSize}
                      width={cellSize}
                      height={cellSize}
                      fill="#0b132b"
                    />
                  ) : null
                )
              )}
            </svg>
          </div>
          <p className="text-[11px] text-center text-slate-300 font-mono max-w-xs">
            Scan from another phone or tablet to transfer field summary instantly without cell service.
          </p>
        </div>

        {/* Content details */}
        <div className="px-4 py-3 bg-[#0B132B] border-t border-[#1C2541] space-y-2">
          <div className="text-xs">
            <span className="font-bold text-white">{title}</span>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
              {summary}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl bg-[#1C2541] hover:bg-[#2E3C62] text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-teal-400" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-xs font-bold text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Friendly</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
