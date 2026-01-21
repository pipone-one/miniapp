const RAW_BASE = import.meta.env.VITE_API_BASE_URL;
const FALLBACK_BASE = import.meta.env.DEV ? "/api" : "";
const RESOLVED_BASE = (RAW_BASE && RAW_BASE.length > 0 ? RAW_BASE : FALLBACK_BASE) || "";
const API_BASE = RESOLVED_BASE.endsWith("/") && RESOLVED_BASE.length > 1
  ? RESOLVED_BASE.slice(0, -1)
  : RESOLVED_BASE;

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type NicheItem = {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
};

export type TaskItem = {
  id: number;
  title: string;
  description?: string;
  task_type: "one_time" | "recurring";
  frequency?: string;
  scheduled_time?: string;
  is_archived: boolean;
  niche?: NicheItem;
  created_at: string;
  is_done_today: boolean;
};

// ... Legacy Types ...
export type WindowItem = {
  label: string;
  start: string;
  end: string;
  alert_at: string;
};

export type ModelStatusItem = {
  id: number;
  name: string;
  archetype: string;
  progress: number;
  status: string;
};

export type AccountPlatformItem = {
  id: number;
  platform: string;
  accounts: number;
  status: string;
};

export type HooksResponse = {
  model_name: string;
  hooks: string[];
  formatted: string;
};

export type PlanResponse = {
  brief: string;
  plan: string;
  formatted: string;
};

export type HealthResponse = {
  openai: string;
  xai: string;
  telegram: string;
  openai_verified?: string;
  xai_verified?: string;
  telegram_verified?: string;
};

// --- New Life OS Endpoints ---

export type UserProfile = {
  level: number;
  xp: number;
  streak: number;
  last_activity_date?: string;
  inventory?: string;
  achievements?: string;
  telegram_chat_id?: string;
};

export type TaskLogResponse = {
  status: string;
  profile?: UserProfile;
};

export type StatsResponse = {
  completed_today: number;
  total_active_today: number;
  completion_rate_today: number;
  completed_last_7_days: number;
  streak: number;
};

export type SummaryResponse = {
  summary: string;
  grade: string;
};

export async function getProfile(): Promise<UserProfile> {
  return request("/tasks/profile");
}

export async function updateProfile(data: { xp?: number; inventory?: string; achievements?: string; telegram_chat_id?: string }): Promise<UserProfile> {
  return request("/tasks/profile", { method: "PATCH", body: data });
}

export async function getStats(): Promise<StatsResponse> {
  return request("/tasks/stats");
}

export async function getDailySummary(): Promise<SummaryResponse> {
  return request("/assistant/daily-summary");
}

export async function listNiches(): Promise<NicheItem[]> {
  return request("/niches/");
}

export async function createNiche(data: { name: string; color?: string; icon?: string }): Promise<NicheItem> {
  return request("/niches/", { method: "POST", body: data });
}

export async function deleteNiche(id: number): Promise<{ status: string }> {
  return request(`/niches/${id}`, { method: "DELETE" });
}

export async function listTasks(nicheId?: number): Promise<TaskItem[]> {
  const query = nicheId ? `?niche_id=${nicheId}` : "";
  return request(`/tasks/${query}`);
}

export async function createTask(data: { title: string; niche_id?: number; task_type?: string; is_recurring?: boolean }): Promise<TaskItem> {
  // Map boolean is_recurring to task_type for backend
  const payload = {
    ...data,
    task_type: data.is_recurring ? "recurring" : (data.task_type || "one_time")
  };
  return request("/tasks/", { method: "POST", body: payload });
}

export async function updateTask(taskId: number, data: { title?: string; niche_id?: number; task_type?: string; is_recurring?: boolean }): Promise<TaskItem> {
  const payload = {
    ...data,
    task_type: data.is_recurring !== undefined ? (data.is_recurring ? "recurring" : "one_time") : data.task_type
  };
  return request(`/tasks/${taskId}`, { method: "PATCH", body: payload });
}

export async function deleteTask(taskId: number): Promise<{ status: string }> {
  return request(`/tasks/${taskId}`, { method: "DELETE" });
}

export async function parseTask(text: string): Promise<{ title: string; niche_suggested?: string; is_recurring: boolean; scheduled_time?: string; due_date?: string }> {
  return request("/assistant/parse", { method: "POST", body: { text } });
}

export async function breakDownGoal(goal: string): Promise<{ subtasks: { title: string; niche: string | null }[] }> {
  return request("/assistant/breakdown", { method: "POST", body: { goal } });
}

export async function logTask(taskId: number, status: string, note?: string): Promise<TaskLogResponse> {
  const query = new URLSearchParams({ status });
  if (note) query.append("note", note);
  return request(`/tasks/${taskId}/log?${query.toString()}`, { method: "POST" });
}

// ... Legacy Endpoints ...

export async function getWindows(): Promise<{ timezone: string; windows: WindowItem[] }> {
  return request("/scheduler/windows");
}

export async function notifyWindow(deepLink?: string): Promise<{ sent: boolean; window: WindowItem }> {
  const query = deepLink ? `?deep_link=${encodeURIComponent(deepLink)}` : "";
  return request(`/scheduler/notify${query}`, { method: "POST" });
}

export async function generateHooks(modelName: string): Promise<HooksResponse> {
  return request("/marketing/hooks", { method: "POST", body: { model_name: modelName } });
}

export async function createPlan(brief: string): Promise<PlanResponse> {
  return request("/planning/brief", { method: "POST", body: { brief } });
}

export async function listModels(): Promise<ModelStatusItem[]> {
  return request("/models/");
}

export async function updateModel(id: number, data: { progress?: number; status?: string }): Promise<ModelStatusItem> {
  return request(`/models/${id}`, { method: "PATCH", body: data });
}

export async function listAccounts(): Promise<AccountPlatformItem[]> {
  return request("/accounts/");
}

export async function updateAccount(id: number, data: { accounts?: number; status?: string }): Promise<AccountPlatformItem> {
  return request(`/accounts/${id}`, { method: "PATCH", body: data });
}

export async function getHealth(verify = false): Promise<HealthResponse> {
  const query = verify ? "?verify=true" : "";
  return request(`/health/${query}`);
}

export async function bananaMagic(file: File, mode: string): Promise<{ result: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);
  
  const response = await fetch(`${API_BASE}/banana/magic`, {
    method: "POST",
    body: formData,
    // Note: Do NOT set Content-Type header manually for FormData, browser does it with boundary
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }
  
  return response.json();
}

export async function bananaFaceswap(file: File): Promise<{ result: string }> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_BASE}/banana/faceswap`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }
  
  return response.json();
}

export async function resetSystem(): Promise<{ status: string }> {
  return request("/system/reset", { method: "POST" });
}

// ... Deprecated/Removed ...
// export async function createTaskFromVoice(...) 
// export async function updateTask(...) // Need to implement updateTask properly in frontend if used
