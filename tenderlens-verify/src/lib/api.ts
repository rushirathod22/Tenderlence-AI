const API_BASE = "http://localhost:8000/api";

export async function checkBackendHealth(): Promise<{ healthy: boolean; data?: any }> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET" });
    if (!res.ok) return { healthy: false };
    const data = await res.json();
    return { healthy: true, data };
  } catch {
    return { healthy: false };
  }
}

export async function fetchAutonomousScreening(tenderId = "GEM/2026/B/48213"): Promise<any> {
  const res = await fetch(`${API_BASE}/screen/autonomous?tender_id=${encodeURIComponent(tenderId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Backend screening error: ${res.statusText}`);
  return await res.json();
}

export async function postClarificationAction(
  clarificationId: string,
  action: "approve_send" | "vendor_respond",
  remark?: string,
  responseFile?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/clarifications/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clarification_id: clarificationId,
      action,
      remark,
      response_file: responseFile,
    }),
  });
  if (!res.ok) throw new Error(`Backend clarification action failed: ${res.statusText}`);
  return await res.json();
}

export async function uploadDocumentToBackend(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/upload/file`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return await res.json();
}

export async function triggerVendorVoiceCall(
  tenderId = "GEM/2026/B/48213",
  clarificationId = "clar-oem",
  phone = "+91 98201 44821"
): Promise<any> {
  const url = `${API_BASE}/outreach/call?tender_id=${encodeURIComponent(tenderId)}&clarification_id=${encodeURIComponent(clarificationId)}&phone=${encodeURIComponent(phone)}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(`Voice call API failed: ${res.statusText}`);
  return await res.json();
}

