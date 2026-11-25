import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useApp } from '../context/AppContext';

interface Props {
  variant?: 'card' | 'pill';
  className?: string;
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'pill', className = '' }) => {
  const { state } = useApp();
  const isBn = state.preferences.language === 'bn';
  const { isInstallable, isInstalled, isIOS, installPWA } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const installState = isInstalled
    ? 'installed'
    : isInstallable
    ? 'available'
    : isIOS
    ? 'ios-guide'
    : 'unsupported';

  if (installState === 'installed' || installState === 'unsupported') {
    return null;
  }

  const handleClick = async () => {
    if (installState === 'available') {
      await installPWA();
    } else if (installState === 'ios-guide') {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'card' ? (
        <div
          className={`rounded-[24px] bg-gradient-to-r from-[#084B32] to-[#0B5E3F] text-white p-4 shadow-sm flex items-center justify-between gap-3 ${className}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-[#D9F275] text-[#084B32] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-extrabold truncate">
                {isBn ? 'Safar নেটিভ অ্যাপ ইনস্টল করুন' : 'Install Safar App'}
              </div>
              <div className="text-[11px] text-emerald-100/85 truncate">
                {isBn
                  ? 'ফুল-স্ক্রিন ও অফলাইনে দ্রুত ব্যবহার করতে হোম স্ক্রিনে যুক্ত করুন'
                  : 'Add to Home Screen for full-screen offline experience'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="px-4 py-2 rounded-full bg-[#D9F275] hover:bg-[#e5f896] text-[#084B32] text-xs font-extrabold whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isBn ? 'ইনস্টল' : 'Install'}</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#084B32] hover:bg-[#063a26] text-white text-xs font-bold shadow-sm cursor-pointer transition-colors ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-[#D9F275]" />
          <span>{isBn ? 'ফোনে অ্যাপ ইনস্টল করুন' : 'Install Native App'}</span>
        </button>
      )}

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[28px] max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#141517]">
                {isBn ? 'iPhone / iPad-এ Safar ইনস্টল' : 'Install Safar on iOS'}
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-2.5 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
              <li>
                {isBn ? 'নিচের Safari Share আইকনে ট্যাপ করুন' : 'Tap the Share button in Safari'}{' '}
                <Share className="w-3.5 h-3.5 inline text-[#084B32]" />
              </li>
              <li>
                {isBn
                  ? 'তালিকা থেকে "Add to Home Screen" বেছে নিন'
                  : 'Scroll down and tap "Add to Home Screen"'}
              </li>
              <li>
                {isBn
                  ? 'উপরের ডানে "Add" চাপলেই ফুল-স্ক্রিন অ্যাপ হিসেবে চালু হবে।'
                  : 'Tap "Add" to launch Safar as a full-screen app.'}
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full h-11 rounded-full bg-[#084B32] text-white text-xs font-bold cursor-pointer"
            >
              {isBn ? 'বুঝেছি' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
