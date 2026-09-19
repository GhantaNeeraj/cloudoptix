import React, { useState } from "react";
import { Cloud, Shield, Key, Loader2, CheckCircle2, ToggleLeft, ToggleRight } from "lucide-react";

export const Connector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"AWS" | "Azure" | "GCP" | "AUTO_OPT">("AWS");
  const [loading, setLoading] = useState(false);
  const [connectionStates, setConnectionStates] = useState({
    AWS: "Demo Mode (Simulated Data Active)",
    Azure: "Demo Mode (Simulated Data Active)",
    GCP: "Not Connected"
  });
  const [awsRole, setAwsRole] = useState("arn:aws:iam::123456789012:role/CloudOptix-ReadAccess");
  const [awsExternalId, setAwsExternalId] = useState("cloudoptix-external-x9f2j");
  const [azureTenant, setAzureTenant] = useState("");
  const [azureApp, setAzureApp] = useState("");
  const [gcpProject, setGcpProject] = useState("");

  // Auto-Optimization States
  const [autoResize, setAutoResize] = useState(true);
  const [autoStopIdle, setAutoStopIdle] = useState(false);
  const [schedule, setSchedule] = useState("Weekends Only");

  const handleConnect = (provider: "AWS" | "Azure" | "GCP") => {
    setLoading(true);
    setTimeout(() => {
      setConnectionStates(prev => ({
        ...prev,
        [provider]: "Connected & Verified"
      }));
      setLoading(false);
    }, 1500);
  };

  const handleSaveAutoOpt = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Auto Optimization parameters saved successfully!");
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-extrabold text-[#0F172A] tracking-tight">Console Configuration</h1>
        <p className="text-xs text-[#545b64] mt-0.5">
          Link multi-cloud environments and configure schedules for automated background downscaling.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info/Security Pane */}
        <div className="aws-card rounded-md p-6 space-y-6 lg:col-span-1 bg-white border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-2 text-[#0F6CBD]">
            <Shield className="w-5 h-5" />
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Enterprise Security</h3>
          </div>
          <p className="text-xs text-[#545b64] leading-relaxed">
            CloudOptix connects to cloud environments using standard Read-Only credentials. We do not require or request write permissions to alter or destroy assets.
          </p>

          <div className="space-y-4 pt-4 border-t border-[#E5E7EB] text-xs font-semibold">
            <div className="flex gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#15803D] flex-shrink-0" />
              <div>
                <p className="font-bold text-[#0F172A]">Cross-Account IAM Access</p>
                <p className="text-[#545b64] font-normal mt-0.5">Linked using secure IAM assume-role policies that bypass static API access key constraints.</p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#15803D] flex-shrink-0" />
              <div>
                <p className="font-bold text-[#0F172A]">Scheduler Controls</p>
                <p className="text-[#545b64] font-normal mt-0.5">Enabling Auto-Optimization schedules remediation approvals only inside configured change windows.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Pane */}
        <div className="aws-card rounded-md p-6 lg:col-span-2 flex flex-col justify-between border border-[#E5E7EB] shadow-sm bg-white">
          <div>
            {/* Tabs */}
            <div className="flex border-b border-[#E5E7EB] mb-6">
              {(["AWS", "Azure", "GCP", "AUTO_OPT"] as const).map((prov) => (
                <button
                  key={prov}
                  onClick={() => setActiveTab(prov)}
                  className={`px-5 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
                    activeTab === prov
                      ? "border-[#0F6CBD] text-[#0F6CBD] font-black"
                      : "border-transparent text-[#545b64] hover:text-[#16191f]"
                  }`}
                >
                  {prov === "AWS" ? "Amazon Web Services" : prov === "Azure" ? "Microsoft Azure" : prov === "GCP" ? "Google Cloud" : "Auto Optimization"}
                </button>
              ))}
            </div>

            {/* Provider Forms */}
            {activeTab === "AWS" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-2 uppercase tracking-wide">
                    <Cloud className="w-5 h-5 text-[#ff9900]" /> AWS Role Settings
                  </h3>
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded ${
                    connectionStates.AWS.includes("Connected") ? "glow-tag-success" : "glow-tag-cyan"
                  }`}>
                    {connectionStates.AWS.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-xs text-[#545b64] leading-relaxed">
                  Provision a cross-account IAM role in AWS with the read-only policy <code className="bg-[#F3F4F6] border border-[#E5E7EB] text-[#0f6cbd] px-1.5 py-0.5 rounded font-mono text-[10px]">ReadOnlyAccess</code> and link it here.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#545b64] uppercase tracking-widest mb-2">IAM Role ARN</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-[#D1D5DB] rounded px-4 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#0F6CBD] placeholder-slate-400"
                      value={awsRole}
                      onChange={(e) => setAwsRole(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#545b64] uppercase tracking-widest mb-2">External ID</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-[#D1D5DB] rounded px-4 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#0F6CBD] placeholder-slate-400"
                      value={awsExternalId}
                      onChange={(e) => setAwsExternalId(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Azure" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-2 uppercase tracking-wide">
                    <Cloud className="w-5 h-5 text-[#0089d6]" /> Azure Directory Credentials
                  </h3>
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded ${
                    connectionStates.Azure.includes("Connected") ? "glow-tag-success" : "glow-tag-cyan"
                  }`}>
                    {connectionStates.Azure.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-xs text-[#545b64] leading-relaxed">
                  Register a client application in Azure AD, assign Reader permissions on your Subscription, and supply the credentials below.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#545b64] uppercase tracking-widest mb-2">Tenant ID</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-[#D1D5DB] rounded px-4 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#0F6CBD]"
                      placeholder="00000000-0000-0000-0000-000000000000"
                      value={azureTenant}
                      onChange={(e) => setAzureTenant(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#545b64] uppercase tracking-widest mb-2">Application (Client) ID</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-[#D1D5DB] rounded px-4 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#0F6CBD]"
                      placeholder="00000000-0000-0000-0000-000000000000"
                      value={azureApp}
                      onChange={(e) => setAzureApp(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "GCP" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-2 uppercase tracking-wide">
                    <Cloud className="w-5 h-5 text-[#4285f4]" /> GCP Service Key
                  </h3>
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded ${
                    connectionStates.GCP.includes("Connected") ? "glow-tag-success" : "bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]"
                  }`}>
                    {connectionStates.GCP.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-xs text-[#545b64] leading-relaxed">
                  Provide GCP credentials by creating a Service Account with the Viewer role in IAM & Admin, and upload its JSON credentials key.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#545b64] uppercase tracking-widest mb-2">GCP Project ID</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-[#D1D5DB] rounded px-4 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#0F6CBD]"
                      placeholder="gcp-project-12345"
                      value={gcpProject}
                      onChange={(e) => setGcpProject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#545b64] uppercase tracking-widest mb-2">Credentials Key JSON</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border border-[#E5E7EB] border-dashed rounded bg-[#F3F4F6]/30 hover:bg-[#E5E7EB]/50 transition-all cursor-pointer">
                      <div className="space-y-1 text-center">
                        <Key className="mx-auto h-8 w-8 text-[#545b64]" />
                        <div className="flex text-xs text-[#545b64]">
                          <label className="relative cursor-pointer bg-transparent rounded font-semibold text-[#0F6CBD] hover:underline focus-within:outline-none">
                            <span>Upload JSON file</span>
                            <input type="file" className="sr-only" />
                          </label>
                          <p className="pl-1 text-[#545b64] font-medium">or drag and drop</p>
                        </div>
                        <p className="text-[9px] text-[#545b64]">Service Account JSON Key File</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "AUTO_OPT" && (
              <div className="space-y-5 animate-fadeIn text-xs text-[#1E293B]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-2 uppercase tracking-wide">
                    <ToggleLeft className="w-5 h-5 text-[#0F6CBD]" /> Background Optimization Scheduler
                  </h3>
                  <span className="glow-tag-success">ENABLED</span>
                </div>
                
                <p className="text-xs text-[#545b64] leading-relaxed">
                  Enacting Auto-Optimization lets the analytical pipeline apply verified resizing recommendations on your behalf.
                </p>

                <div className="space-y-4 pt-2">
                  {/* Toggle 1: Auto Resize compute */}
                  <div className="flex items-center justify-between p-3.5 rounded border border-[#E5E7EB] bg-[#F9FAFB]">
                    <div>
                      <p className="font-bold text-[#0F172A]">Auto-Resize Compute Resources</p>
                      <p className="text-[10px] text-[#545b64] mt-0.5">Scale down oversized compute nodes whose 14-day CPU load is less than 5% average.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoResize(!autoResize)}
                      className="text-[#4B5563] hover:text-[#0F6CBD] transition-colors cursor-pointer"
                    >
                      {autoResize ? <ToggleRight className="w-8 h-8 text-[#0F6CBD]" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>

                  {/* Toggle 2: Auto Stop Idle servers */}
                  <div className="flex items-center justify-between p-3.5 rounded border border-[#E5E7EB] bg-[#F9FAFB]">
                    <div>
                      <p className="font-bold text-[#0F172A]">Auto-Shutdown Idle Servers</p>
                      <p className="text-[10px] text-[#545b64] mt-0.5">Automatically stop or decommission resources with zero workload activity for 14 consecutive days.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoStopIdle(!autoStopIdle)}
                      className="text-[#4B5563] hover:text-[#0F6CBD] transition-colors cursor-pointer"
                    >
                      {autoStopIdle ? <ToggleRight className="w-8 h-8 text-[#0F6CBD]" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>

                  {/* Dropdown: Schedule Windows */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#545b64] uppercase tracking-widest mb-2">Execution Change Window</label>
                    <select
                      className="bg-white border border-[#D1D5DB] rounded px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#0F6CBD] w-full md:w-64 cursor-pointer font-semibold"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                    >
                      <option value="Immediate">Immediate (Any Time)</option>
                      <option value="Weekends Only">Weekends Only (UTC Sat 00:00 - Sun 23:59)</option>
                      <option value="Out of Hours">Out of Hours (Daily 10:00 PM - 6:00 AM)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-[#E5E7EB] flex justify-end">
            {activeTab === "AUTO_OPT" ? (
              <button
                disabled={loading}
                onClick={handleSaveAutoOpt}
                className="aws-btn-primary text-xs flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> Saving Window...
                  </>
                ) : (
                  <>
                    Save Optimization Rules
                  </>
                )}
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={() => handleConnect(activeTab as any)}
                className="aws-btn-primary text-xs flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> Accessing...
                  </>
                ) : (
                  <>
                    Verify Connection
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
