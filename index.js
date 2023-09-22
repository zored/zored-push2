import {Display} from './src/display.js';
import {InputTree} from './src/inputs.js';
import {Device} from './src/device.js';
import {Config} from './src/config.js';
import {Flows} from './src/flows.js';

((async function () {
  try {

    const device = await startDevice();
    await new Flows(device).start();
  } catch (e) {
    console.log({e});
    process.exit(1);
  }
})()).then();

async function startDevice() {
  const device = new Device(
    new InputTree(new Config(), () => device.drawInputs()),
    new Display(),
  );
  await device.start();
  return device;
}
