import {initPush, sendFrame} from 'ableton-push-canvas-display';


import {createCanvas} from 'canvas';

export class Drawable {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.priority = 0;
    this.touched = true;
  }
  draw(ctx, display) {
  }
}

export class Display {
  constructor() {
    this.width = 960;
    this.height = 160;
    this.canvas = null;
    this.ctx = null;
    this.colors = {
      bg: '#000',
      bgOpaque: 'rgba(255,255,255,0.1)',
      secondary: '#880',
      primary: '#ff3',
    }
    this.end = false;
    this.drawables = [];
  }

  close() {
    this.end = true;
  }

  clear() {
    this.drawables = [];
  }

  addDrawable(drawable) {
    this.drawables.push(drawable);
    this.drawables.sort((a, b) => a.priority - b.priority);
  }

  removeDrawable(drawable) {
    this.drawables = this.drawables.filter(v => v !== drawable);
  }

  draw() {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;
    const colors = this.colors;
    if (this.end) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const timestamp = new Date().getTime();
    this.timestampDelta = timestamp - (this.timestamp || timestamp);
    this.timestamp = timestamp;
    if (!this.drawables.some(v => v.touched)) {
      return;
    }
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = colors.bgOpaque;
    // for (let i = 0; i < 8; i++) {
    //   if (i % 2 !== 0) {
    //     ctx.fillRect(i * width / 8, 0, width / 8, height);
    //   }
    // }
    // for (let i = 0; i < 4; i++) {
    //   if (i % 2 !== 0) {
    //     ctx.fillRect(0, i * height / 4, width, height / 4);
    //   }
    // }
    this.drawables.forEach(v => v.draw(ctx, this));
  }

  drawLoop() {
    this.draw();
    sendFrame(
      this.ctx,
      err => setTimeout(
        () => this.drawLoop(),
        10,
      ),
    );
  }

  start() {
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
    initPush(err => {
      if (err) {
        console.log(err);
      }
      this.drawLoop();
    });
  }
}
