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
    this.tree = parser.parse();
    this.blocks = parser.getBlocks();
    if (this.blocks != undefined) {
      this.inherit = true;
    }
  }

  render(context) {
    var str = '';
    var that = this;
    this.tree.forEach(function(node) {
      // override blocks that are inherited
      if (that.inherit && node.name == 'block') {
        node = that.blocks[node.blockName][0];
      }
      str += node.render(context);
    });

    return str;
  }
}
