import { useState, useEffect, useCallback } from 'react';
import { Sidebar, ScreenId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ChatView } from './components/chat/ChatView';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { SolversScreen } from './components/screens/SolversScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { DeveloperScreen } from './components/screens/DeveloperScreen';
import { BenchmarkScreen } from './components/screens/BenchmarkScreen';
import { TaskType, ChatMessage, TaskHistoryItem } from './types/solver';
import { INITIAL_HISTORY } from './data/initialHistory';
import { solveTask, checkBackendHealth, ApiNetworkError, ApiBackendError } from './services/api';

const STORAGE_KEY_CHAT = 'cogniflow_chat_messages';
const STORAGE_KEY_HISTORY = 'cogniflow_task_history';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('chat');
  const [isLoading, setIsLoading] = useState(false);

  // Session identifier for context isolation
  const [sessionId, setSessionId] = useState<string>(() => 'sess_' + Math.random().toString(36).substring(2, 10));

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Task execution ledger
  const [history, setHistory] = useState<TaskHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_HISTORY;
  });

  const [apiConnected, setApiConnected] = useState(false);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | undefined>(undefined);

  // Persist messages & history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Periodic health check
  const refreshHealth = useCallback(async () => {
    const health = await checkBackendHealth();
    setApiConnected(health.connected);
    setApiLatencyMs(health.connected ? health.latencyMs : undefined);
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 8000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N -> New Chat
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      }
      // Alt + 1 -> Chat
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setCurrentScreen('chat');
      }
      // Alt + 2 -> Task History
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        setCurrentScreen('history');
      }
      // Alt + 3 -> Solver Overview
      if (e.altKey && e.key === '3') {
        e.preventDefault();
        setCurrentScreen('solvers');
      }
      // Alt + 4 -> Settings
      if (e.altKey && e.key === '4') {
        e.preventDefault();
        setCurrentScreen('settings');
      }
      // Alt + 5 -> Developer Dashboard
      if (e.altKey && e.key === '5') {
        e.preventDefault();
        setCurrentScreen('developer');
      }
      // Alt + 6 -> Benchmark & Evaluation Dashboard
      if (e.altKey && e.key === '6') {
        e.preventDefault();
        setCurrentScreen('benchmark');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSendMessage = async (text: string, mode: TaskType) => {
    const userMsgId = 'msg_' + Math.random().toString(36).substring(2, 9);
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    // Build conversation context from prior successful messages
    const recentHistory = messages
      .filter((m) => m.text && !m.error && m.text.trim().length > 0)
      .slice(-6)
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await solveTask({
        task_type: mode,
        input: text,
        conversation_history: recentHistory,
        session_id: sessionId,
      });

      const assistantMsgId = 'msg_' + Math.random().toString(36).substring(2, 9);
      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toISOString(),
        taskType: response.task_type || mode,
        solver: response.solver,
        processingTimeMs: response.processing_time_ms,
        tokensConsumed: response.usage?.total_tokens ?? response.token_usage?.total_tokens ?? (response.solver_details?.tokens_consumed ?? 0),
        tokenUsage: response.token_usage,
        usage: response.usage,
        secondaryResults: response.secondary_results,
        solverDetails: response.solver_details,
        rawResponse: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Add to task history ledger
      const newHistoryItem: TaskHistoryItem = {
        id: 'tsk_' + Math.random().toString(36).substring(2, 10),
        query: text,
        taskType: response.task_type || mode,
        solver: response.solver,
        engineName:
          response.solver === 'python'
            ? 'Python Deterministic (AST Sandbox)'
            : `${response.solver.toUpperCase()} Engine`,
        durationMs: response.processing_time_ms || 1.4,
        tokens: response.usage?.total_tokens ?? response.token_usage?.total_tokens ?? (response.solver_details?.tokens_consumed ?? 0),
        tokenUsage: response.token_usage,
        usage: response.usage,
        statusCode: response.success ? 200 : 500,
        timestamp: new Date().toISOString(),
        timeAgo: 'Just now',
        response,
        reasoning: `Solved by ${response.solver} in ${response.processing_time_ms || 1.4}ms.`,
      };

      setHistory((prev) => [newHistoryItem, ...prev]);
    } catch (err: any) {
      let errorText = err.message || 'Execution failed';
      if (err instanceof ApiNetworkError) {
        errorText = `Backend connection failed: Cannot connect to FastAPI server at ${err.endpoint}. Make sure the backend is running.`;
      } else if (err instanceof ApiBackendError) {
        errorText = `Backend error (${err.statusCode}): ${err.message}`;
      }

      const errorMsgId = 'msg_' + Math.random().toString(36).substring(2, 9);
      const errorAssistantMsg: ChatMessage = {
        id: errorMsgId,
        sender: 'assistant',
        text: '',
        timestamp: new Date().toISOString(),
        error: errorText,
      };

      setMessages((prev) => [...prev, errorAssistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId('sess_' + Math.random().toString(36).substring(2, 10));
    setCurrentScreen('chat');
  };

  const recentQueries = Array.from(
    new Set(history.map((h) => h.query).filter(Boolean))
  );

  return (
    <div className="bg-background min-h-screen text-on-surface flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        onNewChat={handleNewChat}
        recentQueries={recentQueries}
        onSelectRecentQuery={(query) => {
          handleSendMessage(query, 'smart');
        }}
        historyCount={history.length}
        apiConnected={apiConnected}
        apiLatencyMs={apiLatencyMs}
      />

      {/* Main Content Area */}
      <div className="pl-64 md:pl-72 w-full flex flex-col min-h-screen">
        <Header
          currentScreen={currentScreen}
          onOpenSettings={() => setCurrentScreen('settings')}
          onClearChat={handleNewChat}
          hasMessages={messages.length > 0}
        />

        <main className="w-full pt-16 bg-surface min-h-[calc(100vh-4rem)] flex flex-col">
          {currentScreen === 'chat' && (
            <ChatView
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onRetryMessage={(text, mode) => handleSendMessage(text, mode)}
            />
          )}

          {currentScreen === 'history' && (
            <HistoryScreen
              history={history}
              onClearHistory={() => setHistory([])}
              onRerunTask={(query, mode) => {
                setCurrentScreen('chat');
                handleSendMessage(query, mode);
              }}
            />
          )}

          {currentScreen === 'solvers' && (
            <SolversScreen
              onSimulateDispatch={() => {
                setCurrentScreen('chat');
                handleSendMessage('Calculate 125 * 64', 'math');
              }}
              onNavigateToChat={(query, mode) => {
                setCurrentScreen('chat');
                handleSendMessage(query, mode);
              }}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsScreen
              messagesCount={messages.length}
              historyCount={history.length}
              messages={messages}
              onPurgeMessages={() => setMessages([])}
              onPurgeHistory={() => setHistory([])}
              onNavigateToDeveloper={() => setCurrentScreen('developer')}
            />
          )}

          {currentScreen === 'developer' && (
            <DeveloperScreen
              apiConnected={apiConnected}
              apiLatencyMs={apiLatencyMs}
              onRefreshHealth={refreshHealth}
              onNavigateToSettings={() => setCurrentScreen('settings')}
              history={history}
              messages={messages}
            />
          )}

          {currentScreen === 'benchmark' && (
            <BenchmarkScreen
              onNavigateToChat={() => setCurrentScreen('chat')}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
