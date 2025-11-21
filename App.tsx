
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCalculator } from './hooks/useCalculator';
import { useLocalStorage } from './hooks/useLocalStorage';
import Calculator from './components/Calculator';
import SettingsPanel from './components/SettingsPanel';
import HistoryPanel from './components/HistoryPanel';
import SupportPanel from './components/SupportPanel';
import AboutPanel from './components/AboutPanel';
import Overlay from './components/Overlay';
import Notification from './components/Notification';
import ConfirmationDialog from './components/ConfirmationDialog';
import { HistoryItem } from './types';

type ConfirmationState = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
};

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', show: false });
  const [appUpdate, setAppUpdate] = useState<{ available: boolean; registration: ServiceWorkerRegistration | null }>({ available: false, registration: null });
  const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, onConfirm: () => {}, onCancel: () => {}, title: '', message: '' });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [theme, setTheme] = useLocalStorage<string>('calcTheme_v3', 'dark');
  const [fontFamily, setFontFamily] = useLocalStorage<string>('calcFontFamily_v2', 'Tajawal');
  const [fontScale, setFontScale] = useLocalStorage<number>('calcFontScale_v2', 1);
  
  // Custom Color States
  const [buttonTextColor, setButtonTextColor] = useLocalStorage<string | null>('calcButtonTextColor_v1', null);
  const [borderColor, setBorderColor] = useLocalStorage<string | null>('calcBorderColor_v1', null);
  const [numberBtnColor, setNumberBtnColor] = useLocalStorage<string | null>('calcNumberBtnColor_v1', null);
  const [funcBtnColor, setFuncBtnColor] = useLocalStorage<string | null>('calcFuncBtnColor_v1', null);

  const showNotification = useCallback((message: string) => {
    setNotification({ message, show: true });
    setTimeout(() => {
      setNotification({ message: '', show: false });
    }, 2500);
  }, []);
  
  const calculator = useCalculator({ showNotification });

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('history') === 'true') {
        setIsHistoryOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.has('text')) {
        const sharedText = params.get('text');
        if (sharedText) {
            calculator.actions.updateInput(sharedText);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
  }, [calculator.actions]);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (theme === 'system') {
            document.documentElement.classList.toggle('dark', mediaQuery.matches);
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mediaQuery.matches ? '#050A14' : '#f0f4f8');
        }
    };

    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#050A14');
    } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f0f4f8');
    } else {
        handleChange();
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
      document.documentElement.style.setProperty('--font-family', fontFamily);
      document.documentElement.style.setProperty('--font-scale', String(fontScale));
  }, [fontFamily, fontScale]);

  // Inject Custom Colors
  useEffect(() => {
    if (buttonTextColor) document.documentElement.style.setProperty('--button-text-color-custom', buttonTextColor);
    else document.documentElement.style.removeProperty('--button-text-color-custom');
  }, [buttonTextColor]);

  useEffect(() => {
    if (borderColor) document.documentElement.style.setProperty('--border-color-custom', borderColor);
    else document.documentElement.style.removeProperty('--border-color-custom');
  }, [borderColor]);

  useEffect(() => {
    if (numberBtnColor) document.documentElement.style.setProperty('--button-number-bg-custom', numberBtnColor);
    else document.documentElement.style.removeProperty('--button-number-bg-custom');
  }, [numberBtnColor]);

  useEffect(() => {
    if (funcBtnColor) document.documentElement.style.setProperty('--button-function-bg-custom', funcBtnColor);
    else document.documentElement.style.removeProperty('--button-function-bg-custom');
  }, [funcBtnColor]);


   useEffect(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            setAppUpdate(prev => ({...prev, registration}));
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            setAppUpdate({ available: true, registration });
                        }
                    };
                }
            };
        });
        let refreshing: boolean;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    }
  }, []);
  
  const closeAllPanels = useCallback(() => {
    setIsSettingsOpen(false);
    setIsHistoryOpen(false);
    setIsSupportOpen(false);
    setIsAboutOpen(false);
  }, []);

  const handleClearHistory = useCallback(() => {
    if (calculator.history.length === 0) {
        showNotification("السجل فارغ بالفعل.");
        return;
    }
    setConfirmation({
        isOpen: true,
        title: 'مسح سجل العمليات',
        message: 'هل أنت متأكد أنك تريد مسح السجل بالكامل؟ لا يمكن التراجع عن هذا الإجراء.',
        onConfirm: () => {
            calculator.actions.clearHistory();
            setConfirmation(prev => ({ ...prev, isOpen: false }));
            showNotification("تم مسح السجل بنجاح.");
        },
        onCancel: () => {
            setConfirmation(prev => ({ ...prev, isOpen: false }));
        }
    });
  }, [calculator.history, calculator.actions.clearHistory, showNotification]);
  
  const handleDeleteHistoryItem = useCallback((item: any) => {
    setConfirmation({
        isOpen: true,
        title: 'حذف العملية',
        message: `هل أنت متأكد من حذف العملية: "${item.expression} = ${item.result}"؟ لا يمكن التراجع عن هذا الإجراء.`,
        onConfirm: () => {
            calculator.actions.deleteHistoryItem(item.id);
            setConfirmation(prev => ({ ...prev, isOpen: false }));
            showNotification("تم حذف العملية بنجاح.");
        },
        onCancel: () => {
            setConfirmation(prev => ({ ...prev, isOpen: false }));
        }
    });
  }, [calculator.actions.deleteHistoryItem, showNotification]);

  const onCheckForUpdates = useCallback(() => {
    if (appUpdate.registration) {
        appUpdate.registration.update().then(() => {
            if (appUpdate.registration && (appUpdate.registration.installing || appUpdate.registration.waiting)) {
                showNotification("تم العثور على تحديث! سيتم التثبيت في الخلفية.");
                setAppUpdate({ available: true, registration: appUpdate.registration });
            } else {
                showNotification("أنت تستخدم أحدث إصدار.");
            }
        }).catch(() => {
            showNotification("فشل التحقق من التحديثات. تحقق من اتصالك بالإنترنت.");
        });
    } else {
        showNotification("خدمة التحديث غير متاحة.");
    }
  }, [appUpdate.registration, showNotification]);

  const onUpdateAccepted = () => {
      if (appUpdate.registration && appUpdate.registration.waiting) {
          appUpdate.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
  };
  
  const createExportContent = useCallback((history: any[], format: 'txt' | 'csv') => {
    const getTaxModeLabel = (mode?: string, rate?: number) => {
        if (!mode) return "غير مفعلة";
        switch (mode) {
            case 'add-15': return "إضافة 15%";
            case 'divide-93': return "القسمة على 0.93";
            case 'custom': return `إضافة مخصص ${rate}%`;
            case 'extract-custom': return `استخلاص مخصص ${rate}%`;
            default: return "غير معروف";
        }
    };

    if (format === 'txt') {
        const header = "سجل عمليات الآلة الحاسبة المتقدمة\n\n";
        const content = history.map(item =>
            `التاريخ: ${item.date} - ${item.time}\n` +
            `العملية: ${item.expression}\n` +
            `النتيجة: ${item.result}\n` +
            (item.taxResult ? `وضع الضريبة: ${getTaxModeLabel(item.taxMode, item.taxRate)}\n${item.taxLabel || 'النتيجة مع الضريبة'}: ${item.taxResult}\n` : '') +
            (item.notes ? `ملاحظة: ${item.notes}\n` : '') +
            "------------------------------------\n"
        ).join('\n');
        return header + content;
    }

    if (format === 'csv') {
        const escapeCsvCell = (cell: any) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
        const headers = ["التاريخ", "الوقت", "العملية", "النتيجة", "وضع الضريبة", "نسبة الضريبة", "النتيجة الثانوية (ضريبة/أصل)", "الملاحظات"].map(escapeCsvCell).join(',');
        const rows = history.map(item => [
            item.date, item.time, item.expression, item.result,
            getTaxModeLabel(item.taxMode, item.taxRate), item.taxRate, item.taxResult, item.notes
        ].map(escapeCsvCell).join(',')).join('\n');
        return `\uFEFF${headers}\n${rows}`;
    }
    return '';
  }, []);

  const handleExport = useCallback((format: 'txt' | 'csv', startDate: string, endDate: string) => {
      const filteredHistory = calculator.history;

      if (filteredHistory.length === 0) {
          showNotification("لا يوجد سجل للتصدير.");
          return;
      }

      const content = createExportContent(filteredHistory, format);
      const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.download = `calculator-history-${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification(`جاري تصدير السجل كـ ${format.toUpperCase()}...`);
      closeAllPanels();
  }, [calculator.history, closeAllPanels, showNotification, createExportContent]);
  
  const handleShareHistoryText = useCallback(async (items: HistoryItem[]) => {
    if (!items || items.length === 0) {
        showNotification("لا يوجد عناصر للمشاركة.");
        return;
    }
    const text = createExportContent(items, 'txt');
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'سجل العمليات الحسابية',
                text: text
            });
        } catch (err) {
             if ((err as any).name !== 'AbortError') {
                 navigator.clipboard.writeText(text);
                 showNotification("تم نسخ السجل للحافظة.");
             }
        }
    } else {
        navigator.clipboard.writeText(text);
        showNotification("تم نسخ السجل للحافظة.");
    }
  }, [createExportContent, showNotification]);

  const anyPanelOpen = isSettingsOpen || isHistoryOpen || isSupportOpen || isAboutOpen;

  const todayCount = useMemo(() => {
      const now = new Date();
      const dateString = now.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
      return calculator.history.filter(item => item.date === dateString).length;
  }, [calculator.history]);

  const orientationStyle = calculator.settings.orientation === 'portrait' 
    ? 'max-w-[460px] mx-auto border-x border-[var(--border-secondary)] shadow-2xl' 
    : 'w-full landscape:max-w-none portrait:max-w-[460px] portrait:mx-auto';

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ background: 'var(--bg-primary-gradient)' }}>
      <div className={`flex justify-center items-center min-h-screen w-full font-sans relative pt-24 pb-8 md:pt-8 transition-all duration-300 ${orientationStyle}`}>
        {appUpdate.available && (
           <div className="absolute top-4 z-20 w-[calc(100%-2rem)] max-w-[420px] bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-fade-in-down">
             <div>
               <h4 className="font-bold">✨ تحديث جديد جاهز!</h4>
               <p className="text-xs opacity-90 mt-1">نسخة أحدث وأسرع متاحة الآن.</p>
             </div>
             <button onClick={onUpdateAccepted} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">تحديث</button>
           </div>
        )}

        <Calculator 
          calculator={calculator}
          onToggleSettings={() => setIsSettingsOpen(true)}
          onToggleHistory={() => setIsHistoryOpen(true)}
          onShare={showNotification}
          entryCount={calculator.entryCount}
          todayCount={todayCount}
        />

        <Overlay show={anyPanelOpen} onClick={closeAllPanels} />

        <SettingsPanel 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          settings={calculator.settings}
          theme={theme}
          onThemeChange={setTheme}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          fontScale={fontScale}
          setFontScale={setFontScale}
          
          buttonTextColor={buttonTextColor}
          setButtonTextColor={setButtonTextColor}
          borderColor={borderColor}
          setBorderColor={setBorderColor}
          numberBtnColor={numberBtnColor}
          setNumberBtnColor={setNumberBtnColor}
          funcBtnColor={funcBtnColor}
          setFuncBtnColor={setFuncBtnColor}

          onOpenSupport={() => { setIsSettingsOpen(false); setIsSupportOpen(true); }}
          onShowAbout={() => { setIsSettingsOpen(false); setIsAboutOpen(true); }}
          onCheckForUpdates={onCheckForUpdates}
          deferredPrompt={deferredPrompt}
          onInstallApp={handleInstallClick}
        />

        <HistoryPanel 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)} 
          history={calculator.history}
          onClearHistory={handleClearHistory}
          onHistoryItemClick={calculator.actions.loadFromHistory}
          onExportHistory={handleExport}
          onExportCsvHistory={handleExport}
          onShareHistory={handleShareHistoryText}
          onUpdateHistoryItemNote={calculator.actions.updateHistoryItemNote}
          onDeleteItem={handleDeleteHistoryItem}
        />
        
        <SupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
        <AboutPanel isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        
        <Notification message={notification.message} show={notification.show} />
        
        <ConfirmationDialog 
            isOpen={confirmation.isOpen} 
            onConfirm={confirmation.onConfirm} 
            onCancel={confirmation.onCancel} 
            title={confirmation.title} 
            message={confirmation.message} 
        />
      </div>
    </div>
  );
}

export default App;
