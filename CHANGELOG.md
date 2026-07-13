# Changelog - F'Cube Monitor

All notable changes to the F'Cube Personal Monitor project will be documented in this file.

---

## [2.0.0-blueprint] - 2026-07-12
### Added
- **Handheld Device Mockup Shell:** Centered mobile mockup border frame (`max-w-md`) for desktop views, ensuring native pocket terminal design feel.
- **JetBrains Mono Typography:** Set Google Font `JetBrains Mono` as the global typeface for display, body, inputs, and MONOSPACE logs.
- **Drafting Grid Canvas:** Implemented a visible blueprint-like background grid using linear background-gradients in `src/index.css`.
- **Changelog Tracker:** Added this file (`CHANGELOG.md`) to document release notes.

### Changed
- **Styling System Revamp:** Overrode default Tailwind corner radius variables to force strictly sharp `0px` edges on cards, inputs, and action buttons.
- **Color Scheme Migration:** Swapped light colors for a deep industrial blueprint palette:
  - Background: Deep slate-blue (`#0b1623`)
  - Primary text: Off-white (`#f0f0f0`)
  - Accent / Warnings: Amber-orange (`#ff9f30`)
  - Gridlines / Borders: Charcoal-slate (`#1c2b3a`)
  - Dim Labels: Blue-grey (`#8b9bb4`)
  - Success Indicator: Neon-green/cyan (`#00ff9d`)
- **Document Master-Detail Drilldown:** Reconfigured `DocumentManager.tsx` to handle a single-column drill-down catalog list and back navigation buttons, optimizing note-taking and editing workspaces for mobile-width dimensions.
- **Habit Tracker Strip:** Realigned the last 7-days grid buttons into small, mobile-friendly indicators to prevent overflow issues on small screens.
- **Sidebar Elimination:** Removed the desktop Sidebar component in favor of the mobile bottom nav panel.

### Removed
- Unused `Sidebar.tsx` navigation file.
- Unused template css and files.

---

## [1.0.0-refinement] - 2026-07-12
### Added
- **Global Notification Center:** Bell notification button, digital real-time clocks, and sliding drawer menus synced to LocalStorage (`my-monitor-notifications`).
- **Habits Reminders System:** Dynamic reminders scheduler in `HabitTracker.tsx` (HH:MM and weekday options) linked to background alarm checks in `App.tsx` (raising OS push messages and playing AudioSynthesis beeps).
- **Dashboard Alerts Banner:** Box alerting users when high-priority inventory needs are pending.
- **Consistency Index:** Analytics card displaying habit completion indices over the previous week.

---

## [0.0.0-alpha] - 2026-07-12
### Added
- Scaffolded Vite React + TypeScript base configuration.
- Custom LocalStorage hook (`useLocalStorage.ts`).
- Standard responsive layout outlines (Sidebar + Bottom Nav).
- Initial features catalogue:
  - Habit tracking checklist.
  - Notes manager with basic Markdown rendering.
  - Inventory list logger ("Apa Saja Yang Dibutuhkan").
