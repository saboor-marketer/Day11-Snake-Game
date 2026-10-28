# VIPER // 84

A neon arcade take on Snake, built for desktop and mobile browsers. Collect energy cores, build score multipliers, and keep your snake alive as the pace increases.

## Getting started

**Requirements:** Node.js 20.19 or later in the 20.x release line, or Node.js 22.12 or later, and npm.

Install the dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. To make the development server accessible to another device on your network, run `npm run dev -- --host 0.0.0.0` and open the network URL shown in the terminal.

To build and preview the production version:

```sh
npm run build
npm run preview
```

The build is written to `dist/`. JavaScript and CSS are inlined into the generated HTML; the Google Fonts referenced by the page still require a network connection.

## How to play

Choose your arena and speed on the start screen, then start the game. Collect the pink cores to grow and score points. Avoid running into your own body, and watch the walls if you are playing in Walls mode.

- **Walls:** Hitting the edge ends the run.
- **Phase:** Crossing an edge brings you out on the opposite side.
- **Arcade / Turbo:** Choose a starting speed. The snake accelerates as you collect standard cores.

Each standard core is worth 100 points multiplied by your current combo. Collect another core within 4.8 seconds to increase the multiplier, up to 8x. After every third standard core, a timed golden core can appear if one is not already active. Golden cores last 7.5 seconds, have a 250-point base value, and raise an active combo by two or start one at 2x.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Steer | Arrow keys or WASD | Swipe on the arena or use the on-screen D-pad |
| Start or play again | Space or Enter | Tap the start or play-again button |
| Pause or resume | P or Escape | Tap the pause or resume button |
| Restart while paused | R | Tap Restart in the pause menu |
| Toggle sound | M | Tap the sound button |

The game buffers up to two turns and prevents immediate reversals. Use the gamepad button in the top bar to show or hide the D-pad. Screen shake can be toggled from the pause menu.

## High scores and settings

The top five scores and game settings are stored in the browser's `localStorage`; they do not sync between devices or browsers. A qualifying run lets you edit a three-character callsign. Scores of zero are not recorded.

The leaderboard starts with five sample scores. Select **View Top 5 High Scores** on the start screen and choose **Reset** to restore those sample entries. Clearing browser storage also removes saved scores and settings.

## Project structure

- `src/App.tsx`: game state, input handling, and animation loop.
- `src/components/`: HUD, touch controls, and game-state overlays.
- `src/utils/canvasRenderer.ts`: canvas rendering, particles, and visual effects.
- `src/utils/soundEngine.ts`: procedural audio effects using the Web Audio API.
- `src/utils/storage.ts`: local leaderboard and settings persistence.
- `src/types/game.ts`: shared game types.

The interface uses React, TypeScript, Tailwind CSS, and Lucide icons. The playfield is rendered with HTML Canvas using `requestAnimationFrame` and interpolated movement.