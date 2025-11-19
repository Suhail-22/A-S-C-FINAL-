
import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import Icon from './Icon';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearHistory: () => void;
  onHistoryItemClick: (item: HistoryItem) => void;
  onExportHistory: (startDate: string, endDate: string) => void;
  onExportCsvHistory: (startDate: string, endDate: string) => void;
  onShareHistory: (items: HistoryItem[]) => void;
  onUpdateHistoryItemNote: (id: number, note: string) => void;
  onDeleteItem: (item: HistoryItem) => void;
}

const formatDisplayNumber = (numStr: string) => {
    if (!numStr) return '';
    const num = parseFloat(numStr);
    if (isNaN(num)) return numStr;
    return num.toLocaleString('en-US', { maximumFractionDigits: 3, useGrouping: false });
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history, onClearHistory, onHistoryItemClick, onExportHistory, onExportCsvHistory, onShareHistory, onUpdateHistoryItemNote, onDeleteItem }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<{ id: number; note: string } | null>(null);

  const handleExport = (exportFunc: (start: string, end: string) => void) => {
    exportFunc(startDate, endDate);
  };

  const handleEditSave = () => {
    if (!editingItem) return;
    onUpdateHistoryItemNote(editingItem.id, editingItem.note);
    setEditingItem(null);
  };

  const groupedAndFilteredHistory = useMemo(() => {
    const dailyTotals: { [date: string]: number } = {};
    history.forEach(item => {
        if (dailyTotals[item.date] === undefined) {
            dailyTotals[item.date] = 0;
        }
        const resultNumber = parseFloat(item.result.replace(/,/g, ''));
        if (!isNaN(resultNumber)) {
            dailyTotals[item.date] += resultNumber;
        }
    });

    const filtered = history.filter(item => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            item.expression.toLowerCase().includes(searchLower) ||
            item.result.toLowerCase().includes(searchLower) ||
            (item.notes && item.notes.toLowerCase().includes(searchLower))
        );
    });

    if (filtered.length === 0) return [];

    const groups: { [date: string]: { items: HistoryItem[] } } = {};
    filtered.forEach(item => {
        if (!groups[item.date]) {
            groups[item.date] = { items: [] };
        }
        groups[item.date].items.push(item);
    });
    
    return Object.entries(groups).map(([date, data]) => ({
        date,
        items: data.items,
        total: dailyTotals[date] || 0,
    })).sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const [dayB, monthB, yearB] = b.date.split('/').map(Number);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateB.getTime() - dateA.getTime();
    });
  }, [history, searchTerm]);

  return (
    <div className={`fixed top-0 bottom-0 left-0 w-[320px] max-w-[85vw] bg-[var(--bg-panel)] text-[var(--text-primary)] z-50 p-5 shadow-2xl overflow-y-auto border-r-2 border-[var(--border-primary)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
      <div className="flex justify-between items-center mb-4 border-b border-[var(--border-secondary)] pb-4">
        <div className="flex items-center gap-2">
            <h3 className="text-[var(--accent-color)] text-2xl font-bold">{`📜 السجل (${history.length})`}</h3>
            {history.length > 0 && (
                <button onClick={() => onShareHistory(history)} className="p-1.5 rounded-full bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors" aria-label="مشاركة كامل السجل">
                    <Icon name="share_small" className="w-5 h-5" />
                </button>
            )}
        </div>
        <button onClick={onClose} className="text-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">✕</button>
      </div>
      <div className="mb-4">
         <input type="search" placeholder="ابحث في السجل..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2.5 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-inset)] text-[var(--text-primary)] text-base" />
      </div>
      <div className="text-center mb-4 flex justify-center gap-2">
        <button onClick={onClearHistory} className="py-1 px-3 text-sm rounded-lg bg-[var(--bg-inset)] text-[var(--accent-color)] hover:brightness-95 transition-colors">مسح</button>
        <button onClick={() => handleExport(onExportHistory)} className="py-1 px-3 text-sm rounded-lg bg-[var(--bg-inset)] text-sky-400 hover:brightness-95 transition-colors">TXT</button>
        <button onClick={() => handleExport(onExportCsvHistory)} className="py-1 px-3 text-sm rounded-lg bg-[var(--bg-inset)] text-green-400 hover:brightness-95 transition-colors">CSV</button>
      </div>
      <div className="flex flex-col">
        {groupedAndFilteredHistory.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] text-base mt-8">
            {history.length === 0 ? 'السجل فارغ.' : 'لا توجد نتائج مطابقة للبحث.'}
          </p>
        ) : (
          groupedAndFilteredHistory.map(({ date, items, total }, groupIndex) => (
            <div key={date} className="mb-2">
              <div className={`flex justify-between items-center py-3 px-1 ${groupIndex > 0 ? 'border-t-2 border-[var(--border-secondary)]' : ''}`}>
                <h4 className="text-sm font-bold text-[var(--text-secondary)]">{date}</h4>
                <div className="flex items-center gap-3">
                     <button onClick={() => onShareHistory(items)} className="text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-colors" aria-label={`مشاركة عمليات يوم ${date}`}>
                        <Icon name="share_small" className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-[10px] text-[var(--text-secondary)] mb-0.5">
                             ({items.length} عمليات)
                        </span>
                        <span className="text-xs font-bold text-green-400">
                            {total.toLocaleString('en-US', { maximumFractionDigits: 2, useGrouping: false })}
                        </span>
                    </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 pl-2 border-l-2 border-[var(--border-secondary)] border-opacity-30">
                {items.map((item) => {
                  const isEditing = editingItem && editingItem.id === item.id;
                  return (
                    <div key={item.id} className="p-3 bg-[var(--bg-inset-light)] rounded-lg transition-all duration-200 hover:bg-[var(--bg-inset)]">
                      <div onClick={() => !isEditing && onHistoryItemClick(item)} className="cursor-pointer">
                          <div className="text-base opacity-80 direction-ltr text-left break-all text-[var(--text-secondary)] font-mono">{item.expression} =</div>
                          <div className="text-xl font-bold direction-ltr text-left break-all text-[var(--text-primary)]">{item.result}</div>
                          {item.taxResult && (
                              <div className="text-cyan-400 text-sm mt-1">{`${item.taxLabel || 'الإجمالي مع الضريبة'}: ${formatDisplayNumber(item.taxResult)}`}</div>
                          )}
                          <div className="text-[var(--text-secondary)] opacity-60 text-[10px] mt-1 text-right">{item.time}</div>
                      </div>
                      {isEditing ? (
                          <div className="mt-2 animate-fade-in-down">
                              <textarea
                                  value={editingItem.note}
                                  onChange={(e) => setEditingItem(prev => ({...prev!, note: e.target.value}))}
                                  className="w-full p-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-inset)] text-[var(--text-primary)] text-sm"
                                  placeholder="أضف ملاحظة..."
                                  rows={2}
                              />
                              <div className="flex gap-2 mt-2">
                                  <button onClick={handleEditSave} className="flex-1 py-1 text-xs rounded bg-green-600 text-white">حفظ</button>
                                  <button onClick={() => setEditingItem(null)} className="flex-1 py-1 text-xs rounded bg-[var(--bg-inset)]">إلغاء</button>
                              </div>
                          </div>
                      ) : (
                        <div className="mt-1 flex justify-between items-center gap-2 border-t border-[var(--border-secondary)] border-opacity-20 pt-1">
                             {item.notes ? (
                                <p className="text-xs text-[var(--text-secondary)] italic break-all flex-grow" onClick={() => setEditingItem({ id: item.id, note: item.notes || '' })}>
                                    📝 {item.notes}
                                </p>
                            ) : (
                                <button onClick={() => setEditingItem({ id: item.id, note: item.notes || '' })} className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-color)] opacity-50 hover:opacity-100">+ ملاحظة</button>
                            )}

                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteItem(item); }}
                                aria-label={`حذف ${item.expression}`}
                                className="text-sm text-red-500/50 hover:text-red-500 transition-colors px-2"
                            >🗑️</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
