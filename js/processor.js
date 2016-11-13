class Processor {
  constructor(data, fa) {
    this.fa = fa;
    this.templateName = data.name;
    this.templateContent = data.content;
    this.inherit = false;
    console.log('new parse manager constructed');
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
