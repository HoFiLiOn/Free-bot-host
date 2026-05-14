// Message Router — направляет входящие апдейты к нужным обработчикам

import { BotHandler, TelegramUpdate } from '../store/botStore';
import { sendMessage } from './telegram';

interface HandlerContext {
  message: TelegramUpdate['message'];
  update: TelegramUpdate;
  reply: (text: string) => Promise<any>;
  log: (level: 'info' | 'error' | 'warn' | 'debug', message: string) => void;
}

export async function routeUpdate(
  update: TelegramUpdate,
  handlers: BotHandler[],
  token: string,
  addLog: (level: 'info' | 'error' | 'warn' | 'debug', message: string, data?: any) => void,
  incrementSent: () => void
): Promise<boolean> {
  const message = update.message;
  if (!message || !message.text) return false;

  const text = message.text;
  const enabledHandlers = handlers.filter(h => h.enabled);

  // 1. Проверяем command handlers
  for (const handler of enabledHandlers.filter(h => h.type === 'command')) {
    const cmd = handler.pattern.startsWith('/') ? handler.pattern : `/${handler.pattern}`;
    if (text === cmd || text.startsWith(cmd + ' ') || text.startsWith(cmd + '@')) {
      await executeHandler(handler, update, token, addLog, incrementSent);
      return true;
    }
  }

  // 2. Проверяем regex handlers
  for (const handler of enabledHandlers.filter(h => h.type === 'regex')) {
    try {
      const regex = new RegExp(handler.pattern, 'i');
      if (regex.test(text)) {
        await executeHandler(handler, update, token, addLog, incrementSent);
        return true;
      }
    } catch (e) {
      addLog('error', `Ошибка regex в хендлере "${handler.name}": ${e}`);
    }
  }

  // 3. Проверяем text handlers
  for (const handler of enabledHandlers.filter(h => h.type === 'text')) {
    try {
      const regex = new RegExp(handler.pattern, 'i');
      if (regex.test(text)) {
        await executeHandler(handler, update, token, addLog, incrementSent);
        return true;
      }
    } catch (e) {
      addLog('error', `Ошибка в обработчике "${handler.name}": ${e}`);
    }
  }

  return false;
}

async function executeHandler(
  handler: BotHandler,
  update: TelegramUpdate,
  token: string,
  addLog: (level: 'info' | 'error' | 'warn' | 'debug', message: string, data?: any) => void,
  incrementSent: () => void
) {
  const message = update.message!;
  const chatId = message.chat.id;

  const ctx: HandlerContext = {
    message,
    update,
    reply: async (text: string) => {
      const result = await sendMessage(token, chatId, text);
      incrementSent();
      addLog('debug', `→ Ответ в чат ${chatId}: ${text.substring(0, 80)}...`);
      return result;
    },
    log: (level, msg) => addLog(level, `[${handler.name}] ${msg}`),
  };

  try {
    addLog('debug', `⚡ Обработчик "${handler.name}" для: ${message.text?.substring(0, 50)}`);
    
    // Выполняем пользовательский код
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('ctx', handler.code);
    await fn(ctx);
  } catch (error: any) {
    addLog('error', `❌ Ошибка в "${handler.name}": ${error.message}`);
    try {
      await sendMessage(token, chatId, `⚠️ Ошибка обработки: ${error.message}`);
    } catch (_) {}
  }
}
