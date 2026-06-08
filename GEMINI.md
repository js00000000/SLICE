# Project Mandates

This file contains foundational instructions for Gemini CLI. These mandates take absolute precedence over general workflows.

## Build and Verification
- **Pre-commit Build**: You MUST run `npm run build` and ensure it completes without errors before committing any code changes. This ensures that type safety and bundle optimizations are verified.
- **Fix Failures**: If a build fails, you must resolve the issues and successfully complete a build before proceeding with the commit.

## Mobile-First Design Standards
- **Input & Select Font Sizes**: All interactive text inputs (`<input type="text">`, `<input type="number">`, etc.) and dropdown menus (`<select>`) MUST use a font size of at least `16px` (typically `text-base` in Tailwind CSS) on mobile viewports. This prevents mobile browsers (especially Safari on iOS) from triggering an undesirable automatic page zoom behavior on focus. Avoid using `text-sm` (14px) or `text-xs` (12px) directly on text entry inputs or dropdown controls.

## Visual & Design Guidelines (Bold & Crisp × Playful Numbers)
All future feature implementations, visual enhancements, and layout modifications MUST adhere strictly to the established **Bold & Crisp × Playful Numbers** design system.

### 1. Color Palette (Tailwind CSS v4 mapped variables)
*   **Accent Orange (`#FF6B35` / `bg-accent-orange`, `text-accent-orange`)**: Used for primary action buttons, key amount numbers, highlights, and active states.
*   **Brand Light (`#FFF0EA` / `bg-brand-light`)**: Warm accent tint. Used for badge backgrounds, active tag backdrops, and active toggle containers.
*   **Page Background (`#F7F7F5` / `bg-page-bg`)**: Lighter warm-gray backdrop used across the entire page body. Do not default to `#f3f4f6` or `bg-slate-50`.
*   **Main Text & Borders (`#1A1A2E` / `text-main-text`, `border-main-text`)**: Deep Midnight Blue. All primary headings, body texts, card borders, and tactile shadows must use this color to maintain strong contrast and readability.
*   **Success Green (`#0A7A4A` / `bg-success-light`, `text-success-green`)**: Used for settled balances or receivable gains.

### 2. Typography pairing
*   **Nunito (weights 800-900 / `font-nunito`)**: Rounded display font used for all main page titles, modal titles, amount numbers, currency displays, and action button labels to give a friendly, playful look.
*   **Plus Jakarta Sans (weights 400-700 / `font-plus-jakarta`)**: Highly legible sans-serif font used for UI copy, input labels, metadata, secondary instructions, and descriptive body texts.

### 3. Tactile 3D Styling & Borders
*   **Crisp Borders**: Cards, inputs, and primary buttons must use thick Midnight Blue borders (`border-2 border-main-text` or `border-3 border-main-text`) instead of thin, subtle gray lines.
*   **Tactile Shadows**: Interactive elements must feature solid offset shadows (e.g., `shadow-[4px_4px_0px_#1A1A2E]`, `shadow-[3px_3px_0px_#1A1A2E]`) instead of blurred shadows.
*   **Bouncy Actions**: Ensure interactive elements use tactile press effects (`btn-bounce` class or `active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E]`) to deliver a rewarding, physical click feeling (Duolingo-like feel).

### 4. Interactive Micro-Animations
*   **Staggered Entrance (`.stagger-item`)**: Always use staggered fade-up lists where children are loaded with inline `animationDelay` increments of `60ms` for a cohesive card entrance.
*   **Count-Up Numbers (`CountUp` Component)**: All major currency displays, settlements, and net balances must use the `<CountUp value={...} formatter={formatCurrency} />` component to dynamically count up the values when loaded.
*   **Detail Expansion**: Hover/active expansions (like expenses list) must feature subtle expansion scaling with round feedback.

### 5. Layout Alignment & Modal Clipping
*   **Vertical Stacking on Narrow Devices**: Avoid side-by-side rows for complex input fields and buttons on mobile-container layout formats. Lay out fields vertically (`flex-col w-full gap-3`) so inputs take 100% width and do not overflow.
*   **Modal Rounded Clipping**: All modal container elements (like `ExpenseModal` or `ProfileModal`) must include `overflow-hidden` along with rounded corners (e.g. `rounded-t-[24px]`) to prevent rectangular child background elements from bleeding outside the rounded borders.

