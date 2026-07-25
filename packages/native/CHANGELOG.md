# @rukkiecodes/native

## 0.7.0

### Minor Changes

- 09d960d: Add the Autocomplete component — mirrors the web FAutocomplete: a select whose
  menu filters as you type, where the value is always one of `items` and text that
  never matched an option is reverted when the field is left. Built on the same
  field shell as the Input and Select (variants, state tints, floating & pinned
  labels, prepend/chevron icon cards, clearable, loading, hint / error / success
  messages), plus single or multiple selection with collapsible chips,
  `autoSelectFirst`, `customFilter`, `noDataText`, and `noFilter` +
  `onSearchChange` for server-side search.

  The suggestion menu is anchored inline rather than in a Modal, so the field
  keeps focus and the keyboard stays up while the list filters.

- 1dafa70: Add the Checkbox component — mirrors the web FCheckbox. The box fills with the
  accent colour while the check mark draws itself on (an animated SVG dash offset,
  no Skia, so it runs in Expo Go), plus an indeterminate dash for partial groups, a
  custom icon slot in place of the tick, line-through labels, a loading ring, three
  sizes, and array models so several boxes can share one selection. Honours
  `reduceMotion` and reports `accessibilityRole="checkbox"` with a `mixed` state
  when indeterminate.

  Also fixes a type-only import in the Select's `const.ts`, which referenced a
  non-existent `InputState` instead of `SelectState` and broke `tsc` for anyone who
  copied the component in.

## 0.6.0

### Minor Changes

- 31d148f: Add the Select component — mirrors the web FSelect on the same field shell as the Input: variants (default, underlined, shadow), state tints, prepend + dropdown icon cards that lift on open, floating & pinned labels, single or multiple selection (collapsible chips), a filter search box, group headers, clearable, loading, and hint / error / success messages. The dropdown is a Modal anchored to the field.

## 0.5.0

### Minor Changes

- 7374bab: Add the Input component — a mobile text field mirroring the web FInput/FField: variants (default, underlined, shadow), state tints (success/danger/warning/primary/dark), prepend/append icon cards that lift out on focus, floating & pinned labels, clearable, loading, password reveal, a strength/progress bar, and hint / error / success messages.

## 0.4.1

### Patch Changes

- f8cb9cf: Badge: make it actually look like a badge — small pill by default (semibold, tighter type and padding), a neutral grey `default` variant instead of the old green, and a `notifications` outline that's visible on light backgrounds.

## 0.4.0

### Minor Changes

- 5c2d921: Add the Badge component — a compact status / label chip with colour variants (default, success, warning, error, pending, notifications), three sizes, a full radius scale, and an optional leading icon.

## 0.3.0

### Minor Changes

- 674711f: Add the Aurora component — a Skia + Reanimated aurora shader (flowing light bands over a night-sky gradient, with configurable colours, speed, intensity and drift). Also organise the registry into categories (Typography, Actions, Effects).

## 0.2.0

### Minor Changes

- Bring the mobile Button to web parity with FBtn: variants (solid, relief, shadow, floating, link), a size scale (xs–xl), block, icon / icon-only with left/right icons, circle & square shapes, a loading overlay and an animated upload sweep, and href link support. Adds ButtonGroup for segmented rows (shared rounded ends, optional dividers, horizontal or vertical).

## 0.1.2

### Patch Changes

- Updated dependencies
  - @rukkiecodes/tokens@0.3.0

## 0.1.1

### Patch Changes

- Updated dependencies
  - @rukkiecodes/tokens@0.2.0

## 0.1.0

### Minor Changes

- 68b6a9e: Initial public release of FusionUI — a Vue 3 design library with the engineering
  stability of Vuetify and the look of Vuesax v4, blended with Apple-style
  typography and whitespace. Includes 50+ components, the Feather icon set,
  programmatic notify/dialog/loading services, a documentation site, and the
  `npm create fusionui` scaffolder.

### Patch Changes

- Updated dependencies [68b6a9e]
  - @rukkiecodes/tokens@0.1.0
