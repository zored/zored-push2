import {Drawable} from '../display.js';
import fs from 'fs';


export class IntegratorFlow {
  constructor(device) {
    this.device = device;
    this.data = null;
    this.priorityPurposeColors = {
      integrator: 'turquoise',
      service: 'green',
      tool: 'peach',
      lib: 'orange',
    };
    this.selected = {};
  }

  async start() {
    const buttons = await this.createButtons();
    const loading = buttons.addButton('loading...');
    loading.disabled = true;
    if (!this.data) {
      await this.loadData();
    }
    if (this.stopped) {
      return;
    }
    loading.text = '';

    const d = this.data;
    this.device.inputs.a.pads.forEach((v, i) => {
      const repo = this.data.Repos[i];
      const repoName = repo.Repo.Name;
      const buttonColorName = this.priorityPurposeColors[repo.Repo.Purpose];
      const colors = this.device.inputs.colors;
      const clickedColor = colors.blue;
      const active = repo.Git.Reference === this.data.Branch || repo.Repo.Name === 'integrator';
      const buttonColor = colors[buttonColorName + (active ? '' : 'Dark')];
      v.setColor(buttonColor);
      v.listen(({up}) => {
        if (up) {
          if (this.selected[repoName]) {
            delete this.selected[repoName];
            v.setAnimation('stopTransition');
          } else {
            this.selected[repoName] = true;
            v.setAnimation('pulsingHalf');
          }
          v.setColor(buttonColor);

          buttons.reset();
          const fixes = Object.keys(this.selected).map(v => this.data.Fixes[v]);
          if (fixes.length) {
            fixes.reduce((a, b) => (a || []).filter(c => (b || []).includes(c || [])))
              ?.slice(0, 16)
              ?.forEach((v, i) => buttons.addButton(v, async (button, v, index) => {
                console.log({
                  button,
                  v,
                  index
                })
              }, i > 8 ? 1 : 0, i % 8))
          }
        } else {
          v.setColor(clickedColor);
        }
        this.device.drawInputs();
      });
      this.device.drawInputs();
    });
  }

  async createButtons() {
    const r = new DisplayButtons(this.device);
    r.init();
    return r;
  }

  async loadData() {
    const f = 'debug_integrator_data.json';
    if (fs.existsSync(f)) {
      this.data = JSON.parse(fs.readFileSync(f, 'utf8'));
      return;
    }

    const r = await (await fetch('http://localhost/data', {method: 'POST'})).json();
    const purposes = Object.keys(this.priorityPurposeColors);
    r.Repos.sort((a, b) => {
      const purpose = v => purposes.indexOf(v.Repo.Purpose);
      const name = v => v.Repo.Name;
      const byIntegrator = v => name(v) === 'integrator' ? -1 : 0;
      const bySwagger = v => name(v) === 'swagger' ? -1 : 0;
      return byIntegrator(a) - byIntegrator(b) ||
        bySwagger(a) - bySwagger(b) ||
        purpose(a) - purpose(b) ||
        name(a) - name(b);
    });
    this.data = r;
  }
}

export class DisplayButtons extends Drawable {
  constructor(device) {
    super(0, 0, 0, 0);
    this.buttons = [];
    this.device = device;
  }

  reset() {
    this.buttons = [];
  }

  addButton(text, up = async (button, v, index) => {
  }, row = 0, index = 0) {
    const o = {
      text,
      up,
    };
    this.buttons[row * 8 + index] = o;
    return o;
  }

  init() {
    this.device.display.addDrawable(this);
    this.listen();
  }

  listen() {
    [
      ...this.device.inputs.a.buttons.top,
      ...this.device.inputs.a.buttons.bottom,
    ].forEach(v => {
      v.listen(async ({up}) => {
        if (!up) {
          return;
        }
        const index = v.displayButtonIndex();
        let button = this.buttons[index];
        if (!button) {
          button = this.buttons[index] = {disabled: true};
        }
        if (button.disabled) {
          return;
        }
        button.disabled = true;
        v.setColor(96);
        this.device.drawInputs();
        try {
          await button?.up?.(button, v, index);
        } catch (e) {
          console.error({
            e,
            msg: 'error in button listener',
          });
        }
        button.disabled = false;
        v.setColor(11);
        this.device.drawInputs();
      });
    });
    this.device.drawInputs();
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
        ctx.fillStyle = display.colors[button.disabled ? 'disabled' : 'primary'];
        ctx.textBaseline = top ? 'top' : 'bottom';
        ctx.textAlign = 'center';
        ctx.font = '18px Arial';
        ctx.fillText(button.text, x + width / 2, y, width);
      }
    }
  }
}
