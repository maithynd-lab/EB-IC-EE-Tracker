// events.jsx — Event blocks, EventsSection, TagManager. tag-with-date = event. Exports to window.

const EV_MONTHS = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];
const EV_DOW = ['CN','T2','T3','T4','T5','T6','T7'];

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
                  onClick={() => setOwner(m.id)} title={m.name}>{m.name.charAt(0)}</button>
        ))}
      </div>
      <input className="phase-add-input" value={text} placeholder="+ Thêm việc…"
             onChange={(e) => setText(e.target.value)}
             onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) { onAdd(owner, text.trim()); setText(''); } }} />
    </div>
  );
}

const PHASES = [['pre', 'Pre-Event'], ['during', 'During-Event'], ['post', 'Post-Event']];

function EventBlock({ event, tasks, members, onToggle, onOpen, onAddPrep, onEditEvent, onUpdateEvent, onSetPhase, past }) {
  const prep = tasks.filter((t) => t.tagIds.includes(event.id));
  const done = prep.filter((t) => t.done);
  const total = prep.length;
  const pct = total ? Math.round((done.length / total) * 100) : 0;
  const owners = members.filter((m) => prep.some((t) => t.owner === m.id));
  const defOwner = (owners[0] || members[0]).id;
  const [dragId, setDragId] = React.useState(null);
  const [dropPhase, setDropPhase] = React.useState(null);

  return (
    <section className={'event-block' + (past ? ' past' : '')} style={{ '--accent': event.color }}>
      <header className="event-head">
        <div className="event-head-l">
          <span className="event-dot" />
          <div className="event-titles">
            <div className="event-name">{event.name}</div>
            <div className="event-meta"><IconCalendar size={13} /> {fmtFullDate(event.date)} · {countdownLabel(event.date)}</div>
          </div>
        </div>
        <div className="event-head-r">
          {owners.length > 0 && (
            <div className="event-owners" title={'Phụ trách: ' + owners.map((o) => o.name).join(', ')}>
              {owners.map((o) => <span key={o.id} className="avatar xs" style={{ background: o.color }}>{o.name.charAt(0)}</span>)}
            </div>
          )}
          <span className={'event-dbadge' + (daysUntil(event.date) <= 0 ? ' hot' : '')}>{dBadge(event.date)}</span>
          <button className="iconbtn sm" onClick={() => onEditEvent(event)} aria-label="Sửa sự kiện"><IconGear size={16} /></button>
        </div>
      </header>

      <div className="event-dash">
        <div className="event-cover">
          <image-slot id={'evcover-' + event.id} style={{ width: '100%', height: '100%', display: 'block' }}
                      shape="rounded" radius="14" placeholder="Kéo ảnh bìa 16:9 vào đây"></image-slot>
        </div>
        <div className="event-info">
          <textarea className="event-desc" value={event.desc || ''} rows={2}
                    placeholder="Mô tả / mục tiêu của sự kiện — để cả team cùng nắm…"
                    onChange={(e) => onUpdateEvent(event.id, { desc: e.target.value })} />
          <div className="event-info-grid">
            <InfoField icon={<IconPin size={14} />} value={event.venue} placeholder="Địa điểm" onChange={(v) => onUpdateEvent(event.id, { venue: v })} />
            <InfoField icon={<IconClock size={14} />} value={event.time} placeholder="Giờ bắt đầu" onChange={(v) => onUpdateEvent(event.id, { time: v })} />
            <InfoField icon={<IconUsers size={14} />} value={event.attendees} placeholder="Số người dự kiến" onChange={(v) => onUpdateEvent(event.id, { attendees: v })} />
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
                      <span className="avatar xs" style={{ background: owner.color }} title={owner.name}>{owner.name.charAt(0)}</span>
                      <button className="ev-title" onClick={() => onOpen(t)}>{t.title}</button>
                      {t.deadline && <span className={'due' + (isOverdue(t.deadline) && !t.done ? ' over' : '')}><IconCalendar size={12} /> {relDue(t.deadline)}</span>}
                    </div>
                  );
                })}
              </div>
              <PhaseAdd members={members} defOwner={defOwner} onAdd={(ownerId, title) => onAddPrep(event.id, ownerId, title, ph)} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── EventsSection ────────────────────────────────────────────────────────
function EventsSection({ events, tasks, members, onToggle, onOpen, onAddPrep, onCreateEvent, onEditEvent, onUpdateEvent, onSetPhase }) {
  const [showPast, setShowPast] = React.useState(false);
  const upcoming = events.filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date < b.date ? -1 : 1);
  const pastEvents = events.filter((e) => daysUntil(e.date) < 0).sort((a, b) => a.date > b.date ? -1 : 1);

  return (
    <section className="events">
      <div className="events-head">
        <div>
          <h2>Sự kiện</h2>
          <p>Đếm ngược tới ngày diễn ra · việc cần chuẩn bị nối với board task ở trên</p>
        </div>
        <button className="btn primary sm" onClick={onCreateEvent}><IconPlus size={16} /> Tạo sự kiện</button>
      </div>

      {upcoming.length === 0 && (
        <div className="events-empty">
          <span className="events-empty-emoji">📅</span>
          Chưa có sự kiện sắp tới. Bấm <b>Tạo sự kiện</b> để đặt ngày & gom việc cần chuẩn bị.
        </div>
      )}
      <div className="events-list">
        {upcoming.map((e) => (
          <EventBlock key={e.id} event={e} tasks={tasks} members={members}
                      onToggle={onToggle} onOpen={onOpen} onAddPrep={onAddPrep} onEditEvent={onEditEvent}
                      onUpdateEvent={onUpdateEvent} onSetPhase={onSetPhase} />
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
                <EventBlock key={e.id} event={e} tasks={tasks} members={members} past
                            onToggle={onToggle} onOpen={onOpen} onAddPrep={onAddPrep} onEditEvent={onEditEvent}
                            onUpdateEvent={onUpdateEvent} onSetPhase={onSetPhase} />
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
                     onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
              <button className="btn primary sm" onClick={add} disabled={!name.trim()}>Thêm</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { daysUntil, countdownLabel, fmtFullDate, dBadge, EventBlock, EventsSection, TagManager });
