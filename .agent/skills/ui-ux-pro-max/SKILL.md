---
name: ui-ux-pro-max
description: Impeccable UI/UX Max Pro skill for creating world-class, accessible, delightful, neo-brutalist and editorial design interfaces with fluid animations, micro-interactions, responsive ergonomics, and high usability.
---

# UI/UX Pro Max & Impeccable Design Guidelines for iNSIGHT

## 1. Aesthetic Identity: Pastel Neo-Brutalism & Editorial Elegance
- **Background**: Soft warm cream (`#F8F6EF`) providing low-fatigue high contrast without stark white glare.
- **Accents**: Muted pastel badges — Mint (`#CDEFD4`), Lavender (`#E8DDFB`), Blue (`#C8E9F7`), Peach Pink (`#F8CFD0`), Sunshine Yellow (`#F9E9B7`).
- **Boundaries**: Hard 2px charcoal outlines (`#242424`) with tactile offset shadows (`3px 3px 0px #242424` or `4px 4px 0px #242424`).
- **Typography**: Display font with strong personality paired with readable sans-serif body fonts ('Plus Jakarta Sans', 'Inter', system-ui).

## 2. Motion & Micro-Interactions (Minimal Yet Effective)
- **Subtlety Over Flamboyance**: Keep transitions between 140ms and 200ms.
- **Physics Easing**: Use spring-like cubic beziers `cubic-bezier(0.16, 1, 0.3, 1)` or `cubic-bezier(0.2, 0.8, 0.2, 1)`. Avoid linear or exaggerated bouncy springs that distract from communication.
- **Micro-interactions**:
  - Hover: Lift up by 1–2px with a slightly deepened shadow (`translate(-1px, -1px)` with `box-shadow: 4px 4px 0px #242424`).
  - Active: Press down by 2px with flattened shadow (`translate(2px, 2px)` with `box-shadow: 1px 1px 0px #242424`).
  - Tap Targets: Minimum 44x44px for touch targets.
- **Reduced Motion**: Always honor `prefers-reduced-motion: reduce` for accessibility.

## 3. Ergonomics & Usability
- **Hierarchy**: Bold title, concise subtitle, visual status badges, actionable buttons.
- **State Feedback**: Always show clear visual feedback for every state (`IDLE`, `LISTENING`, `PROCESSING`, `SPEAKING`, `PAUSED`, `ERROR`).
- **Keyboard Navigation**: High-contrast, non-blinding focus rings (`outline: 2px solid #242424; outline-offset: 3px`).
- **Zero Hallucination / Zero Deception**: Model status must always reflect real connectivity and honest inference metrics.
