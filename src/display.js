import {initPush, sendFrame} from 'ableton-push-canvas-display';


import {createCanvas, Image} from 'canvas';

import {Cluster} from 'puppeteer-cluster';
import fs from 'fs';

export class Display {
  constructor(config) {
    this.config = config;
    this.width = 960;
    this.height = 160;
    this.canvas = null;
    this.ctx = null;
    this.colors = {
      bg: '#000',
      bgOpaque: 'rgba(255,255,255,0.1)',
      secondary: '#880',
      primary: '#ff3',
      disabled: '#444',
    };
    this.end = false;
  }

  async start() {
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
    this.html = new HTMLDisplay(this.config);
    this.startDrawLoop();
    this.html.start(this.canvas).then();
  }

  close() {
    this.end = true;
    this.html.close();
  }

  async reset() {
    await this.html.sendCommand('reset', null);
  }

  draw() {
    if (this.end) {
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.width, this.height);
      return;
    }
    this.html.draw(this.ctx, this.canvas);
  }

  drawLoop() {
    this.draw();
    sendFrame(
      this.ctx,
      err => setTimeout(
        () => this.drawLoop(),
        10,
      ),
    );
  }

  startDrawLoop() {
    if (this.config.isLocal()) {
      return;
    }
    initPush(err => {
      if (err) {
        console.log({
          err,
          msg: 'error initializing push',
        });
      }
      this.drawLoop();
    });
  }
}

export class HTMLDisplay {
  constructor(config) {
    this.config = config;
    this.image = null;
    this.text = 'loading...';
    this.running = true;
    this.page = null;
  }

  async start(canvas) {
    this.text = 'loading cluster...';
    const userDataDir = './var/puppeteer';
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, {recursive: true});
    }
    this.cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 2,
      timeout: 2147483647,
      userDataDir,
      puppeteerOptions: {
        headless: this.config.isLocal() ? false : 'new',
        args: [
          // '--autoplay-policy=user-gesture-required',
          // '--disable-background-networking',
          // '--disable-background-timer-throttling',
          // '--disable-backgrounding-occluded-windows',
          // '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-component-update',
          '--disable-default-apps',
          // '--disable-dev-shm-usage',
          // '--disable-domain-reliability',
          '--disable-extensions',
          '--disable-features=AudioServiceOutOfProcess',
          // '--disable-hang-monitor',
          // '--disable-ipc-flooding-protection',
          '--disable-notifications',
          // '--disable-offer-store-unmasked-wallet-cards',
          '--disable-popup-blocking',
          '--disable-print-preview',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          // '--disable-setuid-sandbox',
          '--disable-speech-api',
          // '--disable-sync',
          // '--hide-scrollbars',
          // '--ignore-gpu-blacklist',
          // '--metrics-recording-only',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-first-run',
          // '--no-pings',
          '--no-sandbox',
          // '--no-zygote',
          '--password-store=basic',
          '--use-mock-keychain',
        ],
      },
    });
    this.text = 'loading page...';
    await this.cluster.execute({}, async ({
                                            page,
                                            data,
                                          }) => {
      this.page = page;
      page.setDefaultTimeout(0);
      page.setDefaultNavigationTimeout(0);
      await page.setViewport({ width: canvas.width, height: canvas.height});
      await page.goto('about:blank');
      await page.setContent(
        fs.readFileSync('html/screen.html', 'utf8'),
        {waitUntil: 'networkidle0'},
      );
      if (this.config.isLocal()) {
        // wait forever
        await new Promise(() => {});
        return;
      }
      this.text = 'loading screenshot...';
      while (this.running) {
        try {
          const src = await (await page.$('body')).screenshot({
            encoding: 'base64',
          });
          const img = new Image();
          img.onload = async () => {
            this.image = img;
          };
          img.src = `data:image/png;base64,${src}`;
        } catch (e) {
          if (e.message.includes('Unable to capture screenshot')) {
            await new Promise(r => setTimeout(r, 100));
          }
        }
      }
    });
  }

  async close() {
    this.running = false;
    // await this.cluster.idle();
    await this.cluster.close();
  }

  async sendCommand(id, data) {
    if (!this.page) {
      console.log({msg: 'no page to send command to'});
      return;
    }
    await this.page.evaluate(({
                                id,
                                data,
                              }) => {
      window.handleCommand(id, data);
    }, {
      id,
      data,
    });
  }

  draw(ctx, canvas) {
    if (this.image) {
      ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
      return;
    }
    // write loading in middle of canvas:
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, canvas.width / 2, canvas.height / 2);
  }
}
