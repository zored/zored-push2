import {Flow} from './flow.js';


export class Integrator extends Flow {
  constructor(device) {
    super(device);
    this.customUrl = 'http://localhost/#push2';
    this.data = null;
    this.priorityPurposeColors = {
      integrator: 'turquoise',
      service: 'green',
      tool: 'peach',
      lib: 'orange',
    };
    this.selected = {};
    this.displayButtons = null;
    this.inputsInited = false;
  }

  async init() {
    await super.init();
    await this.device.display.browser.events.on('command', ({
                                                              id,
                                                              data,
                                                            }) => {
      switch (id) {
        case 'expose-all':
          this.initInputs(data);
          break;
      }
    });
  }

  async start() {
    await super.start();
    if (!this.running) {
      return;
    }

    await this.device.display.listenBrowserCommands();

    this.listenNavi();
  }

  listenNavi() {
    const n = this.device.inputs.a.buttons.naviTop;
    [{
      button: n.down,
      action: () => {
        this.device.displayCommand('scrollDown');
      },
    }, {
      button: n.up,
      action: () => {
        this.device.displayCommand('scrollUp');
      },
    }].forEach(v => {
      v.button.listen(({up}) => {
        if (up) {
          return;
        }
        v.action();
      });
    });
    this.device.inputs.a.knobs[1].listen(async ({up}) => {
      await this.device.displayCommand(up ? 'scrollDown' : 'scrollUp', {value: 4});
    });
    this.device.inputs.a.knobs[2].listen(async ({up}) => {
      const k = this.device.display.browser.page.keyboard;
      if (up) {
        await k.press('Tab');
        return;
      }
      await k.down('ShiftLeft');
      await k.press('Tab');
      await k.up('ShiftLeft');
    });
  }

  initInputs(data) {
    if (this.inputsInited) {
      return;
    }
    this.inputsInited = true;
    this.device.inputs.a.pads.forEach((v, i) => {
      const
        repo = data.Repos[i],
        name = repo.Repo.Name,
        buttonColorName = this.priorityPurposeColors[repo.Repo.Purpose],
        colors = this.device.inputs.colors,
        active = repo.Git.Reference === data.branch || repo.Repo.Name === 'integrator',
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
        // this.displayButtons.reset();
        const selectedRepos = Object.keys(this.selected);
        // this.device.displayCommand('intro', {text: selectedRepos.map(v => v.replace('-service', '')).join(' + ')}).then();
        const fixes = selectedRepos.map(v => data.Fixes[v]);
        if (!fixes.length) {
          return;
        }
        // fixes.reduce((a, b) => (a || []).filter(c => (b || []).includes(c || [])))
        //   ?.slice(0, 16)
        //   ?.forEach((v, i) => this.displayButtons.setButton(v, async (button, v, index) => {
        //     const r = await this.runFix(selectedRepos, button.text);
        //     if (r && r.error) {
        //       console.error(r);
        //     }
        //   }, i > 8 ? 1 : 0, i % 8));
      });
    });
  }

  async runFix(repos, text) {
    console.log({
      repos,
      text,
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
      Fixes: {'core': ['go.mod tidy']},
      branch: 'master',
    };
  }
}
