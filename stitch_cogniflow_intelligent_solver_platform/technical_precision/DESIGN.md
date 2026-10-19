---
name: Technical Precision
colors:
  surface: '#08151c'
  surface-dim: '#08151c'
  surface-bright: '#2e3b43'
  surface-container-lowest: '#041017'
  surface-container-low: '#111d25'
  surface-container: '#152129'
  surface-container-high: '#1f2c33'
  surface-container-highest: '#2a363f'
  on-surface: '#d7e4ef'
  on-surface-variant: '#bccbb9'
  inverse-surface: '#d7e4ef'
  inverse-on-surface: '#26323a'
  outline: '#869585'
  outline-variant: '#3d4a3d'
  surface-tint: '#4ae176'
  primary: '#4be277'
  on-primary: '#003915'
  primary-container: '#22c55e'
  on-primary-container: '#004b1e'
  inverse-primary: '#006e2f'
  secondary: '#fabc45'
  on-secondary: '#422c00'
  secondary-container: '#bd8707'
  on-secondary-container: '#392600'
  tertiary: '#63e07e'
  on-tertiary: '#003914'
  tertiary-container: '#44c365'
  on-tertiary-container: '#004b1d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bff8f'
  primary-fixed-dim: '#4ae176'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005321'
  secondary-fixed: '#ffdea9'
  secondary-fixed-dim: '#fabc45'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5f4100'
  tertiary-fixed: '#7ffc97'
  tertiary-fixed-dim: '#62df7d'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005320'
  background: '#08151c'
  on-background: '#d7e4ef'
  surface-variant: '#2a363f'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system targets senior engineers, technical architects, and systems developers who value transparency, low latency, and deterministic outcomes over conversational fluff. 

The aesthetic is **Precision Technical Instrument**: high-contrast, dark-first, and structural. It avoids playful rounded bubbles, pastel washes, or generic anthropomorphic AI patterns. Instead, it mirrors high-performance systems infrastructure, low-level debug consoles, and mission-critical telemetry boards. Interface structures emphasize dense information architecture, real-time routing transparency, execution trace hierarchy, and explicit performance indicators (token velocity, engine destination, latency metrics).

## Colors
The palette is built around an ink-black void (`#090D10`), layering subtle graphite and carbon surfaces to produce optical depth without relying on decorative styling.

- **Primary (`#22C55E`)**: Indicates live routing pathways, optimal model consensus, verified health checks, and active runtime states. Accompanied by `#16A34A` for pressed/engaged interactive elements and `rgba(34, 197, 94, 0.2)` for low-noise structural boundaries.
- **Secondary (`#F4B740`)**: Reserved for routing branch ambiguity, speculative execution tags, heuristic warnings, and computational thresholds.
- **Destructive (`#EF4444`)**: Dictates routing failures, model timeouts, syntax verification breaches, and unhandled exceptions.
- **Surfaces & Hierarchy**:
  - Base Viewport: `#090D10`
  - Recessed / Canvas Panels: `#0D1216`
  - Standard Cards / Containers: `#12191E`
  - Elevated Popovers / Flyouts: `#171F25`
  - Interactive Hover Overlay: `rgba(255, 255, 255, 0.04)`
- **Text & Semantics**:
  - High Emphasis: `#F0F4F6` (Contrast ratio > 14:1 against base)
  - Secondary / Supporting: `#9AA7B1`
  - Inactive / Monospace Metadata: `#65727D`
  - Structural Hairlines: `rgba(255, 255, 255, 0.08)`

## Typography
The system enforces a dual-font configuration:

- **Inter**: Handles primary interface controls, titles, narrative system feedback, and high-density form fields. It maintains exceptional neutrality and vertical metrics.
- **JetBrains Mono**: Serves as the functional core for telemetry outputs, runtime durations, parameter tokens, token counters, memory footprints, model paths, and category pills.

Tabular figures (`font-variant-numeric: tabular-nums`) must be activated across all numerical outputs to guarantee strict vertical alignment during high-frequency telemetry updates. Monospaced elements at `10px` and `11px` scale should use explicit uppercase styling with `+0.05em` letter spacing for micro-badges.

## Layout & Spacing
The layout follows a strict 12-column fluid grid on desktop monitors and collapses into single-column functional panels on constrained mobile viewports.

- **Desktop (>= 1280px)**: 12-column layout with fixed 280px or 320px telemetry navigation drawers, `gutter-lg` (24px) gutters, and `margin-lg` (32px) margins.
- **Tablet (768px - 1279px)**: 8-column layout, contextual panels transition to split-sheet views, 16px gutters, 20px outer margin.
- **Mobile (< 768px)**: 4-column flow. Execution graph visualizers convert to vertical timelines. 16px margins, edge-to-edge execution cards.

Internal element density uses a baseline 4px rhythm (`0.25rem`). Padding inside technical data lists and solver inspection windows is compact (`space-xs` to `space-sm`) to maximize visible information density per fold.

## Elevation & Depth
Elevation is achieved using **tonal layered luminance and 1px structural outlines**, completely avoiding heavy drop shadows.

- **Base Canvas (`#090D10`)**: The deepest canvas. Contains empty space and page background.
- **Level 1 Surface (`#12191E`)**: Standard panels, routing nodes, and task logs. Framed with a 1px solid border of `rgba(255, 255, 255, 0.08)`.
- **Level 2 Surface (`#171F25`)**: Dropdowns, active routing cards, modal dialogues, and hover tooltips. Border transitions to `rgba(255, 255, 255, 0.14)`.
- **Active / Routing State**: When an execution node is active or selected, the border shifts to `rgba(34, 197, 94, 0.25)`, accompanied by a subtle, tight glow: `box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.2), 0 4px 20px -2px rgba(0, 0, 0, 0.7)`.

## Shapes
Geometry is disciplined, utilitarian, and structural:

- **Tokens & Nodes (`rounded-sm` / 4px)**: Applied to micro-badges, execution engine tags (e.g., `PYTHON_LOCAL`), and inline telemetry pills.
- **Interactive Controls (`rounded` / 6px to 8px)**: Buttons, inputs, search filters, and selector chips.
- **Cards & Panes (`rounded-lg` / 10px to 12px)**: Solver inspect panels, dynamic code views, and canvas card containers.
- **Modals & Overlays (`rounded-xl` / 14px)**: Max limit for window overlays. Anything beyond 14px is prohibited to preserve the engineered visual aesthetic.

## Components

### Buttons
- **Primary Action (Execute/Deploy)**: Solid `#22C55E` background, `#090D10` heavy bold text, 8px corner radius. Hover: `#16A34A`. Focus ring: 2px offset with `rgba(34, 197, 94, 0.4)`.
- **Secondary (Inspect/Reroute)**: Surface `#12191E` with 1px `rgba(255, 255, 255, 0.1)` border. Text `#F0F4F6`. Hover: Border `#65727D`, background `#171F25`.
- **Ghost / Utility**: Transparent background, text `#9AA7B1`. Hover: Text `#F0F4F6`, background `rgba(255, 255, 255, 0.04)`.

### Technical Badges & Solver Chips
- Monospace font (`JetBrains Mono`, 11px), uppercase, 4px border radius, strict inline padding (2px 6px).
- **Deterministic Python**: Text `#22C55E`, background `rgba(34, 197, 94, 0.1)`, border `rgba(34, 197, 94, 0.25)`.
- **Lightweight NLP**: Text `#38BDF8`, background `rgba(56, 189, 248, 0.1)`, border `rgba(56, 189, 248, 0.25)`.
- **Local LLM**: Text `#F4B740`, background `rgba(244, 183, 64, 0.1)`, border `rgba(244, 183, 64, 0.25)`.

### Input & Code Fields
- Surface: `#0D1216`. Inactive border: 1px `rgba(255, 255, 255, 0.1)`. Active border: 1px `#22C55E`.
- Caret color: `#22C55E`. Typography: Inter 14px for prompt queries; JetBrains Mono 13px for parameter inputs.

### Routing Execution Card
- Background: `#12191E`. Border: 1px `rgba(255, 255, 255, 0.08)`.
- Header houses monospace route duration (`14ms`), solver destination indicator, and payload payload fingerprint.
- Content zone houses raw output or stream chunks in structured monospaced text blocks.

### Telemetry Lists & Data Tables
- Row height: 36px (compact) to 44px (standard).
- Alternating subtle horizontal border: `1px solid rgba(255, 255, 255, 0.04)`.
- Status indicators: 6px pulsing dot (Green = idle ready, Amber = queued, Blue = executing).