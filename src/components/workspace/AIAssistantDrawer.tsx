import React, { useState } from 'react';
import { EventPlan } from '@/types';
import { runPlanDoctor } from '@/features/plan-doctor/planDoctorRules';
import { formatINR } from '@/lib/currency';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  ShieldCheck, 
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventPlan;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  if (!isOpen) return null;

  const { findings } = runPlanDoctor(event);
  const criticalBlockers = findings
    .filter(f => f.severity === 'critical_blocker')
    .map(f => f.title);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Hello! I am your PlanSutra AI Assistant. I am tracking **${event.name}** (${event.guestCount} guests, budget ${formatINR(event.totalBudget)} in ${event.city}). How can I help optimize your schedule, budget, or vendor contracts today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const quickPrompts = [
    'How can I save ₹15,000 on catering?',
    'What questions should I ask my venue?',
    'How do I fix my Plan Doctor blockers?',
    'Suggest eco-friendly wedding favors',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          userMessage: text.trim(),
          eventContext: {
            name: event.name,
            type: event.type,
            totalBudget: event.totalBudget,
            guestCount: event.guestCount,
            city: event.city,
            venueName: event.venueName,
            criticalBlockers,
          },
        }),
      });

      const data = await response.json();
      const replyMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: data.reply || 'I am ready to assist with your event planning.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, replyMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: 'Unable to reach AI service. Please check your network or consult the Plan Doctor tab for immediate recommendations.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ESC key to dismiss drawer (WCAG 2.2 AA)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-ivory-300 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assistant-drawer-title"
    >
      {/* Drawer Header */}
      <div className="p-4 bg-ivory-100 border-b border-ivory-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
            <Sparkles size={16} className="text-marigold-300" />
          </div>
          <div>
            <h3 id="ai-assistant-drawer-title" className="font-bold text-sm text-navy-950">PlanSutra AI Assistant</h3>
            <p className="text-[10px] text-emerald-800 font-semibold">Active Event Context</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close assistant drawer"
          className="p-1 rounded-md text-navy-500 hover:text-navy-950 hover:bg-ivory-200"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs" aria-live="polite">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={13} />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-700 text-white rounded-br-xs'
                  : 'bg-ivory-100 text-navy-900 rounded-bl-xs border border-ivory-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <span className={`text-[9px] block text-right mt-1 ${msg.sender === 'user' ? 'text-emerald-200' : 'text-navy-400'}`}>
                {msg.timestamp}
              </span>
            </div>
            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-navy-200 text-navy-800 flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-navy-500 text-xs italic">
            <Sparkles size={14} className="animate-spin text-emerald-600" />
            <span>Thinking with event context...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Pills */}
      <div className="p-2.5 bg-ivory-50 border-t border-ivory-200 flex flex-wrap gap-1.5">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(qp)}
            className="text-[10px] font-medium px-2 py-1 rounded-full bg-white border border-ivory-300 text-navy-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-ivory-200 flex items-center gap-2">
        <input
          type="text"
          aria-label="Ask a question about your plan"
          placeholder="Ask a question about your plan..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 px-3 py-2 rounded-xl border border-ivory-300 text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          aria-label="Send message"
          className="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-40 transition-colors"
          title="Send message"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
