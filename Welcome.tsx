import { useBotStore } from '../store/botStore';
import { useState } from 'react';
import { Bot, Zap, Code, Terminal, ArrowRight, Shield } from 'lucide-react';

export default function Welcome() {
  const { addBot } = useBotStore();
  const [name, setName] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && token.trim()) {
      addBot(name.trim(), token.trim());
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-8 animate-fade-in">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-xl mb-4">
            <Bot size={32} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-accent tracking-tight">TG Bot Runtime</h1>
          <p className="text-sm text-text-muted mt-1">Хостинг Telegram ботов прямо в браузере</p>
        </div>

        {/* Architecture */}
        <div className="bg-bg-secondary border border-border rounded-lg p-4 mb-6">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3 text-center font-bold">
            Архитектура
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono flex-wrap">
            <span className="px-2 py-1 bg-bg-tertiary border border-border rounded text-text-secondary">Telegram API</span>
            <ArrowRight size={12} className="text-text-muted" />
            <span className="px-2 py-1 bg-white/5 border border-white/20 rounded text-accent">Long Polling</span>
            <ArrowRight size={12} className="text-text-muted" />
            <span className="px-2 py-1 bg-bg-tertiary border border-border rounded text-text-secondary">Роутер</span>
            <ArrowRight size={12} className="text-text-muted" />
            <span className="px-2 py-1 bg-bg-tertiary border border-border rounded text-text-secondary">Обработчики</span>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <Feature icon={<Zap size={14} />} title="Long Polling" desc="Прямо из браузера" />
          <Feature icon={<Code size={14} />} title="Код обработчиков" desc="JavaScript в реальном времени" />
          <Feature icon={<Terminal size={14} />} title="Логи" desc="Мониторинг в реальном времени" />
          <Feature icon={<Shield size={14} />} title="Безопасно" desc="Токен только в браузере" />
        </div>

        {/* Quick Start Form */}
        <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border rounded-lg p-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
            Быстрый старт
          </h3>
          <input
            type="text"
            placeholder="Имя бота"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-border-light mb-2"
          />
          <input
            type="text"
            placeholder="Токен от @BotFather"
            value={token}
            onChange={e => setToken(e.target.value)}
            className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-border-light mb-3 font-mono"
          />
          <button
            type="submit"
            disabled={!name.trim() || !token.trim()}
            className="w-full bg-white text-black py-2 rounded font-medium text-sm hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Bot size={16} />
            Создать бота
          </button>
          <p className="text-[10px] text-text-muted/50 text-center mt-2">
            Получите токен у @BotFather в Telegram → /newbot
          </p>
        </form>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-3 bg-bg-secondary border border-border rounded-lg">
      <div className="text-accent mb-1">{icon}</div>
      <div className="text-xs font-medium text-text">{title}</div>
      <div className="text-[10px] text-text-muted">{desc}</div>
    </div>
  );
}
