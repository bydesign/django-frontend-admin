class Node {
  constructor(parent, start, end) {
    this.parent = parent;
    this.start = start;
    this.end = end;
  }

  render(context) {
    return '';
  }

  resolveValue(value, context) {
    if (value.match(/^[\'|\"].+[\'|\"]$/) != null) {
      value = value.replace(/[\'|\"]/g, '');
    } else {
      value = context[value];
    }
    return value;
  }

  resolveVars(context) {
    if (this.vars != undefined && this.varsFinal == undefined) {
      var varsFinal = [];
      var that = this;
      this.vars.forEach(function(variable) {
        variable = that.resolveValue(variable, context);
        varsFinal.push(variable);
      });
      this.varsFinal = varsFinal;

      this.children.forEach(function(child) {
        child.resolveVars(context);
      });
    }
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
  constructor(tagName, parent, start, end, vars) {
    super(parent, start, end);
    this.name = tagName;
    this.vars = vars;
  }
}

class TagClosing extends Tag {
  constructor(tagName, parent, start, end, vars, endTagName) {
    super(tagName, parent, start, end, vars);
    this.end = endTagName;
    this.children = [];
    this.needsClosing = true;
  }

  addChild(child) {
    this.children.push(child);
  }

  render(context) {
    var str = '';
    this.children.forEach(function(child) {
      str += child.render();
    });
    return str;
  }
}

class ExtendsTag extends Tag {
  constructor(parent, start, end, vars) {
    super('extends', parent, start, end, vars);
  }
}

class BlockTag extends TagClosing {
  constructor(parent, start, end, vars) {
    super('block', parent, start, end, vars, 'endblock');
  }

  resolveVars(context) {
    super.resolveVars(context);
    this.blockName = this.varsFinal[0];
  }
}

class WithTag extends TagClosing {
  constructor(parent, start, end, vars) {
    super('with', parent, start, end, vars, 'endwith');
  }
}

class IfTag extends TagClosing {
  constructor(parent, start, end, vars) {
    super('if', parent, start, end, vars, 'endif');
    this.extraTags = ['elif', 'else'];
  }
}

class ForTag extends TagClosing {
  constructor(parent, start, end, vars) {
    super('if', parent, start, end, vars, 'endif');
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
