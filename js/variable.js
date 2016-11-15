class Variable extends Node {
  constructor(parent, start, end, value) {
    super(parent, start, end);
    this.value = value;
  }

  resolveVars(context) {
    this.value = this.resolveValue(this.value, context);
  }

  render(mode) {
    if (mode == 1) {
      return '<span class="FAeditable">' + this.value + '</span>';
    } else {
      return this.value;
    }
  }
}
