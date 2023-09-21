import nodeHtmlToImage from 'node-html-to-image';
import {Image} from 'canvas';

import {Cluster} from 'puppeteer-cluster';

export class HTMLFlow {
  constructor(device) {
    this.device = device;
    this.touched = true;
    this.image = null;
    this.text = 'loading...'
  }

  async start() {
    this.device.display.addDrawable(this);

    this.text = 'loading cluster...';
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 2,
      timeout: 30000,
      puppeteerOptions: {headless: 'new'},
    });
    this.text = 'loading page...';
    await cluster.execute({}, async ({
                                       page,
                                       data,
                                     }) => {
      page.setDefaultTimeout(30000);
      await page.setContent(`<html>
        <head>
          <style>
            body {
              width: ${this.device.display.width}px;
              height: ${this.device.display.height}px;
            }
          </style>
          <script>
              window.onload = () => {
                setInterval(() => {
                    document.body.innerHTML = 'Hello ' + new Date().getTime();  
                }, 100);
                
              };
          </script>
        </head>
        <body>loading...</body></html>`, {waitUntil: 'networkidle0'});

      this.text = 'loading screenshot...';
      for (let i = 0; i < 1000; i++) {
        console.log('screenshot', i);
        const src = await (await page.$('body')).screenshot({
          encoding: 'base64',
        });
        const img = new Image();
        img.onload = async () => {
          this.image = img;
        };
        img.src = `data:image/png;base64,${src}`;
      }
    });
    await cluster.idle();
    await cluster.close();
  }

  draw(ctx, display) {
    if (!this.image) {
      // write loading in middle of display:
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, display.width, display.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.text, display.width / 2, display.height / 2);
      return;
    }
    ctx.drawImage(this.image, 0, 0, display.width, display.height);
  }
}
