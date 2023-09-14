const {createCanvas} = require('canvas');
const {
  initPush,
  sendFrame,
} = require('ableton-push-canvas-display');
const abletonPush2Lib = require('ableton-push2');
const robotJS = require('robotjs');

const push2 = new abletonPush2Lib.Push2(port = 'user');
//push2.monitor();

let fontMultiplier = 1;
let speedMultiplier = 1;
let waveSize = 1;

push2.setColor([1, 8], 127);
push2.midi.on('message', (v) => {
  if (v._type === 'activesense') {
    return;
  }
  // { channel: 0, note: 36, velocity: 0, _type: 'noteoff' }
  if (v.channel === 0 && v._type === 'noteon') {
    if (v.note === 36) {
      const smiles = ['😊', '😄', '😆', '😂', '🤣'];
      const maxVelocity = 60;
      const smile = smiles[Math.floor(v.velocity * (smiles.length - 1) / maxVelocity)];
      robotJS.typeString(smile);
    }
  }
  // { channel: 0, value: 16320, _type: 'pitch' }
  if (v.channel === 0 && v._type === 'pitch') {
    const color = Math.round(v.value * 127 / 16320);
    push2.setColor([1, 8], color);
    console.log({color});
  }
  if (v.channel === 0 && v._type === 'cc') {
    if (v.controller === 71) {
      if (v.value === 1) {
        fontMultiplier += 0.01;
      } else if (v.value === 127) {
        fontMultiplier -= 0.01;
      }
    }
    if (v.controller === 72) {
      if (v.value === 1) {
        speedMultiplier += 0.01;
      } else if (v.value === 127) {
        speedMultiplier -= 0.01;
      }
    }
    if (v.controller === 73) {
      if (v.value === 1) {
        waveSize += 0.01;
      } else if (v.value === 127) {
        waveSize -= 0.01;
      }
    }
  }
  console.log(v);
});

const width = 960;
const height = 160;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

function drawFrame(frameNum) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  // draw 8 white column rects full push2.width:
  ctx.fillStyle = '#111';
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) {
      continue;
    }
    ctx.fillRect(i * width / 8, 0, width / 8, height);
  }

  // draw 4 white row rects full push2.height:
  ctx.fillStyle = 'rgba(255,255,255, 0.3)';
  for (let i = 0; i < 4; i++) {
    if (i % 2 === 0) {
      continue;
    }
    ctx.fillRect(0, i * height / 4, width, height / 4);
  }
  ctx.font = '800 ' + (20 * fontMultiplier) + 'px "SF Pro Display"';
  ctx.fillStyle = 'hsl(' + frameNum % 360 + ',100%,50%)';
  ctx.fillText('Привет, Женечка!', (frameNum * speedMultiplier - 100) % width, Math.sin(frameNum / 50) * height * waveSize * 0.4 + height / 2);
}

let frameNum = 0;

function nextFrame() {
  drawFrame(frameNum);
  frameNum++;
  sendFrame(ctx, err => setTimeout(nextFrame, 10));
}

initPush(err => {
  if (err) {
    console.log(err);
  }
  nextFrame();
});
