export function SettingsIcon() {
  return <svg className="settings-icon" viewBox="0 0 24 24" aria-hidden="true">
    <g className="settings-teeth">
      {Array.from({ length: 8 }, (_, index) => <rect key={index} x="10.3" y="1.4" width="3.4" height="4.4" rx=".8" transform={`rotate(${index * 45} 12 12)`} />)}
    </g>
    <circle cx="12" cy="12" r="7.1" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
}
