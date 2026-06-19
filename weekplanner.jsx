// weekplanner.jsx — per-person weekly task board (modal). Tasks placed by deadline,
// drag between days to re-schedule, plus that person's posts & this week's events. Exports to window.

const WP_DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function WeekPlanner({ member, tasks, tags, posts, channels, events, refDate, onStep, onToday,
                       onUpdateTask, onToggleTask, onOpenTask, onOpenPost, onTogglePosted, onClose }) {
  const wr = weekRange(refDate);
  const days = []; for (let i = 0; i < 7; i++) days.push(addDaysISO(wr.start, i));
  const today = todayISO();

  const mine = tasks.filter((t) => t.owner === member.id);
  const backlog = mine.filter((t) => !t.deadline);
  const byDay = {}; days.forEach((d) => (byDay[d] = []));
  mine.forEach((t) => { if (t.deadline && byDay[t.deadline] !== undefined) byDay[t.deadline].push(t); });
  const postsByDay = {}; days.forEach((d) => (postsByDay[d] = []));
  posts.filter((p) => p.pic === member.id).forEach((p) => { if (postsByDay[p.date] !== undefined) postsByDay[p.date].push(p); });
  const evByDay = {}; days.forEach((d) => (evByDay[d] = []));
  events.forEach((e) => { if (e.date && evByDay[e.date] !== undefined) evByDay[e.date].push(e); });

  const [dragId, setDragId] = React.useState(null);
  const [dropKey, setDropKey] = React.useState(null);

  const TaskCard = (t) => {
    const tag = (t.tagIds || []).map((id) => tags.find((g) => g.id === id)).filter(Boolean)[0];
    const pc = t.priority ? prioConf(t.priority) : null;
    return (
      <div key={t.id} className={'wp-task' + (t.done ? ' done' : '') + (dragId === t.id ? ' dragging' : '')}
           draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragId(t.id); }}
           onDragEnd={() => { setDragId(null); setDropKey(null); }}>
        <button className="card-check sm" style={{ '--accent': member.color }} onClick={(e) => { e.stopPropagation(); onToggleTask(t.id, e); }} aria-label="Hoàn thành">
          {t.done && <IconCheck size={11} sw={2.8} />}
        </button>
        <button className="wp-task-body" onClick={() => onOpenTask(t)}>
          {(tag || pc) && (
            <span className="wp-task-meta">
              {tag && <span className="tag mini" style={tagStyle(tag.color)}>{tag.name}</span>}
              {pc && <span className="wp-prio" style={{ color: pc.color }}><i style={{ background: pc.color }} />{pc.label}</span>}
            </span>
          )}
          <span className="wp-task-title">{t.title}</span>
        </button>
      </div>
    );
  };

  const dayDropProps = (key) => ({
    onDragOver: (e) => { if (dragId) { e.preventDefault(); if (dropKey !== key) setDropKey(key); } },
    onDragLeave: (e) => { if (e.currentTarget === e.target) setDropKey(null); },
    onDrop: (e) => { e.preventDefault(); if (dragId) onUpdateTask(dragId, { deadline: key === 'none' ? null : key }); setDragId(null); setDropKey(null); },
  });

  const sortDone = (a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0);

  return (
    <div className="scrim" onMouseDown={onClose}>
      <div className="modal wp-modal" onMouseDown={(e) => e.stopPropagation()} style={{ '--accent': member.color }}>
        <div className="modal-head wp-head">
          <div className="wp-head-l">
            <span className="avatar" style={{ background: member.color }}>{member.icon || member.name.charAt(0)}</span>
            <div>
              <div className="wp-head-name">{member.name}</div>
              <div className="wp-head-sub">Bảng tuần · task theo deadline, kéo–thả để dời ngày</div>
            </div>
          </div>
          <div className="wp-head-nav">
            <button className="iconbtn sm" onClick={() => onStep(-1)} aria-label="Tuần trước"><IconChevL size={16} /></button>
            <span className="wp-week-label">{weekLabel(wr)}</span>
            <button className="iconbtn sm" onClick={() => onStep(1)} aria-label="Tuần sau"><IconChevR size={16} /></button>
            <button className="btn ghost sm" onClick={onToday}>Tuần này</button>
            <button className="iconbtn" onClick={onClose} aria-label="Đóng"><IconClose /></button>
          </div>
        </div>

        <div className="wp-body">
          <div className={'wp-backlog' + (dropKey === 'none' ? ' dropping' : '')} {...dayDropProps('none')}>
            <div className="wp-backlog-h"><IconNote size={13} /> Chưa xếp lịch <span className="wp-count">{backlog.length}</span></div>
            <div className="wp-backlog-list">
              {backlog.length === 0 && <div className="wp-empty">Không có task chưa xếp lịch</div>}
              {[...backlog].sort(sortDone).map(TaskCard)}
            </div>
          </div>

          <div className="wp-week">
            {days.map((iso, i) => {
              const dt = parseISO(iso);
              const evs = evByDay[iso], pts = postsByDay[iso], tks = [...byDay[iso]].sort(sortDone);
              return (
                <div key={iso} className={'wp-day' + (iso === today ? ' today' : '') + (dropKey === iso ? ' dropping' : '')} {...dayDropProps(iso)}>
                  <div className="wp-day-h">
                    <span className="wp-day-dow">{WP_DOW[i]}</span>
                    <span className={'wp-day-num' + (iso === today ? ' today' : '')}>{dt.getDate()}</span>
                  </div>
                  <div className="wp-day-body">
                    {evs.map((e) => (
                      <div key={e.id} className="cevent wp-ev" style={{ background: e.color }} title={'Sự kiện: ' + e.name}>
                        <IconCalendar size={10} /> <span>{e.name}</span>
                      </div>
                    ))}
                    {pts.map((p) => <PostChip key={p.id} post={p} channels={channels} events={events} onOpen={onOpenPost} onToggle={onTogglePosted} />)}
                    {tks.map(TaskCard)}
                    {evs.length === 0 && pts.length === 0 && tks.length === 0 && <div className="wp-day-empty">Kéo task vào đây</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WeekPlanner });
