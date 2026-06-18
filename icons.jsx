// icons.jsx — small stroke icons. Exports to window.
const Ic = ({ d, size = 18, sw = 1.8, fill = 'none', ...p }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill}
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
       strokeLinejoin="round" aria-hidden="true" {...p}>
    {d}
  </svg>
);

const IconCheck   = (p) => <Ic {...p} d={<path d="M5 12.5 10 17.5 19.5 7" />} />;
const IconPlus    = (p) => <Ic {...p} d={<><path d="M12 5v14" /><path d="M5 12h14" /></>} />;
const IconClose   = (p) => <Ic {...p} d={<><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>} />;
const IconTrash   = (p) => <Ic {...p} d={<><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M7 7l1 13h8l1-13" /><path d="M10 11v6M14 11v6" /></>} />;
const IconCalendar= (p) => <Ic {...p} d={<><rect x="3.5" y="5" width="17" height="16" rx="3" /><path d="M3.5 10h17" /><path d="M8 3v4M16 3v4" /></>} />;
const IconChevL   = (p) => <Ic {...p} d={<path d="M14.5 6 8.5 12l6 6" />} />;
const IconChevR   = (p) => <Ic {...p} d={<path d="M9.5 6l6 6-6 6" />} />;
const IconSort    = (p) => <Ic {...p} d={<><path d="M7 4v16M7 20l-3-3M7 20l3-3" /><path d="M17 20V4M17 4l-3 3M17 4l3 3" /></>} />;
const IconFlag    = (p) => <Ic {...p} d={<><path d="M6 21V4" /><path d="M6 4h11l-2 3.5L17 11H6" /></>} />;
const IconTag     = (p) => <Ic {...p} d={<><path d="M3.5 12.5 11 5h7.5V12.5L11 20z" /><circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none" /></>} />;
const IconNote    = (p) => <Ic {...p} d={<><path d="M5 5h14M5 10h14M5 15h9" /></>} />;
const IconDrag    = (p) => <Ic {...p} d={<><circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none"/></>} />;
const IconPrint   = (p) => <Ic {...p} d={<><path d="M7 9V4h10v5" /><rect x="5" y="9" width="14" height="7" rx="2" /><path d="M7 14h10v6H7z" /><circle cx="16.5" cy="12" r=".9" fill="currentColor" stroke="none" /></>} />;
const IconClock   = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>} />;
const IconGear    = (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" /></>} />;
const IconChevD   = (p) => <Ic {...p} d={<path d="M6 9.5l6 6 6-6" />} />;
const IconPin     = (p) => <Ic {...p} d={<><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>} />;
const IconLink    = (p) => <Ic {...p} d={<><path d="M9.5 14.5l5-5" /><path d="M8 12l-2 2a3.2 3.2 0 0 0 4.5 4.5l2-2" /><path d="M16 12l2-2a3.2 3.2 0 0 0-4.5-4.5l-2 2" /></>} />;
const IconUsers   = (p) => <Ic {...p} d={<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6" /><path d="M17 13.5a5.5 5.5 0 0 1 3.5 5.1" /></>} />;
const IconList    = (p) => <Ic {...p} d={<><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none"/></>} />;
const IconGrid    = (p) => <Ic {...p} d={<><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></>} />;

Object.assign(window, {
  IconCheck, IconPlus, IconClose, IconTrash, IconCalendar,
  IconChevL, IconChevR, IconSort, IconFlag, IconTag, IconNote, IconDrag, IconPrint, IconClock, IconGear, IconChevD,
  IconPin, IconLink, IconUsers, IconList, IconGrid,
});
