# Design Guidelines: Text-to-Speech & Voice Cloning Application

## Design Approach

**Selected System:** Linear-inspired minimalist utility design
**Justification:** This is a production tool requiring efficiency, clarity, and focus. Linear's clean aesthetic, excellent form design, and functional hierarchy perfectly suit a text-to-speech workflow application.

**Core Principles:**
- Clarity over decoration
- Progressive disclosure of complexity
- Workflow-oriented layout
- Functional aesthetics

---

## Typography

**Font Family:** Inter (Google Fonts) for all text
- Primary: Inter (400, 500, 600)

**Hierarchy:**
- Page Title: text-2xl font-semibold
- Section Headers: text-lg font-medium
- Labels: text-sm font-medium
- Body/Input: text-base font-normal
- Helper Text: text-sm font-normal opacity-60
- Button Text: text-sm font-medium

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-4, p-6
- Section gaps: gap-6, gap-8
- Margins: m-2, m-4
- Icon spacing: h-4, h-6

**Container Strategy:**
- Max width: max-w-6xl mx-auto
- Page padding: px-6 py-8
- Cards/panels: rounded-lg with p-6

**Grid System:**
- Main layout: Single column on mobile, 2-column on desktop (lg:grid-cols-2)
- Input/Output split: Left panel (text input), Right panel (settings/preview)
- Responsive breakpoint: lg (1024px)

---

## Component Library

### Core UI Elements

**Input Fields:**
- Textarea for text input: min-h-[200px], rounded-lg border
- File upload zone: Dashed border, rounded-lg, p-8 with centered upload icon
- Dropdowns: Rounded-md with chevron icon, full-width on mobile

**Buttons:**
- Primary CTA: rounded-md px-4 py-2
- Secondary: rounded-md px-4 py-2 with border
- Icon buttons: p-2 rounded-md
- File upload trigger: Dashed border button

**Cards/Panels:**
- Settings panel: rounded-lg with p-6
- Voice cards: rounded-md p-4 with flex layout
- Results container: rounded-lg with minimal border

### Navigation

**Top Bar:**
- Fixed header: h-16 with px-6
- Logo/title on left, settings icon on right
- Simple, unobtrusive

### Forms

**Voice Settings:**
- Label above input pattern
- Grouped settings in sections with gap-4
- Range sliders for speed/pitch with value display
- Radio buttons for style selection

**Voice Cloning Section:**
- Tab switcher: Upload / Record (rounded-full toggle)
- Upload zone with icon + text
- Microphone controls: Record button (rounded-full), timer display
- Saved voices grid: 2-column on mobile, 3-column on desktop

### Data Displays

**Audio Player:**
- Waveform visualization: Canvas element, height h-24
- Playback controls: Play/pause, progress bar, time display
- Volume control in corner

**Voice Library:**
- Voice cards with: Name, language tag, delete icon
- Hover state for selection
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

### Overlays

**Processing State:**
- Inline spinner with "Generating..." text
- Non-blocking, appears in results panel

**Toast Notifications:**
- Top-right corner
- Slide-in animation (subtle)
- Success: checkmark icon, Error: alert icon

---

## Animations

**Minimal & Purposeful:**
- Button hover: Subtle opacity change only (no scale/transform)
- Recording indicator: Pulsing red dot (opacity pulse)
- Loading states: Subtle spinner
- NO page transitions, NO scroll animations

---

## Icons

**Library:** Heroicons (outline style via CDN)
- Upload: arrow-up-tray
- Microphone: microphone
- Play: play
- Pause: pause
- Download: arrow-down-tray
- Trash: trash
- Chevron: chevron-down
- Settings: cog-6-tooth

---

## Images

**No Hero Images:** This is a utility application, not a marketing site.

**Icon Usage Only:**
- Empty state illustrations: Simple line icons for "no voices yet"
- File type icons in upload zone
- All decorative elements via icons, not images

---

## Page Structure

**Single-Page Application Layout:**

1. **Header** (h-16): Logo + optional settings
2. **Main Workflow Area** (2-column on desktop):
   - **Left Panel:** Text input (textarea + file upload option)
   - **Right Panel:** Settings & preview (voice selection, cloning, audio player)
3. **Results Section** (below or integrated): Audio player + download button
4. **Voice Library** (collapsible section): Grid of saved cloned voices

**Mobile:** Single column, progressive disclosure (accordion for advanced settings)