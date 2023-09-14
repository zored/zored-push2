import {Display} from './src/display.js';
import {InputTree} from './src/inputs.js';
import {Device} from './src/device.js';
import {Config} from './src/config.js';
import {ColorsFlow} from './src/flow/colors.js';

((async function () {
  const config = new Config();

  const display = new Display();
  const inputs = new InputTree(config);
  const device = new Device();

  display.start();
  await device.start();
  device.listen(v => inputs.listen(v));
})()).then();
