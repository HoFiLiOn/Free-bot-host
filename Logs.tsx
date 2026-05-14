import { useEffect, useRef, useState } from 'react';
import { useBotStore, LogEntry } from '../store/botStore';
import { Trash2, Download, Filter, Terminal } from 'lucide-react';

const levelConfig: Record<LogEntry['level'], { color: string; label: string; bg: string }> = {
  info: { color: 'text-info', label: 'INF', bg: 'bg-info/10' },
  error: { color: 'text-error', label: 'ERR', bg: 'bg-error/10' },
  warn: { color: 'text-warning', label: 'WRN', bg: 'bg-warning/10' },
  debug: { color: 'text-text-muted', label: 'DBG', bg: 'bg-bg-tertiary' },
};

export default function Logs() {
  const { bots, activeBotId, clearLogs } = useBotStore();
  const bot = bots.find(b => b.id === activeBotId);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<LogEntry['level'] | 'all'>('all');
  const [searchText, setSearchText] = useState('');

  const filteredLogs = (bot?.logs || []).filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchText && !log.message.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs.length, autoScroll]);

  if (!bot) return null;

  const handleExport = () => {
    const content = bot.logs.map(log => {
      const time = new Date(log.timestamp).toISOString();
      return `[${time}] [${log.level.toUpperCase()}] ${log.message}`;
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bot.name}-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('ru-RU', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  };

  return (
    <div className="p-6 flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-accent flex items-center gap-2">
            <Terminal size={18} />
            Логи
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {bot.logs.length} записей • {filteredLogs.length} показано
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border border-border hover:border-border-light text-text-muted hover:text-text transition-colors"
          >
            <Download size={11} />
            Экспорт
          </button>
          <button
            onClick={() => clearLogs(bot.id)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border border-border hover:border-error/50 text-text-muted hover:text-error transition-colors"
          >
            <Trash2 size={11} />
            Очистить
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3">
        <Filter size={12} className="text-text-muted" />
        <div className="flex gap-1">
          {(['all', 'info', 'error', 'warn', 'debug'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-colors uppercase tracking-wider ${
                filterLevel === level
                  ? 'bg-white text-black border-white'
                  : 'border-border text-text-muted hover:border-border-light'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Поиск..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="ml-2 bg-bg border border-border rounded px-2 py-0.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-border-light flex-1 max-w-xs"
        />
        <label className="flex items-center gap-1.5 text-[10px] text-text-muted ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={e => setAutoScroll(e.target.checked)}
            className="accent-white"
          />
          Автопрокрутка
        </label>
      </div>

      {/* Log Entries */}
      <div className="flex-1 bg-bg-secondary border border-border rounded-lg overflow-y-auto font-mono text-xs min-h-0">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted/40">
            <div className="text-center">
              <Terminal size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Нет логов</p>
              <p className="text-[10px] mt-1 opacity-50">Запустите бота для получения логов</p>
            </div>
          </div>
        ) : (
          <div className="p-1">
            {filteredLogs.map(log => {
              const config = levelConfig[log.level];
              return (
                <div
                  key={log.id}
                  className={`flex gap-2 px-2 py-1 rounded hover:bg-bg-hover/30 group ${config.bg} mb-px`}
                >
                  <span className="text-text-muted/50 whitespace-nowrap select-all">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className={`${config.color} font-bold w-7 text-center shrink-0`}>
                    {config.label}
                  </span>
                  <span className="text-text break-all">{log.message}</span>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
