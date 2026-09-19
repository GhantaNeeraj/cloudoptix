import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { TrendingUp, AlertTriangle, ArrowRight, Server, Activity, ShieldCheck } from "lucide-react";

interface DashboardProps {
  onNavigate: (page: string, resourceId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [selectedProvider, setSelectedProvider] = useState("All");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.getDashboardStats();
      setStats(data);

      const savingsOverview = await api.getSavingsOverview();
      const sByService = savingsOverview.savings_by_service;
      
      const pieChartData = sByService.map((s: any) => ({
        name: s.service_name,
        value: s.potential_savings
      }));
      setServiceData(pieChartData);

      // Simulated Cost by Region Data
      setRegionData([
        { name: "us-east-1 (N. Virginia)", cost: 4800, savings: 1200 },
        { name: "us-west-2 (Oregon)", cost: 3200, savings: 450 },
        { name: "eu-west-1 (Ireland)", cost: 2400, savings: 300 },
        { name: "ap-southeast-1 (Singapore)", cost: 1600, savings: 150 }
      ]);

      const baseDaily = data.monthly_cost / 30.0;
      const dataPoints = [];
      const now = new Date();
      
      for (let i = 90; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const monthFactor = i > 30 ? 1.0 : 1.3;
        let dailyCost = baseDaily * monthFactor * (1 + (Math.sin(i / 5) * 0.05) + (Math.random() * 0.04 - 0.02));
        
        if (i === 15) {
          dailyCost += 1250.0;
        }

        dataPoints.push({
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          Spend: Math.round(dailyCost),
          type: "historical"
        });
      }

      const forecastDaily = data.predicted_next_month / 30.0;
      for (let i = 1; i <= 30; i++) {
        const d = new Date();
        d.setDate(now.getDate() + i);
        const dailyCost = forecastDaily * (1 + (Math.sin(i / 8) * 0.02) + (Math.random() * 0.02 - 0.01));
        
        dataPoints.push({
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          Forecast: Math.round(dailyCost),
          type: "predicted"
        });
      }

      setChartData(dataPoints);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, selectedProvider]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-[#0F6CBD] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#545b64] text-xs font-semibold">Analyzing cloud telemetry data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#B91C1C]/5 border border-[#FCA5A5] rounded-md p-6 text-center max-w-xl mx-auto my-12">
        <h2 className="text-[#B91C1C] font-bold text-sm mb-2">Dashboard Error</h2>
        <p className="text-xs text-[#4B5563] mb-4">{error}</p>
        <button onClick={fetchDashboardData} className="aws-btn-primary">
          Retry Analysis
        </button>
      </div>
    );
  }

  // Restrained professional color palette: primary blue, slate, secondary blue, warning amber, critical red
  const PIE_COLORS = ["#0F6CBD", "#475569", "#0284C7", "#D1D5DB"];
  const optimizationScore = stats ? Math.round(((stats.monthly_cost - stats.potential_monthly_savings) / stats.monthly_cost) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn text-[#1E293B]">
      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-lg font-extrabold text-[#0F172A] tracking-tight">Overview</h1>
          <p className="text-xs text-[#4B5563] mt-0.5">
            AI-powered cloud optimization workspace. Grounded waste recommendations and regional costs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-[#D1D5DB] rounded px-2.5 py-1.5 text-xs text-[#374151] focus:outline-none focus:border-[#0F6CBD] font-semibold cursor-pointer"
          >
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 90 Days">Last 90 Days</option>
          </select>

          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="bg-white border border-[#D1D5DB] rounded px-2.5 py-1.5 text-xs text-[#374151] focus:outline-none focus:border-[#0F6CBD] font-semibold cursor-pointer"
          >
            <option value="All">All Providers</option>
            <option value="AWS">AWS Account Only</option>
            <option value="GCP">GCP Account Only</option>
          </select>

          <button
            onClick={fetchDashboardData}
            className="aws-btn-secondary flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-[#0F6CBD]" /> Re-run Regression
          </button>
        </div>
      </div>

      {/* Grid: Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Monthly Cost */}
        <div className="aws-card rounded-md p-5 bg-white relative">
          <p className="text-[10px] uppercase tracking-wider text-[#4B5563] font-bold">Monthly Cloud Cost</p>
          <p className="text-xl font-extrabold text-[#0F172A] mt-2">
            ${stats?.monthly_cost?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-[#B91C1C]">
            <TrendingUp className="w-3 h-3" />
            <span>Exceeded budget by 30% MoM</span>
          </div>
        </div>

        {/* Card 2: Projected Cost */}
        <div className="aws-card rounded-md p-5 bg-white">
          <p className="text-[10px] uppercase tracking-wider text-[#4B5563] font-bold">Projected Cost (Forecast)</p>
          <p className="text-xl font-extrabold text-[#0F172A] mt-2">
            ${stats?.predicted_next_month?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-[#B91C1C]">
            <AlertTriangle className="w-3 h-3" />
            <span>Predicted overspend trend</span>
          </div>
        </div>

        {/* Card 3: Potential Savings */}
        <div className="aws-card rounded-md p-5 bg-white border-l-4 border-l-[#15803D]">
          <p className="text-[10px] uppercase tracking-wider text-[#4B5563] font-bold">Potential Savings</p>
          <p className="text-xl font-extrabold text-[#15803D] mt-2">
            ${stats?.potential_monthly_savings?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[9px] text-[#4B5563] mt-2">
            Save up to {((stats?.potential_monthly_savings / stats?.monthly_cost) * 100).toFixed(0)}% of your bill
          </p>
        </div>

        {/* Card 4: Resources Monitored */}
        <div className="aws-card rounded-md p-5 bg-white">
          <p className="text-[10px] uppercase tracking-wider text-[#4B5563] font-bold">Resources Monitored</p>
          <p className="text-xl font-extrabold text-[#0F172A] mt-2">
            12
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#4B5563] font-semibold">
            <span>6 EC2, 2 RDS, 4 storage pools</span>
          </div>
        </div>

        {/* Card 5: Optimization Score */}
        <div className="aws-card rounded-md p-5 bg-white relative">
          <p className="text-[10px] uppercase tracking-wider text-[#4B5563] font-bold">Optimization Score</p>
          <p className="text-xl font-extrabold text-[#0F6CBD] mt-2">
            {optimizationScore}%
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#15803D] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Level: Fair</span>
          </div>
        </div>
      </div>

      {/* Grid: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Trend & Forecast */}
        <div className="aws-card rounded-md p-5 bg-white lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#0F172A]">Cost Trend & Projections</h3>
              <p className="text-[9px] text-[#4B5563] mt-0.5">Historical 90-day expenses overlaid with next-month forecast regressions.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-[#0F6CBD]">
                <span className="w-2 h-2 bg-[#0F6CBD] rounded-full"></span> Historical Cost
              </span>
              <span className="flex items-center gap-1 text-[#0284C7]">
                <span className="w-2 h-2 border border-dashed border-[#0284C7] rounded-full"></span> Forecast Cost
              </span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F6CBD" stopOpacity={0.06}/>
                    <stop offset="95%" stopColor="#0F6CBD" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.06}/>
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" opacity={0.6} />
                <XAxis dataKey="date" stroke="#4B5563" fontSize={9} tickLine={false} />
                <YAxis stroke="#4B5563" fontSize={9} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#E5E7EB", borderRadius: "4px", fontSize: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                  labelStyle={{ color: "#0F172A", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="Spend" stroke="#0F6CBD" strokeWidth={1.8} fillOpacity={1} fill="url(#colorSpend)" name="Historical" />
                <Area type="monotone" dataKey="Forecast" stroke="#0284C7" strokeWidth={1.8} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorForecast)" name="Projected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost by Service (Pie Chart) */}
        <div className="aws-card rounded-md p-5 bg-white flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#0F172A]">Cost Leakage by Service</h3>
            <p className="text-[9px] text-[#4B5563] mt-0.5">Potential savings breakdown by cloud resource tier.</p>
          </div>
          <div className="h-44 relative flex items-center justify-center my-3">
            {serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {serviceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#E5E7EB", borderRadius: "4px", fontSize: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-[#4B5563]">No active optimizations.</div>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-[8px] text-[#4B5563] uppercase tracking-wider font-bold">Monthly waste</span>
              <span className="text-xl font-extrabold text-[#0F6CBD] mt-0.5">${stats?.potential_monthly_savings?.toFixed(0)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] pt-3 border-t border-[#E5E7EB]">
            {serviceData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                <span className="text-[#4B5563] truncate max-w-[70px]">{entry.name}:</span>
                <span className="text-[#0F172A] font-bold">${entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Region Distribution & Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Region (Bar Chart) */}
        <div className="aws-card rounded-md p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#0F172A]">Cost & Waste by Deployment Region</h3>
              <p className="text-[9px] text-[#4B5563] mt-0.5">Compares total billing volume against estimated waste value.</p>
            </div>
            <div className="flex items-center gap-2.5 text-[9px] font-bold text-[#545b64]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#0F6CBD] rounded-sm"></span> Cost</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#B91C1C] rounded-sm"></span> Waste</span>
            </div>
          </div>
          
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" opacity={0.6} />
                <XAxis dataKey="name" stroke="#4B5563" fontSize={9} tickLine={false} />
                <YAxis stroke="#4B5563" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#E5E7EB", borderRadius: "4px", fontSize: "10px" }} />
                <Bar dataKey="cost" fill="#0F6CBD" name="Total Cost" radius={[2, 2, 0, 0]} barSize={16} />
                <Bar dataKey="savings" fill="#B91C1C" name="Potential Savings" radius={[2, 2, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Recommendations list */}
        <div className="aws-card rounded-md p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-[#0F172A]">Optimization Recommendations</h3>
                <p className="text-[9px] text-[#4B5563] mt-0.5">Top prioritised remediation targets to shrink infrastructure waste.</p>
              </div>
              <button onClick={() => onNavigate("savings")} className="text-[#0F6CBD] hover:underline text-[10px] font-bold flex items-center gap-0.5">
                Savings Center <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3.5">
              {stats?.top_savings?.length > 0 ? (
                stats.top_savings.map((opt: any) => (
                  <div key={opt.resource_id} className="flex items-center justify-between p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#0F6CBD]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-white border border-[#E5E7EB] rounded">
                        <Server className="w-3.5 h-3.5 text-[#545b64]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">{opt.resource_id}</p>
                        <p className="text-[9px] text-[#4B5563] mt-0.5">{opt.resource_name} &bull; {opt.service_type}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-extrabold text-[#15803D]">Save ${opt.potential_savings?.toFixed(0)}/mo</p>
                      <button
                        onClick={() => onNavigate("resource-details", opt.resource_id)}
                        className="text-[9px] text-[#0F6CBD] font-bold hover:underline mt-1 block w-full text-right"
                      >
                        Analyze Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-[#4B5563] py-12">
                  No active waste detected. All resources operating efficiently.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
