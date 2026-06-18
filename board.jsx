// board.jsx — App, columns, cards, drag-drop, persistence, tweaks.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "m1Name": "Mai Thy",
  "m1Color": "#7C3AED",
  "m1Icon": "M",
  "m2Name": "Xuân Thy",
  "m2Color": "#3B82F6",
  "m2Icon": "X",
  "m3Name": "Minh Nguyệt",
  "m3Color": "#F97316",
  "m3Icon": "N",
  "bg": "plain"
}/*EDITMODE-END*/;

const LS = { tasks: 'ttb_tasks_v2', tags: 'ttb_tags_v2', sort: 'ttb_sort_v2', posts: 'ttb_posts_v1', channels: 'ttb_channels_v1', scope: 'ttb_scope_v1', commNotes: 'ttb_commnotes_v1' };
const uid = () => Math.random().toString(36).slice(2, 9);

function useLocal(key, initial) {
  const [val, setValState] = React.useState(() => {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : initial; }
    catch { return initial; }
  });
  const skipNextRef = React.useRef(false);

  React.useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);

  React.useEffect(() => {
    if (!window.__firebaseDB) return;
    const { ref, onValue } = window.__firebaseDB;
    const unsub = onValue(ref('ttb/' + key), (snap) => {
      if (skipNextRef.current) { skipNextRef.current = false; return; }
      const data = snap.val();
      if (data !== null && data !== undefined) {
        setValState(data);
        try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
      }
    });
    return unsub;
  }, [key]);

  const setVal = React.useCallback((updater) => {
    setValState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (window.__firebaseDB) {
        const { ref, set } = window.__firebaseDB;
        skipNextRef.current = true;
        set(ref('ttb/' + key), next).catch(() => { skipNextRef.current = false; });
      }
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  return [val, setVal];
}

const MEMBERS = [
  { id: 'm1', nameKey: 'm1Name', colorKey: 'm1Color', iconKey: 'm1Icon' },
  { id: 'm2', nameKey: 'm2Name', colorKey: 'm2Color', iconKey: 'm2Icon' },
  { id: 'm3', nameKey: 'm3Name', colorKey: 'm3Color', iconKey: 'm3Icon' },
];

// ── seed ────────────────────────────────────────────────────────────────
const d = (off) => { const x = new Date(); x.setDate(x.getDate() + off); return toISO(x); };
const SEED_TAGS = [
  { id: 'tg1', name: 'Badminton Tournament', color: '#F97316', date: d(9) },
  { id: 'tg2', name: '1h đọc sách', color: '#3B82F6', date: null },
  { id: 'tg3', name: 'Team Event', color: '#8B5CF6', date: d(16) },
  { id: 'tg4', name: 'Design', color: '#EC4899', date: null },
  { id: 'tg5', name: 'Content', color: '#10B981', date: null },
];
const SEED_TASKS = [
  { id: uid(), owner: 'm1', title: 'Lên concept poster giải cầu lông', note: 'Mood board + 2 hướng màu', tagIds: ['tg1', 'tg4'], priority: 'high', deadline: d(2), done: false, completedAt: null, order: 0 },
  { id: uid(), owner: 'm1', title: 'Viết caption mở đăng ký', note: '', tagIds: ['tg1', 'tg5'], priority: 'medium', deadline: d(5), done: false, completedAt: null, order: 1 },
  { id: uid(), owner: 'm1', title: 'Đọc xong chương 3 "Atomic Habits"', note: '', tagIds: ['tg2'], priority: 'low', deadline: d(-1), done: true, completedAt: d(-1), order: 2 },
  { id: uid(), owner: 'm1', title: 'Chốt bộ nhận diện màu cho event', note: '', tagIds: ['tg4'], priority: 'medium', deadline: d(-9), done: true, completedAt: d(-9), order: 3 },

  { id: uid(), owner: 'm2', title: 'Chốt danh sách đội tham gia', note: 'Confirm với 6 đội', tagIds: ['tg1'], priority: 'high', deadline: d(1), done: false, completedAt: null, order: 0 },
  { id: uid(), owner: 'm2', title: 'Đặt sân + nước uống', note: 'Sân Hòa Bình, 2 khung giờ', tagIds: ['tg1', 'tg3'], priority: 'medium', deadline: d(3), done: false, completedAt: null, order: 1 },
  { id: uid(), owner: 'm2', title: 'Tổng kết ngân sách tuần', note: '', tagIds: ['tg3'], priority: null, deadline: null, done: true, completedAt: d(-2), order: 2 },
  { id: uid(), owner: 'm2', title: 'Liên hệ nhà tài trợ', note: '', tagIds: ['tg1', 'tg3'], priority: 'high', deadline: d(-12), done: true, completedAt: d(-12), order: 3 },

  { id: uid(), owner: 'm3', title: 'Thiết kế bảng điểm & lịch thi đấu', note: '', tagIds: ['tg1', 'tg4'], priority: 'high', deadline: d(2), done: false, completedAt: null, order: 0 },
  { id: uid(), owner: 'm3', title: 'Quay teaser 15s cho event', note: 'Dùng nhạc trend', tagIds: ['tg1', 'tg5'], priority: 'medium', deadline: d(4), done: false, completedAt: null, order: 1 },
  { id: uid(), owner: 'm3', title: 'Đọc sách 1h mỗi tối', note: 'Streak ngày 5', tagIds: ['tg2'], priority: 'low', deadline: null, done: false, completedAt: null, order: 2 },
  { id: uid(), owner: 'm3', title: 'Dựng video recap tuần trước', note: '', tagIds: ['tg5'], priority: 'medium', deadline: d(-3), done: true, completedAt: d(-3), order: 3 },
  { id: uid(), owner: 'm3', title: 'Lên storyboard nội dung tháng', note: '', tagIds: ['tg5', 'tg4'], priority: 'low', deadline: d(-18), done: true, completedAt: d(-18), order: 4 },
];

// ── sorting ─────────────────────────────────────────────────────────────
const SEED_CHANNELS = [
  { id: 'ch1', name: 'Email', color: '#3B82F6', icon: '✉️' },
  { id: 'ch2', name: 'Zalo OA', color: '#0EA5E9', icon: '💬' },
  { id: 'ch3', name: 'LED screen', color: '#F59E0B', icon: '📺' },
  { id: 'ch4', name: 'Knowlet', color: '#8B5CF6', icon: '📘' },
  { id: 'ch5', name: 'LinkedIn', color: '#0A66C2', icon: '💼' },
];
const SEED_POSTS = [
  { id: uid(), date: d(0), title: 'Mở đăng ký giải cầu lông', channelIds: ['ch2', 'ch5'], pic: 'm1', url: '', note: 'Kèm link form', eventId: 'tg1', posted: false },
  { id: uid(), date: d(1), title: 'Teaser sự kiện 15s', channelIds: ['ch5'], pic: 'm3', url: '', note: '', eventId: 'tg1', posted: false },
  { id: uid(), date: d(3), title: 'Nhắc lịch thi đấu', channelIds: ['ch2', 'ch3'], pic: 'm2', url: '', note: '', eventId: 'tg1', posted: false },
  { id: uid(), date: d(-2), title: 'Recap tuần trước', channelIds: ['ch1', 'ch4'], pic: 'm3', url: '', note: '', eventId: null, posted: true },
  { id: uid(), date: d(-5), title: 'Thông báo nội bộ', channelIds: ['ch1'], pic: 'm2', url: '', note: '', eventId: null, posted: true },
];

const PRANK = { high: 0, medium: 1, low: 2 };
function sortComparator(mode) {
  if (mode === 'priority') return (a, b) => (PRANK[a.priority] ?? 3) - (PRANK[b.priority] ?? 3) || a.order - b.order;
  if (mode === 'deadline') return (a, b) => {
    if (!a.deadline && !b.deadline) return a.order - b.order;
    if (!a.deadline) return 1; if (!b.deadline) return -1;
    return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : a.order - b.order;
  };
  return (a, b) => a.order - b.order; // manual
}

// Today / Week filter for the board columns
function inScope(t, scope) {
  if (scope === 'all') return true;
  const today = todayISO();
  if (scope === 'today') {
    return t.done ? t.completedAt === today : (!!t.deadline && t.deadline <= today);
  }
  const r = weekRange(today);
  return t.done ? inRange(t.completedAt, r.start, r.end) : (!!t.deadline && t.deadline <= r.end);
}

// ── TaskCard ────────────────────────────────────────────────────────────
function TaskCard({ task, tags, accent, onToggle, onOpen, onDragStart, onDragEnd, dragging }) {
  const cardTags = task.tagIds.map((id) => tags.find((t) => t.id === id)).filter(Boolean);
  const p = prioConf(task.priority);
  return (
    <div className={'card' + (task.done ? ' done' : '') + (dragging ? ' dragging' : '')}
         draggable onClick={() => onOpen(task)}
         onDragStart={(e) => onDragStart(e, task.id)} onDragEnd={onDragEnd}
         data-id={task.id}>
      <button className="card-check" aria-label="Đánh dấu hoàn thành"
              style={{ '--accent': accent }}
              onClick={(e) => { e.stopPropagation(); onToggle(task.id, e); }}>
        {task.done && <IconCheck size={14} sw={2.6} />}
      </button>
      <div className="card-main">
        {cardTags.length > 0 && (
          <div className="card-tags">
            {cardTags.map((t) => <span key={t.id} className="tag" style={tagStyle(t.color)}>{t.name}</span>)}
          </div>
        )}
        <div className="card-title">{task.title}</div>
        {task.note && <div className="card-note">{task.note}</div>}
        {(p || task.deadline) && (
          <div className="card-foot">
            {p && (
              <span className="prio" style={{ '--pc': p.color }}>
                <i className="prio-dot" /> {p.label}
              </span>
            )}
            {task.deadline && (
              <span className={'due' + (isOverdue(task.deadline) && !task.done ? ' over' : '')}>
                <IconCalendar size={13} /> {relDue(task.deadline)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Column ──────────────────────────────────────────────────────────────
function Column({ member, name, color, tasks, tags, sort, scope, onToggle, onOpen, onQuickAdd, onAddClick, onCustomize,
                  drag, setDrag, dropInfo, setDropInfo, onDrop }) {
  const [quick, setQuick] = React.useState('');
  const [cust, setCust] = React.useState(false);
  const custRef = React.useRef(null);
  const listRef = React.useRef(null);
  React.useEffect(() => {
    if (!cust) return;
    const onDoc = (e) => { if (custRef.current && !custRef.current.contains(e.target)) setCust(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [cust]);

  const mine = tasks.filter((t) => t.owner === member.id && inScope(t, scope));
  const cmp = sortComparator(sort);
  const active = mine.filter((t) => !t.done).sort(cmp);
  const done = mine.filter((t) => t.done).sort(cmp);

  const computeIndex = (clientY) => {
    const cards = [...listRef.current.querySelectorAll('.card:not(.done):not(.dragging)')];
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return cards.length;
  };
  const onDragOver = (e) => {
    if (!drag) return;
    e.preventDefault();
    const idx = computeIndex(e.clientY);
    if (!dropInfo || dropInfo.owner !== member.id || dropInfo.index !== idx) setDropInfo({ owner: member.id, index: idx });
  };
  const showPlaceholder = drag && dropInfo && dropInfo.owner === member.id;

  return (
    <section className="col" style={{ '--accent': color }}
             onDragOver={onDragOver}
             onDrop={(e) => { e.preventDefault(); onDrop(member.id, dropInfo ? dropInfo.index : active.length); }}>
      <header className="col-head">
        <span className="avatar" style={{ background: color }}>{member.icon || name.charAt(0)}</span>
        <div className="col-meta">
          <span className="col-name">{name}</span>
          <span className="col-count">{active.length} đang làm · {done.length} xong</span>
        </div>
        <button className="iconbtn sm colcust-btn" onClick={() => setCust((o) => !o)} aria-label="Tùy chỉnh avatar & màu"><IconGear size={15} /></button>
        <button className="iconbtn add" onClick={() => onAddClick(member.id)} aria-label="Thêm task"><IconPlus size={18} /></button>
        {cust && (
          <div className="colcust-pop" ref={custRef}>
            <div className="colcust-sec">Avatar</div>
            <div className="colcust-row">
              <input className="colcust-input" maxLength={2} value={member.icon || ''} placeholder={name.charAt(0)}
                     onChange={(e) => onCustomize(member.id, { icon: e.target.value })} aria-label="Chữ / icon" />
              <div className="colcust-emojis">
                {['\uD83D\uDC1D', '\uD83D\uDC75', '\uD83C\uDF19', '\u2B50', '\uD83C\uDF38', '\uD83D\uDC31', '\uD83D\uDE80', '\uD83C\uDFA8', '\uD83C\uDF40', '\uD83E\uDD8A'].map((e) => (
                  <button key={e} className="colcust-emoji" onClick={() => onCustomize(member.id, { icon: e })}>{e}</button>
                ))}
              </div>
            </div>
            <div className="colcust-sec">Màu cột</div>
            <div className="colcust-colors">
              {TAG_PALETTE.map((c) => (
                <button key={c} className={'swatch' + (c === color ? ' on' : '')} style={{ background: c }} onClick={() => onCustomize(member.id, { color: c })} aria-label={'Màu ' + c} />
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="col-list" ref={listRef}>
        {active.map((t, i) => (
          <React.Fragment key={t.id}>
            {showPlaceholder && dropInfo.index === i && <div className="drop-line" />}
            <TaskCard task={t} tags={tags} accent={color} onToggle={onToggle} onOpen={onOpen}
                      dragging={drag === t.id}
                      onDragStart={(e, id) => { e.dataTransfer.effectAllowed = 'move'; setDrag(id); }}
                      onDragEnd={() => { setDrag(null); setDropInfo(null); }} />
          </React.Fragment>
        ))}
        {showPlaceholder && dropInfo.index >= active.length && <div className="drop-line" />}

        {active.length === 0 && !showPlaceholder && (
          <div className="col-empty">Chưa có task nào đang làm</div>
        )}

        {done.length > 0 && (
          <div className="done-sep"><span>Đã xong · {done.length}</span></div>
        )}
        {done.map((t) => (
          <TaskCard key={t.id} task={t} tags={tags} accent={color} onToggle={onToggle} onOpen={onOpen}
                    dragging={drag === t.id}
                    onDragStart={(e, id) => { e.dataTransfer.effectAllowed = 'move'; setDrag(id); }}
                    onDragEnd={() => { setDrag(null); setDropInfo(null); }} />
        ))}
      </div>

      <div className="quickadd">
        <input value={quick} placeholder="+ Thêm task nhanh…"
               onChange={(e) => setQuick(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter' && quick.trim()) { onQuickAdd(member.id, quick.trim()); setQuick(''); } }} />
      </div>
    </section>
  );
}

// ── Intro: fairy waves a wand, then 'bùm' the interface appears ────────────
function IntroOverlay({ onReveal, onClose }) {
  const [phase, setPhase] = React.useState('run');
  const done = React.useRef(false);
  const finish = React.useCallback(() => {
    if (done.current) return;
    done.current = true;
    setPhase('out');
    if (window.fireConfetti) window.fireConfetti({ x: window.innerWidth / 2, y: window.innerHeight * 0.46,
      count: 80, power: 12, up: 5, colors: ['#7C3AED', '#A855F7', '#EC4899', '#3B82F6', '#FCD34D', '#F97316', '#22C55E'] });
    if (window.popEmoji) window.popEmoji({ emoji: '\u2728', size: 54, x: window.innerWidth / 2, y: window.innerHeight * 0.44, duration: 1300 });
    onReveal();
    setTimeout(onClose, 640);
  }, [onReveal, onClose]);

  React.useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { onReveal(); onClose(); return; }
    const t1 = setTimeout(() => setPhase('burst'), 1250);
    const t2 = setTimeout(finish, 1450);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className={'intro intro-' + phase} onClick={finish}>
      <div className="intro-glow" />
      <div className="intro-fairy f1">{'\uD83E\uDDDA'}</div>
      <div className="intro-fairy f2">{'\uD83E\uDDDA'}</div>
      <div className="intro-fairy f3">{'\uD83E\uDDDA'}</div>
      <div className="intro-umbala">Úm ba la…</div>
      <div className="intro-hint">bấm để bỏ qua</div>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────
// ── TaskPit: dark hero with title + 3 fairies; cursor glow; empty = they fly up ──
function TaskPit({ count }) {
  const prev = React.useRef(count);
  const [free, setFree] = React.useState(count === 0);
  React.useEffect(() => {
    if (prev.current > 0 && count === 0) {
      setFree(true);
      if (window.celebrateBig) setTimeout(() => window.celebrateBig(), 140);
    } else if (count > 0) {
      setFree(false);
    }
    prev.current = count;
  }, [count]);

  const stageRef = React.useRef(null);
  const glowRef = React.useRef(null);
  const f0 = React.useRef(null), f1 = React.useRef(null), f2 = React.useRef(null);
  const fairyRefs = [f0, f1, f2];
  const S = React.useRef({ cur: [[0, 0], [0, 0], [0, 0]], tgt: [[0, 0], [0, 0], [0, 0]], home: [[0, 0], [0, 0], [0, 0]], hover: false, raf: 0 });
  const OFFS = [[-38, -4], [2, 12], [42, -2]];
  const GLOWS = ['#7C3AED', '#EC4899', '#3B82F6']; // match the 3 intro fairies

  const computeHome = () => {
    const st = stageRef.current; if (!st) return;
    const w = st.clientWidth, h = st.clientHeight;
    const hx = [w * 0.64, w * 0.77, w * 0.9], hy = [h * 0.5 - 6, h * 0.5 + 12, h * 0.5 - 2];
    S.current.home = hx.map((x, i) => [Math.min(w - 28, x), hy[i]]);
  };
  const apply = (i) => {
    const el = fairyRefs[i].current; if (!el) return;
    const c = S.current.cur[i];
    el.style.transform = 'translate(' + c[0] + 'px,' + c[1] + 'px) translate(-50%,-50%)';
  };

  React.useEffect(() => {
    computeHome();
    const s = S.current;
    s.cur = s.home.map((p) => [p[0], p[1]]);
    s.tgt = s.home.map((p) => [p[0], p[1]]);
    for (let i = 0; i < 3; i++) { apply(i); const el = fairyRefs[i].current; if (el) el.style.opacity = '1'; }
    const tick = () => {
      for (let i = 0; i < 3; i++) {
        const c = s.cur[i], t = s.tgt[i];
        c[0] += (t[0] - c[0]) * 0.14; c[1] += (t[1] - c[1]) * 0.14;
        apply(i);
      }
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
    const onResize = () => { computeHome(); if (!s.hover) s.tgt = s.home.map((p) => [p[0], p[1]]); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(s.raf); window.removeEventListener('resize', onResize); };
  }, []);

  const onMove = (e) => {
    const st = stageRef.current; if (!st) return;
    const r = st.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const s = S.current; s.hover = true;
    for (let i = 0; i < 3; i++) {
      let tx = x + OFFS[i][0], ty = y + OFFS[i][1];
      tx = Math.max(26, Math.min(r.width - 26, tx));
      ty = Math.max(26, Math.min(r.height - 26, ty));
      s.tgt[i] = [tx, ty];
    }
    if (glowRef.current) { glowRef.current.style.opacity = '1'; glowRef.current.style.transform = 'translate(' + x + 'px,' + y + 'px)'; }
  };
  const onLeave = () => {
    const s = S.current; s.hover = false; s.tgt = s.home.map((p) => [p[0], p[1]]);
    if (glowRef.current) glowRef.current.style.opacity = '0';
  };

  return (
    <div className={'taskpit' + (free ? ' free' : '')}>
      <div className="taskpit-title">Úm ba la mở ra mớ task</div>
      <div className="taskpit-stage" ref={stageRef} onMouseMove={onMove} onMouseLeave={onLeave}>
        <div className="pit-glow" ref={glowRef} />
        <div className="pit-deco" aria-hidden="true">
          <span className="pit-bug pit-butterfly">{'\uD83E\uDD8B'}</span>
          <span className="pit-bug pit-frog">{'\uD83D\uDC38'}</span>
          <span className="pit-star s1">{'\u2728'}</span>
          <span className="pit-star s2">{'\u2B50'}</span>
          <span className="pit-star s3">{'\u2728'}</span>
        </div>
        <div className="taskpit-fairies">
          {GLOWS.map((g, i) => (
            <span key={i} ref={fairyRefs[i]} className="pit-fairy" style={{ '--g': g }}>{'\uD83E\uDDDA'}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tasks, setTasks] = useLocal(LS.tasks, SEED_TASKS);
  const [tags, setTags] = useLocal(LS.tags, SEED_TAGS);
  const [sort, setSort] = useLocal(LS.sort, 'manual');
  const [taskScope, setTaskScope] = useLocal(LS.scope, 'all');
  const [commNotes, setCommNotes] = useLocal(LS.commNotes, {});
  const [editing, setEditing] = React.useState(null);
  const [drag, setDrag] = React.useState(null);
  const [dropInfo, setDropInfo] = React.useState(null);
  const [view, setView] = React.useState('board');
  const [ref, setRef] = React.useState(todayISO());
  const [showTags, setShowTags] = React.useState(false);
  const [posts, setPosts] = useLocal(LS.posts, SEED_POSTS);
  const [channels, setChannels] = useLocal(LS.channels, SEED_CHANNELS);
  const [commRef, setCommRef] = React.useState(todayISO());
  const [commView, setCommView] = React.useState('grid');
  const [editingPost, setEditingPost] = React.useState(null);
  const [revealApp, setRevealApp] = React.useState(false);
  const [showIntro, setShowIntro] = React.useState(true);

  const range = view === 'week' ? weekRange(ref) : view === 'month' ? monthRange(ref) : null;

  // migrate older saved tasks that predate the completedAt field
  React.useEffect(() => {
    setTasks((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        if (t.completedAt === undefined || t.phase === undefined) {
          changed = true;
          return {
            ...t,
            completedAt: t.completedAt === undefined ? (t.done ? (t.deadline || todayISO()) : null) : t.completedAt,
            phase: t.phase === undefined ? 'pre' : t.phase,
          };
        }
        return t;
      });
      return changed ? next : prev;
    });
  }, []);
  // migrate tags that predate the date (event) field
  React.useEffect(() => {
    setTags((prev) => {
      let changed = false;
      const next = prev.map((g) => { if (g.date === undefined) { changed = true; return { ...g, date: null }; } return g; });
      return changed ? next : prev;
    });
  }, []);
  // migrate channels that predate the icon field
  React.useEffect(() => {
    const ic = { 'Email': '\u2709\uFE0F', 'Zalo OA': '\uD83D\uDCAC', 'LED screen': '\uD83D\uDCFA', 'Knowlet': '\uD83D\uDCD8', 'LinkedIn': '\uD83D\uDCBC' };
    setChannels((prev) => {
      let changed = false;
      const next = prev.map((c) => { if (c.icon === undefined) { changed = true; return { ...c, icon: ic[c.name] || c.name.charAt(0).toUpperCase() }; } return c; });
      return changed ? next : prev;
    });
  }, []);
  const periodLabel = view === 'week' ? weekLabel(range) : view === 'month' ? monthLabel(ref) : '';
  const stepPeriod = (dir) => {
    if (view === 'week') setRef(addDaysISO(ref, dir * 7));
    else { const dt = parseISO(ref); setRef(toISO(new Date(dt.getFullYear(), dt.getMonth() + dir, 1))); }
  };

  const members = MEMBERS.map((m) => ({ id: m.id, name: t[m.nameKey], color: t[m.colorKey], icon: t[m.iconKey] }));
  const memberOf = (id) => members.find((m) => m.id === id);
  const customizeMember = (id, patch) => {
    const def = MEMBERS.find((x) => x.id === id); if (!def) return;
    const edits = {};
    if (patch.icon !== undefined) edits[def.iconKey] = patch.icon;
    if (patch.color !== undefined) edits[def.colorKey] = patch.color;
    if (Object.keys(edits).length) setTweak(edits);
  };

  const toggle = (id, ev) => {
    const task = tasks.find((x) => x.id === id);
    if (!task) return;
    const newDone = !task.done;
    const next = tasks.map((x) => x.id === id ? { ...x, done: newDone, completedAt: newDone ? todayISO() : null } : x);
    setTasks(next);
    if (!newDone) return;
    const x = ev && ev.clientX != null ? ev.clientX : window.innerWidth / 2;
    const y = ev && ev.clientY != null ? ev.clientY : window.innerHeight / 2;
    if (window.celebrateTask) window.celebrateTask(x, y);

    let rocketed = false;
    const fly = () => { if (!rocketed && window.celebrateRocket) { rocketed = true; setTimeout(() => window.celebrateRocket(), 340); } };

    // an event (tag with a date) is fully done
    task.tagIds.forEach((tid) => {
      const tag = tags.find((g) => g.id === tid);
      if (tag && tag.date) {
        const evTasks = next.filter((p) => p.tagIds.includes(tid));
        if (evTasks.length && evTasks.every((p) => p.done)) fly();
      }
    });
    // all of this member's tasks are done
    const mine = next.filter((p) => p.owner === task.owner);
    if (mine.length && mine.every((p) => p.done)) fly();
    // all of this week's tasks are done
    const wk = next.filter((p) => inScope(p, 'week'));
    if (wk.length && wk.every((p) => p.done)) fly();
  };

  const quickAdd = (owner, title) => setTasks((prev) => {
    const max = Math.max(0, ...prev.filter((x) => x.owner === owner).map((x) => x.order));
    return [...prev, { id: uid(), owner, title, note: '', tagIds: [], priority: null, deadline: null, done: false, completedAt: null, phase: 'pre', order: max + 1 }];
  });

  const openNew = (owner) => {
    const max = Math.max(0, ...tasks.filter((x) => x.owner === owner).map((x) => x.order));
    setEditing({ id: uid(), owner, title: '', note: '', tagIds: [], priority: null, deadline: null, done: false, completedAt: null, phase: 'pre', order: max + 1, isNew: true });
  };
  const openEdit = (task) => setEditing({ ...task, isNew: false });
  const openNewForEvent = (eventId, phase) => {
    const owner = members[0].id;
    const max = Math.max(0, ...tasks.filter((x) => x.owner === owner).map((x) => x.order));
    setEditing({ id: uid(), owner, title: '', note: '', tagIds: [eventId], priority: null, deadline: null, done: false, completedAt: null, phase: phase || 'pre', order: max + 1, isNew: true });
  };

  const saveTask = (draft) => {
    const { isNew, ...clean } = draft;
    setTasks((prev) => isNew ? [...prev, clean] : prev.map((x) => x.id === clean.id ? clean : x));
    setEditing(null);
  };
  const deleteTask = (id) => { setTasks((prev) => prev.filter((x) => x.id !== id)); setEditing(null); };

  const createTag = (name, color) => {
    const tag = { id: uid(), name, color, date: null };
    setTags((prev) => [...prev, tag]);
    return tag;
  };
  const updateTag = (id, patch) => setTags((prev) => prev.map((x) => x.id === id ? { ...x, ...patch } : x));
  const deleteTag = (id) => {
    setTags((prev) => prev.filter((x) => x.id !== id));
    setTasks((prev) => prev.map((x) => x.tagIds.includes(id) ? { ...x, tagIds: x.tagIds.filter((g) => g !== id) } : x));
  };
  const addTag = (name, color) => setTags((prev) => [...prev, { id: uid(), name, color, date: null }]);
  const addPrep = (eventId, owner, title, phase) => setTasks((prev) => {
    const max = Math.max(0, ...prev.filter((x) => x.owner === owner).map((x) => x.order));
    return [...prev, { id: uid(), owner, title, note: '', tagIds: [eventId], priority: null, deadline: null, done: false, completedAt: null, phase: phase || 'pre', order: max + 1 }];
  });
  const setPhase = (taskId, phase) => setTasks((prev) => prev.map((x) => x.id === taskId ? { ...x, phase } : x));

  const togglePosted = (id, ev) => {
    const p = posts.find((x) => x.id === id); if (!p) return;
    const np = !p.posted;
    setPosts((prev) => prev.map((x) => x.id === id ? { ...x, posted: np } : x));
    if (np) { const x = ev && ev.clientX != null ? ev.clientX : window.innerWidth / 2; const y = ev && ev.clientY != null ? ev.clientY : window.innerHeight / 2; if (window.celebrateTask) window.celebrateTask(x, y); }
  };
  const openNewPost = (date) => setEditingPost({ id: uid(), date, title: '', channelIds: [], pic: members[0].id, url: '', note: '', eventId: null, posted: false, isNew: true });
  const openEditPost = (p) => setEditingPost({ ...p, isNew: false });
  const savePost = (draft) => { const { isNew, ...clean } = draft; setPosts((prev) => isNew ? [...prev, clean] : prev.map((x) => x.id === clean.id ? clean : x)); setEditingPost(null); };
  const deletePost = (id) => { setPosts((prev) => prev.filter((x) => x.id !== id)); setEditingPost(null); };
  const createChannel = (name, color) => { const c = { id: uid(), name, color }; setChannels((prev) => [...prev, c]); return c; };
  const createEventTag = (name, color) => { const ev = { id: uid(), name, color, date: (editingPost && editingPost.date) || todayISO() }; setTags((prev) => [...prev, ev]); return ev; };

  const doDrop = (toOwner, toIndex) => {
    if (!drag) return;
    setTasks((prev) => {
      const moving = prev.find((x) => x.id === drag);
      if (!moving) return prev;
      const targetActive = prev.filter((x) => x.owner === toOwner && !x.done && x.id !== drag)
        .sort((a, b) => a.order - b.order);
      let newOrder;
      if (targetActive.length === 0) newOrder = 0;
      else if (toIndex <= 0) newOrder = targetActive[0].order - 1;
      else if (toIndex >= targetActive.length) newOrder = targetActive[targetActive.length - 1].order + 1;
      else newOrder = (targetActive[toIndex - 1].order + targetActive[toIndex].order) / 2;
      return prev.map((x) => x.id === drag ? { ...x, owner: toOwner, order: newOrder, done: false } : x);
    });
    setDrag(null); setDropInfo(null);
  };

  const total = tasks.length;
  const doneCount = tasks.filter((x) => x.done).length;
  const activeCount = total - doneCount;
  const events = tags.filter((x) => x.date);
  const memberColorOpts = {
    m1: ['#7C3AED', '#8B5CF6', '#A855F7', '#6366F1'],
    m2: ['#3B82F6', '#2563EB', '#0EA5E9', '#4F46E5'],
    m3: ['#F97316', '#FB923C', '#EA580C', '#F59E0B'],
  };

  return (
    <>
    <div className={'app bg-' + (t.bg || 'plain') + (revealApp ? '' : ' intro-pending')}>
      <TaskPit count={activeCount} members={members} />
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><IconCheck size={18} sw={2.6} /></div>
          <span className="brand-tag lg">EB·IC·EE</span>
        </div>
        <div className="toolbar">
          <div className="sync-badge">
            <div id="__sync_dot" className="sync-dot" />
            <span id="__sync_lbl">Đang kết nối…</span>
          </div>
          <div className="seg viewseg">
            {[['board', 'Board'], ['week', 'Tuần'], ['month', 'Tháng']].map(([k, l]) => (
              <button key={k} className={'seg-btn' + (view === k ? ' on' : '')} onClick={() => setView(k)}>{l}</button>
            ))}
          </div>
          {view === 'board' && (
            <div className="seg compact scopeseg">
              {[['all', 'Tất cả'], ['today', 'Hôm nay'], ['week', 'Tuần này']].map(([k, l]) => (
                <button key={k} className={'seg-btn' + (taskScope === k ? ' on' : '')} onClick={() => setTaskScope(k)}>{l}</button>
              ))}
            </div>
          )}
          {view === 'board' && (
            <div className="sortwrap">
              <IconSort size={15} />
              <span className="sort-lbl">Sắp xếp</span>
              <div className="seg compact">
                {[['manual', 'Thủ công'], ['priority', 'Priority'], ['deadline', 'Deadline']].map(([k, l]) => (
                  <button key={k} className={'seg-btn' + (sort === k ? ' on' : '')} onClick={() => setSort(k)}>{l}</button>
                ))}
              </div>
            </div>
          )}
          <button className="iconbtn tagbtn" onClick={() => setShowTags(true)} title="Quản lý tag & sự kiện" aria-label="Quản lý tag"><IconTag size={18} /></button>
        </div>
      </header>

      {view === 'board' ? (
        <main className="page">
          <div className="board">
            {members.map((m) => (
              <Column key={m.id} member={m} name={m.name} color={m.color}
                      tasks={tasks} tags={tags} sort={sort} scope={taskScope}
                      onToggle={toggle} onOpen={openEdit} onQuickAdd={quickAdd} onAddClick={openNew} onCustomize={customizeMember}
                      drag={drag} setDrag={setDrag} dropInfo={dropInfo} setDropInfo={setDropInfo} onDrop={doDrop} />
            ))}
          </div>
          <EventsSection events={events} tasks={tasks} members={members}
                         onToggle={toggle} onOpen={openEdit} onAddPrep={addPrep} onAddTask={openNewForEvent}
                         onCreateEvent={() => setShowTags(true)} onEditEvent={() => setShowTags(true)}
                         onUpdateEvent={updateTag} onSetPhase={setPhase} />
          <CommCalendar posts={posts} channels={channels} members={members} events={events}
                        refMonth={commRef}
                        onStep={(dir) => { const dt = parseISO(commRef); setCommRef(toISO(new Date(dt.getFullYear(), dt.getMonth() + dir, 1))); }}
                        onToday={() => setCommRef(todayISO())}
                        view={commView} setView={setCommView}
                        note={commNotes[commRef.slice(0, 7)] || ''}
                        onNote={(text) => setCommNotes((prev) => ({ ...prev, [commRef.slice(0, 7)]: text }))}
                        onOpenPost={openEditPost} onNewPost={openNewPost} onTogglePosted={togglePosted} onOpenEvent={() => setShowTags(true)} />
        </main>
      ) : (
        <main className="report-main">
          <div className="subbar">
            <div className="period-nav">
              <button className="iconbtn sm" onClick={() => stepPeriod(-1)} aria-label="Kỳ trước"><IconChevL size={16} /></button>
              <span className="period-label">{periodLabel}</span>
              <button className="iconbtn sm" onClick={() => stepPeriod(1)} aria-label="Kỳ sau"><IconChevR size={16} /></button>
              <button className="btn ghost sm" onClick={() => setRef(todayISO())}>Hôm nay</button>
            </div>
            <div className="subbar-title">{view === 'week' ? 'Báo cáo tuần · cho team' : 'Báo cáo tháng · cho Sếp Hải'}</div>
            <button className="btn export" onClick={() => window.print()}><IconPrint size={16} /> In / Xuất PDF</button>
          </div>
          {view === 'week'
            ? <WeekView members={members} tasks={tasks} tags={tags} range={range} onOpen={openEdit} />
            : <MonthView members={members} tasks={tasks} tags={tags} range={range} onOpen={openEdit} />}
        </main>
      )}

      <TaskEditor task={editing} member={editing ? memberOf(editing.owner) : members[0]}
                  members={members} allTags={tags} onCreateTag={createTag}
                  onSave={saveTask} onDelete={deleteTask} onClose={() => setEditing(null)} />

      <TagManager open={showTags} tags={tags} tasks={tasks}
                  onUpdate={updateTag} onDelete={deleteTag} onAdd={addTag} onClose={() => setShowTags(false)} />

      <PostEditor post={editingPost} members={members} channels={channels} events={events}
                  onCreateChannel={createChannel} onCreateEvent={createEventTag} onSave={savePost} onDelete={deletePost} onClose={() => setEditingPost(null)} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Thành viên" />
        {MEMBERS.map((m, i) => (
          <React.Fragment key={m.id}>
            <TweakText label={`Tên #${i + 1}`} value={t[m.nameKey]} onChange={(v) => setTweak(m.nameKey, v)} />
            <TweakText label="Icon (emoji)" value={t[m.iconKey]} onChange={(v) => setTweak(m.iconKey, v)} />
            <TweakColor label="Màu" value={t[m.colorKey]} options={memberColorOpts[m.id]} onChange={(v) => setTweak(m.colorKey, v)} />
          </React.Fragment>
        ))}
        <TweakSection label="Giao diện" />
        <TweakRadio label="Nền" value={t.bg || 'grid'}
                    options={[{ value: 'grid', label: 'Lưới' }, { value: 'dots', label: 'Chấm' }, { value: 'plain', label: 'Trơn' }]}
                    onChange={(v) => setTweak('bg', v)} />
      </TweaksPanel>
    </div>
    {showIntro && <IntroOverlay onReveal={() => setRevealApp(true)} onClose={() => setShowIntro(false)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
