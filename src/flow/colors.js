import robotJS from 'robotjs';

export class ColorsFlow {
  constructor(inputTree) {
    this.inputTree = inputTree;
  }

  start() {
    this.inputTree = 1;
  }

  handle(v) {
    if (v.channel === 0) {
      if (v._type === 'noteon') {
        if (v.note === 36) {
          const smiles = ['😊', '😄', '😆', '😂', '🤣'];
          const maxVelocity = 60;
          const smile = smiles[Math.floor(v.velocity * (smiles.length - 1) / maxVelocity)];
          robotJS.typeString(smile);
        }
      }
      if (v._type === 'pitch') {
        const color = Math.round(v.value * 127 / 16320);
        push2.setColor([1, 8], color);
        console.log({color});
      }
    }
    console.log(v);
  }
}

function fillColors(push2, second) {
  let color = second ? 65 : 1;
  for (let x = 1; x <= 8; x++) {
    for (let y = 1; y <= 8; y++) {
      push2.setColor([x, y], color++);
    }
  }
}
