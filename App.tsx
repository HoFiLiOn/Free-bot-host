import { useBotStore } from './store/botStore';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Handlers from './components/Handlers';
import Logs from './components/Logs';
import Settings from './components/Settings';
import Welcome from './components/Welcome';
import { LayoutDashboard, Code, Terminal, Settings as SettingsIcon } from 'lucide-react';

const tabs = [
  { id: 'dashboard' as const, label: 'Дашборд', icon: LayoutDashboard },
  { id: 'handlers' as const, label: 'Обработчики', icon: Code },
  { id: 'logs' as const, label: 'Логи', icon: Terminal },
  { id: 'settings' as const, label: 'Настройки', icon: SettingsIcon },
];

export default function App() {
  const { activeBotId, activeTab, setActiveTab, bots } = useBotStore();
  const activeBot = bots.find(b => b.id === activeBotId);

  return (
    <div className="flex h-screen bg-bg text-text overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeBot ? (
          <>
            {/* Tab Bar */}
            <div className="bg-bg-secondary border-b border-border px-4 flex items-center gap-0.5 shrink-0">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs transition-all relative ${
                      activeTab === tab.id
                        ? 'text-accent'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    <Icon size={13} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-2 right-2 h-px bg-white" />
                    )}
                  </button>
                );
              })}
              
              {/* Status indicator in tab bar */}
              <div className="ml-auto flex items-center gap-2 text-[10px] text-text-muted">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  activeBot.status === 'running' ? 'bg-success pulse-dot' :
                  activeBot.status === 'error' ? 'bg-error' :
                  activeBot.status === 'connecting' ? 'bg-warning pulse-dot' :
                  'bg-text-muted/30'
                }`} />
                <span className="font-mono">
                  {activeBot.status === 'running' ? 'ONLINE' :
                   activeBot.status === 'connecting' ? 'CONNECTING' :
                   activeBot.status === 'error' ? 'ERROR' : 'OFFLINE'}
                </span>
                {activeBot.status === 'running' && (
                  <span className="text-text-muted/50">
                    • ↓{activeBot.stats.messagesReceived} ↑{activeBot.stats.messagesSent}
                  </span>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'handlers' && <Handlers />}
              {activeTab === 'logs' && <Logs />}
              {activeTab === 'settings' && <Settings />}
            </div>
          </>
        ) : (
          <Welcome />
        )}
      </div>
    </div>
  );
}
