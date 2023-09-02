const {createCanvas} = require('canvas')
const path = require('path')
const { initPush, sendFrame } = require('ableton-push-canvas-display')

const push2 = {
  width: 960,
  height: 160,
}
const canvas = createCanvas(push2.width, push2.height)
const ctx = canvas.getContext('2d')

function drawFrame(c, frameNum) {
  c.fillStyle = "#000"
  c.fillRect(0, 0, push2.width, push2.height)
  c.font = '800 20px "SF Pro Display"';
  c.fillStyle = "hsl(" + frameNum % 360 +",100%,50%)"
  c.fillText("Привет, Женечка!", frameNum, Math.sin(frameNum/50)*push2.height*0.4+push2.height/2);
}

let frameNum = 0

function nextFrame() {
  drawFrame(ctx, frameNum)
  frameNum++
  sendFrame(ctx, function(error) {
    // we can ignore any error here, more or less
    setTimeout(nextFrame,10) // Do not use nextTick here, as this will not allow usb callbacks to fire.
  })
}

initPush(err => {
  if (err) {
    console.log(err)
  }
  nextFrame()
})
