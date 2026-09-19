import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Search, Eye, Filter, CheckCircle2, AlertTriangle } from "lucide-react";

interface ResourcesProps {
  onNavigate: (page: string, resourceId?: string) => void;
}

export const Resources: React.FC<ResourcesProps> = ({ onNavigate }) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [efficiencyBand, setEfficiencyBand] = useState("All");

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (type !== "All") filters.type = type;
      if (efficiencyBand !== "All") filters.efficiency_band = efficiencyBand;
      if (search.trim()) filters.search = search.trim();

      const data = await api.getResources(filters);
      setResources(data);
    } catch (err: any) {
      setError(err.message || "Failed to load cloud resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [type, efficiencyBand]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources();
  };

  const getProviderBadge = (provider: string) => {
    if (provider === "AWS") {
      return (
        <span className="bg-[#ff9900]/10 border border-[#ff9900]/30 text-[#ff9900] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          AWS
        </span>
      );
    }
    if (provider === "Azure") {
      return (
        <span className="bg-[#0089d6]/10 border border-[#0089d6]/30 text-[#0089d6] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          Azure
        </span>
      );
    }
    return (
      <span className="bg-[#4285f4]/10 border border-[#4285f4]/30 text-[#4285f4] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
        GCP
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-extrabold text-[#0F172A] tracking-tight">Cloud Inventory</h1>
        <p className="text-xs text-[#545b64] mt-0.5">
          Real-time catalog of virtual servers, relational databases, and block storage tiers.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="aws-card rounded-md p-4 shadow-sm bg-white border border-[#E5E7EB]">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="relative w-full md:flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#545b64]">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              className="w-full bg-white border border-[#D1D5DB] rounded pl-9 pr-4 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#0F6CBD] placeholder-slate-400"
              placeholder="Search resource ID or server tag name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setType("All"); setEfficiencyBand("All"); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] text-[#545b64] hover:text-[#0F6CBD] font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Service Type Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-[10px] font-bold text-[#545b64] flex items-center gap-1 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            <select
              className="bg-white border border-[#D1D5DB] rounded px-2.5 py-1.5 text-xs text-[#374151] focus:outline-none focus:border-[#0F6CBD] font-semibold cursor-pointer"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="All">All Services</option>
              <option value="Compute">Compute (EC2)</option>
              <option value="Database">Database (RDS)</option>
              <option value="Storage">Storage (S3)</option>
              <option value="Networking">Networking</option>
            </select>
          </div>

          {/* Efficiency Band Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-[10px] font-bold text-[#545b64] flex items-center gap-1 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" /> Efficiency:
            </span>
            <select
              className="bg-white border border-[#D1D5DB] rounded px-2.5 py-1.5 text-xs text-[#374151] focus:outline-none focus:border-[#0F6CBD] font-semibold cursor-pointer"
              value={efficiencyBand}
              onChange={(e) => setEfficiencyBand(e.target.value)}
            >
              <option value="All">All Scores</option>
              <option value="Excellent">Excellent (90-100)</option>
              <option value="Good">Good (70-89)</option>
              <option value="Needs Attention">Needs Attention (40-69)</option>
              <option value="Inefficient">Highly Inefficient (0-39)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 bg-[#0F6CBD] text-white font-semibold rounded hover:bg-[#0C589E] cursor-pointer shadow-sm text-xs"
          >
            Search
          </button>
        </form>
      </div>

      {/* Cloud Inventory Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-[#0F6CBD] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#545b64] text-xs font-semibold">Parsing infrastructure catalog...</p>
        </div>
      ) : error ? (
        <div className="bg-[#B91C1C]/5 border border-[#FCA5A5] rounded p-6 text-center text-[#B91C1C]">
          {error}
        </div>
      ) : resources.length === 0 ? (
        <div className="aws-card rounded p-12 text-center text-[#545b64] bg-white border border-[#E5E7EB]">
          <AlertTriangle className="w-12 h-12 mx-auto text-[#ff9900] mb-4" />
          <p className="font-bold text-[#0F172A] mb-1">No monitored assets found</p>
          <p className="text-xs">Try adapting your search string or check connector credentials.</p>
        </div>
      ) : (
        <div className="aws-card rounded-md overflow-hidden bg-white border border-[#E5E7EB] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#545b64] uppercase tracking-widest font-semibold text-[9px]">
                  <th className="py-3 px-4">Resource ID / Name</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Region</th>
                  <th className="py-3 px-4 text-center">Efficiency</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Monthly Cost</th>
                  <th className="py-3 px-4 text-right">Potential Savings</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((res) => {
                  const isWaste = res.is_idle || res.is_underutilized;
                  const savings = res.is_idle ? res.monthly_cost * 0.90 : res.monthly_cost * 0.50;

                  return (
                    <tr
                      key={res.id}
                      className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors duration-150 group"
                    >
                      {/* ID / Name */}
                      <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                        <div>
                          <span className="block font-semibold text-xs truncate max-w-[150px]" title={res.id}>
                            {res.id}
                          </span>
                          <span className="block text-[10px] text-[#545b64] font-normal truncate max-w-[150px]" title={res.name}>
                            {res.name}
                          </span>
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="py-3.5 px-4">
                        {getProviderBadge(res.provider)}
                      </td>

                      {/* Service Category */}
                      <td className="py-3.5 px-4">
                        <span className="text-[#374151] font-semibold">{res.type}</span>
                      </td>

                      {/* Region */}
                      <td className="py-3.5 px-4 text-[#545b64] font-medium">
                        {res.region}
                      </td>

                      {/* Efficiency Rating */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          res.efficiency_score >= 90 ? "glow-tag-success" :
                          res.efficiency_score >= 70 ? "glow-tag-blue" :
                          res.efficiency_score >= 40 ? "glow-tag-warning" :
                          "glow-tag-danger"
                        }`}>
                          {res.efficiency_score?.toFixed(0)}%
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 px-4 text-center font-semibold">
                        {res.is_idle ? (
                          <span className="glow-tag-danger">Idle</span>
                        ) : res.is_underutilized ? (
                          <span className="glow-tag-warning">Oversized</span>
                        ) : (
                          <span className="glow-tag-success">Optimal</span>
                        )}
                      </td>

                      {/* Monthly Cost */}
                      <td className="py-3.5 px-4 text-right text-[#0F172A] font-bold">
                        ${res.monthly_cost?.toFixed(0)}
                      </td>

                      {/* Potential Savings */}
                      <td className="py-3.5 px-4 text-right text-[#15803D] font-bold">
                        {isWaste ? `+$${savings.toFixed(0)}` : "—"}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onNavigate("resource-details", res.id)}
                            className="p-1.5 bg-white hover:bg-[#F3F4F6] text-[#4B5563] hover:text-[#0F6CBD] border border-[#D1D5DB] rounded transition-all cursor-pointer"
                            title="Inspect metrics curve"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
