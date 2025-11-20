
export interface TaxSettings {
  isEnabled: boolean;
  mode: 'add-15' | 'divide-93' | 'custom' | 'extract-custom';
  rate: number;
  showTaxPerNumber: boolean;
}

export interface HistoryItem {
  id: number;
  expression: string;
  result: string;
  taxResult?: string | null;
  taxMode?: string | null;
  taxRate?: number | null;
  taxLabel?: string | null;
  date: string;
  time: string;
  notes?: string;
}

export interface ButtonConfig {
  id: string;
  label: string;
  value?: string;
  action?: 'clear' | 'backspace' | 'calculate' | 'toggleSign' | 'parenthesis' | 'appendAnswer';
  type: 'number' | 'operator' | 'function' | 'equals';
  span?: number;
  icon?: string;
}

export interface ErrorDetails {
  pre: string;
  highlight: string;
  post: string;
}

export interface ErrorState {
  message: string;
  details: ErrorDetails | null;
}

export interface AISuggestion {
  fix: string;
  message: string;
}
