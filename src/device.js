import ableton from 'ableton-push2';

export class Device {
  async start() {
    this.push2 = new ableton.Push2('user');
    await Promise.all([
      this.push2.setTouchStripConfiguration(),
      this.push2.setDisplayBrightness(255)
    ])
    this.push2.setAftertouchMode('poly');
  }
  listen(f) {
    this.push2.midi.on('message', f);
  }
}
