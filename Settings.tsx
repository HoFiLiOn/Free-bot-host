import { useState } from 'react';
import { useBotStore } from '../store/botStore';
import { Settings as SettingsIcon, Eye, EyeOff, Copy, Check, Shield, Key } from 'lucide-react';

export default function Settings() {
  const { bots, activeBotId } = useBotStore();
  const bot = bots.find(b => b.id === activeBotId);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!bot) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(bot.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-accent flex items-center gap-2">
          <SettingsIcon size={18} />
          Настройки
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Конфигурация бота "{bot.name}"
        </p>
      </div>

      {/* Bot Info */}
      <div className="bg-bg-secondary border border-border rounded-lg p-4 mb-4">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <Key size={12} />
          Токен бота
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-bg border border-border rounded px-3 py-2 font-mono text-xs text-text">
            {showToken ? bot.token : '•'.repeat(Math.min(bot.token.length, 40))}
          </div>
          <button
            onClick={() => setShowToken(!showToken)}
            className="p-2 rounded border border-border hover:border-border-light text-text-muted hover:text-text transition-colors"
          >
            {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded border border-border hover:border-border-light text-text-muted hover:text-text transition-colors"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-2">
          Токен используется для подключения к Telegram Bot API через Long Polling
        </p>
      </div>

      {/* Security Info */}
      <div className="bg-bg-secondary border border-border rounded-lg p-4 mb-4">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <Shield size={12} />
          Безопасность
        </h3>
        <div className="space-y-2 text-xs text-text-secondary">
          <div className="flex items-start gap-2 p-2 bg-bg rounded border border-border">
            <span className="text-warning mt-0.5">⚠️</span>
            <div>
              <p className="font-medium text-text">Токен хранится в памяти браузера</p>
              <p className="text-text-muted mt-0.5">
                При перезагрузке страницы все данные будут потеряны. Токен не отправляется на сервер —
                все запросы идут напрямую к api.telegram.org из вашего браузера.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 bg-bg rounded border border-border">
            <span className="mt-0.5">🔒</span>
            <div>
              <p className="font-medium text-text">Прямое подключение</p>
              <p className="text-text-muted mt-0.5">
                Long Polling работает через fetch API браузера → Telegram API. Никаких промежуточных серверов.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Details */}
      <div className="bg-bg-secondary border border-border rounded-lg p-4">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
          ⚙️ Как работает Runtime
        </h3>
        <div className="space-y-3 text-xs">
          <Step
            num={1}
            title="Long Polling"
            desc="Браузер делает запрос getUpdates к Telegram API с timeout=30с. Telegram держит соединение открытым, пока не появится новое сообщение."
          />
          <Step
            num={2}
            title="Роутер сообщений"
            desc="Входящий update попадает в роутер. Роутер перебирает обработчики по приоритету: command → regex → text. Первый подходящий — выполняется."
          />
          <Step
            num={3}
            title="Обработчики"
            desc="Пользовательский код выполняется с контекстом (ctx). ctx.reply() отправляет ответ, ctx.message содержит данные сообщения, ctx.log() пишет в лог."
          />
          <Step
            num={4}
            title="sendMessage"
            desc="ctx.reply() вызывает sendMessage через Telegram API. Ответ доставляется пользователю в Telegram."
          />
        </div>
      </div>
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold shrink-0">
        {num}
      </div>
      <div>
        <p className="font-medium text-text">{title}</p>
        <p className="text-text-muted mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
