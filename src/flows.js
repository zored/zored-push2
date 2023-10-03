import {Integrator} from './flows/integrator.js';
import {Colors} from './flows/colors.js';
import {Simple} from './flows/simple.js';

export class Flows {
  constructor(device) {
    this.device = device;
    this.index = 0;
    this.flows = this.initFlows();
  }

  initFlows() {
    const d = this.device;
    return [
      new Simple(d),
      new Integrator(d),
      new Colors(d, 0),
      new Colors(d, 64),
    ];
  }

  async start() {
    this.device.reset();
    this.switchOnKnob();
    await Promise.all(this.flows.map(async (v, i) => await (i === this.index
        ? v.start()
        : v.stop()
    )));
  }

  switchOnKnob() {
    this.device.inputs.a.knobs[0].listen(async ({up}) => {
      this.index += up ? 1 : -1;
      this.index = this.index < 0
        ? this.flows.length - 1
        : (this.index >= this.flows.length ? 0 : this.index);
      await this.start();
    });
  }
}
