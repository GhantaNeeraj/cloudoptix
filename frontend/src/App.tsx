import React, { useEffect, useState } from "react";
import { api } from "./services/api";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Resources } from "./pages/Resources";
import { ResourceDetails } from "./pages/ResourceDetails";
import { Savings } from "./pages/Savings";
import { Alerts } from "./pages/Alerts";
import { Assistant } from "./pages/Assistant";
import { Connector } from "./pages/Connector";
import { CloudOptixLogo } from "./components/Logo";
import {
  LayoutDashboard,
  Server,
  Zap,
  Bell,
  Bot,
  LogOut,
  RefreshCw,
  Loader2,
  CheckCircle,
  LineChart,
  Settings,
  ToggleLeft,
  User,
  ExternalLink,
  Search,
  CircleHelp,
  ChevronDown
} from "lucide-react";

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [userEmail, setUserEmail] = useState("admin@cloudoptix.com");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const fetchUnreadAlerts = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getAlerts();
      const unread = data.filter((a: any) => !a.is_read).length;
      setUnreadAlerts(unread);
    } catch (err) {
      console.error("Failed to load alerts badge count:", err);
    }
  };

  const checkUserSession = async () => {
    if (!isAuthenticated) return;
    try {
      const user = await api.getMe();
      setUserEmail(user.email);
    } catch (err) {
      setIsAuthenticated(false);
      api.logout();
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkUserSession();
      fetchUnreadAlerts();
    }
  }, [isAuthenticated, activePage]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setActivePage("dashboard");
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
  };

  const handleResetDemo = async () => {
    try {
      setResetLoading(true);
      setResetSuccess(false);
      await api.resetDatabase();
      setResetSuccess(true);
      await fetchUnreadAlerts();
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      alert("Failed to reset database. Check API connection.");
    } finally {
      setResetLoading(false);
    }
  };

  const handlePageNavigation = (page: string, resourceId?: string) => {
    setActivePage(page);
    if (resourceId) {
      setSelectedResourceId(resourceId);
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#f7f9fc] text-[#1E293B] font-sans overflow-hidden">
      {/* Sticky Top Navbar */}
      <header className="sticky-header h-16 flex items-center justify-between px-5 lg:px-7 flex-shrink-0">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 min-w-max">
          <div className="p-1.5 bg-gradient-to-br from-[#edf8ff] to-[#e6f0ff] rounded-lg border border-[#cfe5f5] shadow-sm">
            <CloudOptixLogo size={22} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-[#0F172A] flex items-center gap-1.5 leading-none">
              CloudOptix
              <span className="text-[9px] font-semibold text-[#0F6CBD] bg-[#F0F7FF] border border-[#BFDBFE] px-1.5 py-0.5 rounded uppercase tracking-wider">Console</span>
            </h1>
            <p className="text-[9px] text-[#64748b] font-semibold mt-1 tracking-wide">FINOPS CONTROL PLANE</p>
          </div>
        </div>

        {/* Middle: Standard Navigation Links */}
        <nav className="hidden xl:flex items-center gap-7 text-xs font-semibold text-[#64748b]">
          <button
            onClick={() => setActivePage("dashboard")}
            className={`hover:text-[#0F6CBD] transition-colors ${activePage === "dashboard" ? "text-[#0F6CBD]" : ""}`}
          >
            Product
          </button>
          <button onClick={() => setActivePage("savings")} className="hover:text-[#0F6CBD] transition-colors">Optimization</button>
          <button onClick={() => setActivePage("alerts")} className="hover:text-[#0F6CBD] transition-colors">Operations</button>
          <button
            onClick={() => setActivePage("resources")}
            className={`hover:text-[#0F6CBD] transition-colors ${activePage === "resources" ? "text-[#0F6CBD]" : ""}`}
          >
            Resources
          </button>
          <a href="https://docs.cloudoptix.com" target="_blank" rel="noreferrer" className="hover:text-[#0F6CBD] transition-colors flex items-center gap-1">
            Docs <ExternalLink className="w-3 h-3 text-[#9CA3AF]" />
          </a>
        </nav>

        {/* Right: User Profile Switcher */}
        <div className="flex items-center gap-1.5 lg:gap-2.5">
          <button className="hidden lg:grid console-icon-button" title="Search console"><Search className="w-4 h-4" /></button>
          <button className="hidden sm:grid console-icon-button" title="Help center"><CircleHelp className="w-4 h-4" /></button>
          <button onClick={() => setActivePage("alerts")} className="console-icon-button" title="Notifications">
            <Bell className="w-4 h-4" />
            {unreadAlerts > 0 && <span className="absolute -right-1 -top-1 min-w-4 h-4 px-1 grid place-items-center bg-[#d13212] text-white rounded-full text-[8px] font-black border-2 border-white">{unreadAlerts}</span>}
          </button>
          <div className="hidden md:flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1.5 rounded-md hover:border-[#bfdbfe] transition-colors cursor-default">
            <User className="w-3.5 h-3.5 text-[#4B5563]" />
            <span className="text-xs font-semibold text-[#334155] truncate max-w-[120px]">{userEmail}</span>
            <ChevronDown className="w-3 h-3 text-[#94a3b8]" />
          </div>
          
          <button
            onClick={handleLogout}
            className="console-icon-button hover:text-[#B91C1C]"
            title="Sign Out Console"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Console Sidebar */}
        <aside className="console-sidebar w-64 bg-white border-r border-[#e2e8f0] flex flex-col justify-between flex-shrink-0 z-20">
          <div className="py-5">
            <div className="mx-3 mb-5 p-3 rounded-lg bg-[#f8fbff] border border-[#e0effa]">
              <div className="flex items-center justify-between gap-2"><span className="text-[10px] text-[#64748b] uppercase tracking-wider font-black">Workspace</span><span className="w-2 h-2 bg-[#1d8102] rounded-full shadow-[0_0_0_3px_rgba(29,129,2,.1)]"></span></div>
              <p className="text-xs text-[#0f172a] font-bold mt-1.5">Production</p>
              <p className="text-[10px] text-[#64748b] mt-0.5">ap-south-1 · 24 resources</p>
            </div>
            <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest px-4 mb-2">Monitor</p>
            <nav className="space-y-0.5 px-2">
              <button
                onClick={() => setActivePage("dashboard")}
                className={`nav-item ${activePage === "dashboard" ? "nav-item-active" : ""}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActivePage("dashboard")}
                className={`nav-item ${activePage === "cost-analysis" ? "nav-item-active" : ""}`}
              >
                <LineChart className="w-4 h-4" />
                <span>Cost Analysis</span>
              </button>

              <button
                onClick={() => setActivePage("resources")}
                className={`nav-item ${activePage === "resources" || activePage === "resource-details" ? "nav-item-active" : ""}`}
              >
                <Server className="w-4 h-4" />
                <span>Resources</span>
              </button>
            </nav>

            <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest px-4 pt-5 mb-2">Optimize</p>
            <nav className="space-y-0.5 px-2">
              <button
                onClick={() => setActivePage("savings")}
                className={`nav-item ${activePage === "savings" ? "nav-item-active" : ""}`}
              >
                <Zap className="w-4 h-4" />
                <span>Recommendations</span>
              </button>

              <button
                onClick={() => setActivePage("dashboard")}
                className={`nav-item ${activePage === "forecasting" ? "nav-item-active" : ""}`}
              >
                <LineChart className="w-4 h-4" />
                <span>Forecasting</span>
              </button>

              <button
                onClick={() => setActivePage("connector")}
                className={`nav-item ${activePage === "auto-opt" ? "nav-item-active" : ""}`}
              >
                <ToggleLeft className="w-4 h-4" />
                <span>Auto Optimization</span>
              </button>
            </nav>

            <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest px-4 pt-5 mb-2">System</p>
            <nav className="space-y-0.5 px-2">
              <button
                onClick={() => setActivePage("alerts")}
                className={`nav-item ${activePage === "alerts" ? "nav-item-active" : ""}`}
              >
                <Bell className="w-4 h-4" />
                <span className="flex-1 text-left">Alerts</span>
                {unreadAlerts > 0 && (
                  <span className="bg-[#B91C1C] text-white px-2 py-0.5 rounded-full text-[9px] font-bold leading-none">
                    {unreadAlerts}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActivePage("assistant")}
                className={`nav-item ${activePage === "assistant" ? "nav-item-active" : ""}`}
              >
                <Bot className="w-4 h-4" />
                <span>AI Copilot</span>
              </button>

              <button
                onClick={() => setActivePage("connector")}
                className={`nav-item ${activePage === "connector" ? "nav-item-active" : ""}`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Database Reset Action */}
          <div className="p-4 border-t border-[#e2e8f0] bg-[#fcfdff]">
            <button
              disabled={resetLoading}
              onClick={handleResetDemo}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#f0f7ff] text-[#475569] hover:text-[#0F6CBD] font-semibold py-2.5 px-3 rounded-md text-xs border border-[#cbd5e1] hover:border-[#93c5fd] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              {resetLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0F6CBD]" />
              ) : resetSuccess ? (
                <CheckCircle className="w-4 h-4 text-[#15803D]" />
              ) : (
                <RefreshCw className="w-4 h-4 text-[#4B5563]" />
              )}
              {resetLoading ? "Re-seeding..." : resetSuccess ? "System Seeded" : "Reset Demo Data"}
            </button>
          </div>
        </aside>

        {/* Main Console Canvas */}
        <main className="console-main flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8 bg-[#f7f9fc]">
          <div className="max-w-[1600px] mx-auto">
          {activePage === "dashboard" && <Dashboard onNavigate={handlePageNavigation} />}
          {activePage === "resources" && <Resources onNavigate={handlePageNavigation} />}
          {activePage === "resource-details" && (
            <ResourceDetails
              resourceId={selectedResourceId}
              onBack={() => setActivePage("resources")}
            />
          )}
          {activePage === "savings" && <Savings onNavigate={handlePageNavigation} />}
          {activePage === "alerts" && (
            <Alerts onNavigate={handlePageNavigation} onAlertChange={fetchUnreadAlerts} />
          )}
          {activePage === "assistant" && <Assistant />}
          {activePage === "connector" && <Connector />}
          </div>
        </main>
      </div>
    </div>
  );
};
