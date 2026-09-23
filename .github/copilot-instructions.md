# Copilot Instructions for this repository

## Project shape

This is a dependency-free static browser game. The page is assembled by `index.html`, styled by `style.css`, and implemented by `script.js`; there is no bundler, package manifest, build step, test runner, or lint configuration.

To preview the game locally, serve the repository root over HTTP:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Build, test, and lint commands

There are currently no package scripts, test files, or lint tooling in this repository.

- Build: none
- Test: none
- Lint: none
- Single test command: none

For gameplay or rendering changes, do a browser smoke test covering:

- movement
- jump
- attack
- pause
- restart
- star collection
- reaching the exit

## High-level architecture

- `index.html` owns the page shell and the non-Canvas UI: controls, mission status, HUD values, pause/replay controls, and the `#game` canvas element. Keep gameplay state out of the markup.
- `style.css` owns the visual system and responsive layout. The game is presented as a two-column hero on wide screens and a stacked layout below 850px, with a mobile adjustment below 520px. It uses the CSS custom properties at the top of the file for the palette.
- `script.js` owns all game state and rendering. The fixed logical viewport is `960 x 540`; the playable world is wider (`world.width = 3600`) and is shown through `world.camera`.
- Gameplay uses a single `requestAnimationFrame` loop. `update(dt)` advances physics, collisions, enemies, collectibles, camera, and win state; `draw()` paints the background and world using Canvas 2D. Keep simulation changes in `update` and visual changes in `draw`.
- `resetGame()` is the canonical initializer. It recreates the player, state, platforms, stars, and enemies and also resets the DOM HUD/message state. Add new resettable gameplay data there so replay behaves like a fresh run.
- DOM elements are cached at module load and synchronized through `updateHud()` or the relevant state transition. Canvas coordinates use world coordinates until `ctx.translate(-world.camera, 0)` is applied.

## Key conventions

- The user-facing descriptions in-game (controls, status, messages, etc.) are displayed in Japanese.
- UI and gameplay text shown to players must be written in Japanese, including explanatory labels, status messages, and tutorial text.
- Use plain browser JavaScript and existing DOM/Canvas APIs; do not introduce a framework or dependency for small gameplay/UI changes.
- Keep the current data-oriented entity shape: plain objects for `player`, `world.platforms`, `world.stars`, and `world.enemies`, with explicit fields such as `x`, `y`, `w`, `h`, and lifecycle flags (`got`, `alive`).
- Use the existing keyboard mapping in `onKeyDown`: A/D and arrow keys move, W/Space/Up jumps, J/Enter attacks, P pauses, and R resets. Prevent default browser behavior for keys used by the game.
- Preserve the fixed-world collision model: platforms are axis-aligned rectangles, landing is resolved while falling using the previous bottom edge, and `intersects()` is the shared AABB helper for entities and pickups.
- Keep the game-over flow consistent with the existing flags: set `state.won`, update `#mission-status`, and reveal `#game-message`; replay must go through `resetGame()`. Pause must stop simulation updates without stopping rendering.
- Keep UI colors and typography aligned with the CSS variables and the existing `DM Mono` / `Space Grotesk` pairing. Avoid inline styles in HTML when a rule belongs in `style.css`.
- The game currently loads fonts from Google Fonts via `@import`; preserve that external font dependency unless the project is intentionally made offline-capable.

## Repository notes

- The project is intentionally minimal and static; avoid adding package managers or build tooling unless there is a clear project need.
- Prefer surgical edits that preserve the current structure and gameplay conventions instead of introducing new abstractions.
