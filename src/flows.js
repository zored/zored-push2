import {DigitsOutput, CubeOutput} from './outputs.js';
import {IntegratorFlow} from './flows/integrator_flow.js';

export class Flows {
  constructor(device) {
    this.device = device;
    this.flows = [
      new IntegratorFlow(device),
      new ColorsFlow(device, 0),
      new ColorsFlow(device, 64),
      new CalcFlow(device),
    ];
    this.index = 0;
  }

  async start() {
    await this.update();
  }

  listenKnob() {
    this.device.inputs.a.knobs[0].listen(({up}) => {
      const before = this.index;
      this.index += up ? 1 : -1;
      this.index = this.index < 0 ? this.flows.length - 1 : (this.index >= this.flows.length ? 0 : this.index);
      this.update();
    });
  }

  async update() {
    this.device.reset();
    this.listenKnob();
    const r = this.flows[this.index].start();
    if (r instanceof Promise) {
      await r
    }
  }
}

class ColorsFlow {
  constructor(device, offset = 0) {
    this.device = device;
    this.offset = offset;
  }

  start() {
    this.device.inputs.a.pads.forEach(v => {
      v.setColor((v.x - 1) * 8 + v.y + this.offset);
      v.listen(({up}) => {
        if (up) {
          console.log(v.color);
        }
      });
    });
    this.device.drawInputs();

    const size = 100;
    const d = this.device.display;
    const cube = new CubeOutput(
      d.width / 2 - size / 2,
      d.height / 2 - size / 2,
      size,
      size,
    );
    d.addDrawable(cube);
    this.device.inputs.a.knobs[1].listen(({up}) => {
      cube.speed += (up ? 1 : -1) * 0.1;
    })
  }
}

class CalcFlow {
  constructor(device) {
    this.device = device;
  }

  start() {
    const digitsOutput = new DigitsOutput(this.device.display);
    const pressedColor = 14;
    const digitColor = 8;
    const deleteColor = 78;

    this.device.inputs.a.pads.forEach(v => {
      const offset = 2;
      const x = v.x - offset;
      const y = v.y - offset;
      if ((x >= 1 && x <= 3 && y >= 1 && y <= 3) || (x === 4 && y === 2)) {
        const digit = x === 4 ? 0 : (x - 1) * 3 + y;
        responsiveButton(
          () => digitsOutput.value += digit,
          v, this.device, digitColor, pressedColor,
        );
      }
      if (x === 4 && y === 1) {
        responsiveButton(
          () => digitsOutput.value = digitsOutput.value.slice(0, -1),
          v, this.device, deleteColor, pressedColor,
        );
      }
    });
    this.device.display.addDrawable(digitsOutput);
    this.device.drawInputs();
  }
}

function responsiveButton(f, button, device, releasedColor, pressedColor) {
  button.setColor(releasedColor);
  button.listen(({up}) => {
    const color = up ? releasedColor : pressedColor;
    button.setColor(color);
    if (!up) {
      f();
    }
    device.drawInputs();
  });

  device.drawInputs();
}
