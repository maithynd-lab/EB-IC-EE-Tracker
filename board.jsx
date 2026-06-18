// board.jsx — App, columns, cards, drag-drop, persistence, tweaks.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "m1Name": "Mai Thy",
  "m1Color": "#8B5CF6",
  "m2Name": "Xuân Thy",
  "m2Color": "#3B82F6",
  "m3Name": "Minh Nguyệt",
  "m3Color": "#F97316",
  "bg": "plain"
}/*EDITMODE-END*/;

const LS = { tasks: 'ttb_tasks_v2', tags: 'ttb_tags_v2', sort: 'ttb_sort_v2', posts: 'ttb_posts_v1', channels: 'ttb_channels_v1', scope: 'ttb_scope_v1', commNotes: 'ttb_commnotes_v1' };
const uid = () => Math.random().toString(36).slice(2, 9);

// ── Firebase sync ────────────────────────────────────────────────────────
// Replaces useLocal — syncs to Firebase Realtime Database instead of localStorage.
// Falls back to localStorage if Firebase is not ready.
const FB_PATH = 'ttb'; // root path in your Firebase database

function useFirebase(key, initial) {
  const [val, setValState] = React.useState(() => {
    // Load from localStorage immediately for fast first paint
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : initial; }
    catch { return initial; }
  });
  const valRef = React.useRef(val);
  const skipNextRef = React.useRef(false); // prevent echo from our own writes

  React.useEffect(() => {
    valRef.current = val;
  }, [val]);

  React.useEffect(() => {
    // Also sync to localStorage as backup
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);

  React.useEffect(() => {
    if (!window.__firebaseDB) return;
    const { ref, onValue, set } = window.__firebaseDB;
    const dbRef = ref(FB_PATH + '/' + key);
    const unsub = onValue(dbRef, (snap) => {
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
      // Write to Firebase
      if (window.__firebaseDB) {
        const { ref, set } = window.__firebaseDB;
        skipNextRef.current = true;
        set(ref(FB_PATH + '/' + key), next).catch(() => { skipNextRef.current = false; });
      }
      // Always write to localStorage too
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  return [val, setVal];
}

// Use useFirebase for all shared state
const useLocal = useFirebase;

const MEMBERS = [
  { id: 'm1', nameKey: 'm1Name', colorKey: 'm1Color' },
  { id: 'm2', nameKey: 'm2Name', colorKey: 'm2Color' },
  { id: 'm3', nameKey: 'm3Name', colorKey: 'm3Color' },
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
  { id: 'ch1', name: 'Email', color: '#3B82F6' },
  { id: 'ch2', name: 'Zalo OA', color: '#0EA5E9' },
  { id: 'ch3', name: 'LED screen', color: '#F59E0B' },
  { id: 'ch4', name: 'Knowlet', color: '#8B5CF6' },
  { id: 'ch5', name: 'LinkedIn', color: '#0A66C2' },
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
function Column({ member, name, color, avatar, tasks, tags, sort, scope, onToggle, onOpen, onQuickAdd, onAddClick,
                  drag, setDrag, dropInfo, setDropInfo, onDrop }) {
  const [quick, setQuick] = React.useState('');
  const listRef = React.useRef(null);

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
        {avatar
          ? <img src={avatar} style={{width:32,height:32,borderRadius:10,objectFit:'cover',flexShrink:0,boxShadow:'0 2px 6px rgba(0,0,0,.15)'}} />
          : <span className="avatar" style={{ background: color }}>{name.charAt(0)}</span>
        }
        <div className="col-meta">
          <span className="col-name">{name}</span>
          <span className="col-count">{active.length} đang làm · {done.length} xong</span>
        </div>
        <button className="iconbtn add" onClick={() => onAddClick(member.id)} aria-label="Thêm task"><IconPlus size={18} /></button>
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

// ── App ─────────────────────────────────────────────────────────────────
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
  const periodLabel = view === 'week' ? weekLabel(range) : view === 'month' ? monthLabel(ref) : '';
  const stepPeriod = (dir) => {
    if (view === 'week') setRef(addDaysISO(ref, dir * 7));
    else { const dt = parseISO(ref); setRef(toISO(new Date(dt.getFullYear(), dt.getMonth() + dir, 1))); }
  };

  const members = MEMBERS.map((m) => ({ id: m.id, name: t[m.nameKey], color: t[m.colorKey] }));
  const memberOf = (id) => members.find((m) => m.id === id);

  const toggle = (id, ev) => {
    const task = tasks.find((x) => x.id === id);
    if (!task) return;
    const newDone = !task.done;
    setTasks((prev) => prev.map((x) => x.id === id ? { ...x, done: newDone, completedAt: newDone ? todayISO() : null } : x));
    if (newDone) {
      const x = ev && ev.clientX != null ? ev.clientX : window.innerWidth / 2;
      const y = ev && ev.clientY != null ? ev.clientY : window.innerHeight / 2;
      if (window.celebrateTask) window.celebrateTask(x, y);
      task.tagIds.forEach((tid) => {
        const tag = tags.find((g) => g.id === tid);
        if (tag && tag.date) {
          const others = tasks.filter((p) => p.tagIds.includes(tid) && p.id !== id);
          if (others.every((p) => p.done)) setTimeout(() => window.celebrateBig && window.celebrateBig(), 260);
        }
      });
    }
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
  const events = tags.filter((x) => x.date);
  const [showSettings, setShowSettings] = React.useState(false);
  const [avatars, setAvatars] = useLocal('ttb_avatars_v1', {});

  return (
    <div className={'app bg-' + (t.bg || 'grid')}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><IconCheck size={18} sw={2.6} /></div>
          <div>
            <h1>Úm ba la mở ra mớ task <span className="brand-tag">EB·IC·EE</span></h1>
            <p>{doneCount}/{total} task đã xong · {members.map((m) => m.name).join(' · ')}</p>
          </div>
        </div>
        <div className="toolbar">
          {/* Sync indicator */}
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
          <button className="iconbtn" onClick={() => setShowSettings(true)} title="Cài đặt thành viên" aria-label="Cài đặt"><IconGear size={18} /></button>
        </div>
      </header>

      {view === 'board' ? (
        <main className="page">
          <div className="board">
            {members.map((m) => (
              <Column key={m.id} member={m} name={m.name} color={m.color} avatar={avatars[m.id]}
                      tasks={tasks} tags={tags} sort={sort} scope={taskScope}
                      onToggle={toggle} onOpen={openEdit} onQuickAdd={quickAdd} onAddClick={openNew}
                      drag={drag} setDrag={setDrag} dropInfo={dropInfo} setDropInfo={setDropInfo} onDrop={doDrop} />
            ))}
          </div>
          <EventsSection events={events} tasks={tasks} members={members}
                         onToggle={toggle} onOpen={openEdit} onAddPrep={addPrep}
                         onCreateEvent={() => setShowTags(true)} onEditEvent={() => setShowTags(true)}
                         onUpdateEvent={updateTag} onSetPhase={setPhase} />
          <CommCalendar posts={posts} channels={channels} members={members} events={events}
                        refMonth={commRef}
                        onStep={(dir) => { const dt = parseISO(commRef); setCommRef(toISO(new Date(dt.getFullYear(), dt.getMonth() + dir, 1))); }}
                        onToday={() => setCommRef(todayISO())}
                        view={commView} setView={setCommView}
                        note={commNotes[commRef.slice(0, 7)] || ''}
                        onNote={(text) => setCommNotes((prev) => ({ ...prev, [commRef.slice(0, 7)]: text }))}
                        onOpenPost={openEditPost} onNewPost={openNewPost} onTogglePosted={togglePosted} />
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
            <div className="subbar-title">{view === 'week' ? 'Báo cáo tuần · cho team' : 'Báo cáo tháng · cho Head of HR'}</div>
            <button className="btn export" onClick={() => window.print()}><IconPrint size={16} /> In / Xuất PDF</button>
          </div>
          {view === 'week'
            ? <WeekView members={members} tasks={tasks} tags={tags} range={range} onOpen={openEdit} />
            : <MonthView members={members} tasks={tasks} tags={tags} range={range} onOpen={openEdit} />}
        </main>
      )}

      <TaskEditor task={editing} member={editing ? memberOf(editing.owner) : members[0]}
                  allTags={tags} onCreateTag={createTag}
                  onSave={saveTask} onDelete={deleteTask} onClose={() => setEditing(null)} />

      <TagManager open={showTags} tags={tags} tasks={tasks}
                  onUpdate={updateTag} onDelete={deleteTag} onAdd={addTag} onClose={() => setShowTags(false)} />

      <PostEditor post={editingPost} members={members} channels={channels} events={events}
                  onCreateChannel={createChannel} onSave={savePost} onDelete={deletePost} onClose={() => setEditingPost(null)} />

      {showSettings && (
        <div className="scrim" onMouseDown={() => setShowSettings(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{'--accent':'#8B5CF6',maxWidth:440}}>
            <div className="modal-head">
              <span className="modal-owner"><IconGear size={16} /> Cài đặt</span>
              <button className="iconbtn" onClick={() => setShowSettings(false)} aria-label="Đóng"><IconClose /></button>
            </div>
            <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:20}}>
              {MEMBERS.map((m, i) => {
                const member = members[i];
                return (
                  <div key={m.id} style={{display:'flex',flexDirection:'column',gap:10,padding:'14px 16px',borderRadius:14,border:'1px solid rgba(20,22,30,.08)',background:'rgba(20,22,30,.02)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <label style={{position:'relative',cursor:'pointer',flexShrink:0}} title="Click để đổi ảnh">
                        {avatars[m.id]
                          ? <img src={avatars[m.id]} style={{width:44,height:44,borderRadius:13,objectFit:'cover',boxShadow:'0 2px 8px rgba(0,0,0,.15)'}} />
                          : <span className="avatar" style={{background:member.color,width:44,height:44,borderRadius:13,fontSize:18}}>{member.name.charAt(0)}</span>
                        }
                        <span style={{position:'absolute',bottom:-4,right:-4,background:'#fff',borderRadius:'50%',width:18,height:18,display:'grid',placeItems:'center',boxShadow:'0 1px 4px rgba(0,0,0,.2)',fontSize:11}}>📷</span>
                        <input type="file" accept="image/*" style={{display:'none'}} onChange={(e) => {
                          const file = e.target.files[0]; if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => setAvatars((prev) => ({...prev, [m.id]: ev.target.result}));
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                      <input
                        value={t[m.nameKey]}
                        onChange={(e) => setTweak(m.nameKey, e.target.value)}
                        style={{flex:1,border:'1px solid rgba(20,22,30,.12)',borderRadius:9,padding:'8px 12px',fontSize:14,fontWeight:600,fontFamily:'inherit',background:'#fff'}}
                        placeholder={`Tên thành viên ${i+1}`}
                      />
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:12,fontWeight:600,color:'#8B909E',width:40,flexShrink:0}}>Màu</span>
                      <input type="color" value={t[m.colorKey]} onChange={(e) => setTweak(m.colorKey, e.target.value)}
                        style={{width:36,height:36,border:'none',borderRadius:9,cursor:'pointer',padding:2,background:'none'}} />
                      <span style={{fontSize:12,color:'#8B909E'}}>{t[m.colorKey]}</span>
                    </div>
                  </div>
                );
              })}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <span style={{fontSize:12,fontWeight:600,color:'#8B909E'}}>NỀN</span>
                <div style={{display:'flex',gap:8}}>
                  {[['plain','Trơn'],['grid','Lưới'],['dots','Chấm']].map(([v,l]) => (
                    <button key={v} onClick={() => setTweak('bg', v)}
                      style={{flex:1,padding:'8px 0',borderRadius:9,border:'1.5px solid '+(t.bg===v?'#8B5CF6':'rgba(20,22,30,.12)'),
                        background:t.bg===v?'rgba(139,92,246,.08)':'#fff',
                        color:t.bg===v?'#8B5CF6':'#23262F',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
