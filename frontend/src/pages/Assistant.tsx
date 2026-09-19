import React, { useState, useRef, useEffect } from "react";
import { api } from "../services/api";
import { Send, Bot, User, Sparkles, Loader2, ChevronRight } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
}

const RenderMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let listItems: string[] = [];
  let inList = false;

  const parseInlineStyles = (txt: string) => {
    const parts = txt.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return <strong key={idx} className="text-[#0F172A] font-bold">{part}</strong>;
      }
      const subparts = part.split(/`([^`]+)`/g);
      return subparts.map((sub, sidx) => {
        if (sidx % 2 === 1) {
          return <code key={sidx} className="bg-[#F3F4F6] border border-[#E5E7EB] px-1.5 py-0.5 rounded text-[#0F6CBD] text-xs font-mono">{sub}</code>;
        }
        return sub;
      });
    });
  };

  const flushTable = (key: number) => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-${key}`} className="overflow-x-auto my-4 border border-[#E5E7EB] rounded bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#1E293B] font-bold">
                {tableHeaders.map((h, i) => (
                  <th key={i} className="p-2.5">{h.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 text-[#4B5563] font-medium">{parseInlineStyles(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-3 space-y-1.5 text-xs text-[#4B5563]">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInlineStyles(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("|")) {
      if (inList) flushList(index);
      const cells = trimmed.split("|").slice(1, -1);
      if (cells.every(c => c.trim().startsWith(":") || c.trim().startsWith("-"))) {
        return;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable(index);
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(trimmed.substring(2));
      return;
    } else if (inList && !trimmed.match(/^\d+\./)) {
      flushList(index);
    }

    if (trimmed.startsWith("###")) {
      elements.push(<h3 key={index} className="text-sm font-extrabold text-[#0F172A] mt-4 mb-2">{parseInlineStyles(trimmed.substring(3).trim())}</h3>);
    } else if (trimmed.startsWith("####")) {
      elements.push(<h4 key={index} className="text-xs font-bold text-[#0F6CBD] mt-3 mb-1.5">{parseInlineStyles(trimmed.substring(4).trim())}</h4>);
    } else if (trimmed.startsWith("##")) {
      elements.push(<h2 key={index} className="text-base font-black text-[#0F172A] mt-5 mb-3">{parseInlineStyles(trimmed.substring(2).trim())}</h2>);
    } else if (trimmed) {
      elements.push(<p key={index} className="text-xs leading-relaxed text-[#4B5563] my-2">{parseInlineStyles(trimmed)}</p>);
    }
  });

  if (inTable) flushTable(lines.length);
  if (inList) flushList(lines.length);

  return <div className="space-y-1">{elements}</div>;
};

export const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your **CloudOptix AI Assistant**. I analyze your cloud resources and billing patterns to help you save money.\n\nHere is a summary of your cloud environment. Ask me questions such as:\n- *Why did my bill increase?*\n- *Show me all idle servers.*\n- *Which server is wasting the most money?*\n- *How much money can I save?*\n- *What is causing my storage cost increase?*\n- *Which resource should I optimize first?*"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await api.chatWithAssistant(textToSend);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: data.response
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: "Sorry, I encountered an error querying the cloud database. Please verify the backend is online."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (qText: string) => {
    handleSendMessage(qText);
  };

  const quickPrompts = [
    "Why did my bill increase?",
    "Show me all idle servers.",
    "Which server is wasting the most money?",
    "How much can I save?",
    "What is causing my storage cost increase?",
    "Which recommendation gives me the highest savings?"
  ];

  return (
    <div className="h-[80vh] flex flex-col lg:flex-row gap-6 animate-fadeIn">
      {/* Sidebar prompts */}
      <div className="w-full lg:w-72 aws-card rounded p-5 shadow-sm flex flex-col justify-between flex-shrink-0 bg-white border border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-4 text-[#0F6CBD]">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Suggested Queries</h3>
          </div>
          <p className="text-xs text-[#545b64] mb-6 leading-relaxed">
            Click any prompt to compile live optimization data directly from resource and billing tables.
          </p>

          <div className="space-y-2">
            {quickPrompts.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickQuestion(q)}
                disabled={loading}
                className="w-full text-left p-3 bg-white border border-[#D1D5DB] rounded text-xs font-bold text-[#4B5563] hover:text-[#0F6CBD] hover:border-[#0F6CBD]/50 hover:bg-[#F0F7FF] transition-all cursor-pointer truncate flex items-center justify-between group"
              >
                <span>{q}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5E7EB] text-[10px] text-[#9CA3AF] leading-relaxed mt-4 lg:mt-0 font-medium">
          Answers are generated directly from database telemetry metrics.
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1 aws-card rounded shadow-sm flex flex-col overflow-hidden bg-white border border-[#E5E7EB]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#F0F7FF] flex items-center justify-center border border-[#BFDBFE]">
            <Bot className="w-5 h-5 text-[#0F6CBD]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">CloudOptix Intelligent Copilot</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-[#15803D] rounded-full animate-pulse"></span>
              <span className="text-[9px] text-[#15803D] font-black uppercase tracking-wider">Online & Grounded</span>
            </div>
          </div>
        </div>

        {/* Message Window */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4-5 ${msg.sender === "user" ? "flex-row-reverse ml-auto" : ""}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border ${
                msg.sender === "user" 
                  ? "bg-[#F0F7FF] border-[#BFDBFE] text-[#0F6CBD]" 
                  : "bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563]"
              }`}>
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Speech bubble */}
              <div className={`p-4 rounded text-xs max-w-xl shadow-sm border ${
                msg.sender === "user"
                  ? "bg-[#F0F7FF] border-[#BFDBFE] text-[#1E293B] rounded-tr-none"
                  : "bg-[#F9FAFB] border-[#E5E7EB] rounded-tl-none text-[#1E293B]"
              }`}>
                <RenderMarkdown text={msg.text} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-4-5 animate-pulse">
              <div className="w-8 h-8 rounded bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-[#4B5563]">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded rounded-tl-none text-xs flex items-center gap-2 text-[#4B5563]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F6CBD]" />
                Copilot is reviewing cost tables...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB]">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
            className="flex gap-3"
          >
            <input
              type="text"
              disabled={loading}
              className="flex-1 bg-white border border-[#D1D5DB] rounded px-4 py-3 text-xs text-[#1E293B] focus:outline-none focus:border-[#0F6CBD] focus:ring-1 focus:ring-[#0F6CBD] transition-all placeholder-[#9CA3AF]"
              placeholder="Ask copilot about idle nodes, bill drivers, or budget overruns..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-[#0F6CBD] text-white font-bold rounded hover:bg-[#0C589E] disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
