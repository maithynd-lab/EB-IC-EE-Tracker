// editor.jsx — shared constants, TagPicker, TaskEditor modal. Exports to window.

// Notion-ish curated tag palette (single source for swatches)
const TAG_PALETTE = [
  '#6B7280', '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#10B981', '#14B8A6', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#A16207',
];
function tagStyle(color) {
  return {
    background: `color-mix(in srgb, ${color} 15%, white)`,
    color: `color-mix(in srgb, ${color} 65%, #1a1a1a)`,
    border: `0.5px solid color-mix(in srgb, ${color} 30%, white)`,
  };
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

  const add = (id) => { onChange([...value, id]); setQ(''); };
  const remove = (id) => onChange(value.filter((x) => x !== id));
  const create = (color) => {
    const name = q.trim();
    if (!name) return;
    const t = onCreateTag(name, color);
    onChange([...value, t.id]);
    setQ('');
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
// props: task (draft or null=closed), member, allTags, onCreateTag, onSave, onDelete, onClose
function TaskEditor({ task, member, allTags, onCreateTag, onSave, onDelete, onClose }) {
  const [draft, setDraft] = React.useState(task);
  const [calOpen, setCalOpen] = React.useState(false);
  React.useEffect(() => { setDraft(task); setCalOpen(false); }, [task]);
  if (!task || !draft) return null;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const canSave = draft.title.trim().length > 0;
  const save = () => { if (canSave) onSave(draft); };

  return (
    <div className="scrim" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ '--accent': member.color }}>
        <div className="modal-head">
          <span className="modal-owner">
            <span className="avatar sm" style={{ background: member.color }}>{member.name.charAt(0)}</span>
            {task.isNew ? 'Task mới' : 'Sửa task'} · {member.name}
          </span>
          <button className="iconbtn" onClick={onClose} aria-label="Đóng"><IconClose /></button>
        </div>

        <div className="modal-body">
          <input
            className="title-input"
            autoFocus
            value={draft.title}
            placeholder="Tên task…"
            onChange={(e) => set({ title: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); }}
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
        </div>

        <div className="modal-foot">
          {!task.isNew
            ? <button className="btn danger-ghost" onClick={() => onDelete(draft.id)}><IconTrash size={16} /> Xoá</button>
            : <span />}
          <div className="foot-right">
            <button className="btn ghost" onClick={onClose}>Huỷ</button>
            <button className="btn primary" disabled={!canSave} onClick={save}>{task.isNew ? 'Thêm task' : 'Lưu'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TAG_PALETTE, tagStyle, PRIORITIES, prioConf, TagPicker, TaskEditor });
