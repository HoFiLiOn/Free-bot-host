import { useState } from 'react';
import { useBotStore, Bot } from '../store/botStore';
import { Plus, Bot as BotIcon, Trash2, Circle } from 'lucide-react';

const statusColors: Record<Bot['status'], string> = {
  stopped: 'text-text-muted',
  running: 'text-success',
  error: 'text-error',
  connecting: 'text-warning',
};

const statusLabels: Record<Bot['status'], string> = {
  stopped: 'Остановлен',
  running: 'Работает',
  error: 'Ошибка',
  connecting: 'Подключение...',
};

export default function Sidebar() {
  const { bots, activeBotId, setActiveBotId, addBot, removeBot } = useBotStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newToken, setNewToken] = useState('');

  const handleAdd = () => {
    if (newName.trim() && newToken.trim()) {
      addBot(newName.trim(), newToken.trim());
      setNewName('');
      setNewToken('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="w-72 min-w-[288px] bg-bg-secondary border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <BotIcon size={18} className="text-black" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-accent tracking-wide">TG BOT RUNTIME</h1>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">Hosting Platform</p>
          </div>
        </div>
      </div>

      {/* Bot List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1.5 mb-1">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Боты ({bots.length})</span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-accent transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mx-1 mb-2 p-3 bg-bg-tertiary border border-border rounded-lg animate-slide-in">
            <input
              type="text"
              placeholder="Имя бота"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full bg-bg border border-border rounded px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-border-light mb-2"
            />
            <input
              type="text"
              placeholder="Bot Token (от @BotFather)"
              value={newToken}
              onChange={e => setNewToken(e.target.value)}
              className="w-full bg-bg border border-border rounded px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-border-light mb-2 font-mono"
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || !newToken.trim()}
                className="flex-1 bg-white text-black text-xs py-1.5 rounded font-medium hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Создать
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 text-xs py-1.5 rounded border border-border text-text-muted hover:text-text hover:border-border-light transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Bot items */}
        {bots.map(bot => (
          <button
            key={bot.id}
            onClick={() => setActiveBotId(bot.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 flex items-center gap-2.5 group transition-all ${
              activeBotId === bot.id
                ? 'bg-bg-hover border border-border-light'
                : 'border border-transparent hover:bg-bg-hover/50'
            }`}
          >
            <Circle
              size={8}
              className={`${statusColors[bot.status]} ${bot.status === 'running' ? 'pulse-dot fill-current' : ''}`}
              fill={bot.status === 'running' ? 'currentColor' : 'none'}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-text truncate">{bot.name}</div>
              <div className={`text-[10px] ${statusColors[bot.status]}`}>
                {statusLabels[bot.status]}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Удалить бота "${bot.name}"?`)) {
                  removeBot(bot.id);
                }
              }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg text-text-muted hover:text-error transition-all"
            >
              <Trash2 size={12} />
            </button>
          </button>
        ))}

        {bots.length === 0 && !showAddForm && (
          <div className="text-center py-12 px-4">
            <BotIcon size={32} className="mx-auto mb-3 text-text-muted opacity-30" />
            <p className="text-xs text-text-muted mb-1">Нет ботов</p>
            <p className="text-[10px] text-text-muted/60">Нажмите + чтобы добавить</p>
          </div>
        )}
      </div>

      {/* Architecture Info */}
      <div className="p-3 border-t border-border">
        <div className="text-[9px] text-text-muted/50 font-mono space-y-0.5 leading-relaxed">
          <div>TG API ←→ Long Polling</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Роутер сообщений</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Обработчики</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓</div>
          <div>&nbsp;&nbsp;&nbsp;sendMessage → TG API</div>
        </div>
      </div>
    </div>
  );
}
