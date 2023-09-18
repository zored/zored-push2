import ableton from 'ableton-push2';
import {Button} from './inputs.js';

export class Device {
  constructor(inputs, display) {
    this.inputs = inputs;
    this.display = display;
    this.push2 = null;
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
      p.setTouchStripConfiguration(),
      p.setDisplayBrightness(255),
    ]);
    p.setAftertouchMode('poly');
    this.push2 = p;
  }

  listen(f) {
    this.push2.midi.on('message', f);
  }

  drawInputs() {
    Object.values(this.inputs.index).filter(v => v.touched).map(v => {
      if (v instanceof Button) {
        const key = v.key();
        console.log({key, color: v.color})
        this.push2.setColor(key, v.color);
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
