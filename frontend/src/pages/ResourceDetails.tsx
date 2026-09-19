import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ArrowLeft, Server, Cpu, Activity, CheckCircle, Play, Loader2, Sparkles, AlertTriangle } from "lucide-react";

interface ResourceDetailsProps {
  resourceId: string;
  onBack: () => void;
}

export const ResourceDetails: React.FC<ResourceDetailsProps> = ({ resourceId, onBack }) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getResourceDetails(resourceId);
      setDetails(data);
    } catch (err: any) {
      setError(err.message || "Failed to load resource details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [resourceId]);

  const handleApplyAction = async (recId: number) => {
    try {
      setActionLoading(true);
      setSuccessMsg(null);
      await api.approveRecommendation(recId);
      setSuccessMsg("Remediation policy applied successfully! Capacity minimized and billing updated.");
      await fetchDetails();
    } catch (err: any) {
      setError(err.message || "Failed to apply optimization action.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-10 h-10 border-4 border-[#0F6CBD] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#545b64] text-xs font-semibold">Querying workload metrics timeline...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="bg-[#B91C1C]/5 border border-[#FCA5A5] rounded p-6 text-center max-w-xl mx-auto my-12">
        <h2 className="text-[#B91C1C] font-bold text-sm mb-2">Error</h2>
        <p className="text-xs text-[#16191f] mb-4">{error || "Resource details could not be found."}</p>
        <button onClick={onBack} className="px-4 py-2 bg-[#0F6CBD] text-white font-bold rounded">
          Back to Inventory
        </button>
      </div>
    );
  }

  const chartData = details.metrics?.map((m: any) => ({
    date: new Date(m.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    CPU: Math.round(m.cpu_avg),
    Memory: Math.round(m.mem_avg),
    Network: Math.round(m.network_in_out_gb),
    Disk: Math.round(m.disk_iops)
  })) || [];

  const activeRec = details.recommendations?.[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 border border-[#D1D5DB] bg-white hover:bg-[#F3F4F6] rounded text-[#4B5563] hover:text-[#0F172A] transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[10px] text-[#545b64] font-bold uppercase tracking-widest leading-none">Resource Metrics</span>
          <h1 className="text-base font-extrabold text-[#0F172A] mt-1.5">{details.id}</h1>
        </div>
      </div>

      {successMsg && (
        <div className="bg-[#1d8102]/10 border border-[#1d8102]/25 text-[#1d8102] p-4 rounded flex items-center gap-3">
          <CheckCircle className="w-4 h-4 flex-shrink-0 animate-bounce" />
          <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Grid: Details summary & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card */}
        <div className="aws-card rounded-md p-6 space-y-5 bg-white border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
              <Server className="w-5 h-5 text-[#545b64]" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[#0F172A]">{details.name}</h3>
              <p className="text-[9px] text-[#545b64] font-bold uppercase tracking-wider">{details.provider} &bull; {details.region}</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#E5E7EB] text-xs font-semibold">
            <div className="flex justify-between">
              <span className="text-[#545b64]">Service Category</span>
              <span className="text-[#0F172A]">{details.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#545b64]">Operational Status</span>
              <span className={`capitalize ${details.status === "active" ? "text-[#1d8102]" : "text-[#545b64]"}`}>
                {details.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#545b64]">Monthly Cost Baseline</span>
              <span className="text-[#0F172A]">${details.monthly_cost?.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#545b64]">Launch Time</span>
              <span className="text-[#4B5563] font-normal">
                {new Date(details.launch_time).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#545b64]">Utilization Band</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                details.efficiency_score >= 90 ? "glow-tag-success" :
                details.efficiency_score >= 70 ? "glow-tag-blue" :
                details.efficiency_score >= 40 ? "glow-tag-warning" :
                "glow-tag-danger"
              }`}>
                {details.efficiency_score?.toFixed(0)}% Score
              </span>
            </div>
          </div>
        </div>

        {/* Right Diagnostics Card */}
        <div className="aws-card rounded-md p-6 lg:col-span-2 flex flex-col justify-between border border-[#E5E7EB] bg-white shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-4 text-[#0F6CBD]">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <h3 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">Diagnostics Report</h3>
            </div>

            {activeRec ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#FEF3C7]/20 border border-[#FDE68A] rounded space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-5">
                    <AlertTriangle className="w-16 h-16 text-[#B45309]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#B45309] text-[9px] font-black uppercase tracking-wider">Target Policy</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                      activeRec.priority === "HIGH" ? "glow-tag-danger" : "glow-tag-warning"
                    }`}>
                      {activeRec.priority} PRIORITY
                    </span>
                  </div>
                  <h4 className="font-extrabold text-[#0F172A] text-xs mt-1">{activeRec.problem}</h4>
                  <p className="text-[#545b64] text-xs leading-relaxed max-w-2xl">{activeRec.evidence}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F9FAFB] p-3 rounded border border-[#E5E7EB]">
                    <p className="text-[9px] text-[#545b64] font-bold uppercase tracking-wider leading-none">Financial Impact</p>
                    <p className="text-sm font-extrabold text-[#0F172A] mt-2">${activeRec.financial_impact?.toFixed(0)}/mo</p>
                  </div>
                  <div className="bg-[#0f6cbd]/5 p-3 rounded border border-[#BFDBFE]">
                    <p className="text-[9px] text-[#0F6CBD] font-bold uppercase tracking-wider leading-none">Potential Savings</p>
                    <p className="text-sm font-extrabold text-[#15803D] mt-2">+${activeRec.potential_savings?.toFixed(0)}/mo</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] text-[#545b64] font-bold uppercase tracking-wider leading-none">Remediation Policy</p>
                  <p className="text-xs text-[#0F172A] font-extrabold leading-relaxed mt-1">{activeRec.action}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="p-2.5 bg-[#DCFCE7] rounded-full border border-[#BBF7D0]">
                  <CheckCircle className="w-6 h-6 text-[#15803D]" />
                </div>
                <h4 className="font-bold text-[#0F172A] text-xs">Asset is fully optimized</h4>
                <p className="text-xs text-[#545b64] max-w-xs">This resource utilization curve complies with allocation guidelines. No action needed.</p>
              </div>
            )}
          </div>

          {activeRec && (
            <div className="pt-6 border-t border-[#E5E7EB] flex justify-end">
              <button
                disabled={actionLoading}
                onClick={() => handleApplyAction(activeRec.id)}
                className="aws-btn-primary text-xs flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Minimizing allocations...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" /> Apply Remediation Action
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Utilization Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU / Mem */}
          <div className="aws-card rounded-md p-5 bg-white border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-[#0F6CBD] animate-pulse" />
              <h3 className="text-xs font-bold text-[#0F172A]">CPU & Memory Utilization History</h3>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" opacity={0.6} />
                  <XAxis dataKey="date" stroke="#4B5563" fontSize={9} tickLine={false} />
                  <YAxis stroke="#4B5563" fontSize={9} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#E5E7EB", borderRadius: "4px", fontSize: "10px" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="CPU" stroke="#0F6CBD" strokeWidth={2} dot={false} name="CPU Avg (%)" />
                  <Line type="monotone" dataKey="Memory" stroke="#475569" strokeWidth={2} dot={false} name="Memory Avg (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Network / Disk */}
          <div className="aws-card rounded-md p-5 bg-white border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#0F6CBD]" />
              <h3 className="text-xs font-bold text-[#0F172A]">Network & Disk I/O Timelines</h3>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" opacity={0.6} />
                  <XAxis dataKey="date" stroke="#4B5563" fontSize={9} tickLine={false} />
                  <YAxis stroke="#4B5563" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#E5E7EB", borderRadius: "4px", fontSize: "10px" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Network" fill="#0f6cbd" name="Network Data (GB)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Disk" fill="#475569" name="Disk operations (IOPS)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
