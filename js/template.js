class Template {
  constructor(path, content, url) {
    this.path = path,
    this.content = content,
    this.url = url;
    console.log('new template constructed');
  }

  save() {
    console.log('save this template to the server');
  }

  render() {
    var parser = new TemplateParser(this.content);
    return parser.parse();
  }
}
