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
    this.selectedRepo = null;
    this.selectedButton = null;
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
    this.device.inputs.addListener(v => {
      this.device.displayCommand('input', v);
    });
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
      v.listen(async ({up}) => {
        if (!up) {
          v.setColor(clickedColor);
          return;
        }


        // color and animation:
        this.selectedButton?.setAnimation('stopTransition');
        if (this.selectedRepo === name) {
          this.selectedRepo = null;
        } else {
          this.selectedRepo = name;
          this.selectedButton = v;
          v.setAnimation('pulsingHalf');
        }
        v.setColor(buttonColor);

        await this.device.displayCommand('selectRepo', {name: this.selectedRepo});
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
