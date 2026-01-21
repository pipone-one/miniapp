import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useState, useEffect, useRef, useMemo, forwardRef } from "react";
import { 
  Activity, 
  Briefcase, 
  Coffee, 
  Zap, 
  Camera, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Circle, 
  Repeat, 
  Plus, 
  X,
  Dumbbell,
  BookOpen,
  Heart,
  Gamepad2,
  Moon,
  Sun,
  Music,
  Brain,
  Banana,
  Settings,
  Globe,
  Trash2,
  Edit2,
  Trophy,
  Flame,
  Star,
  TrendingUp,
  Layout,
  Play,
  ChevronRight,
  Calendar,
  User,
  BarChart3,
  Clock,
  ArrowRight,
  Smartphone,
  MessageSquare,
  Mic,
  ShoppingBag,
  Award,
  Lock,
  Unlock,
  Palette,
  Volume2,
  Snowflake,
  Wand2
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  createTask,
  generateHooks,
  createPlan,
  listNiches,
  listTasks,
  logTask,
  createNiche,
  deleteNiche,
  bananaMagic,
  bananaFaceswap,
  type NicheItem,
  type TaskItem,
  resetSystem,
  getProfile,
  updateProfile,
  type UserProfile,
  deleteTask,
  updateTask,
  parseTask,
  breakDownGoal,
  type StatsResponse,
  getStats,
  getDailySummary,
  type SummaryResponse
} from "./api";
import { playSound, vibrate } from "./utils/sound";

// --- Utils ---
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- Translations ---
const TRANSLATIONS = {
  ru: {
    // Focus Screen
    niches: "Ниши",
    today: "Сегодня",
    add: "Добавить",
    cancel: "Отмена",
    newTaskPlaceholder: "Новая задача...",
    daily: "Повторять ежедневно",
    oneTime: "Разовая задача",
    create: "Создать",
    cleanHorizon: "Чистый горизонт",
    
    // Lab Screen
    nanoBanana: "NANO Banana",
    aiLab: "AI-Лаборатория v1.0",
    uploadPhoto: "Загрузите фото",
    format: "JPG, PNG до 10MB",
    analyzing: "ANALYZING...",
    faceSwap: "Face Swap",
    magic: "Магия",
    
    // Settings Screen
    settings: "Настройки",
    personalization: "Персонализация Life OS",
    app: "Приложение",
    theme: "Тема оформления",
    dark: "Темная",
    light: "Светлая",
    enableLight: "Включить светлую",
    enableDark: "Включить темную",
    language: "Язык",
    russian: "Русский",
    english: "English",
    addNiche: "Добавить нишу",
    nicheNameLabel: "Название",
    nicheNamePlaceholder: "Например: Чтение",
    nicheColorLabel: "Цвет",
    createNicheBtn: "Добавить нишу",
    created: "Создано!",
    manageNiches: "Управление нишами",
    deleteNicheConfirm: "Удалить эту нишу? Задачи останутся без категории.",
    dangerZone: "Опасная зона",
    resetData: "Сбросить все данные",
    resetConfirm: "Вы уверены? Все данные будут удалены.",
    
    // Tabs
    tabFocus: "Фокус",
    tabShop: "Шоп",
    tabLab: "Лаб",
    tabSettings: "Настройки",

    // Shop Screen
    shop: "Магазин & Достижения",
    xpBalance: "Баланс XP",
    buy: "Купить",
    purchased: "Куплено",
    locked: "Закрыто",
    itemThemeNeon: "Неоновая Тема",
    itemSound8bit: "8-бит Звуки",
    itemStreakFreeze: "Заморозка Стрика",
    achievements: "Достижения",
    achFirstBlood: "Первая Кровь",
    achFirstBloodDesc: "Выполните 1 задачу",
    achOnFire: "В Огне",
    achOnFireDesc: "Стрик 3 дня",
    achMaster: "Мастер",
    achMasterDesc: "Достигните 5 уровня",
    
    // Telegram
    telegram: "Telegram Интеграция",
    chatId: "Ваш Chat ID",
    chatIdPlaceholder: "Введите ID (напр. 12345678)",
    save: "Сохранить",
    saved: "Сохранено!",
    telegramDesc: "Запустите бота @... и введите ID здесь."
  },
  en: {
    // Focus Screen
    niches: "Niches",
    today: "Today",
    add: "Add",
    cancel: "Cancel",
    newTaskPlaceholder: "New task...",
    daily: "Repeat Daily",
    oneTime: "One-time Task",
    create: "Create",
    cleanHorizon: "Clean Horizon",
    
    // Lab Screen
    nanoBanana: "NANO Banana",
    aiLab: "AI Laboratory v1.0",
    uploadPhoto: "Upload Photo",
    format: "JPG, PNG up to 10MB",
    analyzing: "ANALYZING...",
    faceSwap: "Face Swap",
    magic: "Magic",
    
    // Settings Screen
    settings: "Settings",
    personalization: "Life OS Personalization",
    app: "Application",
    theme: "Appearance",
    dark: "Dark",
    light: "Light",
    enableLight: "Switch to Light",
    enableDark: "Switch to Dark",
    language: "Language",
    russian: "Russian",
    english: "English",
    addNiche: "Add Niche",
    nicheNameLabel: "Name",
    nicheNamePlaceholder: "Ex: Reading",
    nicheColorLabel: "Color",
    createNicheBtn: "Add Niche",
    created: "Created!",
    manageNiches: "Manage Niches",
    deleteNicheConfirm: "Delete this niche? Tasks will be uncategorized.",
    dangerZone: "Danger Zone",
    resetData: "Reset All Data",
    resetConfirm: "Are you sure? All data will be wiped.",
    
    // Tabs
    tabFocus: "Focus",
    tabShop: "Shop",
    tabLab: "Lab",
    tabSettings: "Settings",

    // Shop Screen
    shop: "Shop & Achievements",
    xpBalance: "XP Balance",
    buy: "Buy",
    purchased: "Purchased",
    locked: "Locked",
    itemThemeNeon: "Neon Theme",
    itemSound8bit: "8-bit Sounds",
    itemStreakFreeze: "Streak Freeze",
    achievements: "Achievements",
    achFirstBlood: "First Blood",
    achFirstBloodDesc: "Complete 1 task",
    achOnFire: "On Fire",
    achOnFireDesc: "3 day streak",
    achMaster: "Master",
    achMasterDesc: "Reach level 5",

    // Telegram
    telegram: "Telegram Integration",
    chatId: "Your Chat ID",
    chatIdPlaceholder: "Enter ID (e.g. 12345678)",
    save: "Save",
    saved: "Saved!",
    telegramDesc: "Start bot @... and enter ID here."
  }
};

type Lang = 'ru' | 'en';

// --- Icons Map ---
const ICON_MAP: Record<string, any> = {
  sport: Dumbbell,
  work: Briefcase,
  rest: Coffee,
  learn: BookOpen,
  health: Heart,
  hobby: Gamepad2,
  music: Music,
  mind: Brain,
  default: Zap
};

// --- Constants ---
const PRESET_COLORS = [
  "#FF453A", // iOS Red
  "#FF9F0A", // iOS Orange
  "#FFD60A", // iOS Yellow
  "#32D74B", // iOS Green
  "#66D4CF", // Mint
  "#64D2FF", // iOS Teal
  "#0A84FF", // iOS Blue
  "#5E5CE6", // iOS Indigo
  "#BF5AF2", // iOS Purple
  "#FF375F", // iOS Pink
  "#AC8E68", // Gold/Brown
  "#8E8E93", // System Gray
];

// --- Components ---

function TabButton({ active, icon: Icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
        active ? "text-indigo-600 dark:text-white" : "text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60"
      )}
    >
      {active && (
        <motion.div 
          layoutId="tab-bg"
          className="absolute inset-0 bg-indigo-50 dark:bg-white/10 rounded-xl"
        />
      )}
      <span className="relative z-10"><Icon size={20} strokeWidth={active ? 2.5 : 2} /></span>
      <span className="relative z-10 text-[10px] font-medium">{label}</span>
    </button>
  );
}

function NicheCard({ niche }: { niche: NicheItem }) {
  // Robust Icon Selection Logic
  let Icon = ICON_MAP.default;
  const name = niche.name.toLowerCase();
  
  if (name.includes("sport") || name.includes("спорт") || name.includes("fitness") || name.includes("фитнес") || name.includes("gym") || name.includes("зал")) Icon = ICON_MAP.sport;
  else if (name.includes("work") || name.includes("работ") || name.includes("job") || name.includes("бизнес") || name.includes("business")) Icon = ICON_MAP.work;
  else if (name.includes("rest") || name.includes("отдых") || name.includes("relax") || name.includes("chill") || name.includes("sleep") || name.includes("сон")) Icon = ICON_MAP.rest;
  else if (name.includes("learn") || name.includes("уч") || name.includes("study") || name.includes("book") || name.includes("книг")) Icon = ICON_MAP.learn;
  else if (name.includes("health") || name.includes("здоров")) Icon = ICON_MAP.health;
  else if (name.includes("hobby") || name.includes("хобби") || name.includes("game") || name.includes("игр")) Icon = ICON_MAP.hobby;
  else if (name.includes("music") || name.includes("музык")) Icon = ICON_MAP.music;
  else if (name.includes("mind") || name.includes("мозг") || name.includes("think") || name.includes("мышл")) Icon = ICON_MAP.mind;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative group overflow-hidden rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] p-5 flex flex-col justify-between h-32 backdrop-blur-xl shadow-sm dark:shadow-none"
    >
      {/* Glow Effect */}
      <div 
        className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"
        style={{ backgroundColor: niche.color }} 
      />
      
      <div className="relative z-10 flex justify-between items-start">
        <div 
          className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white/80"
          style={{ color: niche.color }}
        >
          <Icon size={20} strokeWidth={1.5} />
        </div>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: niche.color, boxShadow: `0 0 8px ${niche.color}` }} />
      </div>

      <div className="relative z-10">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white tracking-tight">{niche.name}</h3>
        {niche.description && (
          <p className="text-xs text-gray-500 dark:text-white/40 mt-1 line-clamp-1">{niche.description}</p>
        )}
      </div>
    </motion.div>
  );
}

const TaskRow = forwardRef<HTMLDivElement, { task: TaskItem; onToggle: () => void; onDelete: () => void; onEdit: () => void }>(
  ({ task, onToggle, onDelete, onEdit }, ref) => {
    const x = useMotionValue(0);
    const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
    const editOpacity = useTransform(x, [50, 100], [0, 1]);
    const deleteScale = useTransform(x, [-100, -50], [1, 0.8]);
    const editScale = useTransform(x, [50, 100], [0.8, 1]);

    return (
      <div ref={ref} className="relative">
        <div className="absolute inset-0 flex items-center justify-between px-6 rounded-2xl overflow-hidden">
           <motion.div style={{ opacity: editOpacity, scale: editScale }} className="text-blue-500 font-bold flex items-center gap-2">
              <Edit2 size={24} />
           </motion.div>
           <motion.div style={{ opacity: deleteOpacity, scale: deleteScale }} className="text-red-500 font-bold flex items-center gap-2">
              <Trash2 size={24} />
           </motion.div>
        </div>

      <motion.div
        layout
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -100) {
            playSound('delete');
            vibrate(50);
            onDelete();
          } else if (info.offset.x > 100) {
            playSound('success');
            vibrate(20);
            onEdit();
          }
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileDrag={{ scale: 1.02, zIndex: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative z-10 group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors shadow-sm dark:shadow-none touch-pan-y"
      >
        <button
          onClick={onToggle}
          className={cn(
            "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300",
            task.is_done_today
              ? "bg-indigo-500 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
              : "border-gray-300 dark:border-white/20 text-transparent hover:border-indigo-400/50"
          )}
        >
          <CheckCircle2 size={14} strokeWidth={3} className={cn("transform transition-transform", task.is_done_today ? "scale-100" : "scale-0")} />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
             <p className={cn(
               "text-sm font-medium truncate transition-all", 
               task.is_done_today ? "text-gray-400 dark:text-white/30 line-through" : "text-gray-900 dark:text-white/90"
             )}>
               {task.title}
             </p>
             {task.task_type === "recurring" && (
               <Repeat size={12} className="text-purple-400/70" />
             )}
          </div>
          {task.niche && (
            <p className="text-[10px] text-gray-500 dark:text-white/40 flex items-center gap-1.5 mt-0.5">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: task.niche.color }} />
              {task.niche.name}
            </p>
          )}
        </div>
      </motion.div>
      </div>
    );
  }
);

// --- Screens ---

function StatsModal({ onClose, lang }: { onClose: () => void; lang: Lang }) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const data = await getDailySummary();
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSummary(false);
    }
  };

  if (!stats) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-[#111] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={24} className="text-indigo-500" />
            {lang === 'ru' ? "Статистика" : "Statistics"}
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10">
            <X size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-2xl">
                <p className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase mb-1">{lang === 'ru' ? "Выполнено" : "Completed"}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed_today}</p>
            </div>
             <div className="bg-purple-50 dark:bg-purple-500/10 p-4 rounded-2xl">
                <p className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase mb-1">{lang === 'ru' ? "Эффективность" : "Rate"}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(stats.completion_rate_today * 100)}%</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-500/10 dark:to-orange-500/10 p-5 rounded-2xl col-span-2">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-pink-600 dark:text-pink-400 text-xs font-bold uppercase mb-1">{lang === 'ru' ? "За 7 дней" : "Last 7 Days"}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed_last_7_days} <span className="text-base font-normal opacity-60">{lang === 'ru' ? "задач" : "tasks"}</span></p>
                    </div>
                     <div className="text-pink-500 bg-white/50 dark:bg-white/10 p-3 rounded-xl">
                        <TrendingUp size={28} />
                    </div>
                </div>
            </div>
            
            {/* AI Summary Section */}
            <div className="col-span-2 mt-2">
               {!summary ? (
                 <button 
                   onClick={handleGenerateSummary}
                   disabled={loadingSummary}
                   className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                 >
                   {loadingSummary ? (
                     <Sparkles size={16} className="animate-spin" />
                   ) : (
                     <Sparkles size={16} />
                   )}
                   {lang === 'ru' ? "Анализ дня (AI)" : "Analyze Day (AI)"}
                 </button>
               ) : (
                 <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold uppercase text-gray-400 dark:text-white/40">{lang === 'ru' ? "AI Советник" : "AI Advisor"}</p>
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-md",
                        summary.grade === 'S' || summary.grade === 'A' ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                        summary.grade === 'B' ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                      )}>
                        Grade: {summary.grade}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-white/80 leading-relaxed italic">
                      "{summary.summary}"
                    </p>
                 </div>
               )}
            </div>
        </div>
      </motion.div>
    </div>
  );
}

function GamificationHeader({ profile, onOpenStats }: { profile: UserProfile; onOpenStats: () => void }) {
  const nextLevelXp = profile.level * 100;
  const progress = Math.min((profile.xp / nextLevelXp) * 100, 100);

  return (
    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-5 text-white mb-6 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Trophy size={120} />
      </div>
      
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
            <span className="text-xl font-bold">{profile.level}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Level</p>
            <p className="text-sm font-semibold">{profile.xp} / {nextLevelXp} XP</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button onClick={onOpenStats} className="bg-white/20 backdrop-blur-md p-1.5 rounded-full border border-white/30 hover:bg-white/30 transition-colors active:scale-95">
              <BarChart3 size={16} />
           </button>
           <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
            <Flame size={16} className="text-orange-300 fill-orange-300" />
            <span className="text-sm font-bold">{profile.streak} Day Streak</span>
          </div>
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="h-2 bg-black/20 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50 }}
            className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          />
        </div>
      </div>
    </div>
  );
}

function FocusScreen({ lang }: { lang: Lang }) {
  const [niches, setNiches] = useState<NicheItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<number | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    Promise.all([listNiches(), listTasks(), getProfile()])
      .then(([n, t, p]) => {
        setNiches(n);
        setTasks(t);
        setProfile(p);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load data:", err);
        setError("Не удалось загрузить данные. Проверьте подключение к интернету.");
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <Zap size={32} />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ошибка связи</h3>
        <p className="text-sm text-gray-500 dark:text-white/50">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium active:scale-95 transition-transform"
        >
          Повторить
        </button>
      </div>
    );
  }

  const handleToggle = async (task: TaskItem) => {
    // Optimistic update
    if (task.task_type === "one_time") {
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } else {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_done_today: !t.is_done_today } : t));
    }
    
    if (!task.is_done_today) {
      playSound('success');
      vibrate([10, 30, 10]);
      const response = await logTask(task.id, "done");
      if (response.profile) setProfile(response.profile);
    } else {
      await logTask(task.id, "pending");
      // Could fetch profile again to revert, but simpler to just keep it or optimistic revert?
      // For now, let's keep XP. You don't lose XP for undoing (or maybe you should?)
      // Simplest: Don't revert XP on undo to avoid negative feeling, or fetch profile.
      // Let's re-fetch profile to be safe/sync.
      getProfile().then(setProfile);
    }
  };

  const handleDelete = async (taskId: number) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await deleteTask(taskId);
  };

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setNewTaskTitle(prev => (prev ? prev + " " + transcript : transcript));
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      vibrate(50);
    }
  };

  const handleEdit = (task: TaskItem) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setSelectedNiche(task.niche ? task.niche.id : (niches.length > 0 ? niches[0].id : null));
    setIsRecurring(task.task_type === "recurring");
    setShowAdd(true);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      if (editingTask) {
        const nicheId = selectedNiche || (niches.length > 0 ? niches[0].id : 1);
        const updatedTask = await updateTask(editingTask.id, {
          title: newTaskTitle,
          niche_id: nicheId,
          is_recurring: isRecurring
        });
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        setEditingTask(null);
        playSound('success');
      } else {
        const parsed = await parseTask(newTaskTitle);
        let nicheId = selectedNiche;
        
        if (!nicheId && parsed.niche_suggested) {
          const found = niches.find(n => 
            n.name.toLowerCase() === parsed.niche_suggested?.toLowerCase()
          );
          if (found) nicheId = found.id;
        }
        if (!nicheId) nicheId = (niches.length > 0 ? niches[0].id : 1);
        
        const newTask = await createTask({
          title: parsed.title,
          niche_id: nicheId,
          is_recurring: parsed.is_recurring || isRecurring
        });
        
        const nicheObj = niches.find(n => n.id === nicheId);
        setTasks(prev => [{ ...newTask, niche: nicheObj }, ...prev]);
        playSound('success');
      }

      setNewTaskTitle("");
      setIsRecurring(false);
      setShowAdd(false);
      vibrate(20);
    } catch (e) {
      console.error("Failed to save task", e);
    }
  };

  const handleMagic = async () => {
    if (!newTaskTitle.trim()) return;
    setIsParsing(true);
    try {
      const result = await parseTask(newTaskTitle);
      setNewTaskTitle(result.title);
      if (result.is_recurring) setIsRecurring(true);
      if (result.niche_suggested) {
        // Simple heuristic to match niche name
        const found = niches.find(n => 
          n.name.toLowerCase().includes(result.niche_suggested!.toLowerCase()) || 
          result.niche_suggested!.toLowerCase().includes(n.name.toLowerCase())
        );
        if (found) setSelectedNiche(found.id);
      }
      playSound('success');
      vibrate(20);
    } catch (e) {
      console.error(e);
    } finally {
      setIsParsing(false);
    }
  };

  const handleBreakdown = async () => {
    if (!newTaskTitle.trim()) return;
    setIsParsing(true);
    try {
      const response = await breakDownGoal(newTaskTitle);
      
      // Create multiple tasks
      for (const sub of response.subtasks) {
        let nicheId = selectedNiche;
        if (!nicheId && sub.niche) {
            const found = niches.find(n => n.name.toLowerCase() === sub.niche?.toLowerCase());
            if (found) nicheId = found.id;
        }
        if (!nicheId) nicheId = (niches.length > 0 ? niches[0].id : 1);
        
        await createTask({
            title: sub.title,
            niche_id: nicheId,
            is_recurring: false
        });
      }
      
      const newTasks = await listTasks();
      setTasks(newTasks);
      
      setNewTaskTitle("");
      setShowAdd(false);
      playSound('success');
      vibrate(50);
    } catch (e) {
      console.error("Breakdown failed", e);
    } finally {
      setIsParsing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
      <p className="text-sm text-gray-400 dark:text-white/30 font-medium animate-pulse">Loading Life OS...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-32">
      <AnimatePresence>
        {showStats && <StatsModal onClose={() => setShowStats(false)} lang={lang} />}
      </AnimatePresence>
      
      {profile && <GamificationHeader profile={profile} onOpenStats={() => setShowStats(true)} />}
      
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 px-1 tracking-tight">{t.niches}</h2>
        <div className="grid grid-cols-2 gap-3">
          {niches.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <NicheCard niche={n} />
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.today}</h2>
          <button 
            onClick={() => {
              setShowAdd(!showAdd);
              if (showAdd) setEditingTask(null);
            }}
            className="group flex items-center gap-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-gray-900 dark:text-white/80 px-4 py-2 rounded-full transition-all active:scale-95"
          >
            {showAdd ? <X size={14} /> : <Plus size={14} />}
            {showAdd ? t.cancel : t.add}
          </button>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-white dark:bg-[#0A0A0A] p-5 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-2xl">
                <div className="relative">
                  <input
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddTask()}
                    placeholder={t.newTaskPlaceholder}
                    className="w-full bg-transparent text-gray-900 dark:text-white text-lg font-medium outline-none placeholder:text-gray-400 dark:placeholder:text-white/20 mb-6 pr-20"
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-[calc(50%+12px)] flex items-center gap-1">
                    <button 
                      onClick={handleBreakdown}
                      className="p-2 text-gray-400 hover:text-purple-500 transition-colors"
                      disabled={isParsing || !newTaskTitle.trim()}
                      title="AI Breakdown"
                    >
                      <Wand2 size={20} className={isParsing ? "animate-spin" : ""} />
                    </button>
                    <button 
                      onClick={toggleListening}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        isListening ? "text-red-500 bg-red-500/10 animate-pulse" : "text-gray-400 hover:text-indigo-500"
                      )}
                    >
                      <Mic size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
                    {niches.map(n => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNiche(n.id)}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap font-medium",
                          selectedNiche === n.id 
                            ? "bg-indigo-600 text-white border-indigo-600 dark:bg-white dark:text-black dark:border-white shadow-[0_0_10px_rgba(79,70,229,0.2)] dark:shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
                            : "bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/80 hover:border-gray-300 dark:hover:border-white/20"
                        )}
                      >
                        {n.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/[0.05]">
                    <button
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={cn(
                        "text-xs flex items-center gap-2 transition-colors",
                        isRecurring ? "text-purple-500 dark:text-purple-400" : "text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60"
                      )}
                    >
                      <Repeat size={14} />
                      {isRecurring ? t.daily : t.oneTime}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleMagic}
                        disabled={isParsing || !newTaskTitle.trim()}
                        className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                        title="AI Auto-Fill"
                      >
                        <Sparkles size={20} className={isParsing ? "animate-spin" : ""} />
                      </button>

                      <button
                        onClick={handleAddTask}
                        disabled={!newTaskTitle.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all active:scale-95"
                      >
                        {editingTask ? (lang === 'ru' ? "Сохранить" : "Save") : t.create}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {tasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-white/20 gap-3 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl"
              >
                <Sparkles size={24} strokeWidth={1} />
                <p className="text-sm font-medium">{t.cleanHorizon}</p>
              </motion.div>
            ) : (
              tasks.map(t => <TaskRow key={t.id} task={t} onToggle={() => handleToggle(t)} onDelete={() => handleDelete(t.id)} onEdit={() => handleEdit(t)} />)
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function ShopScreen({ profile, setProfile, lang }: { profile: UserProfile; setProfile: (p: UserProfile) => void; lang: Lang }) {
  const t = TRANSLATIONS[lang];
  const [loading, setLoading] = useState<string | null>(null);

  const inventory = useMemo(() => {
    try { return JSON.parse(profile.inventory || "[]"); } catch { return []; }
  }, [profile.inventory]);

  const achievements = useMemo(() => {
    try { return JSON.parse(profile.achievements || "[]"); } catch { return []; }
  }, [profile.achievements]);

  const ITEMS = [
    { id: "theme_neon", name: t.itemThemeNeon, price: 500, icon: Palette, color: "#F0F" },
    { id: "sound_8bit", name: t.itemSound8bit, price: 300, icon: Volume2, color: "#0FF" },
    { id: "streak_freeze", name: t.itemStreakFreeze, price: 1000, icon: Snowflake, color: "#00F" },
  ];

  const ACHIEVEMENTS_LIST = [
    { id: "first_blood", name: t.achFirstBlood, desc: t.achFirstBloodDesc, icon: Award, color: "#F00", condition: () => true }, // Already handled by backend logic theoretically
    { id: "on_fire", name: t.achOnFire, desc: t.achOnFireDesc, icon: Flame, color: "#FA0", condition: () => profile.streak >= 3 },
    { id: "master", name: t.achMaster, desc: t.achMasterDesc, icon: Trophy, color: "#D4AF37", condition: () => profile.level >= 5 },
  ];

  const handleBuy = async (item: any) => {
    if (profile.xp < item.price) return;
    if (inventory.includes(item.id)) return;

    setLoading(item.id);
    try {
      const newInventory = [...inventory, item.id];
      const newXp = profile.xp - item.price;
      
      // Optimistic update
      const updatedProfile = { ...profile, xp: newXp, inventory: JSON.stringify(newInventory) };
      setProfile(updatedProfile);
      
      // API call
      await import("./api").then(m => m.updateProfile({ xp: newXp, inventory: JSON.stringify(newInventory) }));
      
      playSound("success");
      vibrate(50);
    } catch (e) {
      console.error("Buy failed", e);
      // Revert would go here
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShoppingBag size={120} />
        </div>
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-bold uppercase mb-1">{t.xpBalance}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black tracking-tight">{profile.xp}</h2>
            <span className="text-sm font-medium opacity-80">XP</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingBag size={20} className="text-indigo-500" />
          {t.shop}
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {ITEMS.map(item => {
            const isPurchased = inventory.includes(item.id);
            const canAfford = profile.xp >= item.price;
            
            return (
              <div key={item.id} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5" style={{ color: item.color }}>
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-white/40">{item.price} XP</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleBuy(item)}
                  disabled={isPurchased || !canAfford || loading === item.id}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                    isPurchased 
                      ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" 
                      : canAfford 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95" 
                        : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/20"
                  )}
                >
                  {loading === item.id ? (
                    <Sparkles size={14} className="animate-spin" />
                  ) : isPurchased ? (
                    <>
                      <CheckCircle2 size={14} />
                      {t.purchased}
                    </>
                  ) : (
                    <>
                      {canAfford ? <Unlock size={14} /> : <Lock size={14} />}
                      {t.buy}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" />
          {t.achievements}
        </h3>
        <div className="grid grid-cols-1 gap-3">
           {ACHIEVEMENTS_LIST.map(ach => {
             // In a real app, we would check if achievement is in profile.achievements
             // For now, we simulate unlocked state based on condition
             const isUnlocked = ach.condition();
             
             return (
               <div key={ach.id} className={cn(
                 "border rounded-2xl p-4 flex items-center gap-4 transition-all",
                 isUnlocked 
                   ? "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/10 border-yellow-200 dark:border-yellow-500/20" 
                   : "bg-gray-50 dark:bg-white/5 border-transparent opacity-60 grayscale"
               )}>
                 <div className={cn(
                   "p-3 rounded-full shadow-sm",
                   isUnlocked ? "bg-white dark:bg-white/10 text-yellow-500" : "bg-gray-200 dark:bg-white/10 text-gray-400"
                 )}>
                   <ach.icon size={24} />
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-900 dark:text-white">{ach.name}</h4>
                   <p className="text-xs text-gray-500 dark:text-white/60">{ach.desc}</p>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ theme, toggleTheme, lang, setLang, profile, setProfile }: { theme: 'dark' | 'light', toggleTheme: () => void, lang: Lang, setLang: (l: Lang) => void, profile: UserProfile, setProfile: (p: UserProfile) => void }) {
  const [niches, setNiches] = useState<NicheItem[]>([]);
  const [nicheName, setNicheName] = useState("");
  const [nicheColor, setNicheColor] = useState(PRESET_COLORS[7]); // Indigo default
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Telegram state
  const [telegramId, setTelegramId] = useState(profile.telegram_chat_id || "");
  const [savingTg, setSavingTg] = useState(false);
  const [tgSuccess, setTgSuccess] = useState(false);
  
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    listNiches().then(setNiches);
  }, []);

  useEffect(() => {
    if (profile.telegram_chat_id) {
        setTelegramId(profile.telegram_chat_id);
    }
  }, [profile.telegram_chat_id]);

  const handleSaveTelegram = async () => {
    if (!telegramId.trim()) return;
    setSavingTg(true);
    try {
        const updated = await updateProfile({ telegram_chat_id: telegramId });
        setProfile(updated);
        setTgSuccess(true);
        setTimeout(() => setTgSuccess(false), 2000);
    } catch (e) {
        console.error("Failed to save Telegram ID", e);
    } finally {
        setSavingTg(false);
    }
  };

  const handleCreateNiche = async () => {
    if (!nicheName.trim()) return;
    setLoading(true);
    try {
      const newNiche = await createNiche({ name: nicheName, color: nicheColor });
      setNiches(prev => [...prev, newNiche]);
      setSuccess(true);
      setNicheName("");
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      console.error("Failed to create niche", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNiche = async (id: number) => {
    if (!confirm(t.deleteNicheConfirm)) return;
    try {
      await deleteNiche(id);
      setNiches(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error("Failed to delete niche", e);
    }
  };
  
  const handleReset = async () => {
    if (!confirm(t.resetConfirm)) return;
    try {
      await resetSystem();
      window.location.reload();
    } catch (e) {
      alert("Reset failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
           <Settings size={24} className="text-gray-900 dark:text-white/80" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.settings}</h2>
          <p className="text-xs text-gray-500 dark:text-white/40">{t.personalization}</p>
        </div>
      </div>

      {/* Theme & General Settings */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-6 space-y-6 shadow-sm dark:shadow-none">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.app}</h3>
        
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t.theme}</p>
              <p className="text-xs text-gray-500 dark:text-white/40">{theme === 'dark' ? t.dark : t.light}</p>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? t.enableLight : t.enableDark}
          </button>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60">
              <Globe size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t.language}</p>
              <p className="text-xs text-gray-500 dark:text-white/40">{lang === 'ru' ? t.russian : t.english}</p>
            </div>
          </div>
          <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1">
             <button 
               onClick={() => setLang('ru')}
               className={cn(
                 "px-3 py-1 rounded-md shadow-sm text-xs font-medium transition-all",
                 lang === 'ru' ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white" : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
               )}
             >
               RU
             </button>
             <button 
               onClick={() => setLang('en')}
               className={cn(
                 "px-3 py-1 rounded-md shadow-sm text-xs font-medium transition-all",
                 lang === 'en' ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white" : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
               )}
             >
               EN
             </button>
          </div>
        </div>
      </div>

      {/* Telegram Integration */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                <MessageSquare size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.telegram}</h3>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-white/40">{t.telegramDesc}</p>

        <div className="flex gap-2">
            <input
              value={telegramId}
              onChange={e => setTelegramId(e.target.value)}
              placeholder={t.chatIdPlaceholder}
              className="flex-1 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-blue-500/50 transition-colors"
            />
             <button
            onClick={handleSaveTelegram}
            disabled={!telegramId.trim() || savingTg}
            className={cn(
              "px-6 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
              tgSuccess ? "bg-green-500 shadow-green-500/25" : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/25"
            )}
          >
            {savingTg ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : tgSuccess ? (
              <CheckCircle2 size={18} />
            ) : (
              t.save
            )}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-6 space-y-6 shadow-sm dark:shadow-none">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.addNiche}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 dark:text-white/40 font-medium ml-1 block mb-2">{t.nicheNameLabel}</label>
            <input
              value={nicheName}
              onChange={e => setNicheName(e.target.value)}
              placeholder={t.nicheNamePlaceholder}
              className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-white/40 font-medium ml-1 block mb-2">{t.nicheColorLabel}</label>
            <div className="grid grid-cols-6 gap-3">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNicheColor(color)}
                  className={cn(
                    "w-full aspect-square rounded-full transition-all flex items-center justify-center",
                    nicheColor === color ? "scale-110 ring-2 ring-offset-2 ring-indigo-500 ring-offset-white dark:ring-offset-[#0A0A0A]" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                >
                  {nicheColor === color && <CheckCircle2 size={16} className="text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateNiche}
            disabled={!nicheName.trim() || loading}
            className={cn(
              "w-full py-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-4",
              success ? "bg-green-500 shadow-green-500/25" : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25"
            )}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : success ? (
              <>
                <CheckCircle2 size={18} />
                {t.created}
              </>
            ) : (
              t.createNicheBtn
            )}
          </button>
        </div>
      </div>
      
      {/* Manage Niches */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-sm dark:shadow-none">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.manageNiches}</h3>
        <div className="space-y-2">
          {niches.map(n => (
            <div key={n.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: n.color }} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{n.name}</span>
              </div>
              <button 
                onClick={() => handleDeleteNiche(n.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {niches.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No niches found.</p>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-3xl p-6 space-y-4">
         <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">{t.dangerZone}</h3>
         <button 
           onClick={handleReset}
           className="w-full py-3 rounded-xl border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
         >
            <Trash2 size={16} />
            {t.resetData}
         </button>
      </div>
    </div>
  );
}

// --- Nano Banana Component ---

function NanoBanana({ lang }: { lang: Lang }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const t = TRANSLATIONS[lang];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProcess = async (mode: 'faceswap' | 'magic') => {
    if (!selectedFile) return;
    setProcessing(true);
    setResult(null);
    
    try {
      let res;
      if (mode === 'faceswap') {
        res = await bananaFaceswap(selectedFile);
      } else {
        res = await bananaMagic(selectedFile, "cyberpunk"); // Default style for now
      }
      setResult(res.result);
    } catch (e) {
      console.error("Banana process failed", e);
      alert("Processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-yellow-100 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20">
           <Banana size={24} className="text-yellow-600 dark:text-yellow-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.nanoBanana}</h2>
          <p className="text-xs text-gray-500 dark:text-white/40">{t.aiLab}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-6 space-y-6 shadow-sm dark:shadow-none">
        {!selectedFile ? (
          <div 
            onClick={() => document.getElementById("file-upload")?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
               <Camera size={24} className="text-gray-400 dark:text-white/40 group-hover:text-gray-900 dark:group-hover:text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t.uploadPhoto}</p>
              <p className="text-xs text-gray-500 dark:text-white/30 mt-1">{t.format}</p>
            </div>
            <input 
              id="file-upload"
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] group/preview">
              <img 
                src={result || URL.createObjectURL(selectedFile)} 
                alt="Preview" 
                className={cn("w-full h-full object-contain transition-opacity", processing ? "opacity-30 blur-sm" : "opacity-100")} 
              />
              
              {processing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                  <p className="text-xs font-mono text-yellow-500 animate-pulse">{t.analyzing}</p>
                </div>
              )}

              {!processing && !result && (
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur rounded-full text-white/70 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button 
              disabled={!selectedFile || processing}
              onClick={() => handleProcess('faceswap')}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-gray-900 dark:text-white py-4 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/5 disabled:opacity-30 transition-all"
            >
              {t.faceSwap}
            </button>
            <button 
              disabled={!selectedFile || processing}
              onClick={() => handleProcess('magic')}
              className="relative overflow-hidden bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white py-4 rounded-xl text-sm font-semibold shadow-lg shadow-yellow-500/20 disabled:opacity-50 transition-all group/btn"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Sparkles size={16} /> {t.magic}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            </button>
          </div>
        </div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState<"focus" | "shop" | "lab" | "settings">("focus");
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
    }
    return 'dark';
  });
  
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lang') as Lang) || 'ru';
    }
    return 'ru';
  });

  const [profile, setProfile] = useState<UserProfile>({
    level: 1,
    xp: 0,
    streak: 0,
    inventory: "[]",
    achievements: "[]"
  });

  useEffect(() => {
    // Fetch profile on mount
    getProfile().then(p => setProfile(p)).catch(console.error);
  }, []);
  
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen text-gray-900 dark:text-white selection:bg-indigo-500/30 pb-24 bg-gray-50 dark:bg-black transition-colors duration-300">
      <main className="max-w-md mx-auto p-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-white/60">
              Life OS
            </h1>
            <p className="text-xs font-mono text-gray-500 dark:text-white/40 uppercase tracking-widest mt-1">System Online</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px]">
            <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center">
               <span className="font-bold text-xs text-black dark:text-white">AI</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {tab === "focus" && <FocusScreen lang={lang} />}
            {tab === "shop" && <ShopScreen profile={profile} setProfile={setProfile} lang={lang} />}
            {tab === "lab" && <NanoBanana lang={lang} />}
            {tab === "settings" && <SettingsScreen theme={theme} toggleTheme={toggleTheme} lang={lang} setLang={setLang} profile={profile} setProfile={setProfile} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-6 left-6 right-6 z-30 max-w-[calc(28rem-3rem)] mx-auto">
        <nav className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-2xl border border-gray-200 dark:border-white/[0.08] rounded-2xl flex p-1 shadow-2xl shadow-black/10 dark:shadow-black/50">
          <TabButton 
            active={tab === "focus"} 
            icon={Zap} 
            label={t.tabFocus} 
            onClick={() => setTab("focus")} 
          />
          <TabButton 
            active={tab === "shop"} 
            icon={ShoppingBag} 
            label={t.tabShop} 
            onClick={() => setTab("shop")} 
          />
          <TabButton 
            active={tab === "lab"} 
            icon={Sparkles} 
            label={t.tabLab} 
            onClick={() => setTab("lab")} 
          />
          <TabButton 
            active={tab === "settings"} 
            icon={Settings} 
            label={t.tabSettings} 
            onClick={() => setTab("settings")} 
          />
        </nav>
      </div>
    </div>
  );
}

export default App;
