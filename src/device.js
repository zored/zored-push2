import ableton from 'ableton-push2';
import {Button} from './inputs.js';
import {LocalPush2} from './local_push2.js';
import { createInterface } from "node:readline"


export class Device {
  constructor(inputs, display, config) {
    this.inputs = inputs;
    this.display = display;
    this.config = config;
    this.push2 = null;
    this.drawInputTimeout = null;
    this.closing = false;
  }

  async afterStart() {
    await this.readLocalInputs();
  }

  async readLocalInputs() {
    if (!this.config.isLocal()) {
      return
    }
    console.log('JSON for emit midi:');
    for await (const line of createInterface({ input: process.stdin })) {
      const v = JSON.parse(line);
      this.push2.emitMidi(v);
      console.log('Input: ');
    }
  }

  async start() {
    this.onExit();
    await this.initPush2();
    this.listen(v => this.inputs.listen(v));
    await this.display.start();
  }

  async initPush2() {
    if (this.config.isLocal()) {
      this.push2 = new LocalPush2();
      return
    }
    const p = new ableton.Push2('user');
    const [sensitivities] = await Promise.all([
      p.get400gPadValues(),
      p.setTouchStripConfiguration(undefined),
      p.setDisplayBrightness(255),
    ]);
    p.setAftertouchMode('poly');

    Object.entries(sensitivities)
      .forEach(([scene, values]) =>
        p.set400gPadValues(scene, Object.values(values).map(v => Math.round(v * 0.4))),
      );
    this.push2 = p;
  }

  listen(f) {
    this.push2.midi.setMaxListeners(255);
    this.push2.midi.on('message', f);
  }

  async displayCommand(id, data) {
    await this.display.html.sendCommand(id, data);
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
    ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM', 'uncaughtException'].forEach((v) => {
      process.on(v, e => this.close(v, e));
    });
  }

  reset() {
    this.display.reset().then();
    this.inputs.clear();
    this.drawInputs();
  }

  close(v, e) {
    console.log({v,e});
    if (this.closing) {
      return
    }
    this.closing = true;
    this.reset();
    this.display.close();
    this.push2.close();
  }
}
