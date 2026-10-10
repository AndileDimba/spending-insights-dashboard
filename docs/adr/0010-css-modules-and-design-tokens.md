# 10. CSS Modules with design tokens as CSS custom properties

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The styling approach must support a strict Content Security Policy, light and dark themes, a responsive layout from 320px upwards, and WCAG AA contrast. It should keep the performance budget and be readable by any frontend engineer.

Options considered:

1. **Tailwind CSS.** Fast to build with, consistent spacing and colour scales, and very popular. Markup carries long class lists, and the design system lives in configuration rather than in CSS. A reasonable choice; this project prefers semantic class names that read well in review.
2. **Runtime CSS-in-JS** (styled-components, Emotion). Co-located and dynamic. Styles are generated at runtime, which costs performance, and injected `<style>` tags need a CSP nonce or `unsafe-inline`. The most popular option, styled-components, has been in maintenance mode since 2025.
3. **Zero-runtime CSS-in-TypeScript** (vanilla-extract). Typed and CSP-friendly, with more build tooling and a smaller community.
4. **CSS Modules with design tokens as custom properties.** Plain CSS, scoped per component, compiled to static files. Works with a strict CSP and needs no runtime.

## Decision

Option 4.

- Design tokens (colour, spacing, typography, radii, shadows, motion) are CSS custom properties in one tokens file. Components use tokens, never raw values.
- Themes switch token values only: dark mode follows `prefers-color-scheme`, so components contain no theme logic.
- Token colour pairs are chosen to meet WCAG AA contrast in both themes, and checked with axe (#13).
- Layout uses modern CSS: grid, container queries where a component's own width matters, logical properties and `clamp()` for fluid type.
- API-supplied category colours are only used after validation (ADR 0009), with a token fallback.

## Consequences

- No styling runtime, no inline styles from our own code, and a strict `style-src 'self'` remains possible.
- Any engineer who knows CSS can work on it, and design tokens map directly to a design system if the bank has one.
- Class names are not type-checked. A typed CSS Modules plugin can be added if this becomes a source of bugs.
- Consistency depends on using tokens, which review and a lint rule for raw colour values can enforce.
