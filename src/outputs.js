import {Drawable} from './display.js';

export class CubeOutput extends Drawable {

  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.angleX = 0;
    this.angleY = 0;
    this.angleZ = 0;
    this.speedX = 1;
    this.speedY = 1;
    this.speedZ = 1;
    this.hue = 0;
    this.slowDown()
  }

  slowDown() {
    setInterval(() => {
      this.speedX *= 0.99;
      this.speedY *= 0.99;
      this.speedZ *= 0.99;
    }, 100)
  }
  draw(ctx, display) {
    this.draw3DCube(ctx, display);
  }


  rotateCubeAroundCenter(cube, angleX, angleY, angleZ) {
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const cosZ = Math.cos(angleZ);
    const sinZ = Math.sin(angleZ);

    const rotateX = ([x, y, z]) => {
      return [
        x,
        y * cosX - z * sinX,
        y * sinX + z * cosX,
      ];
    };
    const rotateY = ([x, y, z]) => {
      return [
        x * cosY + z * sinY,
        y,
        -x * sinY + z * cosY,
      ];
    };
    const rotateZ = ([x, y, z]) => {
      return [
        x * cosZ - y * sinZ,
        x * sinZ + y * cosZ,
        z,
      ];
    };
    return cube.map(v => rotateZ(rotateY(rotateX(v))));
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

    this.angleX += display.timestampDelta * this.speedX / 1000
    this.angleY += display.timestampDelta * this.speedY / 1000
    this.angleZ += display.timestampDelta * this.speedZ / 1000
    cube = this.rotateCubeAroundCenter(cube, this.angleX, this.angleY, this.angleZ);
    const cube2d = cube.map(([x, y, z]) => {
      return [
        (x - y) * Math.cos(Math.PI / 4),
        (x + y) * Math.sin(Math.PI / 4) - z,
      ];
    });
    const cube2dScaled = cube2d.map(([x, y]) => {
      return [
        x * this.width / 3 + this.width / 3,
        y * this.height / 3 + this.height / 3,
      ];
    });
    ctx.strokeStyle = `hsl(${this.hue}, 100%, 50%)`;
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

    const w = display.height;
    ctx.drawImage(display.canvas,
      this.x, 0,
      w, w,
      0, 0,
      w, w,
    );
    ctx.drawImage(display.canvas,
      this.x, 0,
      w, w,
      display.width-w, 0,
      w, w,
    );
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
