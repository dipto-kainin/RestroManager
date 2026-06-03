# Design System

This document specifies the design tokens, visual language, and interaction guidelines for the RestroManager Citrus Sunlit Bistro theme.

## Color Palette (Citrus Sunlit Bistro)

We use OKLCH exclusively for our color system.

| Role | Token | Value | Visual Description |
| --- | --- | --- | --- |
| Canvas Background | `--bg` | `oklch(1.000 0.000 0)` | Pure sunlit white canvas |
| Surface Panels | `--surface` | `oklch(0.97 0.01 113.1)` | Tinted sunlit olive-white for cards & panels |
| Surface Secondary | `--surface-hover` | `oklch(0.93 0.02 113.1)` | Slightly deeper tint for active hovers |
| Primary Branding | `--primary` | `oklch(0.80 0.18 113.1)` | High-energy sunlit lime/chartreuse |
| Primary Ink / Text | `--ink` | `oklch(0.12 0.02 113.1)` | Off-black olive-tinted ink (Contrast vs bg: >12:1) |
| Secondary Ink / Muted | `--muted` | `oklch(0.45 0.02 113.1)` | Medium-gray olive-tinted text (Contrast vs bg: >4.5:1) |
| Highlight CTA / Alert | `--accent` | `oklch(0.65 0.22 45)` | Vibrant coral-orange (White text on top) |
| Table Vacant | `--status-vacant` | `oklch(0.68 0.17 185)` | Electric cyan / teal |
| Table Occupied | `--status-occupied`| `oklch(0.65 0.22 45)` | Vibrant coral |
| Order In Progress | `--status-preparing`| `oklch(0.82 0.15 75)` | Bright sunlit amber |
| Order Ready | `--status-ready` | `oklch(0.72 0.16 140)` | Fresh mint green |

## Typography

- **Display Font**: Satoshi / Inter Tight (Geometric high-contrast sans-serif)
  - Desktop Hero: `clamp(2.5rem, 5vw, 4rem)`, tracking `-0.03em`, leading `1.05`
  - Section Headlines: `font-semibold`, tracking `-0.02em`
- **Body Font**: Inter / System Sans
  - Body Text: `text-base`, `leading-relaxed`, line-length capped at `70ch`
- **Monospace Font**: JetBrains Mono (For codes, capacities, metrics, dates)

## Component Rules

- **Borders & Shadows**:
  - We do not mix soft drop shadows and solid borders. Cards use a single solid light border (`1px solid oklch(0.88 0.01 113.1)`) with zero shadow.
  - Interactive elements have full borders.
- **Corner Radii**:
  - Buttons, inputs, and tags: `8px`
  - Cards and Panels: `12px`
  - Table representation circles: `50%` (Pill/round)
  - No over-rounded `32px+` corners on square elements.

## Animations & Motion

- **Tactile Click Feedback**:
  - On hover: scale slightly up `scale(1.01)` with custom ease.
  - On active press: scale down `scale(0.97)` to simulate a physical button push.
  - Easing: `cubic-bezier(0.23, 1, 0.32, 1)` (snappy ease-out, 150ms).
- **Entrance Transitions**:
  - Modals and dropdowns fade and scale in from `scale(0.95)` to `scale(1)` using `@starting-style` transitions.
  - Lists stagger item entry delays by `30ms-50ms` up to `200ms` total.
- **Reduced Motion**:
  - All scale and translate motions are gated behind `@media (prefers-reduced-motion: no-preference)`. When reduced motion is requested, transitions default to simple instant opacity crossfades.
