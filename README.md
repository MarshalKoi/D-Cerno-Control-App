# D-Cerno AV system control app
This project was created as a learning experience and a pilot program for a D-Cerno Control App.
What is D-Cerno? D-Cerno is a Televic Conference digital discussion system designed for small to medium-sized meetings.

Tech stack:  Nodejs + Deno+ Tauri app + Reactjs

- Why Tauri? Cross-platform, Easier to develop frontend using JS and TS with React which was the team preferred language/framework of choice.
- Why Deno with Nodejs? Some of their devs where unfamiliar with Deno so they used Node for compiling and Deno for runtime. Deno is loaded as a sidecar. Eventually they will switch over to Deno completely this shouldn’t be too hard since Deno was used for all the API call logic.
- Why not use Rust? Again language preference, they wanted to use TS and Deno to have an easier development time.
