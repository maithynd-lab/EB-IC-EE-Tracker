// comm.jsx — Comm Calendar (month grid + list), PostEditor, ChannelPicker. Exports to window.

const CDOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// ── ChannelPicker (multi-select + inline create) ──────────────────────────
function ChannelPicker({ channels, value, onChange, onCreate }) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [newColor, setNewColor] = React.useState(TAG_PALETTE[7]);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const selected = value.map((id) => channels.find((c) => c.id === id)).filter(Boolean);
  const ql = q.trim().toLowerCase();
  const matches = channels.filter((c) => !value.includes(c.id) && c.name.toLowerCase().includes(ql));
  const exact = channels.some((c) => c.name.toLowerCase() === ql);
  const add = (id) => { onChange([...value, id]); setQ(''); };
  const remove = (id) => onChange(value.filter((x) => x !== id));
  const create = (color) => { const name = q.trim(); if (!name) return; const c = onCreate(name, color); onChange([...value, c.id]); setQ(''); };
  return (
    <div className="tagpicker" ref={ref}>
      <div className="tagpicker-field" onClick={() => setOpen(true)}>
        {selected.map((c) => (
          <span key={c.id} className="tag tag-rm" style={tagStyle(c.color)}>
            {c.name}
            <button onClick={(e) => { e.stopPropagation(); remove(c.id); }} aria-label="Bỏ channel"><IconClose size={11} sw={2.4} /></button>
          </span>
        ))}
        <input className="tagpicker-input" value={q} placeholder={selected.length ? '' : 'Chọn hoặc tạo channel…'}
               onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
               onKeyDown={(e) => { if (e.key === 'Enter' && q.trim() && !exact) { e.preventDefault(); create(newColor); } if (e.key === 'Backspace' && !q && selected.length) remove(selected[selected.length - 1].id); }} />
      </div>
      {open && (
        <div className="tagpicker-menu">
          {matches.length > 0 && (
            <div className="tagpicker-list">
              {matches.map((c) => (
                <button key={c.id} className="tagpicker-opt" onClick={() => add(c.id)}>
                  <span className="tag" style={tagStyle(c.color)}>{c.name}</span>
                </button>
              ))}
            </div>
          )}
          {q.trim() && !exact && (
            <div className="tagpicker-create">
              <div className="tagpicker-create-row"><span className="muted-lbl">Tạo</span><span className="tag" style={tagStyle(newColor)}>{q.trim()}</span></div>
              <div className="swatches">
                {TAG_PALETTE.map((c) => (
                  <button key={c} className={'swatch' + (c === newColor ? ' on' : '')} style={{ background: c }} onClick={() => { setNewColor(c); create(c); }} />
                ))}
              </div>
            </div>
          )}
          {!matches.length && !q.trim() && <div className="tagpicker-empty">Gõ để tạo channel mới hoặc chọn có sẵn</div>}
        </div>
      )}
    </div>
  );
}

// ── PostEditor modal ───────────────────────────────────────────────────────
function PostEditor({ post, members, channels, events, onCreateChannel, onSave, onDelete, onClose }) {
  const [draft, setDraft] = React.useState(post);
  const [calOpen, setCalOpen] = React.useState(false);
  React.useEffect(() => { setDraft(post); setCalOpen(false); }, [post]);
  if (!post || !draft) return null;
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const canSave = draft.title.trim().length > 0;
  return (
    <div className="scrim" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ '--accent': '#3B82F6' }}>
        <div className="modal-head">
          <span className="modal-owner"><IconCalendar size={16} /> {post.isNew ? 'Bài đăng mới' : 'Sửa bài đăng'}</span>
          <button className="iconbtn" onClick={onClose} aria-label="Đóng"><IconClose /></button>
        </div>
        <div className="modal-body">
          <input className="title-input" autoFocus value={draft.title} placeholder="Tên bài đăng…"
                 onChange={(e) => set({ title: e.target.value })} />

          <div className="field-row">
            <div className="field">
              <div className="label"><IconCalendar size={14} /> Ngày đăng</div>
              <div className="due-picker">
                <button className="due-btn set" onClick={() => setCalOpen((o) => !o)}><IconCalendar size={15} /> {relDue(draft.date)}</button>
                {calOpen && <Calendar value={draft.date} onPick={(iso) => { set({ date: iso }); setCalOpen(false); }} onClear={() => setCalOpen(false)} />}
              </div>
            </div>
            <div className="field">
              <div className="label"><IconUsers size={14} /> PIC</div>
              <div className="owner-pick">
                {members.map((m) => (
                  <button key={m.id} className={'avatar pick-lg' + (draft.pic === m.id ? ' on' : '')}
                          style={{ background: draft.pic === m.id ? m.color : 'transparent', color: draft.pic === m.id ? '#fff' : m.color, boxShadow: `inset 0 0 0 2px ${m.color}` }}
                          onClick={() => set({ pic: m.id })} title={m.name}>{m.name.charAt(0)}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <div className="label"><IconTag size={14} /> Channel</div>
            <ChannelPicker channels={channels} value={draft.channelIds} onChange={(v) => set({ channelIds: v })} onCreate={onCreateChannel} />
          </div>

          <div className="field-row">
            <div className="field">
              <div className="label"><IconLink size={14} /> Link bài / nội dung</div>
              <input className="textarea" style={{ resize: 'none' }} value={draft.url} placeholder="https://…" onChange={(e) => set({ url: e.target.value })} />
            </div>
            <div className="field">
              <div className="label"><IconCalendar size={14} /> Gắn event</div>
              <select className="post-select" value={draft.eventId || ''} onChange={(e) => set({ eventId: e.target.value || null })}>
                <option value="">— Không —</option>
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <div className="label"><IconNote size={14} /> Ghi chú</div>
            <textarea className="textarea" rows={2} value={draft.note} placeholder="Ghi chú ngắn…" onChange={(e) => set({ note: e.target.value })} />
          </div>

          <label className="posted-row">
            <span className={'card-check' + (draft.posted ? ' on' : '')} style={{ '--accent': '#22C55E', background: draft.posted ? '#22C55E' : '#fff', borderColor: draft.posted ? '#22C55E' : undefined }}>
              {draft.posted && <IconCheck size={14} sw={2.6} />}
            </span>
            <input type="checkbox" checked={draft.posted} onChange={(e) => set({ posted: e.target.checked })} hidden />
            <span>Đã đăng</span>
          </label>
        </div>
        <div className="modal-foot">
          {!post.isNew ? <button className="btn danger-ghost" onClick={() => onDelete(draft.id)}><IconTrash size={16} /> Xoá</button> : <span />}
          <div className="foot-right">
            <button className="btn ghost" onClick={onClose}>Huỷ</button>
            <button className="btn primary" disabled={!canSave} onClick={() => canSave && onSave(draft)}>{post.isNew ? 'Thêm bài' : 'Lưu'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PostChip (in a day cell) ───────────────────────────────────────────────
function PostChip({ post, channels, events, onOpen, onToggle }) {
  const chs = post.channelIds.map((id) => channels.find((c) => c.id === id)).filter(Boolean);
  const ev = post.eventId ? events.find((e) => e.id === post.eventId) : null;
  return (
    <div className={'cpost' + (post.posted ? ' posted' : '')} onClick={() => onOpen(post)}
         style={ev ? { borderLeftColor: ev.color, borderLeftWidth: 3 } : undefined}>
      <button className="cpost-check" onClick={(e) => { e.stopPropagation(); onToggle(post.id, e); }} aria-label="Đã đăng">
        {post.posted && <IconCheck size={10} sw={3} />}
      </button>
      {chs.length > 0 && <span className="cpost-dots">{chs.map((c) => <i key={c.id} style={{ background: c.color }} />)}</span>}
      <span className="cpost-title">{post.title}</span>
    </div>
  );
}

// ── CommList (list view) ───────────────────────────────────────────────────
function CommList({ posts, channels, members, events, onOpen, onToggle }) {
  const sorted = [...posts].sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  if (sorted.length === 0) return <div className="events-empty"><span className="events-empty-emoji">📭</span> Chưa có bài đăng nào.</div>;
  const groups = {};
  sorted.forEach((p) => { (groups[p.date] = groups[p.date] || []).push(p); });
  return (
    <div className="comm-list">
      {Object.keys(groups).sort().map((date) => (
        <div key={date} className="comm-list-group">
          <div className="comm-list-date">{fmtFullDate(date)}</div>
          {groups[date].sort((a, b) => (a.posted ? 1 : 0) - (b.posted ? 1 : 0)).map((p) => {
            const chs = p.channelIds.map((id) => channels.find((c) => c.id === id)).filter(Boolean);
            const pic = members.find((m) => m.id === p.pic);
            const ev = p.eventId ? events.find((e) => e.id === p.eventId) : null;
            return (
              <div key={p.id} className={'comm-list-row' + (p.posted ? ' posted' : '')} onClick={() => onOpen(p)}>
                <button className="cpost-check" onClick={(e) => { e.stopPropagation(); onToggle(p.id, e); }} aria-label="Đã đăng">{p.posted && <IconCheck size={10} sw={3} />}</button>
                <span className="comm-list-title">{p.title}</span>
                <div className="comm-list-chs">{chs.map((c) => <span key={c.id} className="tag mini" style={tagStyle(c.color)}>{c.name}</span>)}</div>
                {ev && <span className="tag mini" style={tagStyle(ev.color)}>{ev.name}</span>}
                {pic && <span className="avatar xs" style={{ background: pic.color }} title={pic.name}>{pic.name.charAt(0)}</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── CommCalendar ───────────────────────────────────────────────────────────
function CommCalendar({ posts, channels, members, events, refMonth, onStep, onToday, view, setView, note, onNote, onOpenPost, onNewPost, onTogglePosted }) {
  const d = parseISO(refMonth), y = d.getFullYear(), m = d.getMonth();
  const first = new Date(y, m, 1), startDow = (first.getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let dd = 1; dd <= dim; dd++) cells.push(dd);
  while (cells.length % 7) cells.push(null);
  const byDate = {};
  posts.forEach((p) => { (byDate[p.date] = byDate[p.date] || []).push(p); });
  const today = todayISO();

  return (
    <section className="comm">
      <div className="comm-head">
        <div>
          <h2>Comm Calendar</h2>
          <p>Lịch bài đăng theo tháng · tick khi đã đăng</p>
        </div>
        <div className="comm-toolbar">
          <div className="period-nav">
            <button className="iconbtn sm" onClick={() => onStep(-1)} aria-label="Tháng trước"><IconChevL size={16} /></button>
            <span className="period-label sm">{monthLabel(refMonth)}</span>
            <button className="iconbtn sm" onClick={() => onStep(1)} aria-label="Tháng sau"><IconChevR size={16} /></button>
            <button className="btn ghost sm" onClick={onToday}>Hôm nay</button>
          </div>
          <div className="seg compact comm-viewseg">
            <button className={'seg-btn' + (view === 'grid' ? ' on' : '')} onClick={() => setView('grid')}><IconGrid size={14} /></button>
            <button className={'seg-btn' + (view === 'list' ? ' on' : '')} onClick={() => setView('list')}><IconList size={14} /></button>
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <CommList posts={posts} channels={channels} members={members} events={events} onOpen={onOpenPost} onToggle={onTogglePosted} />
      ) : (
        <div className="comm-body">
        <div className="comm-grid">
          <div className="comm-dow-row">{CDOW.map((w) => <span key={w} className="comm-dow">{w}</span>)}</div>
          <div className="comm-cells">
            {cells.map((dd, i) => {
              if (dd == null) return <div key={i} className="comm-cell muted" />;
              const iso = toISO(new Date(y, m, dd));
              const list = (byDate[iso] || []).slice().sort((a, b) => (a.posted ? 1 : 0) - (b.posted ? 1 : 0));
              return (
                <div key={i} className={'comm-cell' + (iso === today ? ' today' : '')} onDoubleClick={() => onNewPost(iso)}>
                  <div className="comm-cell-h">
                    <span className="comm-day">{dd}</span>
                    <button className="comm-add" onClick={() => onNewPost(iso)} aria-label="Thêm bài"><IconPlus size={13} /></button>
                  </div>
                  <div className="comm-cell-posts">
                    {list.map((p) => <PostChip key={p.id} post={p} channels={channels} events={events} onOpen={onOpenPost} onToggle={onTogglePosted} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <aside className="comm-notes">
          <div className="comm-notes-h"><IconNote size={14} /> Ghi chú bài đăng</div>
          <textarea className="comm-notes-ta" value={note} placeholder="Note nhanh về bài đăng / lịch tháng này…" onChange={(e) => onNote(e.target.value)} />
        </aside>
        </div>
      )}
    </section>
  );
}

Object.assign(window, { ChannelPicker, PostEditor, PostChip, CommList, CommCalendar });
