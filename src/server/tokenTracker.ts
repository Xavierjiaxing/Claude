import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('./data');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

interface TokenData {
  inputTokens: number;
  outputTokens: number;
  dailyHistory: { date: string; inputTokens: number; outputTokens: number }[];
}

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function save(): void {
  ensureDir();
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

let state: TokenData = (() => {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const raw = fs.readFileSync(TOKENS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        inputTokens: parsed.inputTokens || 0,
        outputTokens: parsed.outputTokens || 0,
        dailyHistory: Array.isArray(parsed.dailyHistory) ? parsed.dailyHistory : [],
      };
    }
  } catch { /* fresh start */ }
  return { inputTokens: 0, outputTokens: 0, dailyHistory: [] };
})();

export function recordTokens(input: number, output: number): void {
  state.inputTokens += input;
  state.outputTokens += output;

  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = state.dailyHistory.find((d) => d.date === today);
  if (todayEntry) {
    todayEntry.inputTokens += input;
    todayEntry.outputTokens += output;
  } else {
    state.dailyHistory.push({ date: today, inputTokens: input, outputTokens: output });
    if (state.dailyHistory.length > 90) {
      state.dailyHistory = state.dailyHistory.slice(-90);
    }
  }

  save();
}

export function getTokenStats(): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  dailyHistory: { date: string; inputTokens: number; outputTokens: number }[];
} {
  return {
    inputTokens: state.inputTokens,
    outputTokens: state.outputTokens,
    totalTokens: state.inputTokens + state.outputTokens,
    dailyHistory: state.dailyHistory,
  };
}
