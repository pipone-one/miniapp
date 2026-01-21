import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createPlan,
  createTask,
  createTaskFromVoice,
  generateHooks,
  getHealth,
  getWindows,
  listAccounts,
  listModels,
  listTasks,
  notifyWindow,
  updateAccount,
  updateModel,
  updateTask,
  type AccountPlatformItem,
  type HealthResponse,
  type ModelStatusItem,
  type TaskItem,
  type WindowItem
} from "./api";
import { getTelegram, type TelegramUser } from "./telegram";

const defaultHooks = "```\nОжидаю хуки от Grok.\n```";
const defaultPlan = "```\nОжидаю план от GPT-4o.\n```";
const MINI_APP_LINK = import.meta.env.VITE_MINI_APP_LINK || "";

type Status = "idle" | "loading" | "error";
type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  text: string;
  tone: ToastTone;
};

function formatWindowLabel(window: WindowItem, timezone: string) {
  const start = new Date(window.start);
  const end = new Date(window.end);
  const startLabel = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone
  });
  const endLabel = end.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone
  });
  return `${startLabel}-${endLabel} ${timezone}`;
}

function formatModelStatus(value: string) {
  if (value === "Active") return "Активна";
  if (value === "Standby") return "Ожидание";
  if (value === "Development") return "Разработка";
  return value;
}

function formatAccountStatus(value: string) {
  if (value === "Active") return "Активно";
  if (value === "Warming") return "Прогрев";
  if (value === "Standby") return "Ожидание";
  return value;
}

function formatBotState(value: string | undefined) {
  if (!value || value === "Unknown") return "Неизвестно";
  if (value === "configured") return "Настроен";
  if (value === "missing") return "Нет ключа";
  if (value === "error:api") return "Ошибка";
  return value;
}

export default function App() {
  const [selectedModel, setSelectedModel] = useState("MIA");
  const [hooksFormatted, setHooksFormatted] = useState(defaultHooks);
  const [hooksStatus, setHooksStatus] = useState<Status>("idle");

  const [brief, setBrief] = useState("");
  const [planFormatted, setPlanFormatted] = useState(defaultPlan);
  const [planStatus, setPlanStatus] = useState<Status>("idle");

  const [windows, setWindows] = useState<WindowItem[]>([]);
  const [timezone, setTimezone] = useState("Europe/Kyiv");
  const [windowsStatus, setWindowsStatus] = useState<Status>("loading");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [lastNotified, setLastNotified] = useState<WindowItem | null>(null);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksStatus, setTasksStatus] = useState<Status>("loading");
  const [taskInput, setTaskInput] = useState("");
  const [taskError, setTaskError] = useState("");
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [voiceError, setVoiceError] = useState("");
  const voiceInputRef = useRef<HTMLInputElement | null>(null);

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<Status>("loading");

  const [models, setModels] = useState<ModelStatusItem[]>([]);
  const [modelsStatus, setModelsStatus] = useState<Status>("loading");
  const [modelEdits, setModelEdits] = useState<Record<number, { progress: number; status: string }>>({});

  const [accounts, setAccounts] = useState<AccountPlatformItem[]>([]);
  const [accountsStatus, setAccountsStatus] = useState<Status>("loading");
  const [accountEdits, setAccountEdits] = useState<Record<number, { accounts: number; status: string }>>({});

  const [isTelegram, setIsTelegram] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const formattedWindows = useMemo(() => {
    return windows.map((window) => ({
      ...window,
      label: window.label,
      timeLabel: formatWindowLabel(window, timezone)
    }));
  }, [windows, timezone]);

  const pushToast = useCallback((text: string, tone: ToastTone = "info") => {
    setToasts((prev) => [...prev, { id: Date.now(), text, tone }]);
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const loadWindows = useCallback(async (quiet = false) => {
    if (!quiet) setWindowsStatus("loading");
    try {
      const data = await getWindows();
      setWindows(data.windows);
      setTimezone(data.timezone);
      setWindowsStatus("idle");
    } catch (error) {
      setWindowsStatus("error");
    }
  }, []);

  const loadHealth = useCallback(async (quiet = false) => {
    if (!quiet) setHealthStatus("loading");
    try {
      const data = await getHealth(true);
      setHealth(data);
      setHealthStatus("idle");
    } catch (error) {
      setHealthStatus("error");
    }
  }, []);

  const loadTasks = useCallback(async (quiet = false) => {
    if (!quiet) setTasksStatus("loading");
    try {
      const data = await listTasks();
      setTasks(data);
      setTasksStatus("idle");
    } catch (error) {
      setTasksStatus("error");
    }
  }, []);

  const loadModels = useCallback(async (quiet = false) => {
    if (!quiet) setModelsStatus("loading");
    try {
      const data = await listModels();
      setModels(data);
      setModelEdits(
        Object.fromEntries(data.map((model) => [model.id, { progress: model.progress, status: model.status }]))
      );
      setModelsStatus("idle");
    } catch (error) {
      setModelsStatus("error");
    }
  }, []);

  const loadAccounts = useCallback(async (quiet = false) => {
    if (!quiet) setAccountsStatus("loading");
    try {
      const data = await listAccounts();
      setAccounts(data);
      setAccountEdits(
        Object.fromEntries(data.map((item) => [item.id, { accounts: item.accounts, status: item.status }]))
      );
      setAccountsStatus("idle");
    } catch (error) {
      setAccountsStatus("error");
    }
  }, []);

  useEffect(() => {
    const tg = getTelegram();
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.("#0c0f14");
      tg.setBackgroundColor?.("#06070a");
      setIsTelegram(true);
      setTelegramUser(tg.initDataUnsafe?.user ?? null);
    }

    loadWindows();
    loadHealth();
    loadTasks();
    loadModels();
    loadAccounts();
  }, [loadAccounts, loadHealth, loadModels, loadTasks, loadWindows]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadHealth(true);
      loadWindows(true);
      loadTasks(true);
      loadModels(true);
      loadAccounts(true);
    }, 45000);
    return () => window.clearInterval(interval);
  }, [loadAccounts, loadHealth, loadModels, loadTasks, loadWindows]);

  const botState = (() => {
    if (!health) return formatBotState("Unknown");
    if (health.telegram_verified === "ok") return "Подключен";
    if (health.telegram_verified) return formatBotState(health.telegram_verified);
    return formatBotState(health.telegram);
  })();

  const telegramLabel = telegramUser?.first_name
    ? `@${telegramUser.username ?? telegramUser.first_name}`
    : "Telegram WebApp";

  useEffect(() => {
    const tg = getTelegram();
    if (!tg?.MainButton || !tg?.BackButton) return;
    const handleMain = () => {
      const input = document.querySelector<HTMLInputElement>("input[placeholder='Добавить задачу или продиктовать']");
      input?.focus();
    };
    const handleBack = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    tg.MainButton.setParams({
      text: "Новая задача",
      color: "#44d4ff",
      text_color: "#06070a",
      is_active: true
    });
    tg.MainButton.show();
    tg.MainButton.onClick(handleMain);
    tg.BackButton.show();
    tg.BackButton.onClick(handleBack);

    return () => {
      tg.MainButton.offClick(handleMain);
      tg.BackButton.offClick(handleBack);
      tg.MainButton.hide();
      tg.BackButton.hide();
    };
  }, [isTelegram]);

  const handleGenerateHooks = async () => {
    setHooksStatus("loading");
    try {
      const data = await generateHooks(selectedModel);
      setHooksFormatted(data.formatted);
      setHooksStatus("idle");
      pushToast("Хуки готовы для копирования", "success");
    } catch (error) {
      setHooksFormatted("```\nНе удалось сгенерировать хуки.\n```");
      setHooksStatus("error");
      pushToast("Grok недоступен", "error");
    }
  };

  const handleCreatePlan = async () => {
    if (!brief.trim()) {
      setPlanFormatted("```\nСначала введи бриф.\n```");
      setPlanStatus("error");
      return;
    }
    setPlanStatus("loading");
    try {
      const data = await createPlan(brief.trim());
      setPlanFormatted(data.formatted);
      setPlanStatus("idle");
      pushToast("План готов", "success");
    } catch (error) {
      setPlanFormatted("```\nНе удалось сгенерировать план.\n```");
      setPlanStatus("error");
      pushToast("GPT-4o недоступен", "error");
    }
  };

  const handleNotify = async () => {
    setNotifyStatus("sending");
    try {
      const data = await notifyWindow(MINI_APP_LINK || undefined);
      setLastNotified(data.window);
      setNotifyStatus(data.sent ? "sent" : "error");
      pushToast(data.sent ? "Алерт отправлен" : "Не удалось отправить алерт", data.sent ? "success" : "error");
    } catch (error) {
      setNotifyStatus("error");
      pushToast("Telegram недоступен", "error");
    }
  };

  const handleAddTask = async () => {
    const trimmed = taskInput.trim();
    if (!trimmed) {
      setTaskError("Сначала введи название задачи.");
      return;
    }
    setTaskError("");
    try {
      const created = await createTask(trimmed);
      setTasks((prev) => [created, ...prev]);
      setTaskInput("");
      pushToast("Задача добавлена", "success");
    } catch (error) {
      setTaskError("Не удалось создать задачу.");
      pushToast("Ошибка создания задачи", "error");
    }
  };

  const handleVoiceUpload = async (file: File) => {
    setVoiceStatus("uploading");
    setVoiceError("");
    try {
      const created = await createTaskFromVoice(file);
      setTasks((prev) => [created, ...prev]);
      setVoiceStatus("idle");
      pushToast("Голосовая задача создана", "success");
    } catch (error) {
      setVoiceStatus("error");
      setVoiceError("Не удалось обработать голос.");
      pushToast("Whisper недоступен", "error");
    }
  };

  const handleToggleTask = async (task: TaskItem) => {
    const nextDone = !task.is_done;
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, is_done: nextDone } : item))
    );
    try {
      await updateTask(task.id, nextDone);
      pushToast(nextDone ? "Задача выполнена" : "Задача возвращена", "info");
    } catch (error) {
      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...item, is_done: task.is_done } : item))
      );
      pushToast("Не удалось сохранить задачу", "error");
    }
  };

  const handleModelSave = async (model: ModelStatusItem) => {
    const edit = modelEdits[model.id];
    if (!edit) return;
    try {
      const updated = await updateModel(model.id, {
        progress: edit.progress,
        status: edit.status
      });
      setModels((prev) => prev.map((item) => (item.id === model.id ? updated : item)));
      pushToast("Модель обновлена", "success");
    } catch (error) {
      setModelsStatus("error");
      pushToast("Ошибка сохранения модели", "error");
    }
  };

  const handleAccountSave = async (account: AccountPlatformItem) => {
    const edit = accountEdits[account.id];
    if (!edit) return;
    try {
      const updated = await updateAccount(account.id, {
        accounts: edit.accounts,
        status: edit.status
      });
      setAccounts((prev) => prev.map((item) => (item.id === account.id ? updated : item)));
      pushToast("Аккаунты обновлены", "success");
    } catch (error) {
      setAccountsStatus("error");
      pushToast("Ошибка сохранения аккаунтов", "error");
    }
  };

  return (
    <motion.main
      className="tma-shell min-h-screen bg-night-950 text-white"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-neon-purple/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-neon-blue/20 blur-[120px]" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-[560px] flex-col gap-6 px-4 py-6 sm:max-w-4xl lg:max-w-6xl sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">AI Cartel Command</p>
                <h1 className="font-display text-2xl font-semibold sm:text-4xl">Центр управления моделями</h1>
              </div>
              <motion.button
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/80 shadow-glow"
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.03 }}
              >
                Подключить бота
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-night-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60">
                Статус
              </span>
              <span className="rounded-full border border-white/10 bg-night-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/50">
                Среда: {isTelegram ? telegramLabel : "Браузер"}
              </span>
              <span className="rounded-full border border-white/10 bg-night-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/50">
                Бот: {botState}
              </span>
              {healthStatus === "loading" && (
                <span className="rounded-full border border-white/10 bg-night-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Проверяю...
                </span>
              )}
              {healthStatus === "error" && (
                <span className="rounded-full border border-white/10 bg-night-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-neon-amber">
                  Оффлайн
                </span>
              )}
              {healthStatus === "idle" && health && (
                <>
                  <span className="rounded-full border border-neon-blue/40 bg-neon-blue/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-neon-blue">
                    xAI: {health.xai_verified || health.xai}
                  </span>
                  <span className="rounded-full border border-neon-purple/40 bg-neon-purple/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-neon-purple">
                    OpenAI: {health.openai_verified || health.openai}
                  </span>
                  <span className="rounded-full border border-neon-green/40 bg-neon-green/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-neon-green">
                    Telegram: {health.telegram_verified || health.telegram}
                  </span>
                </>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-sm text-white/70">
                Изоляция фермы телефонов: <span className="text-neon-amber">1 телефон = 1 аккаунт</span>.
                Масштабируй 10+ аккаунтов в Instagram, Threads и X без пересечений.
              </p>
            </div>
            {!isTelegram && (
              <div className="rounded-2xl border border-neon-blue/30 bg-neon-blue/10 p-4 text-sm text-white/70">
                Для теста в Telegram: создай Mini App в BotFather → открой ссылку в Telegram. Сейчас открыт
                браузерный режим.
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-white/10 bg-night-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70"
                    onClick={() => {
                      void navigator.clipboard?.writeText(window.location.origin);
                      pushToast("Ссылка скопирована", "success");
                    }}
                  >
                    Скопировать ссылку
                  </button>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                    {window.location.origin}
                  </span>
                </div>
              </div>
            )}
          </header>

          <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl">Обзор моделей</h2>
                <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.3em]">
                  <span className="rounded-full border border-white/10 bg-night-900/70 px-2 py-1 text-white/50">
                    Дневной прогресс
                  </span>
                  <span className="rounded-full border border-neon-green/30 bg-neon-green/10 px-2 py-1 text-neon-green">
                    Активна
                  </span>
                  <span className="rounded-full border border-neon-blue/30 bg-neon-blue/10 px-2 py-1 text-neon-blue">
                    Ожидание
                  </span>
                  <span className="rounded-full border border-neon-amber/40 bg-neon-amber/10 px-2 py-1 text-neon-amber">
                    Разработка
                  </span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {modelsStatus === "loading" && (
                  <div className="rounded-2xl border border-white/10 bg-night-900/60 p-4 text-sm text-white/60">
                    Загружаю модели...
                  </div>
                )}
                {modelsStatus === "error" && (
                  <div className="rounded-2xl border border-white/10 bg-night-900/60 p-4 text-sm text-white/60">
                    Данные моделей недоступны.
                  </div>
                )}
                {modelsStatus === "idle" &&
                  models.map((model) => {
                    const edit = modelEdits[model.id] || { progress: model.progress, status: model.status };
                    const statusColor =
                      edit.status === "Active"
                        ? "bg-neon-green"
                        : edit.status === "Standby"
                        ? "bg-neon-blue"
                        : "bg-neon-amber";

                    return (
                      <motion.div
                        key={model.id}
                        className="rounded-2xl border border-white/10 bg-night-900/60 p-4 shadow-glow"
                        whileHover={{ y: -4 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-white/50">{model.name}</p>
                            <p className="text-sm text-white/70">{model.archetype}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`h-2 w-2 rounded-full ${statusColor} animate-pulse`} />
                            <span className="text-white/70">{formatModelStatus(edit.status)}</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-white/60">
                            <span>Прогресс</span>
                            <span>{edit.progress}%</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-night-800">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple"
                              style={{ width: `${edit.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={edit.progress}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              setModelEdits((prev) => ({
                                ...prev,
                                [model.id]: { ...edit, progress: value }
                              }));
                            }}
                            className="h-2 w-full accent-neon-blue"
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={edit.status}
                              onChange={(event) => {
                                setModelEdits((prev) => ({
                                  ...prev,
                                  [model.id]: { ...edit, status: event.target.value }
                                }));
                              }}
                              className="flex-1 rounded-full border border-white/10 bg-night-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70"
                            >
                              <option value="Active">Активна</option>
                              <option value="Standby">Ожидание</option>
                              <option value="Development">Разработка</option>
                            </select>
                            <motion.button
                              className="rounded-full border border-neon-blue/40 bg-neon-blue/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-neon-blue"
                              whileTap={{ scale: 0.96 }}
                              whileHover={{ scale: 1.03 }}
                              onClick={() => handleModelSave(model)}
                            >
                              Сохранить
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <h2 className="font-display text-xl">Синхронизация окон</h2>
                <p className="mt-2 text-sm text-white/60">
                  Планирование в Киеве под окна США. Уведомление в Telegram за 15 минут до окна.
                </p>
                <div className="mt-4 space-y-3">
                  {windowsStatus === "loading" && (
                    <div className="rounded-2xl border border-white/10 bg-night-900/70 px-4 py-3 text-sm text-white/60">
                      Загружаю расписание...
                    </div>
                  )}
                  {windowsStatus === "error" && (
                    <div className="rounded-2xl border border-white/10 bg-night-900/70 px-4 py-3 text-sm text-white/60">
                      Расписание недоступно.
                    </div>
                  )}
                  {windowsStatus === "idle" &&
                    formattedWindows.map((window) => (
                      <div
                        key={window.label}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-night-900/70 px-4 py-3"
                      >
                        <span className="text-sm text-white/70">{window.label}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-neon-blue">{window.timeLabel}</span>
                      </div>
                    ))}
                </div>
                {lastNotified && (
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/50">
                    Последний алерт: {lastNotified.label}
                  </p>
                )}
                <motion.button
                  className="mt-5 w-full rounded-2xl border border-neon-blue/40 bg-neon-blue/10 px-4 py-3 text-xs uppercase tracking-[0.25em] text-neon-blue"
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={handleNotify}
                  disabled={notifyStatus === "sending"}
                >
                  {notifyStatus === "sending" ? "Отправляю..." : "Отправить алерт"}
                </motion.button>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl">Матрица аккаунтов</h2>
                  <span className="text-xs uppercase tracking-[0.2em] text-white/50">10+ аккаунтов</span>
                </div>
                <p className="mt-2 text-sm text-white/60">
                  Масштабирование в Instagram, Threads и X. Сохраняем изоляцию телефонов.
                </p>
                <div className="mt-4 space-y-2">
                  {accountsStatus === "loading" && (
                    <div className="rounded-2xl border border-white/10 bg-night-900/70 px-4 py-3 text-sm text-white/60">
                      Загружаю аккаунты...
                    </div>
                  )}
                  {accountsStatus === "error" && (
                    <div className="rounded-2xl border border-white/10 bg-night-900/70 px-4 py-3 text-sm text-white/60">
                      Данные аккаунтов недоступны.
                    </div>
                  )}
                  {accountsStatus === "idle" &&
                    accounts.map((item) => {
                      const edit = accountEdits[item.id] || { accounts: item.accounts, status: item.status };
                      const color =
                        edit.status === "Active"
                          ? "text-neon-green"
                          : edit.status === "Warming"
                          ? "text-neon-amber"
                          : "text-neon-blue";
                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-white/10 bg-night-900/70 px-4 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white/70">{item.platform}</span>
                            <span className={`text-xs uppercase tracking-[0.2em] ${color}`}>
                              {formatAccountStatus(edit.status)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <input
                              type="number"
                              min={0}
                              value={edit.accounts}
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                setAccountEdits((prev) => ({
                                  ...prev,
                                  [item.id]: { ...edit, accounts: value }
                                }));
                              }}
                              className="w-20 rounded-full border border-white/10 bg-night-900/70 px-2 py-1 text-center text-white/70"
                            />
                            <span className="text-white/50">аккаунтов</span>
                            <select
                              value={edit.status}
                              onChange={(event) => {
                                setAccountEdits((prev) => ({
                                  ...prev,
                                  [item.id]: { ...edit, status: event.target.value }
                                }));
                              }}
                              className="ml-auto rounded-full border border-white/10 bg-night-900/70 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
                            >
                              <option value="Active">Активно</option>
                              <option value="Warming">Прогрев</option>
                              <option value="Standby">Ожидание</option>
                            </select>
                            <motion.button
                              className="rounded-full border border-neon-blue/40 bg-neon-blue/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-neon-blue"
                              whileTap={{ scale: 0.96 }}
                              whileHover={{ scale: 1.03 }}
                              onClick={() => handleAccountSave(item)}
                            >
                              Сохранить
                            </motion.button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">Маркетинг‑лаборатория</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-white/50">Grok-4-1</span>
              </div>
              <p className="mt-2 text-sm text-white/60">
                Логика Loop Trap: 5с видео, 7с текста. Выбери модель, получи 3 агрессивных хука.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {models.map((model) => (
                  <button
                    key={model.name}
                    onClick={() => setSelectedModel(model.name)}
                    className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                      selectedModel === model.name
                        ? "border-neon-blue/60 bg-neon-blue/10 text-neon-blue"
                        : "border-white/15 bg-night-900/70 text-white/70"
                    }`}
                  >
                    {model.name}
                  </button>
                ))}
                <motion.button
                  className="rounded-full border border-neon-purple/40 bg-neon-purple/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-neon-purple"
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={handleGenerateHooks}
                  disabled={hooksStatus === "loading"}
                >
                  {hooksStatus === "loading" ? "Генерирую..." : "Сгенерировать хуки"}
                </motion.button>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-night-900/80 p-4 text-xs text-neon-blue">
                {hooksFormatted}
              </pre>
              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg">Планер</h3>
                  <span className="text-xs uppercase tracking-[0.2em] text-white/50">GPT-4o</span>
                </div>
                <p className="mt-2 text-sm text-white/60">Превращает бриф в тактический план.</p>
                <textarea
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-night-900/70 p-3 text-sm text-white/80"
                  rows={3}
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  placeholder="Бриф: запустить Loop Trap кампанию для Mia на US prime"
                />
                <motion.button
                  className="mt-3 rounded-full border border-neon-purple/40 bg-neon-purple/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-neon-purple"
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={handleCreatePlan}
                  disabled={planStatus === "loading"}
                >
                  {planStatus === "loading" ? "Планирую..." : "Сгенерировать план"}
                </motion.button>
                <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-night-900/80 p-4 text-xs text-neon-blue">
                  {planFormatted}
                </pre>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="font-display text-xl">Командный центр задач</h2>
              <p className="mt-2 text-sm text-white/60">Добавляй голосом или текстом, успех отмечается анимацией.</p>
              <div className="mt-4 space-y-3">
                {tasksStatus === "loading" && (
                  <div className="rounded-2xl border border-white/10 bg-night-900/70 px-4 py-3 text-sm text-white/60">
                    Загружаю задачи...
                  </div>
                )}
                {tasksStatus === "error" && (
                  <div className="rounded-2xl border border-white/10 bg-night-900/70 px-4 py-3 text-sm text-white/60">
                    Список задач недоступен.
                  </div>
                )}
                {tasksStatus === "idle" && tasks.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-night-900/70 px-4 py-3 text-sm text-white/60">
                    Задач пока нет.
                  </div>
                )}
                {tasksStatus === "idle" &&
                  tasks.map((task) => (
                    <motion.label
                      key={task.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-night-900/70 px-4 py-3"
                      whileHover={{ x: 4 }}
                    >
                      <input
                        type="checkbox"
                        checked={task.is_done}
                        onChange={() => handleToggleTask(task)}
                        className="h-4 w-4 rounded border-white/20 bg-night-800 text-neon-blue focus:ring-neon-blue"
                      />
                      <span className={`text-sm ${task.is_done ? "text-white/40 line-through" : "text-white/70"}`}>
                        {task.title}
                      </span>
                      {task.is_done && (
                          <motion.span
                            className="ml-auto text-xs uppercase tracking-[0.3em] text-neon-green"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            Успех
                          </motion.span>
                        )}
                    </motion.label>
                  ))}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-2xl border border-white/10 bg-night-900/70 px-4 py-2 text-sm text-white/70"
                    placeholder="Добавить задачу или продиктовать"
                    value={taskInput}
                    onChange={(event) => setTaskInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleAddTask();
                      }
                    }}
                  />
                  <motion.button
                    className="rounded-2xl border border-neon-blue/40 bg-neon-blue/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-neon-blue"
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={handleAddTask}
                  >
                    Добавить
                  </motion.button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={voiceInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        handleVoiceUpload(file);
                      }
                    }}
                  />
                  <motion.button
                    className="rounded-2xl border border-neon-purple/40 bg-neon-purple/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-neon-purple"
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => voiceInputRef.current?.click()}
                  >
                    {voiceStatus === "uploading" ? "Загружаю..." : "Загрузить голос"}
                  </motion.button>
                  {voiceStatus === "error" && (
                    <span className="text-xs uppercase tracking-[0.2em] text-neon-amber">{voiceError}</span>
                  )}
                </div>
                {taskError && <p className="text-xs uppercase tracking-[0.2em] text-neon-amber">{taskError}</p>}
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-xs flex-col gap-2 px-4 sm:right-6 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border px-4 py-3 text-xs uppercase tracking-[0.2em] backdrop-blur ${
              toast.tone === "success"
                ? "border-neon-green/40 bg-neon-green/10 text-neon-green"
                : toast.tone === "error"
                ? "border-neon-amber/40 bg-neon-amber/10 text-neon-amber"
                : "border-neon-blue/40 bg-neon-blue/10 text-neon-blue"
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </motion.main>
  );
}
