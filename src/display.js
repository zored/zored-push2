import {initPush, sendFrame} from 'ableton-push-canvas-display';


import {createCanvas} from 'canvas';
import {Browser} from './browser.js';

export class Display {
  constructor(config) {
    this.config = config;
    this.width = 960;
    this.height = 160;
    this.canvas = null;
    this.ctx = null;
    this.colors = {
      bg: '#000',
      bgOpaque: 'rgba(255,255,255,0.1)',
      secondary: '#880',
      primary: '#ff3',
      disabled: '#444',
    };
    this.end = false;
  }

  async start() {
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
    this.browser = new Browser(this.config);
    this.startDrawLoop();
    await this.browser.start(this.canvas);
  }

  close() {
    this.end = true;
    this.browser.close();
  }

  async reset() {
    await this.browser.sendCommand('reset', null);
  }

  async listenBrowserCommands() {
    await this.browser.listenCommands();
  }

  draw() {
    if (this.end) {
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.width, this.height);
      return;
    }
    this.browser.draw(this.ctx, this.canvas);
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

  startDrawLoop() {
    if (this.config.isLocal()) {
      return;
    }
    initPush(err => {
      if (err) {
        console.log({
          err,
          msg: 'error initializing push',
        });
      }
      this.drawLoop();
    });
  }
}


// put in init:
// this.displayButtons = new DisplayButtons(this.device);
// this.displayButtons.init();
export class DisplayButtons {
  constructor(device) {
    this.buttons = [];
    this.device = device;
  }

  reset() {
    this.buttons = [];
    this.syncDisplay();
  }

  setButton(text, up = async (button, v, index) => {
  }, row = 0, index = 0) {
    const o = {
      text,
      up,
      row,
      index,
    };
    this.buttons[row * 8 + index] = o;
    this.syncDisplayLater();
    return o;
  }

  syncDisplayLater() {
    clearTimeout(this.syncDisplayTimeout);
    this.syncDisplayTimeout = setTimeout(() => {
      this.syncDisplay();
    }, 1);
  }

  syncDisplay() {
    this.device.displayCommand('displayButtons', {all: this.buttons}).then();
  }

  init() {
    this.listen();
  }

  toggleButton(b, enabled) {
    if (!b) {
      return;
    }
    b.disabled = !enabled;
    this.syncDisplayLater();
  }

  listen() {
    [
      ...this.device.inputs.a.buttons.top,
      ...this.device.inputs.a.buttons.bottom,
    ].forEach(v => {
      v.listen(async ({up}) => {
        if (!up) {
          return;
        }
        const index = v.displayButtonIndex();
        let button = this.buttons[index];
        if (!button) {
          button = this.buttons[index] = {disabled: true};
        }
        if (button.disabled) {
          return;
        }
        this.toggleButton(button, false);
        v.setColor(96);
        try {
          await button?.up?.(button, v, index);
        } catch (e) {
          console.error({
            e,
            msg: 'error in button listener',
          });
        }
        this.toggleButton(button, true);
        v.setColor(11);
      });
    });
  }
}
