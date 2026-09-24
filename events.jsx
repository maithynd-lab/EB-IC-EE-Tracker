// events.jsx — Event blocks, EventsSection, TagManager. tag-with-date = event. Exports to window.

const EV_MONTHS = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];
const EV_DOW = ['CN','T2','T3','T4','T5','T6','T7'];

// Icon palette for events (replaces cover image — persists with the event). macOS-style, diverse.
const EVENT_ICONS = [
  // team / people
  '🤝','👥','🙌','🥳','🎉','🎊','🍻','🧑‍💼','👔','🗣️',
  // learning / work
  '🎓','📚','📖','✏️','📝','🧑‍🏫','💼','🗂️','📊','📈','🗓️','📅','⏰','🕐',
  // tech / AI
  '🤖','🧠','💻','🖥️','⌨️','📱','⚙️','🛠️','🔧','🧩','💡','🚀','🛰️','🔬','🧪','📡',
  // security
  '🔒','🛡️','🔐','🕵️','⚠️',
  // travel / trip
  '✈️','🚌','🚗','🏖️','🏝️','🗺️','🧳','⛺','🏔️','🎡',
  // sports / health
  '🏸','⚽','🏀','🏓','🏆','🥇','🎯','🏃','🧗','🚴','🧘','💪',
  // celebration / seasonal / holiday
  '🎄','🎅','🎁','🧧','🎆','🎇','🏮','🌸','🌷','🌻','🍀','🎃','🦃','❤️','💖','🌟','⭐','🌈',
  // food
  '🍕','🍰','🎂','🍔','☕','🍩','🥗','🍜',
  // misc
  '🎤','🎬','🎨','🎵','📣','📢','🔔','🏅','🎮','🎲','📷','🎥','💎','🔥','✨','🌍','🌱','🐾',
];
const DEFAULT_EVENT_ICON = '📅';

function daysUntil(iso) { const a = parseISO(todayISO()), b = parseISO(iso); return Math.round((b - a) / 86400000); }
function countdownLabel(iso) {
  const n = daysUntil(iso);
  if (n === 0) return 'Hôm nay';
  if (n === 1) return 'Ngày mai';
  if (n > 1) return `Còn ${n} ngày`;
  if (n === -1) return 'Hôm qua';
  return `${-n} ngày trước`;
}
function fmtFullDate(iso) { const d = parseISO(iso); return `${EV_DOW[d.getDay()]}, ${d.getDate()} ${EV_MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function dBadge(iso) { const n = daysUntil(iso); return n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `D+${-n}`; }

// Mốc thời gian của 1 project (tag): mảng tường minh nếu có, không thì suy ra 1 mốc từ ngày diễn ra.
function tagMilestones(tag) {
  if (Array.isArray(tag.milestones) && tag.milestones.length) return tag.milestones;
  return tag.date ? [{ id: 'm0', date: tag.date, label: tag.name }] : [];
}

// ── EventBlock ───────────────────────────────────────────────────────────
function InfoField({ icon, value, placeholder, onChange, type }) {
  return (
    <label className="info-field">
      <span className="info-ic">{icon}</span>
      <input type={type || 'text'} value={value || ''} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function PhaseAdd({ members, defOwner, onAdd }) {
  const [owner, setOwner] = React.useState(defOwner);
  const [text, setText] = React.useState('');
  return (
    <div className="phase-add">
      <div className="owner-pick sm">
        {members.map((m) => (
          <button key={m.id} className={'avatar xs pick' + (owner === m.id ? ' on' : '')}
                  style={{ background: owner === m.id ? m.color : 'transparent', color: owner === m.id ? '#fff' : m.color, boxShadow: `inset 0 0 0 1.5px ${m.color}` }}
                  onClick={() => setOwner(m.id)} title={m.name}>{m.icon || m.name.charAt(0)}</button>
        ))}
      </div>
      <input className="phase-add-input" value={text} placeholder="+ Thêm việc…"
             onChange={(e) => setText(e.target.value)}
             onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && text.trim()) { e.preventDefault(); onAdd(owner, text.trim()); setText(''); } }} />
    </div>
  );
}

const PHASES = [['pre', 'Pre-Event'], ['during', 'During-Event'], ['post', 'Post-Event']];

// ── ProjectContentCalendar: mini content calendar riêng cho 1 project ──────
// Dùng chung dữ liệu "posts" với Comm Calendar (lọc theo eventId) — sửa ở đây
// hiện luôn bên Comm Calendar và ngược lại. Cột phải là danh sách kéo-thả toàn
// bộ content của project, sắp theo khoảng cách tới ngày diễn ra (gần nhất lên
// đầu, chưa có ngày thì xuống cuối); kéo 1 thẻ thả vào 1 ngày trên lịch là gán
// deadline luôn.
const PCC_DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function ProjectContentCalendar({ event, posts, channels, members, onOpenPost, onTogglePosted, onUpdatePost, onNewPost }) {
  const myPosts = (posts || []).filter((p) => p.eventId === event.id);
  const eventDay = event.endDate || event.date || todayISO();
  const today = todayISO();

  const allDates = [event.date, event.endDate, ...myPosts.map((p) => p.date)].filter(Boolean);
  const anchorStart = allDates.length ? allDates.reduce((a, b) => a < b ? a : b) : today;
  const anchorEnd = allDates.length ? allDates.reduce((a, b) => a > b ? a : b) : today;
  const rangeStart = weekRange(anchorStart).start;
  const rangeEnd = weekRange(anchorEnd).end;
  const weekStarts = [];
  { let cur = rangeStart, guard = 0; while (cur <= rangeEnd && guard++ < 26) { weekStarts.push(cur); cur = addDaysISO(cur, 7); } }

  const byDay = {};
  myPosts.forEach((p) => { if (p.date) (byDay[p.date] = byDay[p.date] || []).push(p); });

  const dist = (p) => p.date ? Math.abs(Math.round((parseISO(p.date) - parseISO(eventDay)) / 86400000)) : Infinity;
  const backlog = [...myPosts].sort((a, b) => dist(a) - dist(b) || (a.date || '9999').localeCompare(b.date || '9999'));

  const [dragId, setDragId] = React.useState(null);
  const [dropKey, setDropKey] = React.useState(null);
  const dropProps = (key) => ({
    onDragOver: (e) => { if (dragId) { e.preventDefault(); if (dropKey !== key) setDropKey(key); } },
    onDragLeave: (e) => { if (e.currentTarget === e.target) setDropKey(null); },
    onDrop: (e) => { e.preventDefault(); if (dragId) onUpdatePost(dragId, { date: key === 'none' ? null : key }); setDragId(null); setDropKey(null); },
  });

  const PostCard = (p) => {
    const chs = (p.channelIds || []).map((id) => (channels || []).find((c) => c.id === id)).filter(Boolean);
    const pic = members.find((m) => m.id === p.pic);
    return (
      <div key={p.id} className={'pcc-card' + (p.posted ? ' done' : '') + (dragId === p.id ? ' dragging' : '')}
           draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragId(p.id); }}
           onDragEnd={() => { setDragId(null); setDropKey(null); }}
           onClick={() => onOpenPost(p)}>
        <button className="card-check sm" style={{ '--accent': pic ? pic.color : '#94A3B8' }}
                onClick={(e) => { e.stopPropagation(); onTogglePosted(p.id, e); }} aria-label="Đã đăng">
          {p.posted && <IconCheck size={10} sw={2.8} />}
        </button>
        <div className="pcc-card-body">
          {chs.length > 0 && <div className="pcc-card-chs">{chs.map((c) => <span key={c.id} className="tag mini" style={tagStyle(c.color)}>{c.name}</span>)}</div>}
          <span className="pcc-card-title">{p.title || 'Chưa đặt tên'}</span>
          <span className="pcc-card-meta">
            {pic && <span className="avatar xs" style={{ background: pic.color }} title={pic.name}>{pic.icon || pic.name.charAt(0)}</span>}
            <span className="pcc-card-date">{p.date ? fmtFullDate(p.date) : 'CHƯA CÓ NGÀY'}</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="pcc-wrap">
      <div className="pcc-cal">
        {weekStarts.map((wk) => {
          const days = []; for (let i = 0; i < 7; i++) days.push(addDaysISO(wk, i));
          return (
            <div className="pcc-week" key={wk}>
              {days.map((iso, i) => {
                const dt = parseISO(iso);
                return (
                  <div key={iso} className={'pcc-day' + (iso === today ? ' today' : '') + (iso === eventDay ? ' event' : '') + (dropKey === iso ? ' dropping' : '')} {...dropProps(iso)}>
                    <div className="pcc-day-h"><span className="pcc-day-dow">{PCC_DOW[i]}</span><span className="pcc-day-num">{dt.getDate()}/{dt.getMonth() + 1}</span></div>
                    <div className="pcc-day-body">
                      {(byDay[iso] || []).length === 0 && <div className="pcc-day-empty">Kéo content vào đây</div>}
                      {(byDay[iso] || []).map(PostCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className={'pcc-backlog' + (dropKey === 'none' ? ' dropping' : '')} {...dropProps('none')}>
        <div className="pcc-backlog-h"><IconNote size={13} /> Content <span className="wp-count">{backlog.length}</span></div>
        <div className="pcc-backlog-list">
          {backlog.length === 0 && <div className="wp-empty">Chưa có content nào gắn với project này.</div>}
          {backlog.map(PostCard)}
        </div>
        <button className="btn ghost sm pcc-add" onClick={() => onNewPost(null, event.id)}><IconPlus size={13} /> Thêm content</button>
      </div>
    </div>
  );
}

function EventBlock({ event, tasks, members, posts, channels, onToggle, onOpen, onAddPrep, onAddTask, onEditEvent, onUpdateEvent, onSetPhase, past, onOpenPost, onTogglePosted, onUpdatePost, onNewPost }) {
  const prep = tasks.filter((t) => t.tagIds.includes(event.id));
  const done = prep.filter((t) => t.done);
  const total = prep.length;
  const pct = total ? Math.round((done.length / total) * 100) : 0;
  const owners = members.filter((m) => prep.some((t) => t.owner === m.id));
  const defOwner = (owners[0] || members[0]).id;
  const [dragId, setDragId] = React.useState(null);
  const [dropPhase, setDropPhase] = React.useState(null);
  const [dateOpen, setDateOpen] = React.useState(false);
  const [iconOpen, setIconOpen] = React.useState(false);
  const dateRef = React.useRef(null);
  const iconRef = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => {
      if (dateRef.current && !dateRef.current.contains(e.target)) setDateOpen(false);
      if (iconRef.current && !iconRef.current.contains(e.target)) setIconOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <section className={'event-block' + (past ? ' past' : '')} style={{ '--accent': event.color }}>
      <header className="event-head">
        <div className="event-head-l">
          <span className="event-dot" />
          <div className="event-titles">
            <input className="event-name-input" value={event.name} placeholder="Tên sự kiện"
                   onChange={(e) => onUpdateEvent(event.id, { name: e.target.value })} />
            <div className="event-meta event-date-wrap" ref={dateRef}>
              <span className="event-cd">{countdownLabel(event.date)}{event.startTime ? ' · ' + event.startTime + (event.endTime ? '–' + event.endTime : '') : ''}</span>

            </div>
          </div>
        </div>
        <div className="event-head-r">
          {owners.length > 0 && (
            <div className="event-owners" title={'Phụ trách: ' + owners.map((o) => o.name).join(', ')}>
              {owners.map((o) => <span key={o.id} className="avatar xs" style={{ background: o.color }}>{o.icon || o.name.charAt(0)}</span>)}
            </div>
          )}
          <span className={'event-dbadge' + (daysUntil(event.date) <= 0 ? ' hot' : '')}>{dBadge(event.date)}</span>
          <a className="iconbtn sm" href={gcalUrl({ title: event.name, date: event.date, startTime: event.startTime, endTime: event.endTime, details: [event.desc, event.docLink].filter(Boolean).join('\n'), location: event.venue })}
             target="_blank" rel="noopener noreferrer" title="Thêm vào Google Calendar" onClick={(e) => e.stopPropagation()}><IconCalPlus size={16} /></a>
          <button className="iconbtn sm" onClick={() => onEditEvent(event)} aria-label="Sửa sự kiện"><IconGear size={16} /></button>
        </div>
      </header>

      <div className="event-dash">
        <div className="event-icon-wrap" ref={iconRef}>
          <button className="event-icon-tile" onClick={() => setIconOpen((o) => !o)} title="Chọn icon cho sự kiện">
            <span className="event-icon-glyph">{event.icon || DEFAULT_EVENT_ICON}</span>
            <span className="event-icon-edit"><IconGear size={12} /></span>
          </button>
          {iconOpen && (
            <div className="pop event-icon-pop">
              {EVENT_ICONS.map((ic) => (
                <button key={ic} className={'event-icon-opt' + (ic === event.icon ? ' on' : '')}
                        onClick={() => { onUpdateEvent(event.id, { icon: ic }); setIconOpen(false); }}>{ic}</button>
              ))}
            </div>
          )}
        </div>
        <div className="event-info">
          <textarea className="event-desc" value={event.desc || ''} rows={2}
                    placeholder="Mô tả / mục tiêu của sự kiện — để cả team cùng nắm…"
                    onChange={(e) => onUpdateEvent(event.id, { desc: e.target.value })} />
          <div className="event-info-grid">
            <div className="info-field info-date" ref={dateRef}>
              <span className="info-ic"><IconCalendar size={14} /></span>
              <button className="info-datebtn" onClick={() => setDateOpen((o) => !o)}>
                {event.date ? fmtFullDate(event.date) : 'Ngày bắt đầu'}{event.endDate && event.endDate !== event.date ? ' → ' + fmtFullDate(event.endDate) : ''}
              </button>
              {dateOpen && (
                <div className="pop ev-datepop" onClick={(ev) => ev.stopPropagation()}>
                  <div className="ev-datecol">
                    <div className="ev-datelbl">Ngày bắt đầu</div>
                    <Calendar value={event.date}
                              onPick={(iso) => onUpdateEvent(event.id, { date: iso, endDate: event.endDate && event.endDate < iso ? iso : event.endDate })}
                              onClear={() => {}} />
                  </div>
                  <div className="ev-datecol">
                    <div className="ev-datelbl">Ngày kết thúc</div>
                    <Calendar value={event.endDate || event.date}
                              onPick={(iso) => onUpdateEvent(event.id, { endDate: iso < event.date ? event.date : iso })}
                              onClear={() => onUpdateEvent(event.id, { endDate: null })} />
                  </div>
                  <button className="btn ghost sm ev-datedone" onClick={() => setDateOpen(false)}>Xong</button>
                </div>
              )}
            </div>
            <InfoField icon={<IconPin size={14} />} value={event.venue} placeholder="Địa điểm" onChange={(v) => onUpdateEvent(event.id, { venue: v })} />
            <InfoField icon={<IconLink size={14} />} value={event.docLink} placeholder="Link tài liệu (Drive/Docs)" onChange={(v) => onUpdateEvent(event.id, { docLink: v })} type="url" />
          </div>
        </div>
      </div>

      <div className="event-progress">
        <div className="event-progress-track"><div className="event-progress-bar" style={{ width: pct + '%' }} /></div>
        <span className="event-progress-lbl">{done.length}/{total} việc · {pct}%</span>
      </div>


      <div className="phases">
        {PHASES.map(([ph, label]) => {
          const list = prep.filter((t) => (t.phase || 'pre') === ph);
          const items = [...list.filter((t) => !t.done), ...list.filter((t) => t.done)];
          return (
            <div key={ph} className={'phase' + (dropPhase === ph ? ' dropping' : '')}
                 onDragOver={(e) => { if (dragId) { e.preventDefault(); if (dropPhase !== ph) setDropPhase(ph); } }}
                 onDragLeave={(e) => { if (e.currentTarget === e.target) setDropPhase(null); }}
                 onDrop={(e) => { e.preventDefault(); if (dragId) onSetPhase(dragId, ph); setDragId(null); setDropPhase(null); }}>
              <div className="phase-h"><span className="phase-dot" /> {label} <span className="phase-count">{items.length}</span></div>
              <div className="phase-tasks">
                {items.length === 0 && <div className="phase-empty">Kéo việc vào đây</div>}
                {items.map((t) => {
                  const owner = members.find((m) => m.id === t.owner) || members[0];
                  return (
                    <div key={t.id} className={'ev-row' + (t.done ? ' done' : '') + (dragId === t.id ? ' dragging' : '')}
                         draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragId(t.id); }}
                         onDragEnd={() => { setDragId(null); setDropPhase(null); }}>
                      <button className="card-check sm" style={{ '--accent': owner.color }} onClick={(e) => onToggle(t.id, e)} aria-label="Hoàn thành">
                        {t.done && <IconCheck size={12} sw={2.8} />}
                      </button>
                      <span className="avatar xs" style={{ background: owner.color }} title={owner.name}>{owner.icon || owner.name.charAt(0)}</span>
                      <button className="ev-title" onClick={() => onOpen(t)}>{t.title}</button>
                      {t.deadline && <span className={'due' + (isOverdue(t.deadline) && !t.done ? ' over' : '')}><IconCalendar size={12} /> {relDue(t.deadline)}</span>}
                    </div>
                  );
                })}
              </div>
              <button className="phase-add-btn" onClick={() => onAddTask(event.id, ph)}><IconPlus size={14} /> Thêm việc</button>
            </div>
          );
        })}
      </div>

      <ProjectContentCalendar event={event} posts={posts} channels={channels} members={members}
                              onOpenPost={onOpenPost} onTogglePosted={onTogglePosted} onUpdatePost={onUpdatePost} onNewPost={onNewPost} />
    </section>
  );
}

// ── EventsSection ────────────────────────────────────────────────────────
function EventsSection({ events, tasks, members, posts, channels, onToggle, onOpen, onAddPrep, onAddTask, onCreateEvent, onEditEvent, onUpdateEvent, onSetPhase, onOpenPost, onTogglePosted, onUpdatePost, onNewPost }) {
  const [showPast, setShowPast] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const ql = query.trim().toLowerCase();
  const matchesQuery = (e) => !ql || (e.name || '').toLowerCase().includes(ql);
  const upcoming = events.filter((e) => daysUntil(e.endDate || e.date) >= 0).filter(matchesQuery).sort((a, b) => a.date < b.date ? -1 : 1);
  const pastEvents = events.filter((e) => daysUntil(e.endDate || e.date) < 0).filter(matchesQuery).sort((a, b) => a.date > b.date ? -1 : 1);

  return (
    <section className="events">
      <div className="events-head">
        <div>
          <h2>Sự kiện</h2>
          <p>Đếm ngược tới ngày diễn ra · việc cần chuẩn bị nối với board task ở trên</p>
        </div>
        <button className="btn primary sm" onClick={onCreateEvent}><IconPlus size={16} /> Tạo sự kiện</button>
      </div>

      <div className="events-search">
        <IconSearch size={14} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm sự kiện / project…" />
        {query && <button className="events-search-x" onClick={() => setQuery('')} aria-label="Xoá tìm kiếm"><IconClose size={12} /></button>}
      </div>

      {upcoming.length === 0 && (
        <div className="events-empty">
          <span className="events-empty-emoji">📅</span>
          {query
            ? 'Không tìm thấy sự kiện nào khớp.'
            : <>Chưa có sự kiện sắp tới. Bấm <b>Tạo sự kiện</b> để đặt ngày & gom việc cần chuẩn bị.</>}
        </div>
      )}
      <div className="events-list">
        {upcoming.map((e) => (
          <EventBlock key={e.id} event={e} tasks={tasks} members={members} posts={posts} channels={channels}
                      onToggle={onToggle} onOpen={onOpen} onAddPrep={onAddPrep} onAddTask={onAddTask} onEditEvent={onEditEvent}
                      onUpdateEvent={onUpdateEvent} onSetPhase={onSetPhase}
                      onOpenPost={onOpenPost} onTogglePosted={onTogglePosted} onUpdatePost={onUpdatePost} onNewPost={onNewPost} />
        ))}
      </div>

      {pastEvents.length > 0 && (
        <div className="events-past">
          <button className="past-toggle" onClick={() => setShowPast((s) => !s)}>
            <IconChevD size={16} style={{ transform: showPast ? 'none' : 'rotate(-90deg)', transition: '.15s' }} />
            Đã diễn ra ({pastEvents.length})
          </button>
          {showPast && (
            <div className="events-list">
              {pastEvents.map((e) => (
                <EventBlock key={e.id} event={e} tasks={tasks} members={members} posts={posts} channels={channels} past
                            onToggle={onToggle} onOpen={onOpen} onAddPrep={onAddPrep} onAddTask={onAddTask} onEditEvent={onEditEvent}
                            onUpdateEvent={onUpdateEvent} onSetPhase={onSetPhase}
                            onOpenPost={onOpenPost} onTogglePosted={onTogglePosted} onUpdatePost={onUpdatePost} onNewPost={onNewPost} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── TagManager modal ───────────────────────────────────────────────────────
function TagRow({ tag, count, onUpdate, onDelete }) {
  const [pop, setPop] = React.useState(null); // 'color' | 'date' | null
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setPop(null); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div className="tagm-row" ref={ref}>
      <div className="tagm-swatch-wrap">
        <button className="tagm-swatch" style={{ background: tag.color }} onClick={() => setPop(pop === 'color' ? null : 'color')} aria-label="Đổi màu" />
        {pop === 'color' && (
          <div className="pop swatches-pop">
            {TAG_PALETTE.map((c) => (
              <button key={c} className={'swatch' + (c === tag.color ? ' on' : '')} style={{ background: c }}
                      onClick={() => { onUpdate(tag.id, { color: c }); setPop(null); }} />
            ))}
          </div>
        )}
      </div>
      <input className="tagm-name" value={tag.name} onChange={(e) => onUpdate(tag.id, { name: e.target.value })} />
      <div className="tagm-date-wrap">
        <button className={'tagm-date' + (tag.date ? ' set' : '')} onClick={() => setPop(pop === 'date' ? null : 'date')}>
          <IconCalendar size={14} /> {tag.date ? fmtDue(tag.date) : 'Đặt làm sự kiện'}
        </button>
        {pop === 'date' && (
          <div className="pop">
            <Calendar value={tag.date} onPick={(iso) => { onUpdate(tag.id, { date: iso }); setPop(null); }}
                      onClear={() => { onUpdate(tag.id, { date: null }); setPop(null); }} />
          </div>
        )}
      </div>
      <span className="tagm-count">{count}</span>
      <button className="iconbtn sm danger" onClick={() => onDelete(tag.id)} aria-label="Xoá tag"><IconTrash size={15} /></button>
    </div>
  );
}

function TagManager({ open, tags, tasks, onUpdate, onDelete, onAdd, onClose }) {
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(TAG_PALETTE[7]);
  if (!open) return null;
  const count = (id) => tasks.filter((t) => t.tagIds.includes(id)).length;
  const add = () => { if (name.trim()) { onAdd(name.trim(), color); setName(''); } };
  return (
    <div className="scrim" onMouseDown={onClose}>
      <div className="modal tagm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-owner"><IconTag size={16} /> Quản lý tag & sự kiện</span>
          <button className="iconbtn" onClick={onClose} aria-label="Đóng"><IconClose /></button>
        </div>
        <div className="modal-body tagm-body">
          <div className="tagm-hint">Đặt <b>ngày</b> cho một tag để biến nó thành <b>sự kiện</b> (hiện ở khu Sự kiện bên dưới board).</div>
          <div className="tagm-list">
            {tags.length === 0 && <div className="rep-empty">Chưa có tag nào.</div>}
            {tags.map((t) => <TagRow key={t.id} tag={t} count={count(t.id)} onUpdate={onUpdate} onDelete={onDelete} />)}
          </div>
          <div className="tagm-add">
            <div className="tagm-add-swatches">
              {TAG_PALETTE.map((c) => (
                <button key={c} className={'swatch' + (c === color ? ' on' : '')} style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
            <div className="tagm-add-row">
              <span className="tag" style={tagStyle(color)}>{name.trim() || 'tag mới'}</span>
              <input className="tagm-name flat" value={name} placeholder="Tên tag mới…"
                     onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) add(); }} />
              <button className="btn primary sm" onClick={add} disabled={!name.trim()}>Thêm</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EventEditor modal (create / edit an event = a dated tag) ────────────────
function EventEditor({ event, onSave, onDelete, onClose }) {
  const [draft, setDraft] = React.useState(event);
  const [calOpen, setCalOpen] = React.useState(false);
  const [msCalOpen, setMsCalOpen] = React.useState(null);
  React.useEffect(() => { setDraft(event); setCalOpen(false); setMsCalOpen(null); }, [event]);
  if (!event || !draft) return null;
  const set = (p) => setDraft((d) => ({ ...d, ...p }));
  const canSave = (draft.name || '').trim().length > 0;

  // Mốc thời gian: mặc định 1 mốc (suy ra từ ngày diễn ra) cho tới khi tự thêm/sửa.
  const msRows = draft.milestones && draft.milestones.length ? draft.milestones : [{ id: 'm0', date: draft.date, label: '' }];
  const setMilestones = (rows) => set({ milestones: rows });
  const addMilestone = () => { setMilestones([...msRows, { id: Math.random().toString(36).slice(2, 9), date: draft.date || todayISO(), label: '' }]); };
  const updateMilestone = (id, patch) => setMilestones(msRows.map((m) => m.id === id ? { ...m, ...patch } : m));
  const removeMilestone = (id) => setMilestones(msRows.filter((m) => m.id !== id));
  return (
    <div className="scrim" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ '--accent': draft.color }}>
        <div className="modal-head">
          <span className="modal-owner"><IconCalendar size={16} /> {event.isNew ? 'Sự kiện mới' : 'Sửa sự kiện'}</span>
          <button className="iconbtn" onClick={onClose} aria-label="Đóng"><IconClose /></button>
        </div>
        <div className="modal-body">
          <div className="ev-ed-top">
            <div className="ev-ed-preview" style={{ background: 'color-mix(in srgb,' + draft.color + ' 14%,#fff)', borderColor: 'color-mix(in srgb,' + draft.color + ' 30%,transparent)' }}>
              <span className="ev-ed-preview-glyph">{draft.icon || DEFAULT_EVENT_ICON}</span>
            </div>
            <input className="title-input" autoFocus value={draft.name} placeholder="Tên sự kiện…"
                   onChange={(e) => set({ name: e.target.value })} />
          </div>

          <div className="field-row">
            <div className="field">
              <div className="label"><IconCalendar size={14} /> Ngày diễn ra</div>
              <div className="due-picker">
                <button className="due-btn set" onClick={() => setCalOpen((o) => !o)}>
                  <IconCalendar size={15} /> {fmtFullDate(draft.date)}{draft.endDate && draft.endDate !== draft.date ? ' → ' + fmtFullDate(draft.endDate) : ''}
                </button>
                {calOpen && (
                  <div className="pop ev-datepop" onClick={(e) => e.stopPropagation()}>
                    <div className="ev-datecol">
                      <div className="ev-datelbl">Ngày bắt đầu</div>
                      <Calendar value={draft.date}
                                onPick={(iso) => set({ date: iso, endDate: draft.endDate && draft.endDate < iso ? iso : draft.endDate })}
                                onClear={() => {}} />
                    </div>
                    <div className="ev-datecol">
                      <div className="ev-datelbl">Ngày kết thúc</div>
                      <Calendar value={draft.endDate || draft.date}
                                onPick={(iso) => set({ endDate: iso < draft.date ? draft.date : iso })}
                                onClear={() => set({ endDate: null })} />
                    </div>
                    <button className="btn ghost sm ev-datedone" onClick={() => setCalOpen(false)}>Xong</button>
                  </div>
                )}
              </div>
            </div>
            <div className="field">
              <div className="label"><IconTag size={14} /> Màu</div>
              <div className="ev-ed-colors">
                {TAG_PALETTE.map((c) => (
                  <button key={c} className={'swatch' + (c === draft.color ? ' on' : '')} style={{ background: c }} onClick={() => set({ color: c })} aria-label={'Màu ' + c} />
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <div className="label"><IconClock size={14} /> Giờ diễn ra</div>
            <div className="ev-ed-time">
              <input type="time" className="ev-time-input" value={draft.startTime || ''} onChange={(e) => set({ startTime: e.target.value })} />
              <span className="ev-time-sep">→</span>
              <input type="time" className="ev-time-input" value={draft.endTime || ''} onChange={(e) => set({ endTime: e.target.value })} />
              {(draft.startTime || draft.endTime) && <button className="ev-time-clear" onClick={() => set({ startTime: '', endTime: '' })} title="Xoá giờ"><IconClose size={13} /></button>}
            </div>
            <div className="ev-ed-hint">Để trống = cả ngày. Có giờ → link Google Calendar tự set đúng khung giờ (kết thúc trống thì mặc định +1 giờ).</div>
          </div>

          <div className="field">
            <div className="label">Icon</div>
            <div className="ev-ed-icons">
              {EVENT_ICONS.map((ic) => (
                <button key={ic} className={'event-icon-opt' + (ic === draft.icon ? ' on' : '')} onClick={() => set({ icon: ic })}>{ic}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <div className="label"><IconCalendar size={14} /> Mốc thời gian</div>
            <div className="ev-ms-list">
              {msRows.map((ms) => (
                <div className="ev-ms-row" key={ms.id}>
                  <div className="due-picker">
                    <button className="due-btn set ev-ms-datebtn" onClick={() => setMsCalOpen((o) => o === ms.id ? null : ms.id)}>
                      <IconCalendar size={13} /> {ms.date ? fmtFullDate(ms.date) : 'Chọn ngày'}
                    </button>
                    {msCalOpen === ms.id && (
                      <Calendar value={ms.date} onPick={(iso) => { updateMilestone(ms.id, { date: iso }); setMsCalOpen(null); }}
                                onClear={() => setMsCalOpen(null)} />
                    )}
                  </div>
                  <input className="ev-ms-label" value={ms.label} placeholder={draft.name || 'Tên mốc'}
                         onChange={(e) => updateMilestone(ms.id, { label: e.target.value })} />
                  {msRows.length > 1 && (
                    <button className="ev-ms-x" onClick={() => removeMilestone(ms.id)} aria-label="Xoá mốc"><IconClose size={12} /></button>
                  )}
                </div>
              ))}
              <button className="btn ghost sm" onClick={addMilestone}><IconPlus size={13} /> Thêm mốc</button>
            </div>
            <div className="field-hint">Project có nhiều đợt (VD: 3 mốc trong tháng) — mỗi mốc hiện riêng, đúng ngày, trên Comm Calendar.</div>
          </div>
        </div>
        <div className="modal-foot">
          {!event.isNew ? <button className="btn danger-ghost" onClick={() => onDelete(draft.id)}><IconTrash size={16} /> Xoá</button> : <span />}
          <div className="foot-right">
            <a className="btn ghost" href={gcalUrl({ title: draft.name || 'Sự kiện', date: draft.date, startTime: draft.startTime, endTime: draft.endTime })}
               target="_blank" rel="noopener noreferrer" title="Thêm vào Google Calendar"><IconCalPlus size={16} /> Google Calendar</a>
            <button className="btn ghost" onClick={onClose}>Huỷ</button>
            <button className="btn primary" disabled={!canSave} onClick={() => canSave && onSave(draft)}>{event.isNew ? 'Tạo sự kiện' : 'Lưu'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { daysUntil, countdownLabel, fmtFullDate, dBadge, tagMilestones, EventBlock, EventsSection, TagManager, EventEditor, EVENT_ICONS, DEFAULT_EVENT_ICON });
