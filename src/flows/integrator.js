import fs from 'fs';
import {Flow} from './flow.js';


export class Integrator extends Flow {
  constructor(device) {
    super(device);
    this.data = null;
    this.priorityPurposeColors = {
      integrator: 'turquoise',
      service: 'green',
      tool: 'peach',
      lib: 'orange',
    };
    this.selected = {};
    this.displayButtons = null;
  }

  exampleData() {
    this.data = {
      Repos: [
        {
          Repo: {
            Name: 'example',
            Purpose: 'integrator',
          },
          Git: {Reference: 'master'},
        },
      ],
      Branch: 'master',
    };
  }

  async init() {
    await super.init();
    this.displayButtons = new DisplayButtons(this.device);
    this.displayButtons.init();
    await this.loadData();
  }

  async start() {
    await super.start();
    if (!this.running) {
      return;
    }
    this.initInputs();
  }

  initInputs() {
    this.device.inputs.a.pads.forEach((v, i) => {
      const
        repo = this.data.Repos[i],
        name = repo.Repo.Name,
        buttonColorName = this.priorityPurposeColors[repo.Repo.Purpose],
        colors = this.device.inputs.colors,
        active = repo.Git.Reference === this.data.Branch || repo.Repo.Name === 'integrator',
        buttonColor = colors[buttonColorName + (active ? '' : 'Dark')],
        clickedColor = colors.blue;

      v.setColor(buttonColor);
      v.listen(({up}) => {
        if (!up) {
          v.setColor(clickedColor);
          return;
        }

        // color and animation:
        if (this.selected[name]) {
          delete this.selected[name];
          v.setAnimation('stopTransition');
        } else {
          this.selected[name] = true;
          v.setAnimation('pulsingHalf');
        }
        v.setColor(buttonColor);

        // change active display buttons:
        this.displayButtons.reset();
        const selectedRepos = Object.keys(this.selected);
        this.device.displayCommand('intro', {text: selectedRepos.map(v => v.replace('-service', '')).join(' + ')}).then();
        const fixes = selectedRepos.map(v => this.data.Fixes[v]);
        if (!fixes.length) {
          return;
        }
        fixes.reduce((a, b) => (a || []).filter(c => (b || []).includes(c || [])))
          ?.slice(0, 16)
          ?.forEach((v, i) => this.displayButtons.setButton(v, async (button, v, index) => {
            const r = await this.runFix(selectedRepos, button.text);
            if (r && r.error) {
              console.error(r)
            }
          }, i > 8 ? 1 : 0, i % 8));
      });
    });
  }

  async runFix(repos, FixName) {
    for (const repo of repos) {
      try {
        const r = await (await fetch('http://localhost/fix', {
          'headers': {
            'content-type': 'application/json',
          },
          'body': JSON.stringify({
            FixRepoFilter: repo,
            FixName,
            TestType: 'integration',
          }),
          'method': 'POST',
        })).json();
        if (r.error_message) {
          return {repo: repo, error: r.error_message};
        }
      } catch (e) {
        return {repo: repo, error: e};
      }
    }
  }

  async loadData() {
    this.displayButtons.reset();
    const loading = this.displayButtons.setButton('loading');
    loading.disabled = true;

    // load debug data:
    const f = 'debug_integrator_data.json';
    if (fs.existsSync(f)) {
      this.data = JSON.parse(fs.readFileSync(f, 'utf8'));
      loading.text = '';
      return;
    }

    // query real data:
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
    this.displayButtons.reset();
  }
}

export class DisplayButtons {
  constructor(device) {
    this.buttons = [];
    this.device = device;
  }

  reset() {
    this.buttons = [];
    this.syncDisplay();
  }

  setButton(text, up = async (button, v, index) => {
  }, row = 0, index = 0) {
    const o = {
      text,
      up,
      row,
      index,
    };
    this.buttons[row * 8 + index] = o;
    this.syncDisplayLater();
    return o;
  }

  syncDisplayLater() {
    clearTimeout(this.syncDisplayTimeout);
    this.syncDisplayTimeout = setTimeout(() => {
      this.syncDisplay();
    }, 1)
  }

  syncDisplay() {
    this.device.displayCommand('displayButtons', {all: this.buttons}).then();
  }

  init() {
    this.listen();
  }
  toggleButton(b, enabled) {
    if (!b) {
      return;
    }
    b.disabled = !enabled;
    this.syncDisplayLater();
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
        this.toggleButton(button, false);
        v.setColor(96);
        try {
          await button?.up?.(button, v, index);
        } catch (e) {
          console.error({
            e,
            msg: 'error in button listener',
          });
        }
        this.toggleButton(button, true);
        v.setColor(11);
      });
    });
  }
}
