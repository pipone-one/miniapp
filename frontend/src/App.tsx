import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  createNiche,
  createTask,
  generateHooks,
  createPlan,
  listNiches,
  listTasks,
  logTask,
  type NicheItem,
  type TaskItem
} from "./api";

// --- Components ---

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
        active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
        />
      )}
    </button>
  );
}

function NicheCard({ niche }: { niche: NicheItem }) {
  return (
    <div
      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col gap-2"
      style={{ borderLeftColor: niche.color, borderLeftWidth: 4 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-100">{niche.name}</h3>
        {/* Icon placeholder */}
        <span className="text-zinc-500 text-xs">{niche.icon}</span>
      </div>
      {niche.description && <p className="text-xs text-zinc-400">{niche.description}</p>}
    </div>
  );
}

function TaskRow({ task, onToggle }: { task: TaskItem; onToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800/50"
    >
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
          task.is_done_today
            ? "bg-blue-500 border-blue-500 text-white"
            : "border-zinc-600 hover:border-zinc-400"
        }`}
      >
        {task.is_done_today && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
           <p className={`text-sm truncate ${task.is_done_today ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
             {task.title}
           </p>
           {task.task_type === "recurring" && (
             <svg className="w-3 h-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
           )}
        </div>
        {task.niche && (
          <p className="text-[10px] text-zinc-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.niche.color }} />
            {task.niche.name}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// --- Screens ---

function FocusScreen() {
  const [niches, setNiches] = useState<NicheItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([listNiches(), listTasks()]).then(([n, t]) => {
      setNiches(n);
      setTasks(t);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (task: TaskItem) => {
    // Optimistic update
    if (task.task_type === "one_time") {
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } else {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_done_today: !t.is_done_today } : t));
    }
    
    // Send to backend
    // Note: API currently only supports "done" logging. 
    // If we toggle OFF a recurring task, we technically need to delete the log.
    // For now, let's assume we only mark AS DONE.
    if (!task.is_done_today) {
      await logTask(task.id, "done");
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      // Default to "One-time" task, use selected niche or first one
      const nicheId = selectedNiche || (niches.length > 0 ? niches[0].id : 1);
      const newTask = await createTask({
        title: newTaskTitle,
        niche_id: nicheId,
        is_recurring: isRecurring
      });
      setTasks(prev => [newTask, ...prev]);
      setNewTaskTitle("");
      setIsRecurring(false);
      setShowAdd(false);
    } catch (e) {
      console.error("Failed to create task", e);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Загрузка Life OS...</div>;

  return (
    <div className="space-y-6 pb-20">
      <section>
        <h2 className="text-lg font-bold text-zinc-100 mb-3 px-1">Ниши</h2>
        <div className="grid grid-cols-2 gap-3">
          {niches.map(n => <NicheCard key={n.id} niche={n} />)}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-bold text-zinc-100">План на сегодня</h2>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full transition-colors"
          >
            {showAdd ? "Отмена" : "+ Добавить"}
          </button>
        </div>

        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800"
          >
            <input
              autoFocus
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddTask()}
              placeholder="Что нужно сделать?"
              className="w-full bg-transparent text-white text-sm outline-none placeholder:text-zinc-600 mb-3"
            />
            
            <div className="flex items-center gap-2 mb-3">
               <button
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors flex items-center gap-1 ${
                    isRecurring 
                      ? "bg-purple-500/20 border-purple-500 text-purple-400" 
                      : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
                  }`}
               >
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
                 Повторяющаяся
               </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {niches.map(n => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNiche(n.id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors whitespace-nowrap ${
                    selectedNiche === n.id 
                      ? "bg-zinc-800 border-zinc-600 text-white" 
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                  style={selectedNiche === n.id ? { borderColor: n.color } : {}}
                >
                  {n.name}
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded disabled:opacity-50"
              >
                Создать
              </button>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-sm">На сегодня задач нет. Отдыхаем или строим?</div>
          ) : (
            tasks.map(t => <TaskRow key={t.id} task={t} onToggle={() => handleToggle(t)} />)
          )}
        </div>
      </section>
    </div>
  );
}

// --- Nano Banana Component ---

function NanoBanana() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleProcess = () => {
    if (!selectedFile) return;
    setProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setProcessing(false);
      // For now just show the original image as "result"
      setResult(URL.createObjectURL(selectedFile));
    }, 2000);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
        Nano Banana 🍌 <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">Beta</span>
      </h2>
      
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Загрузить фото</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleUpload}
            className="block w-full text-sm text-zinc-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-xs file:font-semibold
              file:bg-zinc-800 file:text-zinc-300
              hover:file:bg-zinc-700
            "
          />
        </div>

        {selectedFile && (
          <div className="relative rounded-lg overflow-hidden bg-zinc-800/50 aspect-video flex items-center justify-center">
            {result ? (
              <img src={result} alt="Result" className="w-full h-full object-contain" />
            ) : (
              <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-contain opacity-50" />
            )}
            
            {processing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button 
            disabled={!selectedFile || processing}
            onClick={handleProcess}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 rounded text-xs font-medium border border-zinc-700 disabled:opacity-50"
          >
            Face Swap
          </button>
          <button 
            disabled={!selectedFile || processing}
            onClick={handleProcess}
            className="bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded text-xs font-medium disabled:opacity-50"
          >
            Магия ✨
          </button>
        </div>
      </div>
    </div>
  );
}

function LabScreen() {
  const [model, setModel] = useState("MIA");
  const [hooks, setHooks] = useState("");
  const [brief, setBrief] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  const handleHooks = async () => {
    setLoading(true);
    try {
      const res = await generateHooks(model);
      setHooks(res.formatted);
    } finally {
      setLoading(false);
    }
  };

  const handlePlan = async () => {
    setLoading(true);
    try {
      const res = await createPlan(brief);
      setPlan(res.formatted);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <NanoBanana />

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-100">Генератор Хуков</h2>
        <div className="flex gap-2">
          <input 
            value={model} 
            onChange={e => setModel(e.target.value)} 
            className="bg-zinc-800 border-zinc-700 rounded px-3 py-2 text-sm text-white w-24"
            placeholder="Модель"
          />
          <button 
            disabled={loading}
            onClick={handleHooks}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium flex-1 disabled:opacity-50"
          >
            Создать хуки
          </button>
        </div>
        {hooks && (
          <pre className="bg-zinc-900/50 p-3 rounded text-xs text-zinc-300 overflow-x-auto border border-zinc-800">
            {hooks.replace(/```/g, "")}
          </pre>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-zinc-100">Планировщик</h2>
        <textarea 
          value={brief}
          onChange={e => setBrief(e.target.value)}
          className="w-full bg-zinc-800 border-zinc-700 rounded px-3 py-2 text-sm text-white h-24 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="Какая цель?"
        />
        <button 
          disabled={loading || !brief}
          onClick={handlePlan}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
        >
          Создать план
        </button>
        {plan && (
          <pre className="bg-zinc-900/50 p-3 rounded text-xs text-zinc-300 overflow-x-auto border border-zinc-800 whitespace-pre-wrap">
            {plan.replace(/```/g, "")}
          </pre>
        )}
      </section>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [tab, setTab] = useState<"focus" | "lab">("focus");

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-zinc-950 shadow-2xl relative">
        
        {/* Header */}
        <header className="px-5 py-4 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-bold tracking-tight text-zinc-100">Life OS</h1>
          </div>
          <div className="text-xs font-mono text-zinc-500">v2.0</div>
        </header>

        {/* Content */}
        <main className="flex-1 px-5 py-6">
          <AnimatePresence mode="wait">
            {tab === "focus" ? (
              <motion.div 
                key="focus"
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <FocusScreen />
              </motion.div>
            ) : (
              <motion.div 
                key="lab"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <LabScreen />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Tab Bar */}
        <nav className="sticky bottom-0 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800 flex px-2 pb-safe">
          <TabButton active={tab === "focus"} label="Фокус" onClick={() => setTab("focus")} />
          <TabButton active={tab === "lab"} label="Лаба" onClick={() => setTab("lab")} />
        </nav>
      </div>
    </div>
  );
}
