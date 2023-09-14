import ableton from 'ableton-push2';

class Names {
  constructor(keys) {
    this.names = keys ? ableton.Keymap.keys : ableton.Keymap.controls;
    this.ids = Object.fromEntries(Object.entries(this.names).map(([k, v]) => [v, k]));
  }
  nameById(v) {
    return this.names[v];
  }
  idByName(v) {
    return this.ids[v];
  }
}

const keysNames = new Names(true);
const controlsNames = new Names(true);

export const inputTypes = {
  knob: 'cc',
  note: 'note',
  healthcheck: 'activesense',
};

export const events = {
  noteDown: 'noteon',
  noteUp: 'noteoff',
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
  constructor(v) {
    super(v);
    this.touched = false;
  }

  trigger(v) {
    v.up = v.parent._type === events.noteUp;
    v.velocity = v.parent.velocity;
    super.trigger(v);
  }

  setColor(v) {
    this.color = v;
    this.touched = true;
  }
}

export class Pad extends Button {
  constructor(v) {
    super(v)
    const m = v.name.match(/(\d),(\d)/)
    if (m) {
      this.y = parseInt(m[1]);
      this.x = parseInt(m[2]);
    }
  }
}

export class InputTree {
  constructor(config) {
    this.config = config;
    this.a = {
      knobs: [],
      pads: [],
      buttons: {
        left: {},
        right: {},
        top: [],
        bottom: [],
        navi: [],
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
    })));
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
    const data = {parent: v};
    this.findInput(v)?.trigger?.(data);
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
        v.setColor(0)
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
