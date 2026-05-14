import { useState } from 'react';
import { useBotStore, BotHandler } from '../store/botStore';
import { Plus, Trash2, ToggleLeft, ToggleRight, Code, ChevronDown, ChevronRight, Terminal } from 'lucide-react';

export default function Handlers() {
  const { bots, activeBotId, addHandler, updateHandler, removeHandler } = useBotStore();
  const bot = bots.find(b => b.id === activeBotId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newHandler, setNewHandler] = useState({
    name: '',
    pattern: '',
    type: 'command' as BotHandler['type'],
    code: '// Ваш код обработчика\nawait ctx.reply("Привет!");',
    enabled: true,
  });

  if (!bot) return null;

  const handleAddSubmit = () => {
    if (newHandler.name && newHandler.pattern) {
      addHandler(bot.id, newHandler);
      setNewHandler({
        name: '',
        pattern: '',
        type: 'command',
        code: '// Ваш код обработчика\nawait ctx.reply("Привет!");',
        enabled: true,
      });
      setShowAdd(false);
    }
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-accent flex items-center gap-2">
            <Code size={18} />
            Обработчики
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Роутер направляет сообщения → обработчики выполняют ваш код
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-white text-black hover:bg-gray-200 transition-colors font-medium"
        >
          <Plus size={12} />
          Добавить
        </button>
      </div>

      {/* Add New Handler Form */}
      {showAdd && (
        <div className="bg-bg-secondary border border-border rounded-lg p-4 mb-4 animate-slide-in">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
            Новый обработчик
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Имя</label>
              <input
                type="text"
                value={newHandler.name}
                onChange={e => setNewHandler(p => ({ ...p, name: e.target.value }))}
                placeholder="Название"
                className="w-full bg-bg border border-border rounded px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-border-light"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Паттерн</label>
              <input
                type="text"
                value={newHandler.pattern}
                onChange={e => setNewHandler(p => ({ ...p, pattern: e.target.value }))}
                placeholder="/command или regex"
                className="w-full bg-bg border border-border rounded px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-border-light font-mono"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Тип</label>
            <div className="flex gap-1.5">
              {(['command', 'text', 'regex', 'callback'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setNewHandler(p => ({ ...p, type }))}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    newHandler.type === type
                      ? 'bg-white text-black border-white'
                      : 'border-border text-text-muted hover:border-border-light'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Код</label>
            <textarea
              value={newHandler.code}
              onChange={e => setNewHandler(p => ({ ...p, code: e.target.value }))}
              rows={6}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-border-light font-mono resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddSubmit}
              disabled={!newHandler.name || !newHandler.pattern}
              className="px-4 py-1.5 text-xs rounded bg-white text-black hover:bg-gray-200 transition-colors font-medium disabled:opacity-30"
            >
              Создать обработчик
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-xs rounded border border-border text-text-muted hover:text-text transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Pipeline Visualization */}
      <div className="bg-bg-secondary border border-border rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono">
          <span className="text-text-secondary">incoming message</span>
          <span>→</span>
          <span className="text-accent">router.match()</span>
          <span>→</span>
          {bot.handlers.filter(h => h.enabled).map((h, i) => (
            <span key={h.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-text-muted/30">|</span>}
              <span className="px-1.5 py-0.5 bg-bg-tertiary rounded border border-border text-text-secondary">
                {h.pattern}
              </span>
            </span>
          ))}
          <span>→</span>
          <span className="text-success">ctx.reply()</span>
        </div>
      </div>

      {/* Handler List */}
      <div className="space-y-2">
        {bot.handlers.map((handler, index) => (
          <HandlerCard
            key={handler.id}
            handler={handler}
            index={index}
            expanded={expandedId === handler.id}
            onToggleExpand={() => setExpandedId(expandedId === handler.id ? null : handler.id)}
            onToggleEnabled={() => updateHandler(bot.id, handler.id, { enabled: !handler.enabled })}
            onUpdateCode={(code) => updateHandler(bot.id, handler.id, { code })}
            onUpdatePattern={(pattern) => updateHandler(bot.id, handler.id, { pattern })}
            onDelete={() => {
              if (confirm(`Удалить обработчик "${handler.name}"?`)) {
                removeHandler(bot.id, handler.id);
              }
            }}
          />
        ))}
      </div>

      {bot.handlers.length === 0 && (
        <div className="text-center py-16">
          <Terminal size={32} className="mx-auto mb-3 text-text-muted opacity-30" />
          <p className="text-sm text-text-muted">Нет обработчиков</p>
          <p className="text-xs text-text-muted/50 mt-1">Добавьте обработчик для обработки сообщений</p>
        </div>
      )}

      {/* API Reference */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-lg p-4">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
          📖 API Контекста (ctx)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 bg-bg rounded border border-border">
            <span className="text-info">ctx.message</span>
            <span className="text-text-muted"> — входящее сообщение</span>
          </div>
          <div className="p-2 bg-bg rounded border border-border">
            <span className="text-info">ctx.message.text</span>
            <span className="text-text-muted"> — текст сообщения</span>
          </div>
          <div className="p-2 bg-bg rounded border border-border">
            <span className="text-info">ctx.message.from</span>
            <span className="text-text-muted"> — отправитель</span>
          </div>
          <div className="p-2 bg-bg rounded border border-border">
            <span className="text-success">ctx.reply(text)</span>
            <span className="text-text-muted"> — ответить</span>
          </div>
          <div className="p-2 bg-bg rounded border border-border">
            <span className="text-warning">ctx.log(level, msg)</span>
            <span className="text-text-muted"> — в лог</span>
          </div>
          <div className="p-2 bg-bg rounded border border-border">
            <span className="text-info">ctx.update</span>
            <span className="text-text-muted"> — полный апдейт</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HandlerCard({
  handler,
  index,
  expanded,
  onToggleExpand,
  onToggleEnabled,
  onUpdateCode,
  onUpdatePattern,
  onDelete,
}: {
  handler: BotHandler;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
  onUpdateCode: (code: string) => void;
  onUpdatePattern: (pattern: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className={`bg-bg-secondary border rounded-lg transition-all ${
      handler.enabled ? 'border-border' : 'border-border/50 opacity-60'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={onToggleExpand}>
        <span className="text-text-muted/40 text-[10px] font-mono w-4">{String(index + 1).padStart(2, '0')}</span>
        {expanded ? <ChevronDown size={12} className="text-text-muted" /> : <ChevronRight size={12} className="text-text-muted" />}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-text">{handler.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted border border-border font-mono">
            {handler.type}
          </span>
          <span className="text-[10px] text-text-muted font-mono truncate">
            pattern: {handler.pattern}
          </span>
        </div>
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button onClick={onToggleEnabled} className="p-0.5">
            {handler.enabled ? (
              <ToggleRight size={18} className="text-success" />
            ) : (
              <ToggleLeft size={18} className="text-text-muted" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-bg text-text-muted hover:text-error transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border px-3 py-3 animate-slide-in">
          <div className="mb-2">
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Паттерн</label>
            <input
              type="text"
              value={handler.pattern}
              onChange={e => onUpdatePattern(e.target.value)}
              className="w-full bg-bg border border-border rounded px-2.5 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-border-light"
            />
          </div>
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Код обработчика</label>
            <textarea
              value={handler.code}
              onChange={e => onUpdateCode(e.target.value)}
              rows={12}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-xs text-text font-mono focus:outline-none focus:border-border-light resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
