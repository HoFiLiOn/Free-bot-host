// Long Polling Engine — работает в браузере
// Подключается к Telegram API, получает апдейты и передаёт роутеру

import { useBotStore } from '../store/botStore';
import { getMe, getUpdates, deleteWebhook } from './telegram';
import { routeUpdate } from './router';

export async function startBot(botId: string) {
  const store = useBotStore.getState();
  const bot = store.bots.find(b => b.id === botId);
  if (!bot) return;

  const { addLog, updateBotStatus, setAbortController, setBotStartedAt } = store;

  // Проверяем токен
  addLog(botId, 'info', '🔄 Проверка токена...');
  updateBotStatus(botId, 'connecting');

  try {
    const me = await getMe(bot.token);
    addLog(botId, 'info', `✅ Бот подключён: @${me.username} (${me.first_name})`);

    // Удаляем webhook если есть
    await deleteWebhook(bot.token);
    addLog(botId, 'info', '🔗 Webhook удалён, переключаемся на Long Polling');
  } catch (error: any) {
    addLog(botId, 'error', `❌ Ошибка подключения: ${error.message}`);
    updateBotStatus(botId, 'error');
    return;
  }

  // Запускаем polling
  const abortController = new AbortController();
  setAbortController(botId, abortController);
  updateBotStatus(botId, 'running');
  setBotStartedAt(botId, Date.now());
  addLog(botId, 'info', '🚀 Long Polling запущен');

  // Polling loop
  pollLoop(botId, abortController.signal);
}

async function pollLoop(botId: string, signal: AbortSignal) {
  while (!signal.aborted) {
    try {
      const store = useBotStore.getState();
      const bot = store.bots.find(b => b.id === botId);
      if (!bot || bot.status !== 'running') break;

      const updates = await getUpdates(bot.token, bot.pollingOffset, signal);

      if (updates && updates.length > 0) {
        for (const update of updates) {
          const freshStore = useBotStore.getState();
          const freshBot = freshStore.bots.find(b => b.id === botId);
          if (!freshBot) break;

          freshStore.incrementStat(botId, 'messagesReceived');

          if (update.message?.text) {
            freshStore.addLog(
              botId,
              'info',
              `📩 ${update.message.from.first_name}: ${update.message.text.substring(0, 100)}`
            );
          }

          // Роутим сообщение к обработчикам
          const handled = await routeUpdate(
            update,
            freshBot.handlers,
            freshBot.token,
            (level, message, data) => useBotStore.getState().addLog(botId, level, message, data),
            () => useBotStore.getState().incrementStat(botId, 'messagesSent')
          );

          if (!handled && update.message?.text) {
            useBotStore.getState().addLog(botId, 'warn', `⚠️ Нет обработчика для: ${update.message.text}`);
          }

          // Обновляем offset
          useBotStore.getState().setPollingOffset(botId, update.update_id + 1);
        }
      }
    } catch (error: any) {
      if (signal.aborted) break;
      
      if (error.name === 'AbortError') break;
      
      useBotStore.getState().addLog(botId, 'error', `❌ Polling ошибка: ${error.message}`);
      useBotStore.getState().incrementStat(botId, 'errors');
      
      // Ждём перед повторной попыткой
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

export function stopBot(botId: string) {
  const store = useBotStore.getState();
  const bot = store.bots.find(b => b.id === botId);
  if (!bot) return;

  if (bot.abortController) {
    bot.abortController.abort();
  }

  store.setAbortController(botId, undefined);
  store.updateBotStatus(botId, 'stopped');
  store.setBotStartedAt(botId, undefined);
  store.addLog(botId, 'info', '⏹️ Бот остановлен');
}
