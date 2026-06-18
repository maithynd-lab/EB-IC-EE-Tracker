// calendar.jsx — date utilities + Calendar popover. Exports to window.

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function toISO(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
// "18 Th6" short label; adds year if not current year
function fmtDue(s) {
  const dt = parseISO(s);
  if (!dt) return '';
  const now = new Date();
  const base = `${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
  return dt.getFullYear() === now.getFullYear() ? base : `${base} '${String(dt.getFullYear()).slice(2)}`;
}
function isOverdue(s) {
  if (!s) return false;
  return s < todayISO();
}
function relDue(s) {
  if (!s) return '';
  const t = todayISO();
  if (s === t) return 'Hôm nay';
  const dt = parseISO(s), now = parseISO(t);
  const diff = Math.round((dt - now) / 86400000);
  if (diff === 1) return 'Ngày mai';
  if (diff === -1) return 'Hôm qua';
  return fmtDue(s);
}

// Calendar popover. props: value (iso|null), onPick(iso), onClear, anchorClass
function Calendar({ value, onPick, onClear }) {
  const init = parseISO(value) || new Date();
  const [view, setView] = React.useState({ y: init.getFullYear(), m: init.getMonth() });
  const today = todayISO();

  const first = new Date(view.y, view.m, 1);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const prevDays = new Date(view.y, view.m, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push({ d: prevDays - startDow + 1 + i, muted: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, muted: false });
  while (cells.length % 7 !== 0) cells.push({ d: cells.length - (startDow + daysInMonth) + 1, muted: true });

  const step = (delta) => {
    let m = view.m + delta, y = view.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setView({ y, m });
  };

  return (
    <div className="cal" onClick={(e) => e.stopPropagation()}>
      <div className="cal-head">
        <button className="iconbtn sm" onClick={() => step(-1)} aria-label="Tháng trước"><IconChevL size={16} /></button>
        <span className="cal-title">{MONTHS[view.m]} {view.y}</span>
        <button className="iconbtn sm" onClick={() => step(1)} aria-label="Tháng sau"><IconChevR size={16} /></button>
      </div>
      <div className="cal-grid cal-dow-row">
        {DOW.map((w) => <span key={w} className="cal-dow">{w}</span>)}
      </div>
      <div className="cal-grid">
        {cells.map((c, i) => {
          if (c.muted) return <span key={i} className="cal-day muted">{c.d}</span>;
          const iso = toISO(new Date(view.y, view.m, c.d));
          const cls = ['cal-day'];
          if (iso === today) cls.push('today');
          if (iso === value) cls.push('sel');
          return (
            <button key={i} className={cls.join(' ')} onClick={() => onPick(iso)}>{c.d}</button>
          );
        })}
      </div>
      <div className="cal-foot">
        <button className="cal-link" onClick={() => onPick(today)}>Hôm nay</button>
        {value && <button className="cal-link muted" onClick={onClear}>Xoá</button>}
      </div>
    </div>
  );
}

Object.assign(window, { Calendar, todayISO, parseISO, toISO, fmtDue, relDue, isOverdue });
