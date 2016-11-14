class Variable extends Node {
  constructor(parent, start, end, value) {
    super(parent, start, end);
    this.value = value;
  }

  resolveVars(context) {
    this.value = this.resolveValue(this.value, context);
  }

  render() {
    return this.value;
  }
}
