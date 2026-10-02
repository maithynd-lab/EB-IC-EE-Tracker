// editor.jsx — shared constants, TagPicker, TaskEditor modal. Exports to window.

// Curated tag palette — wide spectrum, multiple shades per hue (single source for swatches)
const TAG_PALETTE = [
  // neutrals
  '#94A3B8', '#6B7280', '#57534E', '#44403C',
  // red / rose
  '#FB7185', '#F43F5E', '#EF4444', '#B91C1C',
  // orange / amber
  '#FDBA74', '#FB923C', '#F97316', '#EA580C',
  '#FBBF24', '#F59E0B', '#D97706', '#A16207',
  // yellow / lime
  '#FACC15', '#EAB308', '#A3E635', '#84CC16',
  // green
  '#4ADE80', '#22C55E', '#16A34A', '#15803D',
  // teal / emerald
  '#34D399', '#10B981', '#2DD4BF', '#14B8A6',
  // cyan / sky
  '#22D3EE', '#06B6D4', '#38BDF8', '#0EA5E9',
  // blue
  '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8',
  // indigo / violet
  '#818CF8', '#6366F1', '#A78BFA', '#8B5CF6',
  // purple / fuchsia
  '#C084FC', '#A855F7', '#E879F9', '#D946EF',
  // pink / brown
  '#F472B6', '#EC4899', '#A8A29E', '#78716C',
];
function tagStyle(color) {
  return {
    background: `color-mix(in srgb, ${color} 15%, white)`,
    color: `color-mix(in srgb, ${color} 65%, #1a1a1a)`,
    border: `0.5px solid color-mix(in srgb, ${color} 30%, white)`,
  };
}

// ── useDraftAutosave ─────────────────────────────────────────────────────
// Dùng chung cho modal sửa task/sự kiện/bài đăng: gõ tới đâu lưu tới đó
// (debounce), bản ghi mới chỉ thật sự tạo khi readyCheck() pass (vd có tên).
function useDraftAutosave(entity, { onCreate, onUpdate, readyCheck, debounceMs }) {
  const [draft, setDraft] = React.useState(entity);
  const [saveState, setSaveState] = React.useState('idle'); // idle|saving|saved|error
  const draftRef = React.useRef(entity);
  const pendingRef = React.useRef({});
  const timerRef = React.useRef(null);
  const createdRef = React.useRef(false);

  const flush = React.useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    const patch = pendingRef.current;
    pendingRef.current = {};
    if (!draftRef.current || draftRef.current.isNew || Object.keys(patch).length === 0) return;
    setSaveState('saving');
    try {
      onUpdate(draftRef.current.id, patch);
      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
    }
  }, [onUpdate]);

  React.useEffect(() => {
    flush(); // chốt thay đổi còn treo của entity trước, rồi mới reset cho entity mới
    setDraft(entity);
    draftRef.current = entity;
    pendingRef.current = {};
    createdRef.current = false;
    setSaveState('idle');
  }, [entity]);

  const set = React.useCallback((patch) => {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraft(next);

    if (next.isNew) {
      if (!createdRef.current && (!readyCheck || readyCheck(next))) {
        createdRef.current = true;
        const { isNew, ...clean } = next;
        onCreate(clean);
        draftRef.current = { ...next, isNew: false };
        setDraft(draftRef.current);
        setSaveState('saved');
      }
      return;
    }
    pendingRef.current = { ...pendingRef.current, ...patch };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, debounceMs || 500);
  }, [flush, onCreate, readyCheck]);

  return { draft, set, flush, saveState };
}

function SaveIndicator({ state }) {
  if (state === 'saving') return <span className="save-ind saving">Đang lưu…</span>;
  if (state === 'saved') return <span className="save-ind saved">Đã lưu <IconCheck size={11} sw={3} /></span>;
  if (state === 'error') return <span className="save-ind error">Lỗi lưu, thử lại</span>;
  return <span className="save-ind" />;
}

// Dropdown chọn giai đoạn pre/during/post cho task hoặc content; "Tự động"
// (value=null) để hệ thống tự suy ra từ ngày so với khoảng ngày sự kiện.
function PhaseField({ value, onChange }) {
  return (
    <div className="field">
      <div className="label"><IconFlag size={14} /> Giai đoạn</div>
      <select className="sel" value={value || 'auto'} onChange={(e) => onChange(e.target.value === 'auto' ? null : e.target.value)}>
        <option value="auto">Tự động (theo ngày)</option>
        {PHASES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
    </div>
  );
}

// Esc để đóng modal — dùng chung cho mọi modal (chỉ gắn khi đang mở).
function useEscClose(active, onClose) {
  React.useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}

const PRIORITIES = [
  { key: 'high', label: 'High', color: '#EF4444' },
  { key: 'medium', label: 'Medium', color: '#F59E0B' },
  { key: 'low', label: 'Low', color: '#22C55E' },
];
const prioConf = (k) => PRIORITIES.find((p) => p.key === k);

// ── TagPicker ────────────────────────────────────────────────────────────
function TagPicker({ allTags, value, onChange, onCreateTag }) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [newColor, setNewColor] = React.useState(TAG_PALETTE[7]);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = value.map((id) => allTags.find((t) => t.id === id)).filter(Boolean);
  const ql = q.trim().toLowerCase();
  const matches = allTags.filter((t) => !value.includes(t.id) && t.name.toLowerCase().includes(ql));
  const exact = allTags.some((t) => t.name.toLowerCase() === ql);

  const add = (id) => { onChange([...value, id]); setQ(''); setOpen(false); };
  const remove = (id) => onChange(value.filter((x) => x !== id));
  const create = (color) => {
    const name = q.trim();
    if (!name) return;
    const t = onCreateTag(name, color);
    onChange([...value, t.id]);
    setQ('');
    setOpen(false);
  };

  return (
    <div className="tagpicker" ref={wrapRef}>
      <div className="tagpicker-field" onClick={() => setOpen(true)}>
        {selected.map((t) => (
          <span key={t.id} className="tag tag-rm" style={tagStyle(t.color)}>
            {t.name}
            <button onClick={(e) => { e.stopPropagation(); remove(t.id); }} aria-label="Bỏ tag"><IconClose size={11} sw={2.4} /></button>
          </span>
        ))}
        <input
          className="tagpicker-input"
          value={q}
          placeholder={selected.length ? '' : 'Chọn hoặc tạo tag…'}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && q.trim() && !exact) { e.preventDefault(); create(newColor); }
            if (e.key === 'Backspace' && !q && selected.length) remove(selected[selected.length - 1].id);
          }}
        />
      </div>
      {open && (
        <div className="tagpicker-menu">
          {matches.length > 0 && (
            <div className="tagpicker-list">
              {matches.map((t) => (
                <button key={t.id} className="tagpicker-opt" onClick={() => add(t.id)}>
                  <span className="tag" style={tagStyle(t.color)}>{t.name}</span>
                </button>
              ))}
            </div>
          )}
          {q.trim() && !exact && (
            <div className="tagpicker-create">
              <div className="tagpicker-create-row">
                <span className="muted-lbl">Tạo</span>
                <span className="tag" style={tagStyle(newColor)}>{q.trim()}</span>
              </div>
              <div className="swatches">
                {TAG_PALETTE.map((c) => (
                  <button key={c} className={'swatch' + (c === newColor ? ' on' : '')}
                          style={{ background: c }} onClick={() => { setNewColor(c); create(c); }}
                          aria-label={'Màu ' + c} />
                ))}
              </div>
            </div>
          )}
          {!matches.length && !q.trim() && (
            <div className="tagpicker-empty">Gõ để tạo tag mới hoặc chọn tag có sẵn</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── TaskEditor modal ───────────────────────────────────────────────────────
// props: task (draft or null=closed), member, allTags, onCreateTag, onCreate, onUpdate, onDelete, onClose
// Autosave: mỗi thay đổi ghi lên Firebase (debounce ~500ms, flush khi đóng).
// Task mới chỉ thật sự tạo khi đã gõ tên, sau đó chuyển qua autosave như task cũ.
function TaskEditor({ task, member, members, allTags, onCreateTag, onCreate, onUpdate, onDelete, onClose }) {
  const { draft, set, flush, saveState } = useDraftAutosave(task, {
    onCreate, onUpdate, readyCheck: (d) => d.title.trim().length > 0, debounceMs: 500,
  });
  const [calOpen, setCalOpen] = React.useState(false);
  React.useEffect(() => { setCalOpen(false); }, [task]);
  const close = () => { flush(); onClose(); };
  useEscClose(!!task, close);
  if (!task || !draft) return null;
  const cur = (members && members.find((m) => m.id === draft.owner)) || member;

  return (
    <div className="scrim" onMouseDown={close}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ '--accent': cur.color }}>
        <div className="modal-head">
          <span className="modal-owner">
            <span className="avatar sm" style={{ background: cur.color }}>{cur.icon || cur.name.charAt(0)}</span>
            {task.isNew ? 'Task mới' : 'Sửa task'} · {cur.name}
          </span>
          <SaveIndicator state={saveState} />
          <button className="iconbtn" onClick={close} aria-label="Đóng"><IconClose /></button>
        </div>

        <div className="modal-body">
          <input
            className="title-input"
            autoFocus
            value={draft.title}
            placeholder="Tên task…"
            onChange={(e) => set({ title: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) close(); }}
          />

          <div className="field">
            <div className="label"><IconTag size={14} /> Tag</div>
            <TagPicker allTags={allTags} value={draft.tagIds} onChange={(v) => set({ tagIds: v })} onCreateTag={onCreateTag} />
          </div>

          <div className="field-row">
            <div className="field">
              <div className="label"><IconFlag size={14} /> Priority</div>
              <div className="seg">
                <button className={'seg-btn' + (!draft.priority ? ' on' : '')} onClick={() => set({ priority: null })}>None</button>
                {PRIORITIES.map((p) => (
                  <button key={p.key}
                          className={'seg-btn' + (draft.priority === p.key ? ' on' : '')}
                          style={draft.priority === p.key ? { '--seg': p.color } : undefined}
                          onClick={() => set({ priority: p.key })}>{p.label}</button>
                ))}
              </div>
            </div>
          </div>

          {members && members.length > 1 && (
            <div className="field">
              <div className="label"><IconUsers size={14} /> PIC</div>
              <div className="owner-pick">
                {members.map((m) => (
                  <button key={m.id} className={'avatar pick-lg' + (draft.owner === m.id ? ' on' : '')}
                          style={{ background: draft.owner === m.id ? m.color : 'transparent', color: draft.owner === m.id ? '#fff' : m.color, boxShadow: `inset 0 0 0 2px ${m.color}` }}
                          onClick={() => set({ owner: m.id })} title={m.name}>{m.icon || m.name.charAt(0)}</button>
                ))}
              </div>
            </div>
          )}

          <div className="field">
            <div className="label"><IconCalendar size={14} /> Deadline</div>
            <div className="due-picker">
              <button className={'due-btn' + (draft.deadline ? ' set' : '') + (isOverdue(draft.deadline) ? ' over' : '')}
                      onClick={() => setCalOpen((o) => !o)}>
                <IconCalendar size={15} />
                {draft.deadline ? relDue(draft.deadline) : 'Chọn ngày'}
              </button>
              {calOpen && (
                <Calendar value={draft.deadline} onPick={(iso) => { set({ deadline: iso }); setCalOpen(false); }}
                          onClear={() => { set({ deadline: null }); setCalOpen(false); }} />
              )}
            </div>
          </div>

          <div className="field">
            <div className="label"><IconNote size={14} /> Ghi chú</div>
            <textarea className="textarea" rows={3} value={draft.note}
                      placeholder="Mô tả ngắn (tuỳ chọn)…"
                      onChange={(e) => set({ note: e.target.value })} />
          </div>

          {draft.tagIds.length > 0 && <PhaseField value={draft.phase} onChange={(v) => set({ phase: v })} />}
        </div>

        <div className="modal-foot">
          {!task.isNew
            ? <button className="btn danger-ghost" onClick={() => { if (window.confirm('Xoá task này?')) onDelete(draft.id); }}><IconTrash size={16} /> Xoá</button>
            : <span />}
          <div className="foot-right">
            <button className="btn primary" onClick={close}>{task.isNew ? 'Xong' : 'Đóng'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TAG_PALETTE, tagStyle, PRIORITIES, prioConf, TagPicker, TaskEditor, useDraftAutosave, SaveIndicator, PhaseField, useEscClose });
