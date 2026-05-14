import { create } from 'zustand';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  data?: any;
}

export interface BotHandler {
  id: string;
  name: string;
  pattern: string;  // regex or command like /start
  type: 'command' | 'text' | 'regex' | 'callback';
  code: string;
  enabled: boolean;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string; is_bot: boolean };
    chat: { id: number; type: string; first_name?: string; username?: string };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name: string; username?: string };
    data?: string;
  };
}

export interface Bot {
  id: string;
  name: string;
  token: string;
  status: 'stopped' | 'running' | 'error' | 'connecting';
  handlers: BotHandler[];
  logs: LogEntry[];
  stats: {
    messagesReceived: number;
    messagesSent: number;
    errors: number;
    uptime: number;
    startedAt?: number;
  };
  pollingOffset: number;
  abortController?: AbortController;
}

interface BotStore {
  bots: Bot[];
  activeBotId: string | null;
  activeTab: 'dashboard' | 'handlers' | 'logs' | 'settings';
  
  addBot: (name: string, token: string) => void;
  removeBot: (id: string) => void;
  setActiveBotId: (id: string | null) => void;
  setActiveTab: (tab: 'dashboard' | 'handlers' | 'logs' | 'settings') => void;
  
  updateBotStatus: (id: string, status: Bot['status']) => void;
  addLog: (botId: string, level: LogEntry['level'], message: string, data?: any) => void;
  clearLogs: (botId: string) => void;
  
  addHandler: (botId: string, handler: Omit<BotHandler, 'id'>) => void;
  updateHandler: (botId: string, handlerId: string, updates: Partial<BotHandler>) => void;
  removeHandler: (botId: string, handlerId: string) => void;
  
  incrementStat: (botId: string, stat: 'messagesReceived' | 'messagesSent' | 'errors') => void;
  setPollingOffset: (botId: string, offset: number) => void;
  setAbortController: (botId: string, controller: AbortController | undefined) => void;
  setBotStartedAt: (botId: string, time: number | undefined) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

const DEFAULT_HANDLERS: Omit<BotHandler, 'id'>[] = [
  {
    name: '/start',
    pattern: '/start',
    type: 'command',
    enabled: true,
    code: `// Обработчик команды /start
// ctx.message — входящее сообщение
// ctx.reply(text) — отправить ответ

const user = ctx.message.from.first_name;
await ctx.reply(\`👋 Привет, \${user}!\\n\\nЯ бот, работающий на TG Bot Runtime.\\nНапиши /help для списка команд.\`);
ctx.log('info', \`Новый пользователь: \${user}\`);`
  },
  {
    name: '/help',
    pattern: '/help',
    type: 'command',
    enabled: true,
    code: `// Обработчик команды /help
await ctx.reply(\`📋 Доступные команды:\\n\\n/start — Начать\\n/help — Помощь\\n/ping — Проверка связи\\n/info — Информация о боте\`);`
  },
  {
    name: '/ping',
    pattern: '/ping',
    type: 'command',
    enabled: true,
    code: `// Обработчик команды /ping
const start = Date.now();
await ctx.reply(\`🏓 Pong! Задержка: \${Date.now() - start}ms\`);`
  },
  {
    name: 'Echo',
    pattern: '.*',
    type: 'text',
    enabled: true,
    code: `// Эхо-обработчик — повторяет текст
// Срабатывает на любой текст, не обработанный другими хендлерами
const text = ctx.message.text;
if (text && !text.startsWith('/')) {
  await ctx.reply(\`📝 Вы написали: \${text}\`);
}`
  }
];

export const useBotStore = create<BotStore>((set, get) => ({
  bots: [],
  activeBotId: null,
  activeTab: 'dashboard',

  addBot: (name, token) => {
    const id = generateId();
    const bot: Bot = {
      id,
      name,
      token,
      status: 'stopped',
      handlers: DEFAULT_HANDLERS.map(h => ({ ...h, id: generateId() })),
      logs: [],
      stats: { messagesReceived: 0, messagesSent: 0, errors: 0, uptime: 0 },
      pollingOffset: 0,
    };
    set(state => ({ bots: [...state.bots, bot], activeBotId: id }));
  },

  removeBot: (id) => {
    const bot = get().bots.find(b => b.id === id);
    if (bot?.abortController) bot.abortController.abort();
    set(state => ({
      bots: state.bots.filter(b => b.id !== id),
      activeBotId: state.activeBotId === id ? null : state.activeBotId
    }));
  },

  setActiveBotId: (id) => set({ activeBotId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  updateBotStatus: (id, status) =>
    set(state => ({
      bots: state.bots.map(b => b.id === id ? { ...b, status } : b)
    })),

  addLog: (botId, level, message, data) =>
    set(state => ({
      bots: state.bots.map(b =>
        b.id === botId
          ? {
              ...b,
              logs: [...b.logs.slice(-500), {
                id: generateId(),
                timestamp: Date.now(),
                level,
                message,
                data,
              }]
            }
          : b
      )
    })),

  clearLogs: (botId) =>
    set(state => ({
      bots: state.bots.map(b => b.id === botId ? { ...b, logs: [] } : b)
    })),

  addHandler: (botId, handler) =>
    set(state => ({
      bots: state.bots.map(b =>
        b.id === botId
          ? { ...b, handlers: [...b.handlers, { ...handler, id: generateId() }] }
          : b
      )
    })),

  updateHandler: (botId, handlerId, updates) =>
    set(state => ({
      bots: state.bots.map(b =>
        b.id === botId
          ? {
              ...b,
              handlers: b.handlers.map(h =>
                h.id === handlerId ? { ...h, ...updates } : h
              )
            }
          : b
      )
    })),

  removeHandler: (botId, handlerId) =>
    set(state => ({
      bots: state.bots.map(b =>
        b.id === botId
          ? { ...b, handlers: b.handlers.filter(h => h.id !== handlerId) }
          : b
      )
    })),

  incrementStat: (botId, stat) =>
    set(state => ({
      bots: state.bots.map(b =>
        b.id === botId
          ? { ...b, stats: { ...b.stats, [stat]: b.stats[stat] + 1 } }
          : b
      )
    })),

  setPollingOffset: (botId, offset) =>
    set(state => ({
      bots: state.bots.map(b => b.id === botId ? { ...b, pollingOffset: offset } : b)
    })),

  setAbortController: (botId, controller) =>
    set(state => ({
      bots: state.bots.map(b => b.id === botId ? { ...b, abortController: controller } : b)
    })),

  setBotStartedAt: (botId, time) =>
    set(state => ({
      bots: state.bots.map(b =>
        b.id === botId ? { ...b, stats: { ...b.stats, startedAt: time } } : b
      )
    })),
}));
