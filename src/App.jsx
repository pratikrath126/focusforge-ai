import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'focusforge-ai-v1'

const defaultState = {
  tasks: [],
  focusMinutes: 25,
  habits: [
    { id: crypto.randomUUID(), name: 'Read 20 minutes', streak: 0, checkedToday: false },
    { id: crypto.randomUUID(), name: 'Practice DSA', streak: 0, checkedToday: false },
  ],
  flashcards: [],
}

function App() {
  const [appState, setAppState] = useState(defaultState)
  const [taskText, setTaskText] = useState('')
  const [taskPriority, setTaskPriority] = useState('Medium')
  const [minutesInput, setMinutesInput] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [goal, setGoal] = useState('Master Data Structures in 4 weeks')
  const [hours, setHours] = useState(14)
  const [plan, setPlan] = useState([])
  const [flashQ, setFlashQ] = useState('')
  const [flashA, setFlashA] = useState('')
  const [quizMode, setQuizMode] = useState(false)
  const [quizIndex, setQuizIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAppState(parsed)
      const m = parsed.focusMinutes || 25
      setMinutesInput(m)
      setSecondsLeft(m * 60)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState))
  }, [appState])

  useEffect(() => {
    if (!running || secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [running, secondsLeft])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (secondsLeft === 0) setRunning(false)
  }, [secondsLeft])

  const addTask = () => {
    if (!taskText.trim()) return
    setAppState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, { id: crypto.randomUUID(), text: taskText.trim(), done: false, priority: taskPriority }],
    }))
    setTaskText('')
  }

  const toggleTask = (id) => setAppState((prev) => ({
    ...prev,
    tasks: prev.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  }))

  const deleteTask = (id) => setAppState((prev) => ({
    ...prev,
    tasks: prev.tasks.filter((t) => t.id !== id),
  }))

  const savePomodoro = () => {
    const valid = Math.max(5, Number(minutesInput) || 25)
    setAppState((prev) => ({ ...prev, focusMinutes: valid }))
    setSecondsLeft(valid * 60)
    setRunning(false)
  }

  const generatePlan = () => {
    const weekly = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const weeklyHours = Math.max(1, Number(hours) || 7)
    const deep = Math.round(weeklyHours * 0.45)
    const build = Math.round(weeklyHours * 0.35)
    const revise = weeklyHours - deep - build
    const core = goal.trim() || 'Learning Goal'
    setPlan([
      `${weekly[0]}-${weekly[2]}: Deep study blocks (${deep}h total) on ${core}`,
      `${weekly[3]}-${weekly[4]}: Build mini implementation (${build}h total)`,
      `${weekly[5]}: Mock test + spaced revision (${Math.max(1, revise - 1)}h)`,
      `${weekly[6]}: Reflect, fix weak spots, and plan next sprint (1h)`
    ])
  }

  const addFlashcard = () => {
    if (!flashQ.trim() || !flashA.trim()) return
    setAppState((prev) => ({
      ...prev,
      flashcards: [...prev.flashcards, { id: crypto.randomUUID(), q: flashQ.trim(), a: flashA.trim() }],
    }))
    setFlashQ('')
    setFlashA('')
  }

  const toggleHabit = (id) => {
    setAppState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h
        const checked = !h.checkedToday
        return { ...h, checkedToday: checked, streak: checked ? h.streak + 1 : Math.max(0, h.streak - 1) }
      }),
    }))
  }

  const analytics = useMemo(() => {
    const totalTasks = appState.tasks.length
    const doneTasks = appState.tasks.filter((t) => t.done).length
    const taskCompletion = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0
    const habitsDone = appState.habits.filter((h) => h.checkedToday).length
    const habitCompletion = appState.habits.length ? Math.round((habitsDone / appState.habits.length) * 100) : 0
    const completedPomodoros = Math.max(0, Math.floor((appState.focusMinutes * 60 - secondsLeft) / 60))
    return {
      taskCompletion,
      habitCompletion,
      focus: completedPomodoros,
      flashcards: appState.flashcards.length,
    }
  }, [appState, secondsLeft])

  const fmt = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`
  const card = appState.flashcards[quizIndex]

  return (
    <main className="page">
      <header className="hero">
        <div className="logo-wrap" aria-label="FocusForge AI logo">
          <div className="logo-core">⚡</div>
          <span>FocusForge AI</span>
        </div>
        <p>Student productivity cockpit — tasks, focus, revision, and momentum in one place.</p>
      </header>

      <section className="grid two">
        <article className="panel">
          <h3>1) Task Manager</h3>
          <div className="row">
            <input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="Add a task" />
            <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
            <button onClick={addTask} disabled={!taskText.trim()}>Add</button>
          </div>
          {appState.tasks.map((t) => (
            <div key={t.id} className="task">
              <label><input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} /> {t.text}</label>
              <span className={`badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
              <button onClick={() => deleteTask(t.id)} className="danger">Delete</button>
            </div>
          ))}
        </article>

        <article className="panel">
          <h3>2) Pomodoro</h3>
          <div className="timer">{fmt}</div>
          <div className="row">
            <input type="number" min="5" value={minutesInput} onChange={(e) => setMinutesInput(e.target.value)} />
            <button onClick={savePomodoro}>Set Minutes</button>
            <button onClick={() => setRunning((v) => !v)}>{running ? 'Pause' : 'Start'}</button>
            <button onClick={() => { setRunning(false); setSecondsLeft(appState.focusMinutes * 60) }}>Reset</button>
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="panel">
          <h3>3) AI Study Plan</h3>
          <div className="row">
            <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Your goal" />
            <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} min="1" max="60" />
            <button onClick={generatePlan} disabled={!goal.trim()}>Generate</button>
          </div>
          <ul>{plan.map((line, i) => <li key={i}>{line}</li>)}</ul>
        </article>

        <article className="panel">
          <h3>4) Flashcards + Quiz</h3>
          <div className="row">
            <input value={flashQ} onChange={(e) => setFlashQ(e.target.value)} placeholder="Question" />
            <input value={flashA} onChange={(e) => setFlashA(e.target.value)} placeholder="Answer" />
            <button onClick={addFlashcard} disabled={!flashQ.trim() || !flashA.trim()}>Save</button>
          </div>
          <div className="row">
            <button onClick={() => { setQuizMode((v) => !v); setShowAnswer(false) }} disabled={appState.flashcards.length === 0}>{quizMode ? 'Exit Quiz' : 'Start Quiz'}</button>
            <button onClick={() => { setQuizIndex((i) => (appState.flashcards.length ? (i + 1) % appState.flashcards.length : 0)); setShowAnswer(false) }} disabled={appState.flashcards.length === 0}>Next</button>
          </div>
          {quizMode && card && (
            <div className="quiz">
              <p><strong>Q:</strong> {card.q}</p>
              {showAnswer ? <p><strong>A:</strong> {card.a}</p> : <button onClick={() => setShowAnswer(true)}>Reveal Answer</button>}
            </div>
          )}
        </article>
      </section>

      <section className="grid two">
        <article className="panel">
          <h3>5) Habit Tracker</h3>
          {appState.habits.map((h) => (
            <div className="task" key={h.id}>
              <label><input type="checkbox" checked={h.checkedToday} onChange={() => toggleHabit(h.id)} /> {h.name}</label>
              <span className="badge">Streak: {h.streak}</span>
            </div>
          ))}
        </article>

        <article className="panel">
          <h3>6) Analytics Dashboard</h3>
          <div className="stats">
            <div><small>Tasks Done</small><strong>{analytics.taskCompletion}%</strong></div>
            <div><small>Habits Complete</small><strong>{analytics.habitCompletion}%</strong></div>
            <div><small>Focus Minutes</small><strong>{analytics.focus}</strong></div>
            <div><small>Flashcards</small><strong>{analytics.flashcards}</strong></div>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
