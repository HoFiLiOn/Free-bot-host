import { useEffect, useState } from 'react';
import { useBotStore } from '../store/botStore';
import { startBot, stopBot } from '../engine/polling';
import { Play, Square, RotateCcw, MessageSquare, AlertTriangle, Clock, Zap, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  const { bots, activeBotId } = useBotStore();
  const bot = bots.find(b => b.id === activeBotId);
  const [uptime, setUptime] = useState('00:00:00');

  useEffect(() => {
    if (!bot?.stats.startedAt) {
      setUptime('00:00:00');
      return;
    }
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - (bot.stats.startedAt || 0)) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [bot?.stats.startedAt]);

  if (!bot) return null;

  const handleStart = () => startBot(bot.id);
  const handleStop = () => stopBot(bot.id);
  const handleRestart = async () => {
    stopBot(bot.id);
    setTimeout(() => startBot(bot.id), 500);
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-accent">{bot.name}</h2>
          <p className="text-xs text-text-muted font-mono mt-0.5">
            {bot.token.substring(0, 8)}...{bot.token.substring(bot.token.length - 6)}
          </p>
        </div>
        <div className="flex gap-2">
          {bot.status === 'running' ? (
            <>
              <button
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border hover:border-border-light text-text-secondary hover:text-text transition-colors"
              >
                <RotateCcw size={12} />
                Перезапуск
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-white text-black hover:bg-gray-200 transition-colors font-medium"
              >
                <Square size={12} />
                Остановить
              </button>
            </>
          ) : (
            <button
              onClick={handleStart}
              disabled={bot.status === 'connecting'}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded bg-white text-black hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              <Play size={12} />
              {bot.status === 'connecting' ? 'Подключение...' : 'Запустить'}
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg border mb-6 ${
        bot.status === 'running'
          ? 'bg-success/5 border-success/20'
          : bot.status === 'error'
          ? 'bg-error/5 border-error/20'
          : bot.status === 'connecting'
          ? 'bg-warning/5 border-warning/20'
          : 'bg-bg-tertiary border-border'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${
            bot.status === 'running' ? 'bg-success pulse-dot' :
            bot.status === 'error' ? 'bg-error' :
            bot.status === 'connecting' ? 'bg-warning pulse-dot' :
            'bg-text-muted'
          }`} />
          <div>
            <span className="text-sm font-medium text-text">
              {bot.status === 'running' ? 'Бот активен — Long Polling' :
               bot.status === 'error' ? 'Ошибка подключения' :
               bot.status === 'connecting' ? 'Подключение к Telegram API...' :
               'Бот остановлен'}
            </span>
            <p className="text-[10px] text-text-muted mt-0.5">
              {bot.status === 'running'
                ? 'Получает апдейты через getUpdates → Роутер → Обработчики'
                : 'Нажмите "Запустить" для начала Long Polling'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<ArrowDownLeft size={14} />}
          label="Получено"
          value={bot.stats.messagesReceived}
          color="text-info"
        />
        <StatCard
          icon={<ArrowUpRight size={14} />}
          label="Отправлено"
          value={bot.stats.messagesSent}
          color="text-success"
        />
        <StatCard
          icon={<AlertTriangle size={14} />}
          label="Ошибки"
          value={bot.stats.errors}
          color="text-error"
        />
        <StatCard
          icon={<Clock size={14} />}
          label="Аптайм"
          value={uptime}
          color="text-text-secondary"
          isText
        />
      </div>

      {/* Architecture Diagram */}
      <div className="bg-bg-secondary border border-border rounded-lg p-5">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap size={12} />
          Архитектура Runtime
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
          <ArchBlock
            title="Telegram API"
            desc="api.telegram.org"
            active={bot.status === 'running'}
          />
          <Arrow active={bot.status === 'running'} label="getUpdates" />
          <ArchBlock
            title="Long Polling"
            desc="Браузер (fetch)"
            active={bot.status === 'running'}
            highlight
          />
          <Arrow active={bot.status === 'running'} label="update" />
          <ArchBlock
            title="Роутер"
            desc={`${bot.handlers.filter(h => h.enabled).length} обработчиков`}
            active={bot.status === 'running'}
          />
        </div>

        <div className="flex justify-center my-2">
          <div className={`text-xs ${bot.status === 'running' ? 'text-text-muted' : 'text-text-muted/30'}`}>
            ↓ sendMessage
          </div>
        </div>

        <div className="flex justify-center">
          <div className={`px-4 py-2 rounded border text-center text-xs ${
            bot.status === 'running'
              ? 'border-border-light bg-bg-tertiary text-text'
              : 'border-border/50 text-text-muted/40'
          }`}>
            <div className="font-medium">Ответ пользователю</div>
            <div className="text-[10px] text-text-muted mt-0.5">sendMessage → Telegram API</div>
          </div>
        </div>
      </div>

      {/* Handlers Preview */}
      <div className="mt-4 bg-bg-secondary border border-border rounded-lg p-4">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <MessageSquare size={12} />
          Активные обработчики
        </h3>
        <div className="space-y-1.5">
          {bot.handlers.map(h => (
            <div key={h.id} className="flex items-center gap-2 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full ${h.enabled ? 'bg-success' : 'bg-text-muted/30'}`} />
              <span className="font-mono text-text-secondary">{h.pattern}</span>
              <span className="text-text-muted">→</span>
              <span className="text-text">{h.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted border border-border">
                {h.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, isText }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3">
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className={`text-xl font-bold ${isText ? 'text-text-secondary font-mono text-lg' : 'text-accent'}`}>
        {value}
      </div>
    </div>
  );
}

function ArchBlock({ title, desc, active, highlight }: {
  title: string;
  desc: string;
  active: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`px-3 py-2.5 rounded-lg border text-center transition-all ${
      active
        ? highlight
          ? 'border-white/30 bg-white/5 text-accent'
          : 'border-border-light bg-bg-tertiary text-text'
        : 'border-border/50 text-text-muted/40'
    }`}>
      <div className="text-xs font-bold">{title}</div>
      <div className="text-[10px] mt-0.5 opacity-60">{desc}</div>
    </div>
  );
}

function Arrow({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={`hidden md:flex flex-col items-center text-[10px] ${
      active ? 'text-text-muted' : 'text-text-muted/20'
    }`}>
      <span>{label}</span>
      <span>→</span>
    </div>
  );
}
