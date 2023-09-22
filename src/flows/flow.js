export class Flow {
  constructor(device) {
    this.device = device;
    this.inited = false;
    this.running = false;
  }

  async start() {
    this.running = true;
    if (!this.inited) {
      await this.init();
      this.inited = true;
    }
  }

  async stop() {
    this.running = false;
  }

  // init is called once, when the flow is first started
  async init() {
  }
}
