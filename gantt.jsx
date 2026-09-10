// gantt.jsx — Dashboard "Projects": card project đang làm, Gantt theo tháng, note theo project.
// Project = tag/sự kiện ở tab chính; task = task ở tab chính. Thêm mới từ đây ghi thẳng vào dữ liệu chung.

function gDayList(range) {
  const out = [];
  let cur = range.start;
  let guard = 0;
  while (cur <= range.end && guard++ < 400) { out.push(cur); cur = addDaysISO(cur, 1); }
  return out;
}
const G_WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Khoảng thời gian của 1 task: [start, deadline]. Thiếu 1 đầu -> dấu mốc.
function gTaskSpan(t) {
  const a = t.start || null;
  const b = t.deadline || null;
  if (a && b) return a <= b ? { from: a, to: b, kind: 'bar' } : { from: b, to: a, kind: 'bar' };
  if (b) return { from: b, to: b, kind: 'dot' };
  if (a) return { from: a, to: a, kind: 'dot' };
  return null;
}

// Chuyển span sang % trên trục ngày; null nếu nằm ngoài tháng.
function gPlace(span, days) {
  const N = days.length;
  const first = days[0], last = days[N - 1];
  if (span.to < first || span.from > last) return null;
  const i0 = Math.max(0, days.indexOf(span.from < first ? first : span.from));
  const i1 = Math.max(i0, days.indexOf(span.to > last ? last : span.to));
  return { left: (i0 / N) * 100, width: ((i1 - i0 + 1) / N) * 100, cut: span.from < first, cutEnd: span.to > last };
}

function GanttBar({ span, days, color, done, overdue, title, onClick }) {
  const p = gPlace(span, days);
  if (!p) return null;
  if (span.kind === 'dot') {
    return (
      <button className={'gt-dot' + (done ? ' done' : '') + (overdue ? ' over' : '')}
              style={{ left: p.left + '%', width: p.width + '%', '--c': color }}
              title={title} onClick={onClick}>
        <span className="gt-diamond" />
      </button>
    );
  }
  return (
    <button className={'gt-bar' + (done ? ' done' : '') + (overdue ? ' over' : '') + (p.cut ? ' cut-s' : '') + (p.cutEnd ? ' cut-e' : '')}
            style={{ left: p.left + '%', width: p.width + '%', '--c': color }}
            title={title} onClick={onClick} />
  );
}

// ── card 1 project đang làm ────────────────────────────────────────────────
function ProjectCard({ p, members, onEditProject, onNewTask, onOpen }) {
  const today = todayISO();
  const owners = members.filter((m) => p.all.some((t) => t.owner === m.id));
  const overdue = p.all.filter((t) => !t.done && t.deadline && t.deadline < today).length;
  const next = p.all.filter((t) => !t.done && t.deadline).sort((a, b) => a.deadline < b.deadline ? -1 : 1)[0];
  return (
    <div className="pjc" style={{ '--c': p.tag.color }}>
      <div className="pjc-top">
        <span className="pjc-icon">{p.tag.icon || '📁'}</span>
        <button className="pjc-name" onClick={() => onEditProject(p.tag)} title="Sửa project">{p.tag.name}</button>
        <button className="pjc-add" onClick={() => onNewTask(p.tag.id)} title="Thêm task vào project"><IconPlus size={14} /></button>
      </div>
      <div className="pjc-meta">
        {p.tag.date && <span className="pjc-chip"><IconCalendar size={11} /> {relDue(p.tag.date)}</span>}
        {overdue > 0 && <span className="pjc-chip over"><IconClock size={11} /> {overdue} quá hạn</span>}
        {!p.tag.date && !overdue && next && <span className="pjc-chip"><IconFlag size={11} /> tới: {relDue(next.deadline)}</span>}
      </div>
      <div className="pjc-prog">
        <span className="pjc-bar"><i style={{ width: p.pct + '%' }} /></span>
        <b>{p.pct}%</b>
      </div>
      <div className="pjc-foot">
        <span className="pjc-count">{p.doneAll}/{p.all.length} task</span>
        <span className="pjc-avs">
          {owners.map((m) => <i key={m.id} style={{ background: m.color }} title={m.name}>{m.icon || m.name.charAt(0)}</i>)}
        </span>
      </div>
    </div>
  );
}

// ── Note (tự chọn project) ────────────────────────────────────────────────
function ProjectNotes({ projects, notes, setNotes }) {
  const [adding, setAdding] = React.useState(false);
  const [pick, setPick] = React.useState('');
  const [text, setText] = React.useState('');
  const inputRef = React.useRef(null);

  const open = () => {
    setPick((p) => p || (projects[0] ? projects[0].tag.id : ''));
    setAdding(true);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 20);
  };
  const save = () => {
    const t = text.trim();
    if (!t || !pick) return;
    setNotes((prev) => ({ ...(prev || {}), [pick]: [...(((prev || {})[pick]) || []), { id: Math.random().toString(36).slice(2, 9), text: t, resolved: false }] }));
    setText('');
    setTimeout(() => inputRef.current && inputRef.current.focus(), 20);
  };
  const patch = (id, nid, p) => setNotes((prev) => ({ ...(prev || {}), [id]: (((prev || {})[id]) || []).map((n) => n.id === nid ? { ...n, ...p } : n) }));
  const drop = (id, nid) => setNotes((prev) => ({ ...(prev || {}), [id]: (((prev || {})[id]) || []).filter((n) => n.id !== nid) }));

  const withNotes = projects.filter((p) => (((notes || {})[p.tag.id]) || []).length > 0);
  const totalOpen = withNotes.reduce((n, p) => n + ((notes[p.tag.id] || []).filter((x) => !x.resolved).length), 0);

  return (
    <div className="gt-sec">
      <div className="gt-sec-head">
        <h3>Note</h3>
        {totalOpen > 0 && <span className="gt-sec-n">{totalOpen} note đang mở</span>}
        <div className="gt-sec-acts">
          <button className="btn ghost sm" onClick={() => adding ? setAdding(false) : open()}>
            <IconPlus size={14} /> Thêm note
          </button>
        </div>
      </div>

      <div className="pn-wrap">
        {adding && (
          <div className="pn-form">
            <select className="pn-sel" value={pick} onChange={(e) => setPick(e.target.value)}>
              {projects.map((p) => (
                <option key={p.tag.id} value={p.tag.id}>{p.tag.name}</option>
              ))}
            </select>
            <input ref={inputRef} className="pn-input" value={text} placeholder="Ghi note cho project này…"
                   onChange={(e) => setText(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setAdding(false); }} />
            <button className="btn primary sm" disabled={!text.trim() || !pick} onClick={save}>Lưu</button>
            <button className="btn ghost sm" onClick={() => setAdding(false)}>Xong</button>
          </div>
        )}

        {withNotes.length === 0
          ? <div className="gt-empty sm">Chưa có note nào. Bấm <b>+ Thêm note</b> và chọn project.</div>
          : (
            <div className="pn-grid">
              {withNotes.map((p) => {
                const items = notes[p.tag.id] || [];
                return (
                  <div className="pn-col" key={p.tag.id} style={{ '--c': p.tag.color }}>
                    <div className="pn-col-head">
                      <span className="pn-dot" />
                      <span className="pn-title">{p.tag.icon ? p.tag.icon + ' ' : ''}{p.tag.name}</span>
                      <span className="pn-n">{items.filter((n) => !n.resolved).length}</span>
                    </div>
                    <ul className="pn-list">
                      {items.map((n) => (
                        <li key={n.id} className={'pn-item' + (n.resolved ? ' resolved' : '')}>
                          <span className="pn-text" onClick={() => patch(p.tag.id, n.id, { resolved: !n.resolved })} title="Đánh dấu đã xử lý">{n.text}</span>
                          <button className="pn-x" onClick={() => drop(p.tag.id, n.id)} aria-label="Xoá"><IconClose size={12} /></button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}

// ── dashboard ─────────────────────────────────────────────────────────────
function ProjectGantt({ range, tasks, tags, members, onOpen, onNewProject, onNewTask, onEditProject, notes, setNotes, monthLabel, onStepMonth, onToday }) {
  const days = React.useMemo(() => gDayList(range), [range.start, range.end]);
  const N = days.length;
  const today = todayISO();
  const memberOf = (id) => members.find((m) => m.id === id) || members[0];
  const [collapsed, setCollapsed] = React.useState({});
  const toggleRow = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  // Mỗi tag = 1 project. `all` = toàn bộ task của project; `tasks` cũng vậy — mọi task của
  // project đều liệt kê mỗi tháng (task quá hạn / chưa có deadline / đã xong đều không bị ẩn),
  // chỉ có vị trí trên trục ngày là phụ thuộc deadline có rơi vào tháng đang xem hay không.
  const byTag = React.useMemo(() => tags.map((tg) => {
    const all = tasks.filter((t) => (t.tagIds || []).includes(tg.id));
    const shown = all;
    const marks = [];
    shown.forEach((t) => {
      const s = gTaskSpan(t);
      if (s && !(s.to < range.start || s.from > range.end)) marks.push(s.from, s.to);
    });
    const evFrom = tg.date, evTo = tg.endDate || tg.date;
    if (evFrom && !(evTo < range.start || evFrom > range.end)) marks.push(evFrom, evTo);
    const span = marks.length ? { from: marks.reduce((a, b) => a < b ? a : b), to: marks.reduce((a, b) => a > b ? a : b), kind: 'bar' } : null;
    const doneN = shown.filter((t) => t.done).length;
    const doneAll = all.filter((t) => t.done).length;
    return {
      tag: tg, all, tasks: shown, span, doneN, doneAll,
      pctMonth: shown.length ? Math.round((doneN / shown.length) * 100) : 0,
      pct: all.length ? Math.round((doneAll / all.length) * 100) : 0,
    };
  }), [tasks, tags, range.start, range.end]);

  // Card: project đang làm — còn task chưa xong, hoặc sự kiện chưa diễn ra.
  const active = byTag
    .filter((p) => (p.all.length > 0 && p.doneAll < p.all.length) || (p.tag.date && p.tag.date >= today))
    .sort((a, b) => {
      const ad = a.tag.date || '9999', bd = b.tag.date || '9999';
      if (ad !== bd) return ad < bd ? -1 : 1;
      return b.all.length - a.all.length;
    });

  // Gantt: project có mặt trong tháng đang xem.
  const projects = byTag
    .filter((p) => p.tasks.length > 0 || (p.tag.date && !((p.tag.endDate || p.tag.date) < range.start || p.tag.date > range.end)))
    .sort((a, b) => {
      const ad = a.tag.date && inRange(a.tag.date, range.start, range.end) ? 0 : 1;
      const bd = b.tag.date && inRange(b.tag.date, range.start, range.end) ? 0 : 1;
      if (ad !== bd) return ad - bd;
      if (a.span && b.span && a.span.from !== b.span.from) return a.span.from < b.span.from ? -1 : 1;
      return b.tasks.length - a.tasks.length;
    });

  const allShown = projects.reduce((n, p) => n + p.tasks.length, 0);
  const allDone = projects.reduce((n, p) => n + p.doneN, 0);
  const doneInMonth = tasks.filter((t) => t.done && t.completedAt && inRange(t.completedAt, range.start, range.end))
    .sort((a, b) => a.completedAt < b.completedAt ? -1 : 1);
  const tagById = (id) => tags.find((x) => x.id === id);

  const gridBg = {
    backgroundImage: `repeating-linear-gradient(to right, var(--line) 0 1px, transparent 1px ${100 / N}%)`,
    backgroundSize: `${100 / N}% 100%`,
  };

  return (
    <div className="gt-page">
      <div className="gt-sec">
        <div className="gt-sec-head">
          <h3>Project đang làm</h3>
          <span className="gt-sec-n">{active.length}</span>
          <div className="gt-sec-acts">
            <button className="btn ghost sm" onClick={() => onNewTask(null)}><IconPlus size={14} /> Task</button>
            <button className="btn primary sm" onClick={onNewProject}><IconPlus size={14} /> Project</button>
          </div>
        </div>
        {active.length === 0
          ? <div className="gt-empty">Chưa có project nào đang chạy. Bấm <b>+ Project</b> để tạo — nó sẽ hiện luôn ở tab Board.</div>
          : (
            <div className="pjc-grid">
              {active.map((p) => (
                <ProjectCard key={p.tag.id} p={p} members={members}
                             onEditProject={onEditProject} onNewTask={onNewTask} onOpen={onOpen} />
              ))}
            </div>
          )}
      </div>

      <div className="gt-sec">
        <div className="gt-sec-head">
          <h3>Gantt theo tháng</h3>
          <div className="gt-mnav">
            <button className="iconbtn sm" onClick={() => onStepMonth && onStepMonth(-1)} aria-label="Tháng trước"><IconChevL size={15} /></button>
            <span className="gt-mlabel">{monthLabel}</span>
            <button className="iconbtn sm" onClick={() => onStepMonth && onStepMonth(1)} aria-label="Tháng sau"><IconChevR size={15} /></button>
            <button className="btn ghost sm" onClick={() => onToday && onToday()}>Tháng này</button>
          </div>
          <span className="gt-sec-n">{projects.length} project · {allShown} task · {allShown ? Math.round((allDone / allShown) * 100) : 0}% xong</span>
          <div className="gt-legend">
            {members.map((m) => (
              <span key={m.id} className="gt-leg"><i style={{ background: m.color }} />{m.name}</span>
            ))}
          </div>
        </div>

        <div className="gt-frame">
          <div className="gt-scroll">
            <div className="gt-inner">
              <div className="gt-row gt-head">
                <div className="gt-name gt-head-name">Project / Task</div>
                <div className="gt-track gt-days">
                  {days.map((iso) => {
                    const dt = parseISO(iso);
                    const wd = dt.getDay();
                    return (
                      <div key={iso} className={'gt-day' + (wd === 0 || wd === 6 ? ' we' : '') + (iso === today ? ' now' : '')}>
                        <span className="gt-day-wd">{G_WD[wd]}</span>
                        <span className="gt-day-n">{dt.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {projects.length === 0 && (
                <div className="gt-empty">Chưa có project nào trong tháng này. Gắn tag cho task và đặt ngày bắt đầu / deadline để chúng hiện lên đây.</div>
              )}

              {projects.map((p) => {
                const isOpen = !collapsed[p.tag.id];
                return (
                  <React.Fragment key={p.tag.id}>
                    <div className="gt-row gt-prow">
                      <div className="gt-name" style={{ background: 'color-mix(in srgb, ' + p.tag.color + ' 14%, #fff)', boxShadow: 'inset 3px 0 0 ' + p.tag.color }}>
                        <button className="gt-caret" onClick={() => toggleRow(p.tag.id)} aria-label="Ẩn/hiện task">
                          <IconChevD size={14} style={{ transform: isOpen ? 'none' : 'rotate(-90deg)' }} />
                        </button>
                        <span className="gt-pdot" style={{ background: p.tag.color }} />
                        <span className="gt-ptitle">{p.tag.icon ? p.tag.icon + ' ' : ''}{p.tag.name}</span>
                        <span className="gt-pcount">{p.doneN}/{p.tasks.length}</span>
                        <button className="gt-tadd" onClick={() => onNewTask(p.tag.id)} title="Thêm task vào project"><IconPlus size={12} /></button>
                        <span className="gt-pct" style={{ '--c': p.tag.color }}>
                          <i style={{ width: p.pctMonth + '%' }} />
                          <b>{p.pctMonth}%</b>
                        </span>
                      </div>
                      <div className="gt-track" style={gridBg}>
                        {p.span && (() => {
                          const pl = gPlace(p.span, days);
                          return pl ? <div className="gt-rollup" style={{ left: pl.left + '%', width: pl.width + '%', '--c': p.tag.color }} /> : null;
                        })()}
                        {(p.tag.date || p.span) && (() => {
                          const cand = [p.tag.date, p.tag.endDate, p.span && p.span.from, p.span && p.span.to].filter(Boolean);
                          if (!cand.length) return null;
                          const from = cand.reduce((a, b) => a < b ? a : b);
                          const to = cand.reduce((a, b) => a > b ? a : b);
                          if (to < range.start || from > range.end) return null;
                          const pl = gPlace({ from, to, kind: 'bar' }, days);
                          return pl ? <div className="gt-pbar" style={{ left: pl.left + '%', width: pl.width + '%', '--c': p.tag.color }}
                                           title={'Project: ' + from + ' → ' + to} /> : null;
                        })()}
                        {(p.tag.endDate || p.tag.date) && inRange(p.tag.endDate || p.tag.date, range.start, range.end) && (() => {
                          const endIso = p.tag.endDate || p.tag.date;
                          const pl = gPlace({ from: endIso, to: endIso, kind: 'dot' }, days);
                          return pl ? <span className="gt-event" style={{ left: pl.left + '%', width: pl.width + '%' }} title={'Ngày kết thúc: ' + endIso}>★</span> : null;
                        })()}
                        {days.indexOf(today) >= 0 && <span className="gt-today" style={{ left: ((days.indexOf(today) + 0.5) / N) * 100 + '%' }} />}
                      </div>
                    </div>

                    {isOpen && p.tasks.map((t) => {
                      const m = memberOf(t.owner);
                      const span = gTaskSpan(t);
                      const overdue = !t.done && t.deadline && t.deadline < today;
                      return (
                        <div className="gt-row gt-trow" key={t.id}>
                          <div className="gt-name gt-tname">
                            <span className="gt-av" style={{ background: m.color }}>{m.icon || m.name.charAt(0)}</span>
                            <button className={'gt-tlink' + (t.done ? ' done' : '')} onClick={() => onOpen && onOpen(t)}>{t.title}</button>
                          </div>
                          <div className="gt-track" style={gridBg}>
                            {(() => {
                              const inView = t.deadline && inRange(t.deadline, range.start, range.end);
                              const pl = inView ? gPlace({ from: t.deadline, to: t.deadline, kind: 'dot' }, days) : null;
                              if (pl) {
                                return (
                                  <button className={'gt-owner' + (t.done ? ' done' : '') + (overdue ? ' over' : '')}
                                          style={{ left: pl.left + '%', '--c': m.color }}
                                          title={`${t.title} · ${m.name} · deadline ${t.deadline}`}
                                          onClick={() => onOpen && onOpen(t)}>
                                    <i style={{ background: m.color }}>{m.icon || m.name.charAt(0)}</i>
                                  </button>
                                );
                              }
                              if (t.done) {
                                return <span className="gt-nodate done">{'Đã xong' + (t.deadline ? ' · ' + t.deadline : '')}</span>;
                              }
                              if (t.deadline) {
                                return <span className={'gt-nodate' + (overdue ? ' over' : '')}>{(overdue ? 'Quá hạn · ' : '') + t.deadline}</span>;
                              }
                              return <span className="gt-nodate">không có deadline</span>;
                            })()}
                            {days.indexOf(today) >= 0 && <span className="gt-today" style={{ left: ((days.indexOf(today) + 0.5) / N) * 100 + '%' }} />}
                          </div>
                        </div>
                      );
                    })}

                    {isOpen && p.tasks.length === 0 && (
                      <div className="gt-row gt-trow">
                        <div className="gt-name gt-tname">
                          <button className="gt-tlink muted" onClick={() => onNewTask(p.tag.id)}>+ thêm task đầu tiên</button>
                        </div>
                        <div className="gt-track" style={gridBg} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {byTag.length > 0 && <ProjectNotes projects={byTag} notes={notes} setNotes={setNotes} />}

      <div className="gt-done">
        <div className="gt-done-head">
          <IconCheck size={15} />
          <span>Đã hoàn thành trong tháng</span>
          <span className="gt-done-n">{doneInMonth.length}</span>
        </div>
        {doneInMonth.length === 0
          ? <div className="gt-empty sm">Chưa có task nào hoàn thành trong tháng này.</div>
          : (
            <ul className="gt-done-list">
              {doneInMonth.map((t) => {
                const m = memberOf(t.owner);
                const pj = (t.tagIds || []).map(tagById).filter(Boolean);
                return (
                  <li key={t.id} onClick={() => onOpen && onOpen(t)}>
                    <span className="gt-av" style={{ background: m.color }}>{m.icon || m.name.charAt(0)}</span>
                    <span className="gt-done-t">{t.title}</span>
                    <span className="gt-done-tags">
                      {pj.map((tg) => <em key={tg.id} style={{ color: tg.color, background: tg.color + '18' }}>{tg.name}</em>)}
                    </span>
                    <span className="gt-done-d">{parseISO(t.completedAt).getDate()}/{parseISO(t.completedAt).getMonth() + 1}</span>
                  </li>
                );
              })}
            </ul>
          )}
      </div>
    </div>
  );
}

Object.assign(window, { ProjectGantt });
