import EventEmitter from 'events';

export class LocalPush2 {
  constructor() {
    this.keyColors = {}
    this.keyAnimations = {}
    this.midi = new EventEmitter();
  }

  emitMidi(v) {
    this.midi.emit('message', v);
  }

  setColor(key, color, animation) {
    this.keyColors[key] = color
    this.keyAnimations[key] = animation
  }

  close() {
  }

  getLEDColorPaletteEntry(i) {
    return {r: 255, g: 255, b: 0, w: 0}
  }
}
