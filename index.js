const {createCanvas} = require('canvas')
const path = require('path')
const { initPush, sendFrame } = require('ableton-push-canvas-display')

const push2 = {
  width: 960,
  height: 160,
}
const canvas = createCanvas(push2.width, push2.height)
const ctx = canvas.getContext('2d')

function drawFrame(frameNum) {
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, push2.width, push2.height)
  ctx.font = '800 20px "SF Pro Display"';
  ctx.fillStyle = "hsl(" + frameNum % 360 +",100%,50%)"
  ctx.fillText("Привет, Женечка!", frameNum, Math.sin(frameNum/50)*push2.height*0.4+push2.height/2);
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
