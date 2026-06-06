# Project Mandates

This file contains foundational instructions for Gemini CLI. These mandates take absolute precedence over general workflows.

## Build and Verification
- **Pre-commit Build**: You MUST run `npm run build` and ensure it completes without errors before committing any code changes. This ensures that type safety and bundle optimizations are verified.
- **Fix Failures**: If a build fails, you must resolve the issues and successfully complete a build before proceeding with the commit.

## Mobile-First Design Standards
- **Input & Select Font Sizes**: All interactive text inputs (`<input type="text">`, `<input type="number">`, etc.) and dropdown menus (`<select>`) MUST use a font size of at least `16px` (typically `text-base` in Tailwind CSS) on mobile viewports. This prevents mobile browsers (especially Safari on iOS) from triggering an undesirable automatic page zoom behavior on focus. Avoid using `text-sm` (14px) or `text-xs` (12px) directly on text entry inputs or dropdown controls.
