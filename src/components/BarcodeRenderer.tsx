import React from 'react';

// Crisp SVG Barcode pattern generator based on string hash & pseudo-Code128 bars
export const BarcodeRenderer: React.FC<{
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}> = ({ value, width = 240, height = 65, showText = true, className = '' }) => {
  // Generate deterministic bar widths based on char codes
  const generateBars = (str: string) => {
    const bars: { width: number; isBlack: boolean }[] = [];
    // Start quiet zone & start guard
    bars.push({ width: 3, isBlack: true });
    bars.push({ width: 2, isBlack: false });
    bars.push({ width: 3, isBlack: true });
    bars.push({ width: 1, isBlack: false });

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      const b1 = (code % 3) + 1;
      const b2 = ((code >> 2) % 3) + 1;
      const b3 = ((code >> 4) % 2) + 1;
      const b4 = ((code >> 1) % 2) + 1;

      bars.push({ width: b1, isBlack: true });
      bars.push({ width: b2, isBlack: false });
      bars.push({ width: b3, isBlack: true });
      bars.push({ width: b4, isBlack: false });
    }

    // Stop guard
    bars.push({ width: 3, isBlack: true });
    bars.push({ width: 1, isBlack: false });
    bars.push({ width: 3, isBlack: true });
    return bars;
  };

  const bars = generateBars(value);
  const totalUnits = bars.reduce((acc, b) => acc + b.width, 0);
  const scale = width / Math.max(totalUnits, 1);

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center select-none bg-white p-2 rounded border border-slate-200 ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[280px]"
      >
        <rect width={width} height={height} fill="#ffffff" />
        {bars.map((bar, idx) => {
          const barW = bar.width * scale;
          const x = currentX;
          currentX += barW;
          if (!bar.isBlack) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={barW}
              height={height}
              fill="#0f172a"
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono text-xs font-semibold tracking-widest text-slate-800 mt-1 uppercase">
          {value}
        </span>
      )}
    </div>
  );
};
