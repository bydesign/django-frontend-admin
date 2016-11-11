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
  constructor(tagName, parent, start, end) {
    super(parent, start, end);
    this.name = tagName;
  }
}

class TagClosing extends Tag {
  constructor(tagName, parent, start, end, endTagName, context, extraContext) {
    super(tagName, parent, start, end);
    this.end = endTagName;
    this.children = [];

    if (extraContext == undefined) {
      this.context = context;
    } else {
      this.context = Object.assign({}, context, extraContext);
    }
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
  constructor(parent, start, end, template) {
    super('extends', parent, start, end);
    this.template = template;
  }
}

class BlockTag extends TagClosing {
  constructor(parent, start, end, context, extraContext) {
    super('block', parent, start, end, 'endblock', context, extraContext);
  }
}

class WithTag extends TagClosing {
  constructor(parent, start, end, context, extraContext) {
    super('with', parent, start, end, 'endwith', context, extraContext);
  }
}

class IfTag extends TagClosing {
  constructor(parent, start, end, context, vars) {
    super('if', parent, start, end, 'endif', context);
    this.extraTags = ['elif', 'else'];
  }
}

class ForTag extends TagClosing {
  constructor(parent, start, end, context, loopVarName, loopOverList) {
    super('if', parent, start, end, 'endif', context);
    this.extraTags = ['empty'];
  }
}
