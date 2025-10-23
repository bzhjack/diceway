# Project Guidelines

This repository is a multi-project workspace containing a Laravel backend and two Angular frontends. Use these guidelines when making changes and validating fixes.

## Project overview
- Root
  - backend — Laravel application with Vite for asset bundling; includes Docker scripts in package.json.
  - frontend — Angular 20 app using PrimeNG; has Prettier config embedded in package.json.
  - frontend2 — Angular 19 app using 3D dice libraries and PrimeNG.

## What to run (tests, builds, and dev)
- General
  - OS: Windows. Prefer PowerShell and backslashes in paths (e.g., C:\projects\diceway\frontend).
  - Only run tests/builds for packages you change, to keep feedback fast.

- frontend (Angular 20)
  - Install deps: npm ci
  - Unit tests: npm test
  - Build (dev/prod): npm run build
  - Serve locally: npm start

- frontend2 (Angular 19)
  - Install deps: npm ci
  - Unit tests: npm test
  - Build (dev): npm run build
  - Build (prod): npm run build:prod
  - Serve locally: npm start

- backend (Laravel)
  - Frontend assets
    - Dev server: npm run dev
    - Build assets: npm run build
  - Docker helpers
    - Build container: npm run docker:build
    - Start stack: npm run docker:start
    - Exec shell: npm run docker:exec
  - Note: PHP unit tests and Composer scripts are not defined in this document; if you modify PHP code, ensure the app boots locally (via Docker or your PHP runtime) and that Vite assets compile without errors.

## When to run what
- Small UI-only change (Angular): run npm test and npm run build for the affected frontend package.
- Library upgrades (Angular): run npm test and npm run build in both frontend and frontend2 if they share dependencies you touched.
- Backend asset changes: run npm run build in backend and verify the Laravel app can serve pages (via Docker scripts if available in your environment).

## Code style and conventions
- Angular
  - Follow the official Angular Style Guide (components, services, modules, and naming conventions).
  - Use the existing Prettier settings in frontend (printWidth 100, singleQuote true). Run Prettier before submitting when you touch HTML/TS/SCSS.
- TypeScript/SCSS/HTML
  - Keep imports ordered and prefer relative paths within the same feature area.
  - Avoid introducing global CSS; scope styles to components when practical.
- Commit scope
  - Keep changes minimal and localized to the issue.

## Submission checklist for Junie
- Update only the necessary packages (backend, frontend, and/or frontend2) related to the change.
- For each changed package:
  - npm ci (first time or when lockfile changed)
  - npm test (if the package has tests; both frontends do)
  - npm run build to ensure it compiles
- Verify Windows path compatibility in commands and documentation.

## Notes for tools
- Paths in this project should use Windows-style backslashes in tool invocations.
- Prefer specialized tools over general shell commands when available in the environment.
