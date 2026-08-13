import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { MessageSquareCode, Send, Sparkles, User, Brain, AlertTriangle } from 'lucide-react';

export default function AIAssistant({ showToast }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your AI Productivity Coach. I have analyzed your university database records.\n\nAsk me queries such as:\n* *'Which task should I complete first?'*\n* *'Summarize my pending assignments.'*\n* *'Which tasks are overdue?'*\n* *'Create a daily schedule.'*"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(true);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "Which task should I complete first?",
    "What should I work on today?",
    "Which tasks are urgent?",
    "Create a schedule for my pending tasks.",
    "Summarize my pending assignments.",
    "Which tasks are overdue?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');

    // Append user message
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setLoading(true);

    try {
      const res = await api.chatWithAI(text);
      setMessages(prev => [...prev, { sender: 'ai', text: res.reply }]);
      setAiUsed(res.aiUsed);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: 'Sorry, I encountered an issue connecting to the AI helper. Please check your Ollama backend configuration.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI Study Assistant
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Ask questions about your university syllabus database</p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <MessageSquareCode className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Chat box container */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[550px] overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                </div>

                {/* Bubble content */}
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed font-medium whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white border-indigo-600 rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border-slate-200 rounded-tl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 animate-spin text-indigo-600" />
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Inputs */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask me anything about your tasks database..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl shadow-md transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Suggested Prompts Sidecard */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Suggested Questions</h3>
          <div className="flex flex-col gap-2">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleQuickPrompt(prompt)}
                disabled={loading}
                className="text-left p-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-[11px] font-semibold text-slate-600 rounded-xl border border-slate-150 hover:border-indigo-200 transition-all duration-200"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Model Status Indicator */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${aiUsed ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span>AI Status: {aiUsed ? 'Ollama Online' : 'Rule Fallback Active'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
