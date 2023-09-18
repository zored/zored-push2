import {Drawable} from './display.js';

export class CubeOutput extends Drawable {

  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.angle = 0;
    this.speed = 1;
    this.slowDown()
  }

  slowDown() {
    setInterval(() => {
      this.speed *= 0.7;
    }, 1000)
  }
  draw(ctx, display) {
    this.draw3DCube(ctx, display);
  }

  rotateCubeAroundCenter(cube, angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    // rotate around middle:
    const middle = cube.reduce(([x, y, z], [x2, y2, z2]) => {
      return [x + x2, y + y2, z + z2];
    }, [0, 0, 0]).map((v) => v / cube.length);
    return cube.map(([x, y, z]) => {
      return [
        (x - middle[0]) * cos - (y - middle[1]) * sin + middle[0],
        (x - middle[0]) * sin + (y - middle[1]) * cos + middle[1],
        z,
      ];
    });
  }

  draw3DCube(ctx, display) {
    let cube = [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 0],
      [0, 1, 1],
      [1, 0, 0],
      [1, 0, 1],
      [1, 1, 0],
      [1, 1, 1],
    ];

    this.angle += display.timestampDelta * this.speed / 1000
    cube = this.rotateCubeAroundCenter(cube, this.angle);
    const cube2d = cube.map(([x, y, z]) => {
      return [
        (x - y) * Math.cos(Math.PI / 4),
        (x + y) * Math.sin(Math.PI / 4) - z,
      ];
    });
    const cube2dScaled = cube2d.map(([x, y]) => {
      return [
        x * this.width / 2 + this.width / 2,
        y * this.height / 2 + this.height / 2,
      ];
    });
    ctx.strokeStyle = display.colors.secondary;
    ctx.strokeWidth = 5;

    // translate this.x and this.y:
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.moveTo(...cube2dScaled[0]);
    ctx.lineTo(...cube2dScaled[1]);
    ctx.lineTo(...cube2dScaled[3]);
    ctx.lineTo(...cube2dScaled[2]);
    ctx.lineTo(...cube2dScaled[0]);
    ctx.lineTo(...cube2dScaled[4]);
    ctx.lineTo(...cube2dScaled[5]);
    ctx.lineTo(...cube2dScaled[7]);
    ctx.lineTo(...cube2dScaled[6]);
    ctx.lineTo(...cube2dScaled[4]);
    ctx.moveTo(...cube2dScaled[1]);
    ctx.lineTo(...cube2dScaled[5]);
    ctx.moveTo(...cube2dScaled[3]);
    ctx.lineTo(...cube2dScaled[7]);
    ctx.moveTo(...cube2dScaled[2]);
    ctx.lineTo(...cube2dScaled[6]);
    ctx.stroke();

    ctx.restore();
  }
}

export class DigitsOutput extends Drawable {
  constructor(display, maxLength = 6) {
    const width = (maxLength + 1) * 20;
    const height = 30;
    const x = display.width / 2 - width / 2;
    const y = display.height / 2 - height / 2;
    super(x, y, width, height);

    this._value = '';
    this.maxLength = maxLength;
  }

  get value() {
    return this._value;
  }

  set value(v) {
    this._value = v.slice(0, this.maxLength);
    this.touched = true;
  }

  draw(ctx, display) {
    ctx.fillStyle = display.colors.bg;
    ctx.strokeStyle = display.colors.secondary;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = display.colors.primary;
    ctx.font = '20px Arial';
    ctx.fontWeight = 'bold';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.value, this.x + this.width / 2, this.y + this.height / 2);

    this.touched = false;
  }
}
