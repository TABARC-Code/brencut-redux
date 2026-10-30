// Store geometry and artwork references, not another copy of every bitmap.
export function createHistory(limit = 40) {
  if (!Number.isInteger(limit) || limit < 2 || limit > 200) throw new Error('Invalid history limit');
  let states = [], index = -1;
  const clone = state => ({ items: state.items.map(k => ({ ...k })), selectedId: state.selectedId ?? null });
  const same = (a, b) => a.items.length === b.items.length && a.items.every((k, i) => {
    const other = b.items[i];
    return k.id === other.id && k.x === other.x && k.y === other.y &&
      k.s === other.s && k.rot === other.rot && k.name === other.name && k.bmp === other.bmp;
  });
  return {
    record(state) {
      if (!state || !Array.isArray(state.items)) throw new Error('Invalid history state');
      const next = clone(state);
      if (index >= 0 && same(states[index], next)) return false;
      states = states.slice(0, index + 1);
      states.push(next);
      if (states.length > limit) states.shift();
      index = states.length - 1;
      return true;
    },
    undo() { if (index < 1) return null; return clone(states[--index]); },
    redo() { if (index + 1 >= states.length) return null; return clone(states[++index]); },
    reset(state) { states = []; index = -1; if (state) this.record(state); },
    get canUndo() { return index > 0; },
    get canRedo() { return index >= 0 && index + 1 < states.length; },
  };
}
