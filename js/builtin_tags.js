class Node {
  constructor(parent, start, end) {
    this.parent = parent;
    this.start = start;
    this.end = end;
  }

  render() {
    return '';
  }
}

class Text extends Node {
  constructor(parent, text, start, end) {
    super(parent, start, end);
    this.text = text;
  }

  render() {
    return this.text;
  }
}

class Tag extends Node {
  constructor(tagName, parent, start, end, context, vars) {
    super(parent, start, end);
    this.name = tagName;
    this.context = context;
    this.vars = vars;
  }
}

class TagClosing extends Tag {
  constructor(tagName, parent, start, end, context, vars, endTagName) {
    super(tagName, parent, start, end, context, vars);
    this.end = endTagName;
    this.children = [];
    this.needsClosing = true;
  }

  addChild(child) {
    this.children.push(child);
  }

  render() {
    var str = '';
    this.children.forEach(function(child) {
      str += child.render();
    });
    return str;
  }
}

class ExtendsTag extends Tag {
  constructor(parent, start, end, context, vars) {
    super('extends', parent, start, end, context, vars);
  }
}

class BlockTag extends TagClosing {
  constructor(parent, start, end, context, vars) {
    super('block', parent, start, end, context, vars, 'endblock');
  }
}

class WithTag extends TagClosing {
  constructor(parent, start, end, context, vars) {
    super('with', parent, start, end, context, vars, 'endwith');
  }
}

class IfTag extends TagClosing {
  constructor(parent, start, end, context, vars) {
    super('if', parent, start, end, context, vars, 'endif');
    this.extraTags = ['elif', 'else'];
  }
}

class ForTag extends TagClosing {
  constructor(parent, start, end, context, vars) {
    super('if', parent, start, end, context, vars, 'endif');
    this.extraTags = ['empty'];
  }
}

var BUILTIN_TAGS = [
  {
    name: 'extends',
    class: ExtendsTag
  },
  {
    name: 'block',
    class: BlockTag
  },
  {
    name: 'with',
    class: WithTag
  },
  {
    name: 'if',
    class: IfTag
  },
  {
    name: 'for',
    class: ForTag
  },
];
