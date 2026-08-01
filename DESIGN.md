# DESIGN.md

## Visual Theme
- Dark mode default optimized for low-light, high-fatigue emergency operations.
- Surfaces use tinted neutrals to create depth without relying on generic gray values.

## Color Palette (OKLCH)
- **Background Primary**: `oklch(8% 0.008 250)` (Deep navy-tinted void)
- **Background Surface**: `oklch(12% 0.012 250)` (Base panels)
- **Background Elevated**: `oklch(16% 0.015 250)` (Popovers and active inputs)
- **Accent Red (Emergency)**: `oklch(62% 0.25 29)` (SOS actions and high priority alarms)
- **Accent Green (Status Nominal)**: `oklch(76% 0.20 142)` (Stable system statuses)
- **Accent Blue (Interactive)**: `oklch(62% 0.20 250)` (Primary tabs and data links)
- **Accent Purple (Survival)**: `oklch(58% 0.18 300)` (Survival guidelines and kits)

## Typography
- **Primary Stack**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Monospace Stack**: `SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace`
- **Scale**: Fixed rem system (no fluid typography)
  - Logo H1: `2.0rem / font-weight: 800 / tracking: -0.03em`
  - H2 Card Title: `1.125rem / font-weight: 700 / uppercase`
  - Body Text: `0.875rem / font-weight: 400`
  - UI Labels / Metadata: `0.6875rem / font-weight: 600 / uppercase`

## Spacing & Layout
- 8px grid system (`8px`, `12px`, `16px`, `24px`, `32px`).
- Feature cards use `16px` inner padding.
- Tactical list scrolls cleanly horizontally.
- Bottom navigation is fixed at `64px` height with `20px` backdrop blurs.

## Motion Guidelines
- Timing: `150ms` on interactions, `250ms` on overlays.
- Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (ease-out-quad) for rapid state feedback.
- Prefers-reduced-motion active loops toggle.
