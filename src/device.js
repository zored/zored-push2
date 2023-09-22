import ableton from 'ableton-push2';
import {Button} from './inputs.js';

export class Device {
  constructor(inputs, display) {
    this.inputs = inputs;
    this.display = display;
    this.push2 = null;
    this.drawInputTimeout = null;
  }

  async start() {
    this.display.start();
    await this.configure();
    this.listen(v => this.inputs.listen(v));
    // this.onExit();
  }

  async configure() {
    const p = new ableton.Push2('user');
    await Promise.all([
      p.setTouchStripConfiguration(undefined),
      p.setDisplayBrightness(255),
    ]);
    p.setAftertouchMode('poly');
    this.push2 = p;
  }

  listen(f) {
    this.push2.midi.on('message', f);
  }

  drawInput() {
    clearTimeout(this.drawInputTimeout);
    this.drawInputTimeout = setTimeout(() => {
      this.drawInputTimeout = null;
      this.drawInputs();
    }, 0);
  }
  drawInputs() {
    Object.values(this.inputs.index).filter(v => v.touched).map(v => {
      if (v instanceof Button) {
        const key = v.key().replace(/^(key|control)_/, '');
        this.push2.setColor(key, v.color, v.animation || 0);
        v.touched = false;
      }
    });
  }

  onExit() {
    ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM'].forEach((v) => {
      process.on(v, () => this.close());
    });
  }

  reset() {
    this.display.clear();
    this.inputs.clear();
    this.drawInputs();
  }

  close() {
    this.display.close();
    this.reset();
    this.push2.close();
  }
}
