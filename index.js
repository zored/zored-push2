const {createCanvas} = require('canvas')
const path = require('path')
const { initPush, sendFrame } = require('ableton-push-canvas-display')
const ableton = require('ableton-push2');

const device = new ableton.Push2(port='user');
//device.monitor();

let fontMultiplier = 1;
let speedMultiplier = 1;
let waveSize = 1;

device.midi.on('message', (v) => {
  if (v._type === 'activesense') {
    return;
  }
  if (v.channel === 0 && v._type === 'cc') {
    if (v.controller === 71) {
      if (v.value === 1) {
        fontMultiplier += 0.01
      } else if (v.value === 127) {
        fontMultiplier -= 0.01
      }
    }
    if (v.controller === 72) {
      if (v.value === 1) {
        speedMultiplier += 0.01
      } else if (v.value === 127) {
        speedMultiplier -= 0.01
      }
    }
    if (v.controller === 73) {
      if (v.value === 1) {
        waveSize += 0.01
      } else if (v.value === 127) {
        waveSize -= 0.01
      }
    }
  }
  console.log(v)
});


const push2 = {
  width: 960,
  height: 160,
}
const canvas = createCanvas(push2.width, push2.height)
const ctx = canvas.getContext('2d')

function drawFrame(frameNum) {
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, push2.width, push2.height)
  // draw 8 white column rects full push2.width:
  ctx.fillStyle = "#111"
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) {
      continue
    }
    ctx.fillRect(i*push2.width/8, 0, push2.width/8, push2.height)
  }

  // draw 4 white row rects full push2.height:
  ctx.fillStyle = "rgba(255,255,255, 0.3)"
  for (let i = 0; i < 4; i++) {
    if (i % 2 === 0) {
      continue
    }
    ctx.fillRect(0, i*push2.height/4, push2.width, push2.height/4)
  }
  ctx.font = '800 ' + (20*fontMultiplier) + 'px "SF Pro Display"';
  ctx.fillStyle = "hsl(" + frameNum % 360 +",100%,50%)"
  ctx.fillText("Привет, Женечка!", (frameNum*speedMultiplier-100)%push2.width, Math.sin(frameNum/50)*push2.height*waveSize*0.4+push2.height/2);
}

let frameNum = 0

function nextFrame() {
  drawFrame(frameNum)
  frameNum++
  sendFrame(ctx, err => setTimeout(nextFrame,10))
}

initPush(err => {
  if (err) {
    console.log(err)
  }
  nextFrame()
})
