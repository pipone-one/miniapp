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

export type WindowItem = {
  label: string;
  start: string;
  end: string;
  alert_at: string;
};

export type TaskItem = {
  id: number;
  title: string;
  is_done: boolean;
  created_at: string;
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

export async function listTasks(): Promise<TaskItem[]> {
  return request("/tasks/");
}

export async function listModels(): Promise<ModelStatusItem[]> {
  return request("/models/");
}

export async function updateModel(
  modelId: number,
  payload: { progress?: number; status?: string }
): Promise<ModelStatusItem> {
  return request(`/models/${modelId}`, { method: "PATCH", body: payload });
}

export async function listAccounts(): Promise<AccountPlatformItem[]> {
  return request("/accounts/");
}

export async function updateAccount(
  accountId: number,
  payload: { accounts?: number; status?: string }
): Promise<AccountPlatformItem> {
  return request(`/accounts/${accountId}`, { method: "PATCH", body: payload });
}

export async function createTask(title: string): Promise<TaskItem> {
  return request("/tasks/", { method: "POST", body: { title } });
}

export async function updateTask(taskId: number, isDone: boolean): Promise<TaskItem> {
  return request(`/tasks/${taskId}`, { method: "PATCH", body: { is_done: isDone } });
}

export async function createTaskFromVoice(file: File): Promise<TaskItem> {
  const response = await fetch(`${API_BASE}/tasks/voice`, {
    method: "POST",
    body: (() => {
      const data = new FormData();
      data.append("audio", file);
      return data;
    })()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<TaskItem>;
}

export async function getHealth(verify = false): Promise<HealthResponse> {
  const query = verify ? "?verify=true" : "";
  return request(`/health/check${query}`);
}
