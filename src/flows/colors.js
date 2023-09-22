import {Flow} from './flow.js';

export class Colors extends Flow {
  constructor(device, offset = 0) {
    super(device);
    this.offset = offset;
    this.palette = {};
  }

  async start() {
    await super.start();
    this.colorPadsLogOnChange();

  }
  async init() {
    this.loadPalettes();
  }

  colorPadsLogOnChange() {
    this.device.inputs.a.pads.forEach((v) => {
      const color = (v.x - 1) * 8 + (v.y-1) + this.offset;
      v.setColor(color);
      v.listen(async ({up}) => {
        if (!up) {
          return;
        }
        ['bottom', 'top'].forEach(row => this.device.inputs.a.buttons[row][v.y - 1].setColor(color));
        await this.device.displayCommand('logColor', {
          color,
          palette: this.palette[color],
        });
      });
    });
  }

  async loadPalettes() {
    for (let i = 0; i < 128; i++) {
      this.palette[i] = await this.device.push2.getLEDColorPaletteEntry(i)
    }
  }
}
