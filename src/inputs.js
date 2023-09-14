export const inputTypes = {
  knob: 'cc',
  healthcheck: 'activesense'
};

export class Input {
  constructor(v) {
    this.v = v;
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
    v.up = v.parent.value === 1
    super.trigger(v);
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

  fillInputs() {
    const a = this.a;
    a.knobs = [[14, 15], [71, 79]].flatMap(([a, b]) => {
      const r = [];
      for (let i = a; i <= b; i++) {
        r.push(i);
      }
      return r;
    }).map((controller, i) => (new Knob({
      controller,
      _type: inputTypes.knob,
      name: `knob_${i + 1}`,
    })));
    this.index = Object.fromEntries(this.indexInputs());

    if (this.config.isDebug()) {
      console.log(JSON.stringify(this, null, 2));
    }
  }

  indexInputs(a = this.a) {
    return Object.values(a).flatMap(v => (Array.isArray(v) || !(v instanceof Input))
      ? this.indexInputs(v)
      : [[v.key(), v]]
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
}


function indexKey(v) {
  return v._type + '_' + v.controller;
}
