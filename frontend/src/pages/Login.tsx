import React, { useState } from "react";
import { api } from "../services/api";
import { KeyRound, Mail, Loader2, ShieldCheck, ArrowUpRight } from "lucide-react";
import { CloudOptixLogo } from "../components/Logo";

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("admin@cloudoptix.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await api.login(email, password);
      } else {
        await api.register(email, password);
        // Automatically login after register
        await api.login(email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc] relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "linear-gradient(rgba(15,108,189,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,108,189,.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      <div className="absolute -top-36 left-[8%] w-[32rem] h-[32rem] bg-[#0F6CBD]/10 rounded-full blur-[110px]"></div>
      <div className="absolute -bottom-36 right-[8%] w-[28rem] h-[28rem] bg-[#1d4ed8]/10 rounded-full blur-[110px]"></div>

      <div className="w-full max-w-[440px] bg-white/95 backdrop-blur border border-[#dbe7f1] rounded-xl p-7 sm:p-8 shadow-[0_22px_60px_rgba(15,56,96,.12)] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-[#eff9ff] to-[#e9efff] rounded-xl mb-4 border border-[#cfe5f5] shadow-sm">
            <CloudOptixLogo size={42} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">
            CloudOptix Console
          </h1>
          <p className="text-xs text-[#64748b] mt-1.5 font-medium">
            {isLogin ? "Sign in to manage your cloud savings" : "Create your administrator account"}
          </p>
        </div>

        {error && (
          <div className="bg-[#FEE2E2] border border-[#FCA5A5] text-[#B91C1C] p-3 rounded text-xs mb-5 font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-[#4B5563] uppercase tracking-widest mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#4B5563]">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                className="w-full bg-white border border-[#cbd5e1] rounded-md pl-9 pr-4 py-2.5 text-xs text-[#1E293B] transition-all focus:outline-none focus:border-[#0F6CBD] focus:ring-2 focus:ring-[#0F6CBD]/10"
                placeholder="admin@cloudoptix.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[#4B5563] uppercase tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#4B5563]">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                className="w-full bg-white border border-[#cbd5e1] rounded-md pl-9 pr-4 py-2.5 text-xs text-[#1E293B] transition-all focus:outline-none focus:border-[#0F6CBD] focus:ring-2 focus:ring-[#0F6CBD]/10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative overflow-hidden w-full bg-[#0F6CBD] text-white font-bold py-2.5 rounded-md hover:bg-[#075896] disabled:opacity-40 transition-all hover:-translate-y-px active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs mt-6"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-[#e2e8f0]">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-[#0F6CBD] hover:underline font-bold bg-transparent border-none cursor-pointer"
          >
            {isLogin ? "Need a new console account? Register here" : "Already have a console account? Log in"}
          </button>
        </div>

        <div className="flex items-center justify-between mt-7 pt-4 border-t border-[#f1f5f9] text-[10px] text-[#64748b] font-medium">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#1d8102]" /> Secure workspace</span>
          <span className="flex items-center gap-1">v1.0 <ArrowUpRight className="w-3 h-3" /></span>
        </div>
      </div>
    </div>
  );
};
