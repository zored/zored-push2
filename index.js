import {Display} from './src/display.js';
import {InputTree} from './src/inputs.js';
import {Device} from './src/device.js';
import {Config} from './src/config.js';
import {Flows} from './src/flows.js';

((async function () {
  const device = await startDevice();
  new Flows(device).start();
})()).then();

async function startDevice() {
  const device = new Device(
    new InputTree(new Config()),
    new Display(),
  );
  await device.start();
  return device;
}
