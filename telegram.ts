// Telegram Bot API — Long Polling Engine
// Работает прямо в браузере через CORS-прокси или напрямую

const TG_API = 'https://api.telegram.org';

export async function callTelegramAPI(
  token: string,
  method: string,
  params?: Record<string, any>,
  signal?: AbortSignal
): Promise<any> {
  const url = `${TG_API}/bot${token}/${method}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: params ? JSON.stringify(params) : undefined,
    signal,
  });

  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.description || `Telegram API error: ${method}`);
  }
  
  return data.result;
}

export async function getMe(token: string) {
  return callTelegramAPI(token, 'getMe');
}

export async function getUpdates(
  token: string,
  offset: number,
  signal?: AbortSignal
) {
  return callTelegramAPI(token, 'getUpdates', {
    offset,
    timeout: 30,
    allowed_updates: ['message', 'callback_query', 'edited_message'],
  }, signal);
}

export async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  extra?: Record<string, any>
) {
  return callTelegramAPI(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

export async function deleteWebhook(token: string) {
  return callTelegramAPI(token, 'deleteWebhook', { drop_pending_updates: false });
}
