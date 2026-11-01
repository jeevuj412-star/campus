import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown,
  CircleHelp, Clock3, GraduationCap, HeartHandshake, LoaderCircle, LockKeyhole,
  MessageCircle, Plus, Send, ShieldCheck, Sparkles, X, Zap, Wifi, Wrench,
  BookOpen, PartyPopper, Lightbulb, LogIn, ImagePlus, LogOut
} from 'lucide-react'
import { supabase, supabaseConfigured } from './lib/supabase'
import { askCampusCopilot, notifyComplaintWorkflow } from './lib/api'

const categories = [
  'Wi-Fi Issue', 'Campus Infrastructure', 'Ragging/Harassment',
  'Faculty/Academic Query', 'Campus Development Suggestion'
]
const fallbackEvents = [
  { id: 'demo-1', title: 'Innovation & AI Showcase', event_date: dateOffset(4), description: 'Meet student builders, explore live demos, and connect with mentors.', poster_url: '', tag: 'TECHNOLOGY' },
  { id: 'demo-2', title: 'Campus Connect: Open Mic', event_date: dateOffset(7), description: 'An evening of music, poetry, stories, and student talent.', poster_url: '', tag: 'COMMUNITY' },
  { id: 'demo-3', title: 'Career Launch Workshop', event_date: dateOffset(11), description: 'Build a stronger portfolio and get practical interview guidance.', poster_url: '', tag: 'CAREERS' }
]
function dateOffset(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10) }
function formatDate(value) { if (!value) return 'Date to be announced'; return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
function shortDate(value) { if (!value) return { day: '--', month: 'TBA' }; const d = new Date(`${value.slice(0, 10)}T12:00:00`); return { day: d.getDate(), month: d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase() } }

function getCopilotAnswer(result) {
  const candidates = [
    result,
    ...(Array.isArray(result) ? result : []),
    result?.data,
    ...(Array.isArray(result?.data) ? result.data : [])
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    if (candidate && typeof candidate === 'object') {
      for (const key of ['answer', 'output', 'text', 'message', 'response']) {
        const answer = candidate[key]
        if (typeof answer === 'string' && answer.trim()) return answer.trim()
      }
    }
  }
  return 'I could not find a clear answer. Please check with your academic office.'
}

function IconTile({ icon: Icon, tone = 'violet' }) { return <div className={`icon-tile ${tone}`}><Icon size={19} strokeWidth={1.8} /></div> }
function SectionHeading({ eyebrow, title, detail, action }) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{action}</div>
}

function ComplaintPanel({ onClose }) {
  const [studentId, setStudentId] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [description, setDescription] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!supabaseConfigured) return setNotice({ type: 'error', text: 'Connect Supabase in .env.local before submitting.' })
    if (!consent) return setNotice({ type: 'error', text: 'Please confirm you understand how this report is handled.' })
    setBusy(true); setNotice(null)
    const payload = { student_id: studentId.trim(), category, description: description.trim(), status: 'received' }
    try {
      const { data, error } = await supabase.from('complaints').insert(payload).select('id,student_id,category,description,status,created_at').single()
      if (error) throw error
      let workflowNote = 'Your report was saved securely.'
      try { await notifyComplaintWorkflow(data); workflowNote += ' Campus support workflow notified.' }
      catch (err) { workflowNote += ' The report is saved, but the notification workflow could not be reached.'; console.warn(err) }
      setNotice({ type: 'success', text: workflowNote })
      setStudentId(''); setDescription(''); setConsent(false)
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Unable to submit. Please try again.' })
    } finally { setBusy(false) }
  }

  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <motion.section className="modal-card" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} role="dialog" aria-modal="true" aria-labelledby="complaint-title">
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close complaint form"><X size={18}/></button>
      <div className="modal-kicker"><ShieldCheck size={15}/> PRIVATE REPORTING</div>
      <h2 id="complaint-title">Speak up. We’re listening.</h2>
      <p className="muted">Share a concern or question with the campus support team.</p>
      <form className="form-stack" onSubmit={submit}>
        <label>Student ID<input required value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter your student ID" maxLength={80}/></label>
        <label>What is this about?<span className="select-wrap"><select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select><ChevronDown size={16}/></span></label>
        <label>Tell us what happened<textarea required minLength={10} maxLength={5000} rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="Include relevant details, dates, and what support you need…"/></label>
        <label className="consent-row"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/><span>I understand this report is accessible to authorized campus personnel. I will avoid including unnecessary sensitive details.</span></label>
        {notice && <div className={`notice ${notice.type}`} role="status">{notice.text}</div>}
        <button className="button primary full" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17}/> Sending securely…</> : <><LockKeyhole size={16}/> Submit confidential report</>}</button>
        <p className="tiny-note">This form is private to authorized staff, not anonymous: your Student ID is collected. If you are in immediate danger, contact local emergency services or a trusted campus safeguarding officer.</p>
      </form>
    </motion.section>
  </div>
}

function CopilotPanel({ onClose }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi! I’m Campus Copilot. Ask me about exam dates, class schedules, academic calendars, or campus deadlines.' }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, busy])
  async function send(e) {
    e?.preventDefault()
    const prompt = input.trim()
    if (!prompt || busy) return
    const next = [...messages, { role: 'user', content: prompt }]
    setMessages(next); setInput(''); setBusy(true); setError('')
    try {
      const result = await askCampusCopilot(prompt, messages.map(m => ({ role: m.role, content: m.content })))
      setMessages([...next, { role: 'assistant', content: getCopilotAnswer(result) }])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'The request failed.'
      const isConnectionError = message === 'Failed to fetch' || message === 'Load failed'
      const isWorkflowError = message.startsWith('n8n returned HTTP 500.')
      setError(isConnectionError
        ? 'The browser could not reach the webhook. Allow this site origin in the n8n Webhook node’s CORS settings.'
        : message)
      setMessages([...next, {
        role: 'assistant',
        content: isWorkflowError
          ? 'Your question reached n8n, but its workflow failed while processing it. The workflow owner needs to check the latest failed execution.'
          : 'I couldn’t reach the campus assistant right now. Please try again shortly or check the official academic noticeboard.'
      }])
    } finally { setBusy(false) }
  }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <motion.section className="copilot-modal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} role="dialog" aria-modal="true" aria-labelledby="copilot-title">
      <header className="copilot-head"><div className="copilot-brand"><div className="copilot-orb"><Sparkles size={20}/></div><div><h2 id="copilot-title">Campus Copilot</h2><p><span className="online-dot"/> Academic assistant · n8n connected by setup</p></div></div><button className="icon-button" onClick={onClose} aria-label="Close copilot"><X size={18}/></button></header>
      <div className="chat-messages">
        {messages.map((m, i) => <div key={i} className={`chat-line ${m.role}`}><div className="chat-avatar">{m.role === 'assistant' ? <Sparkles size={15}/> : 'You'}</div><div className="chat-bubble">{m.content}</div></div>)}
        {busy && <div className="chat-line assistant"><div className="chat-avatar"><Sparkles size={15}/></div><div className="chat-bubble typing"><span/><span/><span/></div></div>}
        <div ref={bottomRef}/>
      </div>
      {error && <div className="chat-error">{error}</div>}
      <div className="suggestion-row">{['When are the next exams?', 'Show academic calendar dates', 'Any upcoming deadlines?'].map(q => <button key={q} className="suggestion" onClick={() => { setInput(q) }}>{q}</button>)}</div>
      <form className="chat-input" onSubmit={send}><input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your campus…" aria-label="Message Campus Copilot"/><button className="send-button" disabled={busy || !input.trim()} aria-label="Send message"><Send size={17}/></button></form>
      <p className="tiny-note chat-disclaimer">AI can make mistakes. Confirm critical dates with official college announcements.</p>
    </motion.section>
  </div>
}

function AdminPanel({ onClose, session, onSession }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  async function login(e) {
    e.preventDefault(); setBusy(true); setNotice('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setNotice(error.message)
    else {
      const role = data.user?.app_metadata?.role
      if (role !== 'admin') { await supabase.auth.signOut(); setNotice('This account does not have the admin role. Ask the project owner to assign it securely in Supabase.'); }
      else onSession(data.session)
    }
    setBusy(false)
  }
  async function addEvent(e) {
    e.preventDefault(); setBusy(true); setNotice('')
    const { error } = await supabase.from('events').insert({ title: title.trim(), event_date: eventDate, poster_url: posterUrl.trim() || null, description: description.trim() || null })
    if (error) setNotice(error.message)
    else { setNotice('Event published. Refresh the page to see it in the feed.'); setTitle(''); setEventDate(''); setPosterUrl(''); setDescription('') }
    setBusy(false)
  }
  async function logout() { await supabase.auth.signOut(); onSession(null) }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <motion.section className="modal-card admin-modal" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close event manager"><X size={18}/></button>
      <div className="modal-kicker"><LockKeyhole size={15}/> RESTRICTED AREA</div><h2 id="admin-title">Event management</h2>
      {!supabaseConfigured ? <div className="notice error">Configure Supabase in .env.local first.</div> : !session ? <>
        <p className="muted">Sign in with a Supabase account that has the admin role in its app metadata.</p>
        <form className="form-stack" onSubmit={login}><label>Admin email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="username"/></label><label>Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"/></label>{notice && <div className="notice error">{notice}</div>}<button className="button primary full" disabled={busy}><LogIn size={16}/> Sign in</button></form>
      </> : <>
        <div className="signed-in"><span><Check size={15}/> Admin session active</span><button className="text-button" onClick={logout}><LogOut size={14}/> Sign out</button></div>
        <form className="form-stack" onSubmit={addEvent}><label>Event title<input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. AI Innovation Day" maxLength={160}/></label><label>Event date<input required type="date" min={dateOffset(0)} value={eventDate} onChange={e => setEventDate(e.target.value)}/></label><label>Poster image URL<input type="url" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} placeholder="https://…"/></label><label>Description<textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What should students know?"/></label>{notice && <div className={`notice ${notice.startsWith('Event published') ? 'success' : 'error'}`}>{notice}</div>}<button className="button primary full" disabled={busy}><Plus size={16}/> Publish event</button></form>
      </>}
    </motion.section>
  </div>
}

function EventCard({ event, index }) {
  const date = shortDate(event.event_date)
  const colors = ['event-violet', 'event-blue', 'event-orange']
  return <motion.article className="event-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .07 }}>
    <div className={`event-art ${colors[index % colors.length]}`}>
      {event.poster_url ? <img src={event.poster_url} alt={`${event.title} poster`} loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }}/> : <><div className="art-grid"/><span className="art-symbol">{index % 3 === 0 ? <Zap size={44}/> : index % 3 === 1 ? <PartyPopper size={44}/> : <GraduationCap size={44}/>}</span><span className="art-word">{event.tag || 'CAMPUS LIFE'}</span></>}
      <div className="date-chip"><strong>{date.day}</strong><span>{date.month}</span></div>
    </div>
    <div className="event-copy"><div className="event-meta"><span><CalendarDays size={13}/> {formatDate(event.event_date)}</span><span className="event-upcoming">UPCOMING</span></div><h3>{event.title}</h3><p>{event.description || 'More details will be announced by the event organizers.'}</p><button className="event-link" onClick={() => navigator.clipboard?.writeText(`${event.title} — ${formatDate(event.event_date)}`)}>Save event details <ArrowUpRight size={15}/></button></div>
  </motion.article>
}

export default function App() {
  const [activeModal, setActiveModal] = useState(null)
  const [events, setEvents] = useState(fallbackEvents)
  const [eventsSource, setEventsSource] = useState('demo')
  const [session, setSession] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const campusName = import.meta.env.VITE_CAMPUS_NAME || 'Northstar University'

  useEffect(() => {
    if (!supabaseConfigured) return
    let alive = true
    async function loadEvents() {
      const { data, error } = await supabase.from('events').select('id,title,event_date,poster_url,description,created_at').gte('event_date', dateOffset(-1)).order('event_date', { ascending: true }).limit(12)
      if (alive && !error && data) { setEvents(data); setEventsSource('live') }
    }
    loadEvents()
    supabase.auth.getSession().then(({ data }) => alive && setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => setSession(current))
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])

  const liveEvents = events.length ? events : []
  return <div className="app-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar">
      <a href="#home" className="brand" aria-label="Campusly home"><div className="brand-mark"><GraduationCap size={23}/></div><span>campusly<span className="brand-dot">.</span></span></a>
      <nav className="desktop-nav" aria-label="Main navigation"><a className="nav-active" href="#home">Overview</a><a href="#events">Campus events</a><button onClick={() => setActiveModal('complaint')}>Student support</button></nav>
      <div className="top-actions"><span className="term-pill"><span className="live-dot"/> CAMPUS CONNECT</span><button className="admin-trigger" onClick={() => setActiveModal('admin')} title="Restricted event management" aria-label="Open event management"><LockKeyhole size={15}/><span>Manage</span></button><button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X size={20}/> : <ChevronDown size={20}/>}</button></div>
    </header>
    {menuOpen && <nav className="mobile-nav"><a href="#home" onClick={() => setMenuOpen(false)}>Overview</a><a href="#events" onClick={() => setMenuOpen(false)}>Campus events</a><button onClick={() => { setActiveModal('complaint'); setMenuOpen(false) }}>Student support</button></nav>}
    <main id="home" className="main-wrap">
      <section className="welcome-row"><div><div className="eyebrow welcome-eyebrow"><span className="eyebrow-line"/> YOUR CAMPUS, IN SYNC</div><h1>Good morning<span className="title-period">.</span><br/><span className="title-muted">Make campus life</span> <span className="title-gradient">simpler.</span></h1><p className="welcome-copy">One space for campus updates, academic answers, and the support you deserve.</p><div className="welcome-actions"><button className="button primary" onClick={() => setActiveModal('copilot')}><Sparkles size={17}/> Ask Campus Copilot <ArrowRight size={16}/></button><button className="button secondary" onClick={() => setActiveModal('complaint')}><ShieldCheck size={17}/> Share a concern</button></div></div><div className="hero-visual" aria-hidden="true"><div className="hero-ring ring-one"/><div className="hero-ring ring-two"/><div className="hero-core"><GraduationCap size={49}/></div><div className="float-card float-card-top"><div className="float-icon"><CalendarDays size={16}/></div><div><strong>Campus, organized</strong><span>Everything in one place</span></div><Check className="float-check" size={16}/></div><div className="float-card float-card-bottom"><div className="mini-avatar"><Sparkles size={15}/></div><div><strong>Copilot is ready</strong><span>Answers, minus the search</span></div><span className="status-pulse"/></div><div className="hero-spark spark-a">✳</div><div className="hero-spark spark-b">✦</div></div></section>
      <section className="quick-grid" aria-label="Campus services">
        <button className="quick-card" onClick={() => setActiveModal('copilot')}><IconTile icon={Sparkles}/><div><h3>Campus Copilot</h3><p>Academic dates, answered</p></div><span className="quick-arrow"><ArrowUpRight size={17}/></span></button>
        <button className="quick-card" onClick={() => setActiveModal('complaint')}><IconTile icon={HeartHandshake} tone="mint"/><div><h3>Confidential support</h3><p>A safe channel to be heard</p></div><span className="quick-arrow"><ArrowUpRight size={17}/></span></button>
        <a className="quick-card" href="#events"><IconTile icon={CalendarDays} tone="blue"/><div><h3>Campus events</h3><p>Find your next moment</p></div><span className="quick-arrow"><ArrowUpRight size={17}/></span></a>
      </section>
      <section id="events" className="events-section"><SectionHeading eyebrow="HAPPENING ON CAMPUS" title="Something to look forward to." detail="Discover what’s coming up and find your people." action={<a className="view-all" href="#events" onClick={e => { e.preventDefault(); document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}>Explore events <ArrowDownRight size={16}/></a>}/>
        {eventsSource === 'demo' && <div className="demo-banner"><CircleHelp size={15}/> Preview events shown. Connect Supabase to load your college’s live event feed.</div>}
        <div id="events-grid" className="events-grid">{liveEvents.length ? liveEvents.map((event, i) => <EventCard key={event.id} event={event} index={i}/>) : <div className="empty-events"><CalendarDays size={28}/><h3>No events posted yet</h3><p>Check back soon for the latest campus happenings.</p></div>}</div>
      </section>
      <section className="support-banner"><div className="support-symbol"><ShieldCheck size={27}/></div><div className="support-banner-copy"><span className="eyebrow">YOUR VOICE MATTERS</span><h2>A better campus starts with being heard.</h2><p>Raise a concern, ask a question, or share an idea for change.</p></div><button className="button light-button" onClick={() => setActiveModal('complaint')}>Visit support portal <ArrowRight size={16}/></button><div className="banner-orbit orbit-a"/><div className="banner-orbit orbit-b"/></section>
      <footer className="footer"><a href="#home" className="brand footer-brand"><div className="brand-mark"><GraduationCap size={19}/></div><span>campusly<span className="brand-dot">.</span></span></a><p>Designed for student life. Built for a better campus.</p><div className="footer-right"><span><LockKeyhole size={13}/> Student-first by design</span><span>© {new Date().getFullYear()} {campusName}</span></div></footer>
    </main>
    <AnimatePresence>{activeModal === 'complaint' && <ComplaintPanel onClose={() => setActiveModal(null)}/>}{activeModal === 'copilot' && <CopilotPanel onClose={() => setActiveModal(null)}/>}{activeModal === 'admin' && <AdminPanel onClose={() => setActiveModal(null)} session={session} onSession={setSession}/>}</AnimatePresence>
  </div>
}