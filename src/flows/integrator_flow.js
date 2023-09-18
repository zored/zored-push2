import {Drawable} from '../display.js';

export class IntegratorFlow {
  constructor(device) {
    this.device = device;
  }

  async start() {
    await this.prepareButtons();
  }

  async prepareButtons() {
    const displayButtons = new DisplayButtons();
    this.device.display.addDrawable(displayButtons);
    const example = displayButtons.addButton('example');
    setTimeout(() => example.disabled = true, 1000);
    displayButtons.listen(this.device);

    const r = await (await fetch('http://localhost/data', {method: 'POST'})).json();
    const purposes = ['integrator', 'service', 'tool', 'lib'];
    r.Repos.sort((a, b) => {
      const purpose = v => v.Repo.Purpose;
      const name = v => v.Repo.Name;
      return purpose(a) === purpose(b)
        ? name(a) > name(b) ? 1 : -1
        : purpose(a) > purpose(b) ? 1 : -1;
    });
  }
}

export class DisplayButtons extends Drawable {
  constructor() {
    super(0, 0, 0, 0);
    this.buttons = [];
  }

  addButton(text, row = 0, index = 0) {
    const o = {text};
    this.buttons[row * 8 + index] = o;
    return o;
  }

  listen(device) {
    [
      ...device.inputs.a.buttons.top,
      ...device.inputs.a.buttons.bottom,
    ].forEach(v => {
      v.listen(({up}) => {
        if (up) {
          console.log(`BUTTON CLICKED!`);
          v.toggleLight(!v.color);
          device.drawInputs();
        }
      });
    });
    device.drawInputs();
  }

  draw(ctx, display) {
    const width = display.width / 8;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 2; j++) {
        const x = i * width;
        const top = j == 0;
        const textMargin = 5;
        const y = top ? textMargin : display.height - textMargin;
        const button = this.buttons[i + j * 8];
        if (!button) {
          continue;
        }
        ctx.fillStyle = display.colors[button.disabled ? 'secondary' : 'primary'];
        ctx.textBaseline = top ? 'top' : 'bottom';
        ctx.textAlign = 'center';
        ctx.font = '18px Arial';
        ctx.fillText(button.text, x + width / 2, y, width);
      }
    }
  }
}
