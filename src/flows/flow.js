export class Flow {
  constructor(device) {
    this.device = device;
    this.inited = false;
    this.running = false;
    this.customUrl = null;
  }

  async start() {
    this.running = true;
    if (!this.inited) {
      await this.init();
      this.inited = true;
    }
    this.device.display.html.goto(this.customUrl);
  }

  async stop() {
    this.running = false;
  }

  // init is called once, when the flow is first started
  async init() {
  }
}
