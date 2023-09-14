import {initPush, sendFrame} from 'ableton-push-canvas-display';


import {createCanvas} from 'canvas';


export class Display {
  constructor() {
    this.width = 960;
    this.height = 160;
    this.canvas = null;
    this.ctx = null;
    this.colors = {
      bg: '#000',
      bgOpaque: 'rgba(255,255,255, 0.3)',
    }
  }

  draw() {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;
    const colors = this.colors;

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = colors.bgOpaque;
    for (let i = 0; i < 8; i++) {
      if (i % 2 !== 0) {
        ctx.fillRect(i * width / 8, 0, width / 8, height);
      }
    }
    for (let i = 0; i < 4; i++) {
      if (i % 2 !== 0) {
        ctx.fillRect(0, i * height / 4, width, height / 4);
      }
    }
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
