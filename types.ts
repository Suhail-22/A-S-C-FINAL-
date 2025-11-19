
export interface HistoryItem {
  id: number;
  expression: string;
  result: string;
  taxResult: string | null;
  taxMode: string | null;
  taxRate: number | null;
  taxLabel: string | null;
  date: string;
  time: string;
  notes: string;
}

export interface TaxSettings {
  isEnabled: boolean;
  mode: 'add-15' | 'divide-93' | 'custom' | 'extract-custom';
  rate: number;
  showTaxPerNumber: boolean;
}

export interface ErrorState {
  message: string;
  details: {
    pre: string;
    highlight: string;
    post: string;
  } | null;
}

export interface AISuggestion {
  message: string;
  fix: string | null;
}

export interface ButtonConfig {
  id: string;
  label: string;
  value?: string;
  action?: 'appendAnswer' | 'backspace' | 'clear' | 'toggleSign' | 'parenthesis' | 'calculate';
  type: 'operator' | 'function' | 'number' | 'equals';
  icon?: string;
  span?: number;
}