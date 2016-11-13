class Processor {
  constructor(data, fa) {
    this.fa = fa;
    this.templateName = data.name;
    this.templateContent = data.content;
    this.inherit = false;
  }

  parse() {
    var parser = new TemplateParser(this.templateContent, this.fa.tags);
    this.tree = parser.parse(this.templateContent, this.templateName);
    this.blocksList = parser.getBlocks();
    if (this.blocksList.length > 0) {
      this.inherit = true;
    }
    this.tags = parser.getElements();
  }

  getTag(num) {
    return this.tags[num-1];
  }

  getNodeId(cursor) {
    var id;
    this.tags.forEach(function(tag) {
      if (
        tag.start.line <= cursor.line &&
        tag.start.ch <= cursor.ch &&
        tag.end.line >= cursor.line &&
        tag.end.ch >= cursor.ch
      ) {
        id = tag.id
      }
    })
    return id;
  }

  render(context) {
    var str = '';
    var that = this;
    var blocks = {};

    // build block tree for inheritance
    if (this.inherit) {
      this.blocksList.forEach(function(block) {
        block.resolveVars(context);
        if (blocks[block.blockName] == undefined) {
          blocks[block.blockName] = [];
        }
        blocks[block.blockName].push(block);
      });
    }

    this.tree.forEach(function(node) {
      // override blocks that are inherited
      node.resolveVars(context);
      if (that.inherit && node.name == 'block') {
        node = blocks[node.blockName][0];
      }
      str += node.render();
    });

    return str;
  }
}
