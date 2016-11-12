class Processor {
  constructor(data, fa) {
    this.fa = fa;
    this.templateName = data.name;
    this.templateContent = data.content;
    console.log('new parse manager constructed');
  }

  parse() {
    var parser = new TemplateParser(this.templateContent, this.fa.tags);
    this.tree = parser.parse();
  }

  render(context) {
    var str = '';
    this.tree.forEach(function(node) {
      str += node.render(context);
    });

    return str;
  }
}
