import {Drawable} from './display.js';

export class Flows {
  constructor(device) {
    this.device = device;
    this.flows = [
      new ColorsFlow(device, 0),
      new ColorsFlow(device, 64),
      new CalcFlow(device),
    ];
    this.index = 0;
  }

  start() {
    this.update();
  }

  listenKnob() {
    this.device.inputs.a.knobs[0].listen(({up}) => {
      const before = this.index;
      this.index += up ? 1 : -1;
      this.index = this.index < 0 ? this.flows.length - 1 : (this.index >= this.flows.length ? 0 : this.index);
      console.log({
        before,
        after: this.index,
        up,
      });
      this.update();
    });
  }

  update() {
    this.device.reset();
    this.listenKnob();
    this.flows[this.index].start();
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
  }
}

class CalcFlow {
  constructor(device) {
    this.device = device;
  }

  start() {
    const digitsInput = new DigitsInput(this.device.display);
    const pressedColor = 14;
    const digitColor = 21;
    const deleteColor = 4;
    this.device.inputs.a.pads.forEach(v => {
      const offset = 2;
      const x = v.x - offset;
      const y = v.y - offset;
      if ((x >= 1 && x <= 3 && y >= 1 && y <= 3) || (x === 4 && y === 2)) {
        const digit = x === 4 ? 0 : (x - 1) * 3 + y;
        v.setColor(digitColor);
        v.listen(({up}) => {
          const color = up ? digitColor : pressedColor;
          v.setColor(color);
          this.device.drawInputs();
          if (!up) {
            digitsInput.value += digit;
          }
        });
      }
      if (x === 4 && y === 1) {
        v.setColor(deleteColor);
        v.listen(({up}) => {
          const color = up ? deleteColor : pressedColor;
          v.setColor(color);
          this.device.drawInputs();
          if (!up) {
            digitsInput.value = digitsInput.value.slice(0, -1);
          }
        });
      }
    });
    this.device.display.addDrawable(digitsInput);
    this.device.drawInputs();
  }
}

class DigitsInput extends Drawable {
  constructor(display) {
    const width = 100;
    const height = 30;
    const x = display.width / 2 - width / 2;
    const y = display.height / 2 - height / 2;
    super(x, y, width, height);

    this._value = '';

  }

  get value() {
    return this._value;
  }

  set value(v) {
    this._value = v
    this.touched = true;
  }

  draw(ctx, display) {
    ctx.fillStyle = display.colors.bg;
    ctx.strokeStyle = display.colors.secondary;
    ctx.fillRect(this.x, this.y, this.width, this.height)
    ctx.strokeRect(this.x, this.y, this.width, this.height)

    ctx.fillStyle = display.colors.primary;
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.value, this.x + this.width / 2, this.y + this.height / 2);

    this.touched = false;
  }
}
