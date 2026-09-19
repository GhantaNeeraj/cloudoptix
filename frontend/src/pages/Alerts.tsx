import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Bell, Check, CheckCircle2, ShieldAlert, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";

interface AlertsProps {
  onNavigate: (page: string, resourceId?: string) => void;
  onAlertChange?: () => void;
}

export const Alerts: React.FC<AlertsProps> = ({ onNavigate, onAlertChange }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load alerts feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markAlertAsRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
      if (onAlertChange) onAlertChange();
    } catch (err: any) {
      console.error("Failed to mark alert as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsAsRead();
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      if (onAlertChange) onAlertChange();
    } catch (err: any) {
      console.error("Failed to mark all alerts as read:", err);
    }
  };

  const getAlertIcon = (category: string, severity: string) => {
    if (severity === "CRITICAL") return <ShieldAlert className="w-4 h-4 text-[#B91C1C] animate-pulse" />;
    
    switch (category) {
      case "Budget":
      case "Forecast":
        return <AlertTriangle className="w-4 h-4 text-[#B45309]" />;
      case "Service-Increase":
      case "Spike":
        return <TrendingUp className="w-4 h-4 text-[#B45309]" />;
      case "Savings":
        return <DollarSign className="w-4 h-4 text-[#0F6CBD]" />;
      default:
        return <Bell className="w-4 h-4 text-[#4B5563]" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === "CRITICAL") {
      return "glow-tag-danger";
    }
    if (severity === "WARNING") {
      return "glow-tag-warning";
    }
    return "glow-tag-blue";
  };

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === "ALL") return true;
    return a.severity === severityFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-[#0F172A] tracking-tight">Alert Console</h1>
          <p className="text-xs text-[#545b64] mt-0.5">
            Real-time notifications triggered by Isolation Forest anomalies, monthly budget overruns, and MoM cost surges.
          </p>
        </div>
        
        {alerts.some(a => !a.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer text-[#374151] shadow-sm active:scale-[0.98]"
          >
            <Check className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="aws-card rounded p-4 shadow-sm flex gap-2 bg-white border border-[#E5E7EB]">
        <button
          onClick={() => setSeverityFilter("ALL")}
          className={`px-4 py-1.5 rounded text-xs font-bold cursor-pointer transition-all ${
            severityFilter === "ALL" ? "bg-[#0F6CBD] text-white shadow-sm" : "bg-[#F3F4F6] text-[#4B5563] hover:text-[#0F172A] hover:bg-[#E5E7EB]"
          }`}
        >
          All Notifications ({alerts.length})
        </button>
        <button
          onClick={() => setSeverityFilter("CRITICAL")}
          className={`px-4 py-1.5 rounded text-xs font-bold cursor-pointer transition-all ${
            severityFilter === "CRITICAL" ? "bg-[#B91C1C] text-white shadow-sm" : "bg-[#F3F4F6] text-[#4B5563] hover:text-[#0F172A] hover:bg-[#E5E7EB]"
          }`}
        >
          Critical ({alerts.filter(a => a.severity === "CRITICAL").length})
        </button>
        <button
          onClick={() => setSeverityFilter("WARNING")}
          className={`px-4 py-1.5 rounded text-xs font-bold cursor-pointer transition-all ${
            severityFilter === "WARNING" ? "bg-[#B45309] text-white shadow-sm" : "bg-[#F3F4F6] text-[#4B5563] hover:text-[#0F172A] hover:bg-[#E5E7EB]"
          }`}
        >
          Warnings ({alerts.filter(a => a.severity === "WARNING").length})
        </button>
      </div>

      {/* Alert Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-[#0F6CBD] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#545b64] text-xs font-semibold">Accessing notifications catalog...</p>
        </div>
      ) : error ? (
        <div className="bg-[#B91C1C]/5 border border-[#FCA5A5] rounded p-6 text-center text-[#B91C1C]">
          {error}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="aws-card rounded p-12 text-center text-[#545b64] bg-white border border-[#E5E7EB]">
          <CheckCircle2 className="w-12 h-12 mx-auto text-[#15803D] mb-4" />
          <p className="font-bold text-[#0F172A] mb-1">No alerts found</p>
          <p className="text-xs">No active alerts fit the selected severity filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`aws-card rounded p-5 flex items-start gap-4 bg-white border border-[#E5E7EB] shadow-sm ${
                alert.is_read 
                  ? "opacity-60 border-[#E5E7EB] hover:border-slate-200" 
                  : alert.severity === "CRITICAL"
                    ? "border-l-4 border-l-[#B91C1C]"
                    : "border-l-4 border-l-[#B45309]"
              }`}
            >
              {/* Category Icon */}
              <div className={`p-2.5 rounded border flex-shrink-0 ${
                alert.severity === "CRITICAL" 
                  ? "bg-[#FEE2E2] border-[#FCA5A5]" 
                  : "bg-[#FEF3C7] border-[#FDE68A]"
              }`}>
                {getAlertIcon(alert.category, alert.severity)}
              </div>

              {/* Text info */}
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="text-[10px] text-[#545b64] font-bold uppercase tracking-wider">
                    {new Date(alert.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  {!alert.is_read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F6CBD] animate-pulse"></span>
                  )}
                </div>

                <h3 className="text-sm font-extrabold text-[#0F172A]">{alert.title}</h3>
                <p className="text-xs text-[#545b64] leading-relaxed max-w-3xl">{alert.description}</p>

                {alert.recommended_action && (
                  <div className="pt-2 text-xs text-[#545b64] font-semibold leading-relaxed">
                    Remediation path: <span className="text-[#0F172A] font-medium">{alert.recommended_action}</span>
                  </div>
                )}
              </div>

              {/* Impact / action buttons */}
              <div className="flex flex-col gap-2 items-end justify-between self-stretch">
                {alert.amount_involved && alert.amount_involved > 0 && (
                  <div className="text-right">
                    <p className="text-[9px] text-[#545b64] font-bold uppercase tracking-wider leading-none">Impact</p>
                    <p className="text-sm font-black text-[#B91C1C] mt-1.5">${alert.amount_involved.toFixed(0)}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {alert.category === "Idle" || alert.category === "High-Cost" ? (
                    <button
                      onClick={() => onNavigate("resources")}
                      className="px-3 py-1.5 bg-white hover:bg-[#F3F4F6] text-[#4B5563] hover:text-[#0F172A] rounded text-xs font-bold cursor-pointer border border-[#D1D5DB] transition-all duration-150 shadow-sm"
                    >
                      View Resource
                    </button>
                  ) : alert.category === "Savings" ? (
                    <button
                      onClick={() => onNavigate("savings")}
                      className="aws-btn-primary text-xs"
                    >
                      Optimize Now
                    </button>
                  ) : null}

                  {!alert.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="p-1.5 border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#4B5563] hover:text-[#0F172A] rounded transition-all cursor-pointer bg-white shadow-sm"
                      title="Dismiss alert"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
