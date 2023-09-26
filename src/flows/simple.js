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
    const colorPressed = colors.orange;
    b.setColor(color);
    let zoomMuted = false;
    b.listen(async ({up}) => {
      if (up) {
        muted = !muted;
        b.setColor(muted ? color : colorPulse);
        b.setAnimation(muted ? 'stopTransition' : 'pulsingHalf');
        return;
      }
      robot.keyTap('o', ['control', 'command', 'shift', 'alt']);
      b.setColor(colorPressed);
    });
  }
}
