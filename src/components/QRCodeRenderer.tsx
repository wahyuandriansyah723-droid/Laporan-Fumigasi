import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode as QrIcon, Check, Copy } from 'lucide-react';

interface QRCodeRendererProps {
  value: string;
  size?: number;
  showText?: boolean;
  subtext?: string;
  downloadable?: boolean;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

export const QRCodeRenderer: React.FC<QRCodeRendererProps> = ({
  value,
  size = 128,
  showText = true,
  subtext,
  downloadable = false,
  className = '',
  darkColor = '#0f172a',
  lightColor = '#ffffff',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    QRCode.toDataURL(
      value,
      {
        width: size * 2, // High DPI crispness
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: darkColor,
          light: lightColor,
        },
      },
      (err, url) => {
        if (!err && isMounted) {
          setDataUrl(url);
        } else if (err) {
          console.error('Failed to generate QR Code:', err);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [value, size, darkColor, lightColor]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR-${value.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyValue = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`inline-flex flex-col items-center select-none bg-white p-3 rounded-lg border border-slate-200 shadow-sm ${className}`}
    >
      <div className="relative group">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR Code: ${value}`}
            style={{ width: `${size}px`, height: `${size}px` }}
            className="block rounded object-contain"
          />
        ) : (
          <div
            style={{ width: `${size}px`, height: `${size}px` }}
            className="flex items-center justify-center bg-slate-100 rounded text-slate-400"
          >
            <QrIcon className="w-8 h-8 animate-pulse" />
          </div>
        )}

        {downloadable && dataUrl && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2 p-1 no-print">
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded bg-white/90 hover:bg-white text-slate-900 shadow text-xs transition-transform hover:scale-105 cursor-pointer"
              title="Unduh Gambar QR Code (PNG)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCopyValue}
              className="p-1.5 rounded bg-white/90 hover:bg-white text-slate-900 shadow text-xs transition-transform hover:scale-105 cursor-pointer"
              title="Salin Kode SKU"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {showText && (
        <div className="mt-1.5 text-center max-w-[200px]">
          <span className="font-mono text-xs font-bold tracking-wider text-slate-900 block truncate">
            {value}
          </span>
          {subtext && (
            <span className="text-[10px] text-slate-500 block truncate font-sans">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
