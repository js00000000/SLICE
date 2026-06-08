import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';

interface DialogOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface DialogContextType {
  alert: (message: string, options?: DialogOptions) => Promise<void>;
  confirm: (message: string, options?: DialogOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  useScrollLock(isOpen);
  const [type, setType] = useState<'alert' | 'confirm'>('alert');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [confirmLabel, setConfirmLabel] = useState('確定');
  const [cancelLabel, setCancelLabel] = useState('取消');
  const [resolvePromise, setResolvePromise] = useState<((value: void | boolean) => void) | null>(null);

  const showAlert = useCallback((message: string, options?: DialogOptions) => {
    setMessage(message);
    setTitle(options?.title || '提示');
    setConfirmLabel(options?.confirmLabel || '確定');
    setType('alert');
    setIsOpen(true);
    return new Promise<void>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const showConfirm = useCallback((message: string, options?: DialogOptions) => {
    setMessage(message);
    setTitle(options?.title || '確認');
    setConfirmLabel(options?.confirmLabel || '確定');
    setCancelLabel(options?.cancelLabel || '取消');
    setType('confirm');
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolvePromise) {
      if (type === 'confirm') resolvePromise(true);
      else resolvePromise(undefined);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolvePromise && type === 'confirm') {
      resolvePromise(false);
    }
  };

  return (
    <DialogContext.Provider value={{ alert: showAlert, confirm: showConfirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 select-none font-plus-jakarta">
          <div className="fixed inset-0 bg-main-text/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={type === 'alert' ? handleConfirm : undefined} />
          
          <div className="bg-white w-full max-w-sm rounded-[24px] border-3 border-main-text shadow-[6px_6px_0px_#1A1A2E] z-10 overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col">
            <div className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                
                {/* Visual Accent Tilted Icon Badge */}
                <div className={`w-14 h-14 border-2 border-main-text rounded-2xl flex items-center justify-center shadow-[2px_2px_0px_#1A1A2E] shrink-0 ${
                  type === 'confirm' 
                    ? 'bg-brand-light text-accent-orange rotate-[-6deg]' 
                    : 'bg-amber-50 text-amber-500 rotate-[6deg]'
                }`}>
                  {type === 'confirm' 
                    ? <HelpCircle className="w-7 h-7 stroke-[2.5]" /> 
                    : <AlertCircle className="w-7 h-7 stroke-[2.5]" />
                  }
                </div>
                
                <div className="space-y-1.5 w-full">
                  <h3 className="text-xl font-nunito font-black text-main-text leading-tight">{title}</h3>
                  <p className="text-gray-500 font-medium text-sm whitespace-pre-wrap leading-relaxed">{message}</p>
                </div>
              </div>
            </div>
            
            {/* Playful Interactive Footers */}
            <div className="px-6 py-4 border-t-2 border-dashed border-main-text/10 bg-white flex flex-row-reverse gap-3 shrink-0">
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 bg-accent-orange text-white rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all duration-150 cursor-pointer"
              >
                {confirmLabel}
              </button>
              {type === 'confirm' && (
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-brand-light text-accent-orange rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all duration-150 cursor-pointer"
                >
                  {cancelLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
}
