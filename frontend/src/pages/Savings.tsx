import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sparkles, Check, Trash2, Loader2 } from "lucide-react";

interface SavingsProps {
  onNavigate: (page: string, resourceId?: string) => void;
}

export const Savings: React.FC<SavingsProps> = ({ onNavigate }) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [savingsOverview, setSavingsOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSavingsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const recs = await api.getRecommendations();
      setRecommendations(recs);

      const overview = await api.getSavingsOverview();
      setSavingsOverview(overview);
    } catch (err: any) {
      setError(err.message || "Failed to load savings analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavingsData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      setActionLoadingId(id);
      setSuccessMsg(null);
      await api.approveRecommendation(id);
      setSuccessMsg("Remediation completed! Resource successfully resized/stopped and cost reduced.");
      await fetchSavingsData();
    } catch (err: any) {
      setError(err.message || "Failed to apply recommendation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      setActionLoadingId(id);
      setSuccessMsg(null);
      await api.dismissRecommendation(id);
      setSuccessMsg("Recommendation dismissed successfully.");
      await fetchSavingsData();
    } catch (err: any) {
      setError(err.message || "Failed to dismiss recommendation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-10 h-10 border-4 border-[#0F6CBD] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#545b64] text-xs font-semibold">Generating savings projections curve...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#B91C1C]/5 border border-[#FCA5A5] rounded p-6 text-center text-[#B91C1C] max-w-xl mx-auto my-12">
        {error}
      </div>
    );
  }

  const timelineData = savingsOverview?.savings_over_time?.map((t: any) => ({
    month: t.month,
    Savings: Math.round(t.amount)
  })) || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-extrabold text-[#0F172A] tracking-tight">Recommendations</h1>
        <p className="text-xs text-[#545b64] mt-0.5">
          Review, dismiss, or approve resizing policies to eliminate underutilized capacity leakages.
        </p>
      </div>

      {successMsg && (
        <div className="bg-[#1d8102]/10 border border-[#1d8102]/25 text-[#1d8102] p-4 rounded flex items-center gap-3">
          <Check className="w-4 h-4 flex-shrink-0 animate-bounce" />
          <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Grid: Savings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card: Monthly Savings */}
        <div className="aws-card rounded-md p-5 bg-white border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-[#545b64] font-bold">Total Monthly Savings Potential</p>
          <p className="text-2xl font-black text-[#15803D] mt-2.5">
            ${savingsOverview?.total_monthly_savings?.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-[#545b64] mt-2 font-medium">Estimated cost reduction MoM</p>
        </div>

        {/* Card: Annual Savings */}
        <div className="aws-card rounded-md p-5 bg-white border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-[#545b64] font-bold">Total Annual Savings Potential</p>
          <p className="text-2xl font-black text-[#15803D] mt-2.5">
            ${savingsOverview?.total_annual_savings?.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-[#545b64] mt-2 font-medium">Accumulated optimization return</p>
        </div>

        {/* Card: Recommendations count */}
        <div className="aws-card rounded-md p-5 bg-white border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-[#545b64] font-bold">Active Policies</p>
          <p className="text-2xl font-black text-[#0F172A] mt-2.5">
            {recommendations.length}
          </p>
          <p className="text-[10px] text-[#545b64] mt-2 font-medium">Policies waiting for root approval</p>
        </div>
      </div>

      {/* Projections Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph */}
        <div className="aws-card rounded-md p-5 bg-white border border-[#E5E7EB] shadow-sm lg:col-span-2">
          <h3 className="text-xs font-bold text-[#0F172A] mb-1">Projected Cumulative Return</h3>
          <p className="text-[9px] text-[#545b64] mb-6">Estimated cost-savings timeline if all recommendations are enacted immediately.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" opacity={0.6} />
                <XAxis dataKey="month" stroke="#545b64" fontSize={9} tickLine={false} />
                <YAxis stroke="#545b64" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#E5E7EB", borderRadius: "4px", fontSize: "10px" }}
                />
                <Line type="monotone" dataKey="Savings" stroke="#0f6cbd" strokeWidth={2} activeDot={{ r: 4 }} name="Cumulative Savings" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories breakdown */}
        <div className="aws-card rounded-md p-5 bg-white border border-[#E5E7EB] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#0F172A] mb-1">Savings Categories</h3>
            <p className="text-[9px] text-[#545b64] mb-6">Aggregated savings potentials grouped by service category layers.</p>
          </div>
          <div className="space-y-4 my-2">
            {savingsOverview?.savings_by_service?.map((s: any) => (
              <div key={s.service_name} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-[#545b64]">{s.service_name}</span>
                  <span className="text-[#0F6CBD]">${s.potential_savings?.toFixed(0)}/mo</span>
                </div>
                <div className="w-full bg-[#F3F4F6] rounded h-1 overflow-hidden">
                  <div
                    className="bg-[#0F6CBD] h-1 rounded"
                    style={{ width: `${(s.potential_savings / (savingsOverview.total_monthly_savings || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {(!savingsOverview?.savings_by_service || savingsOverview.savings_by_service.length === 0) && (
              <div className="text-center text-xs text-[#545b64] py-10">No active savings channels.</div>
            )}
          </div>
          <div className="pt-4 border-t border-[#E5E7EB] text-center">
            <p className="text-[9px] text-[#545b64] font-bold uppercase tracking-widest leading-none">Primary waste channel</p>
            <p className="text-xs font-black text-[#0F172A] mt-2">Compute Downsizing (EC2)</p>
          </div>
        </div>
      </div>

      {/* Recommendations Feed */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Active Optimization Policies</h2>
        
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((rec) => {
              const loading = actionLoadingId === rec.id;
              
              return (
                <div
                  key={rec.id}
                  className="aws-card rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-[#E5E7EB] shadow-sm"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#F3F4F6] border border-[#E5E7EB] text-[#545b64] text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                        {rec.resource_id}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        rec.priority === "HIGH" ? "glow-tag-danger" : "glow-tag-warning"
                      }`}>
                        {rec.priority} PRIORITY
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-[#0F172A]">{rec.problem}</h3>
                    <p className="text-xs text-[#545b64] leading-relaxed max-w-3xl">{rec.evidence}</p>
                    
                    <div className="pt-1 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#545b64] font-semibold">
                      <span>Monthly cost baseline: <strong className="text-[#0F172A] font-extrabold">${rec.financial_impact?.toFixed(0)}</strong></span>
                      <span>Remediation action: <strong className="text-[#0F6CBD] font-bold">{rec.action}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-[#E5E7EB]">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] text-[#545b64] font-bold uppercase tracking-wider">Monthly savings</p>
                      <p className="text-xl font-black text-[#15803D] mt-1">+${rec.potential_savings?.toFixed(0)}</p>
                      <p className="text-[9px] text-[#545b64] mt-0.5">${(rec.potential_savings * 12).toFixed(0)}/year</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onNavigate("resource-details", rec.resource_id)}
                        className="px-3 py-1.5 bg-white hover:bg-[#F3F4F6] text-[#545b64] hover:text-[#0F172A] rounded text-xs font-bold cursor-pointer border border-[#E5E7EB] transition-all duration-150 shadow-sm"
                      >
                        Analyze Details
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => handleDismiss(rec.id)}
                        className="p-2 border border-[#E5E7EB] hover:bg-[#B91C1C]/10 text-[#545b64] hover:text-[#B91C1C] rounded transition-all cursor-pointer bg-white shadow-sm"
                        title="Dismiss policy"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d13212]" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => handleApprove(rec.id)}
                        className="aws-btn-primary text-xs flex items-center gap-1 shadow-sm"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Check className="w-3.5 h-3.5" />} Approve & Downsize
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="aws-card rounded p-12 text-center text-[#545b64] bg-white border border-[#E5E7EB]">
              <Sparkles className="w-12 h-12 mx-auto text-[#1d8102] mb-4 animate-pulse" />
              <p className="font-bold text-[#0F172A] mb-1">Environment fully optimized</p>
              <p className="text-xs">No cost leakage or resource waste detected in the active cloud setup.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
