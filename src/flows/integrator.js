import {Flow} from './flow.js';
import {DisplayButtons} from '../display.js';


export class Integrator extends Flow {
  constructor(device) {
    super(device);
    this.customUrl = 'http://localhost/';
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

  async start() {
    await super.start();
    if (!this.running) {
      return;
    }
    // todo
  }

  initInputs(data) {
    this.device.inputs.a.pads.forEach((v, i) => {
      const
        repo = data.Repos[i],
        name = repo.Repo.Name,
        buttonColorName = this.priorityPurposeColors[repo.Repo.Purpose],
        colors = this.device.inputs.colors,
        active = repo.Git.Reference === data.Branch || repo.Repo.Name === 'integrator',
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
        const fixes = selectedRepos.map(v => data.Fixes[v]);
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

  _exampleData() {
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
}
