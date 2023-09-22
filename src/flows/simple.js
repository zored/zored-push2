import {Flow} from './flow.js';
import robot from 'robotjs';


export class Simple extends Flow {
  async start() {
    this.zoom();
  }

  zoom() {
    const b = this.device.inputs.a.pads[0];
    let muted = true;
    const colors = this.device.inputs.colors;
    const color = colors.blue;
    const colorPulse = colors.red;
    const colorPressed = colors.orange
    b.setColor(color);
    let zoomMuted = false;
    b.listen(async ({up}) => {
      if (!up) {
        b.setColor(colorPressed);
        return;
      }
      robot.keyTap('o', ['control', 'command', 'shift', 'alt']);
      muted = !muted;
      b.setColor(muted ? color : colorPulse)
      b.setAnimation(muted ? 'stopTransition' : 'pulsingHalf');
    });
  }
}
