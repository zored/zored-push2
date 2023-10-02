import fs from 'fs';
import {Cluster} from 'puppeteer-cluster';
import {Image} from 'canvas';

export class Browser {
  constructor(config) {
    this.config = config;
    this.image = null;
    this.text = 'loading...';
    this.running = true;
    this.page = null;
    this.url = null;
  }

  async goto(url) {
    if (!this.page || this.url === url) {
      return;
    }
    this.url = url;
    if (!url) {
      await this.gotoDefault();
    } else {
      await Promise.all([this.page.waitForNavigation(), this.page.goto(url, {
        timeout: 0,
        waitUntil: 'networkidle0',
      })]);
    }
    await this.listenCommands();
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
      await page.setViewport({
        width: canvas.width,
        height: canvas.height,
      });
      await this.gotoDefault();
      if (this.config.isLocal()) {
        // wait forever
        await new Promise(() => {
        });
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

  async gotoDefault() {
    await this.page.goto('about:blank', {
      timeout: 0,
      waitUntil: 'networkidle0',
    });
    await this.page.setContent(
      fs.readFileSync('html/screen.html', 'utf8'),
      {waitUntil: 'networkidle0'},
    );
  }

  async close() {
    this.running = false;
    // await this.cluster.idle();
    await this.cluster.close();
  }

  async listenCommands() {
    await this.page.exposeFunction('zoredPush2Call', (id, data) => {
      console.log({id, data, msg: 'call to zoredPush2Call'});
    })
  }

  async sendCommand(id, data) {
    if (!this.page) {
      console.log({msg: 'no page to send command to'});
      return;
    }

    try {
      await this.page.evaluate(({
                                  id,
                                  data,
                                }) => {
        window.handleCommand(id, data);
      }, {
        id,
        data,
      });
    } catch (e) {
      console.error({
        e,
        msg: 'error sending command',
      });
    }
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
