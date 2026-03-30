import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Sparkles, Paperclip, Smile, Search, ChevronDown, Calendar, TrendingUp, HelpCircle, AlertCircle, Info } from "lucide-react";
import { financialMetrics, employees, taxLiabilities } from "../data/mockData";
import { ChatMessage } from "../types";
import { cn } from "../lib/utils";
import { toast } from "sonner";

/**
 * Enhanced response generation logic to provide more human-like, conversational,
 * and comprehensive answers for management queries.
 */
const getConversationalResponse = (q: string): string => {
  const query = q.toLowerCase();
  
  // Conversational fillers and greetings
  const greetings = [
    "Hello! I'm here to help you manage your operations more effectively. What's on your mind?",
    "Hi there! Always happy to assist. How can I make your tasks easier today?",
    "Greetings! I've been keeping an eye on your portfolio. Is there something specific you'd like to dive into?"
  ];

  const genericOpeners = [
    "That's a great question.",
    "I'd be happy to help you with that.",
    "Let me check the latest data for you.",
    "I've got those details right here.",
    "Certainly, let me pull up that information."
  ];

  const getOpener = () => genericOpeners[Math.floor(Math.random() * genericOpeners.length)];
  const getGreeting = () => greetings[Math.floor(Math.random() * greetings.length)];

  // 1. FINANCIAL / REVENUE
  if (query.includes("financial") || query.includes("revenue") || query.includes("money") || query.includes("profit")) {
    const curr = financialMetrics[financialMetrics.length - 1] || financialMetrics[0];
    const prev = financialMetrics[financialMetrics.length - 2] || financialMetrics[0];
    const growth = (((curr.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1);

    return `${getOpener()} Looking at your March 2024 performance, your total revenue reached ${curr.revenue.toLocaleString()} ETB. 

What's really encouraging is that your revenue grew by about ${growth}% compared to last month. Your expenses were kept at ${curr.expenses.toLocaleString()} ETB, leaving you with a very healthy margin. 

By the way, considering your current turnover, remember that your VAT liability (15%) is estimated based on these figures. Would you like me to break down the expenses or show you the tax implications?`;
  }

  // 2. TAX / VAT / PIT
  if (query.includes("tax") || query.includes("vat") || query.includes("pit") || query.includes("erca")) {
    const dueTaxes = taxLiabilities.filter(t => t.status === "Due");
    const totalDue = dueTaxes.reduce((acc, t) => acc + t.amount, 0);

    return `Of course. Keeping up with Ethiopian tax regulations is crucial. Currently, you have a few items on your radar for the March period:

\u2022 VAT: 15% on commercial rentals (Mandatory if turnover > 1M ETB).
\u2022 Rental PIT: Progressive rates up to 35% for higher brackets.
\u2022 WHT: 2% withholding often applied by your corporate tenants.

You currently have ${dueTaxes.length} pending tax liabilities totaling ${totalDue.toLocaleString()} ETB that need to be filed with ERCA by the end of the month. 

I can help you generate the specific reports needed for filing if you're ready!`;
  }

  // 3. MAINTENANCE
  if (query.includes("maintenance") || query.includes("fix") || query.includes("repair") || query.includes("broken")) {
    return `${getOpener()} Right now, we're tracking a set of maintenance requests across your operations. 

Our lead technician, Bekele, is already on-site addressing recent reports. We're averaging about 2.4 days for resolution, which is better than last month. 

Is there a particular repair you're worried about?`;
  }

  // 4. HR / EMPLOYEES
  if (query.includes("hr") || query.includes("employee") || query.includes("staff") || query.includes("salary")) {
    return `You currently have ${employees.length} active staff members. 

Everything seems to be running smoothly on the HR front. Payroll for March has already been processed and paid out. 

Would you like to see a performance summary or check the next payroll cycle?`;
  }

  // 5. GREETINGS / HELLO
  if (query === "hi" || query === "hello" || query === "hey") {
    return getGreeting();
  }

  // FALLBACK - Make it sound helpful instead of "I don't know"
  return `I'm not entirely sure I have the specific data for that right now, but I can definitely help you with financials, Ethiopian tax compliance, or maintenance tracking. 

Could you perhaps rephrase that, or would you like me to give you a quick summary of your overall performance instead?`;
};

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState(["How is our revenue?", "Tax deadline info", "Staff summary", "Maintenance status"]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "1",
        sender: "Bot",
        text: "Hello! I'm your LandoManage AI assistant. How's your day going? I'm ready to help you with your portfolio insights whenever you are.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const onSend = () => {
    const textToSend = input.trim();
    if (!textToSend) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "User",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Sent"
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate AI thinking and "typing" for a more human feel
    const delay = 1000 + Math.random() * 1500; 

    setTimeout(() => {
      const responseText = getConversationalResponse(textToSend);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "Bot",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setTyping(false);

      // Dynamically update suggestions based on the response content
      if (textToSend.toLowerCase().includes("revenue") || textToSend.toLowerCase().includes("financial")) {
        setSuggestions(["VAT Impact", "Expense Breakdown", "Profitability"]);
      } else if (textToSend.toLowerCase().includes("tax")) {
        setSuggestions(["VAT vs PIT", "WHT Records", "Generate ERCA Report"]);
      } else {
        setSuggestions(["Revenue Report", "Staff Compliance", "Tax Compliance", "Maintenance"]);
      }
    }, delay);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-indigo-100" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-indigo-600 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">LandoManage AI</h3>
            <p className="text-[10px] text-indigo-100 uppercase font-bold tracking-wider flex items-center gap-1">
              <span className="w-1 h-1 bg-green-400 rounded-full"></span> Online & Ready
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => toast.info("Searching chat history...")} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
        <div className="flex justify-center mb-4">
          <span className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 border border-slate-100 uppercase tracking-widest flex items-center gap-2 shadow-sm">
            <Calendar className="w-3 h-3" /> Today's Session
          </span>
        </div>

        {messages.map(m => (
          <div key={m.id} className={cn("flex items-end gap-2 max-w-[88%]", m.sender === "User" ? "ml-auto flex-row-reverse" : "mr-auto")}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
              m.sender === "User" ? "bg-indigo-600 text-white" : "bg-white text-indigo-600 border border-indigo-100"
            )}>
              {m.sender === "User" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={cn("flex flex-col", m.sender === "User" ? "items-end" : "items-start")}>
              <div className={cn(
                "p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap leading-relaxed transition-all",
                m.sender === "User" 
                  ? "bg-indigo-600 text-white rounded-br-none" 
                  : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"
              )}>
                {m.text}
                
                {m.sender === "Bot" && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {m.text.includes("ETB") && (
                        <span className="flex items-center gap-1 text-indigo-600 text-[9px] font-bold uppercase tracking-wider">
                          <TrendingUp className="w-3 h-3" /> Data-Driven
                        </span>
                      )}
                      {m.text.includes("VAT") && (
                        <span className="flex items-center gap-1 text-amber-600 text-[9px] font-bold uppercase tracking-wider">
                          <Info className="w-3 h-3" /> Tax Compliance
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-slate-100 rounded text-slate-400" title="Helpful"><Smile className="w-3 h-3" /></button>
                      <button className="p-1 hover:bg-slate-100 rounded text-slate-400" title="Not helpful"><AlertCircle className="w-3 h-3" /></button>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[8px] mt-1 text-slate-400 uppercase font-bold px-1">{m.timestamp}</span>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex items-end gap-2 mr-auto">
            <div className="w-8 h-8 rounded-lg bg-white border border-indigo-100 flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-200">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
          {suggestions.map(s => (
            <button 
              key={s} 
              onClick={() => {
                setInput(s);
              }} 
              className="whitespace-nowrap text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all uppercase tracking-wide shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <Paperclip className="w-4 h-4" />
          </button>
          <input 
            type="text" 
            placeholder="Type your question here..." 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === "Enter" && onSend()} 
            className="flex-1 bg-transparent border-none text-sm focus:outline-none py-1 placeholder:text-slate-400" 
          />
          <button 
            onClick={onSend} 
            disabled={!input.trim() || typing} 
            className="w-10 h-10 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:grayscale flex items-center justify-center shadow-indigo-200 shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[9px] text-slate-400 mt-2 font-medium">LandoManage AI can make mistakes. Verify important financial data.</p>
      </div>
    </div>
  );
};