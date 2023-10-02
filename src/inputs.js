import ableton from 'ableton-push2';

class Names {
  constructor(keys) {
    this.names = keys ? ableton.Keymap.keys : ableton.Keymap.controls;
    this.prefix = keys ? 'key' : 'control';
    this.ids = Object.fromEntries(Object.entries(this.names).map(([k, v]) => [this.addPrefix(v), k]));
  }

  nameById(v) {
    return this.addPrefix(this.names[v]);
  }

  idByName(v) {
    return this.ids[v];
  }

  addPrefix(v) {
    return this.prefix + '_' + v;
  }
}

const keysNames = new Names(true);
const controlsNames = new Names(false);

export const inputTypes = {
  knob: 'cc',
  note: 'note',
  button: 'cc',
  healthcheck: 'activesense',
};

export const events = {
  noteDown: 'noteon',
  noteUp: 'noteoff',
  aftertouch: 'poly aftertouch',
};

export class Input {
  constructor(v) {
    this.v = v;
    this._type = v._type;
    this.listeners = [];
  }

  listen(f) {
    this.listeners.push(f);
  }

  trigger(v) {
    this.listeners.forEach(f => f(v));
  }

  key() {
    return indexKey(this.v);
  }
}

export class Knob extends Input {
  constructor(v) {
    super(v);
  }

  trigger(v) {
    v.up = v.parent.value === 1;
    super.trigger(v);
  }
}

export class Button extends Input {
  constructor(v, notifyTouched) {
    super(v);
    this.touched = false;
    this.color = 0;
    this.animation = 0;
    this.notifyTouched = notifyTouched;
  }

  setColor(v) {
    this.color = v;
    this.redraw();
  }

  setAnimation(v) {
    this.animation = v;
    this.redraw();
  }

  redraw() {
    this.touched = true;
    this.notifyTouched();
  }
}

export class RegularButton extends Button {
  constructor(v, notifyTouched) {
    super(v, notifyTouched);
    this.controller = v.controller;
  }

  trigger(v) {
    v.up = v.parent.value === 0;
    super.trigger(v);
  }

  displayButtonIndex() {
    const m = this.v.name.match(/(lower|upper) display button (\d)/);
    console.log({m});
    if (!m) {
      return -1;
    }
    const [_, row, index] = m;
    return (row === 'upper' ? 0 : 8) + (parseInt(index) - 1);
  }
}

export class Pad extends Button {
  constructor(v, notifyTouched) {
    super(v, notifyTouched);
    const m = v.name.match(/(\d),(\d)/);
    if (m) {
      this.y = parseInt(m[1]);
      this.x = parseInt(m[2]);
    }
  }

  trigger(v) {
    v.up = v.parent._type === events.noteUp;
    v.velocity = v.parent.velocity;
    super.trigger(v);
  }
}

export class InputTree {
  constructor(config, notifyTouched) {
    this.notifyTouched = notifyTouched;
    this.config = config;
    this.colors = {
      turquoise: 14,
      turquoiseDark: 96,
      orange: 8,
      orangeDark: 80,
      red: 2,
      green: 11,
      greenDark: 84,
      sepia: 6,
      blue: 19,
      peach: 5,
      peachDark: 78,
    };
    this.a = {
      knobs: [],
      pads: [],
      buttons: {
        top: [],
        bottom: [],
        naviTop: {
          left: null,
          right: null,
          up: null,
          down: null,
        },
      },
    };
    this.fillInputs();
  }

  byName(name) {
    return this.index[name];
  }

  fillInputs() {
    const a = this.a;
    const seq = (aa) => aa.flatMap(([a, b]) => {
      const r = [];
      for (let i = a; i <= b; i++) {
        r.push(i);
      }
      return r;
    });

    a.knobs = seq([[14, 15], [71, 79]]).map(controller => (new Knob({
      controller,
      _type: inputTypes.knob,
      name: controlsNames.nameById(controller),
    })));

    a.pads = seq([[36, 99]]).map((note, i) => (new Pad({
      note,
      _type: inputTypes.note,
      name: keysNames.nameById(note),
    }, this.notifyTouched)));

    a.buttons.bottom = seq([[20, 27]]).map((controller, i) => (new RegularButton({
      controller,
      _type: inputTypes.button,
      name: controlsNames.nameById(controller),
    }, this.notifyTouched)));
    a.buttons.top = seq([[102, 109]]).map((controller, i) => (new RegularButton({
      controller,
      _type: inputTypes.button,
      name: controlsNames.nameById(controller),
    }, this.notifyTouched)));
    const directions = ['left', 'right', 'up', 'down'];
    a.buttons.naviTop = Object.fromEntries(seq([[44, 47]]).map((controller, i) => [directions[i], (new RegularButton({
      controller,
      _type: inputTypes.button,
      name: controlsNames.nameById(controller),
    }, this.notifyTouched))]));

    this.index = Object.fromEntries(this.indexInputs());
    if (this.config.isDebug()) {
      console.log(JSON.stringify(this, null, 2));
    }
  }

  indexInputs(a = this.a) {
    return Object.values(a).flatMap(v => (Array.isArray(v) || !(v instanceof Input))
      ? this.indexInputs(v)
      : [[v.key(), v]],
    );
  }

  listen(v) {
    if (v._type === inputTypes.healthcheck) {
      return;
    }
    // handle this later:
    if (v._type === events.aftertouch) {
      return;
    }
    const data = {parent: v};
    const foundInput = this.findInput(v);
    foundInput?.trigger?.(data);
    if (this.config.isDebug()) {
      console.log({data});
    }
  }

  findInput(v) {
    return this.index[indexKey(v)];
  }

  clear() {
    Object.values(this.index).forEach(v => {
      v.listeners = [];
      if (v instanceof Button) {
        v.setColor(0);
        v.setAnimation('stopTransition');
      }
    });
  }
}


function indexKey(v) {
  let id = v.controller || v.note;
  const names = v.note ? keysNames : controlsNames;
  const name = names.nameById(id);
  if (name) {
    return name;
  }

  let input = v._type;
  if (input === events.noteDown || input === events.noteUp) {
    input = inputTypes.note;
  }
  return input + '_' + id;
}
