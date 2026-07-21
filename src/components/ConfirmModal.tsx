import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, ShieldAlert, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'HAPUS / DELETE',
  cancelText = 'BATAL / CANCEL',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      border: 'border-[#ef4444]',
      badgeBg: 'bg-[#ef4444]/10 text-[#ef4444]',
      icon: <Trash2 className="w-6 h-6 text-[#ef4444] animate-pulse" />,
      confirmBtn: 'bg-[#ef4444] text-white hover:bg-[#dc2626] border-[#ef4444]',
      accentColor: '#ef4444',
      tag: 'SYS.DELETE_CONFIRM'
    },
    warning: {
      border: 'border-[#ff9f30]',
      badgeBg: 'bg-[#ff9f30]/10 text-[#ff9f30]',
      icon: <AlertTriangle className="w-6 h-6 text-[#ff9f30] animate-pulse" />,
      confirmBtn: 'bg-[#ff9f30] text-[#0b1623] hover:bg-[#e68a1f] font-bold border-[#ff9f30]',
      accentColor: '#ff9f30',
      tag: 'SYS.WARNING'
    },
    info: {
      border: 'border-[#00ff9d]',
      badgeBg: 'bg-[#00ff9d]/10 text-[#00ff9d]',
      icon: <ShieldAlert className="w-6 h-6 text-[#00ff9d]" />,
      confirmBtn: 'bg-[#00ff9d] text-[#0b1623] hover:bg-[#00cc7d] font-bold border-[#00ff9d]',
      accentColor: '#00ff9d',
      tag: 'SYS.ACTION_REQUIRED'
    }
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1623]/80 backdrop-blur-xs transition-all duration-200">
      {/* Scanline cyber backdrop overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px]" />
      
      <div 
        className={`w-full max-w-md bg-[#0b1623] border-2 ${style.border} shadow-2xl relative overflow-hidden flex flex-col p-5 space-y-4`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Tag */}
        <div className="flex items-center justify-between border-b border-[#1c2b3a] pb-3">
          <div className="flex items-center space-x-2">
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border border-[#1c2b3a] ${style.badgeBg}`}>
              {style.tag}
            </span>
            <div className="w-1.5 h-1.5 bg-[#ff9f30] animate-ping" />
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-[#8b9bb4] hover:text-white hover:bg-[#1c2b3a] transition-colors"
            title="Tutup (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialog Content */}
        <div className="flex items-start space-x-4 py-2">
          <div className="p-3 bg-[#1c2b3a]/40 border border-[#1c2b3a] shrink-0">
            {style.icon}
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#f0f0f0]">
              {title}
            </h3>
            <p className="text-[10px] text-[#8b9bb4] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Warning bar notice */}
        <div className="border border-[#1c2b3a] bg-[#1c2b3a]/20 p-2 text-[8px] font-mono text-[#8b9bb4] flex justify-between items-center">
          <span>// TINDAKAN PERMANEN</span>
          <span className="text-[#ff9f30]">ENTER = KONFIRMASI</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-[#1c2b3a]/40 hover:bg-[#1c2b3a] text-[#8b9bb4] hover:text-white font-bold text-[9px] tracking-wider py-2.5 border border-[#1c2b3a] transition-colors text-center uppercase"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full font-bold text-[9px] tracking-wider py-2.5 border transition-all text-center uppercase ${style.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
