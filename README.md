# Zored Ableton Push 2
My vision [Ableton Push 2](https://www.ableton.com/en/push/).

I use it to control my development workflow.

## How does it work.
There are two basic concepts: *device* and *flow*.

### Device
Device basically consists from inputs and display.
- **Inputs** is a simple abstraction to listen for buttons, knobs and control stripe. Also, you can control lights and animation.
- To make inputs work I use [this library](https://www.npmjs.com/package/@guillaumearm/ableton-push2). I call it from `device.push2`.
- **Display** draws pixels from canvas using [other library](https://github.com/halfbyte/ableton-push-canvas-display).
- Also display is backed with **HTML** browser instance. We take screenshots from it and draw it on canvas.
