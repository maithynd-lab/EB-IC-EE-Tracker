// reports.jsx — week/month date helpers, charts, WeekView & MonthView. Exports to window.

const MONTHS_FULL = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const MONTHS_SHORT = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];

function addDaysISO(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
function startOfWeekISO(refIso) { // Monday start
  const d = parseISO(refIso); const day = d.getDay(); const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff); return toISO(d);
}
function weekRange(refIso) { const s = startOfWeekISO(refIso); return { start: s, end: addDaysISO(s, 6) }; }
function monthRange(refIso) {
  const d = parseISO(refIso);
  return { start: toISO(new Date(d.getFullYear(), d.getMonth(), 1)), end: toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
}
function inRange(iso, a, b) { return !!iso && iso >= a && iso <= b; }
function weekLabel(r) {
  const s = parseISO(r.start), e = parseISO(r.end);
  const sameMonth = s.getMonth() === e.getMonth();
  const left = sameMonth ? `${s.getDate()}` : `${s.getDate()} ${MONTHS_SHORT[s.getMonth()]}`;
  return `${left} – ${e.getDate()} ${MONTHS_SHORT[e.getMonth()]}, ${e.getFullYear()}`;
}
function monthLabel(refIso) { const d = parseISO(refIso); return `${MONTHS_FULL[d.getMonth()]}, ${d.getFullYear()}`; }

// classify a member's tasks against a period [start,end]
function classify(tasks, ownerId, start, end) {
  const mine = tasks.filter((t) => t.owner === ownerId);
  const done = mine.filter((t) => t.done && inRange(t.completedAt, start, end));
  const overdue = mine.filter((t) => !t.done && t.deadline && t.deadline < todayISO() && t.deadline <= end);
  const doing = mine.filter((t) => !t.done && inRange(t.deadline, start, end) && !(t.deadline < todayISO()));
  return { done, doing, overdue };
}

// ── small report task row ───────────────────────────────────────────────
function RepRow({ task, tags, onOpen, dim }) {
  const ts = task.tagIds.map((id) => tags.find((t) => t.id === id)).filter(Boolean);
  return (
    <button className={'rep-row' + (dim ? ' done' : '')} onClick={() => onOpen(task)}>
      <span className="rep-dot" />
      <span className="rep-title">{task.title}</span>
      {ts.slice(0, 2).map((t) => <span key={t.id} className="tag mini" style={tagStyle(t.color)}>{t.name}</span>)}
      <span className="rep-date">{dim ? (task.completedAt ? fmtDue(task.completedAt) : '') : (task.deadline ? relDue(task.deadline) : '')}</span>
    </button>
  );
}

// ── WeekView ────────────────────────────────────────────────────────────
function WeekView({ members, tasks, tags, range, onOpen }) {
  return (
    <div className="week-grid">
      {members.map((m) => {
        const { done, doing, overdue } = classify(tasks, m.id, range.start, range.end);
        return (
          <section key={m.id} className="pcard" style={{ '--accent': m.color }}>
            <header className="pcard-head">
              <span className="avatar" style={{ background: m.color }}>{m.icon || m.name.charAt(0)}</span>
              <span className="pcard-name">{m.name}</span>
            </header>
            <div className="stats">
              <div className="stat done"><b>{done.length}</b><span><IconCheck size={12} sw={2.6} /> Xong</span></div>
              <div className="stat doing"><b>{doing.length}</b><span><IconClock size={12} /> Đang làm</span></div>
              <div className="stat over"><b>{overdue.length}</b><span>⚠ Trễ</span></div>
            </div>
            <div className="rep-block">
              <div className="rep-h">Đang làm{overdue.length ? ' & trễ hạn' : ''}</div>
              {[...overdue, ...doing].length === 0
                ? <div className="rep-empty">Không có task nào trong tuần</div>
                : [...overdue, ...doing].map((t) => <RepRow key={t.id} task={t} tags={tags} onOpen={onOpen} />)}
            </div>
            {done.length > 0 && (
              <div className="rep-block">
                <div className="rep-h">Đã xong tuần này</div>
                {done.map((t) => <RepRow key={t.id} task={t} tags={tags} onOpen={onOpen} dim />)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ── charts ──────────────────────────────────────────────────────────────
function Donut({ data, size = 168, thickness = 26 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2, C = 2 * Math.PI * r, cx = size / 2;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(20,22,30,.06)" strokeWidth={thickness} />
      <g transform={`rotate(-90 ${cx} ${cx})`}>
        {total > 0 && data.map((d, i) => {
          const frac = d.value / total, len = frac * C, off = acc * C; acc += frac;
          return <circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
                         strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} strokeLinecap="butt" />;
        })}
      </g>
      <text x={cx} y={cx - 4} className="donut-num">{total}</text>
      <text x={cx} y={cx + 16} className="donut-lbl">task xong</text>
    </svg>
  );
}

function Bars({ rows, max }) {
  const top = Math.max(max, 1);
  return (
    <div className="bars">
      {rows.map((r, i) => (
        <div key={i} className="bar-row">
          <span className="bar-name">{r.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(r.value / top) * 100}%`, background: r.color }} />
          </div>
          <span className="bar-val">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── MonthView ───────────────────────────────────────────────────────────
function MonthView({ members, tasks, tags, range, onOpen }) {
  const doneInMonth = tasks.filter((t) => t.done && inRange(t.completedAt, range.start, range.end));
  const overdueOpen = tasks.filter((t) => !t.done && t.deadline && t.deadline < todayISO() && t.deadline <= range.end);

  // per-person completed
  const perPerson = members.map((m) => ({
    label: m.name, color: m.color,
    value: doneInMonth.filter((t) => t.owner === m.id).length,
  }));
  const maxPerson = Math.max(1, ...perPerson.map((p) => p.value));

  // distribution by tag (count tag occurrences across completed tasks)
  const tagCount = {};
  doneInMonth.forEach((t) => t.tagIds.forEach((id) => { tagCount[id] = (tagCount[id] || 0) + 1; }));
  const tagRows = Object.entries(tagCount)
    .map(([id, value]) => { const tg = tags.find((x) => x.id === id); return tg ? { label: tg.name, color: tg.color, value } : null; })
    .filter(Boolean).sort((a, b) => b.value - a.value);
  const donutData = tagRows.length ? tagRows : [{ label: '—', color: '#D8D9DE', value: 0 }];

  const completionRate = members.map((m) => {
    const total = tasks.filter((t) => t.owner === m.id && (inRange(t.completedAt, range.start, range.end) || inRange(t.deadline, range.start, range.end))).length;
    const done = doneInMonth.filter((t) => t.owner === m.id).length;
    return { name: m.name, color: m.color, pct: total ? Math.round((done / total) * 100) : 0, done, total };
  });

  return (
    <div className="month-wrap">
      <div className="kpis">
        <div className="kpi"><b>{doneInMonth.length}</b><span>Task hoàn thành</span></div>
        <div className="kpi"><b>{tagRows.length}</b><span>Event / tag hoạt động</span></div>
        <div className="kpi warn"><b>{overdueOpen.length}</b><span>Đang trễ hạn</span></div>
      </div>

      <div className="charts">
        <div className="chart-card">
          <div className="chart-h">Hoàn thành theo thành viên</div>
          <Bars rows={perPerson} max={maxPerson} />
          <div className="rate-list">
            {completionRate.map((r) => (
              <div key={r.name} className="rate-row">
                <span className="rate-name"><i style={{ background: r.color }} />{r.name}</span>
                <span className="rate-pct">{r.pct}% <small>({r.done}/{r.total})</small></span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-h">Phân bổ theo event / tag</div>
          <div className="donut-wrap">
            <Donut data={donutData} />
            <div className="legend">
              {tagRows.length === 0 && <div className="rep-empty">Chưa có task hoàn thành trong tháng</div>}
              {tagRows.map((r) => (
                <div key={r.label} className="legend-item">
                  <i style={{ background: r.color }} />
                  <span className="legend-name">{r.label}</span>
                  <span className="legend-val">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  addDaysISO, startOfWeekISO, weekRange, monthRange, inRange, weekLabel, monthLabel,
  classify, WeekView, MonthView, Donut, Bars,
});
