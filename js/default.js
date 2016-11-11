class FrontAdmin {
  init() {
    console.log('initializing Front Admin');

    this.templates = {};
    this.mainTemplate;
    var that = this;

    TEMPLATES.forEach(function(tempData) {
      var template = new Template(tempData.name, tempData.content, '');
      that.templates[tempData.name] = template;
      if (tempData.start) {
        that.mainTemplate = template;
      }
    });
  }

  render() {
    var html = this.mainTemplate.render();
    html = html.replace(/^.+\<body\>/,'').replace('</body>','').replace('</html>','');
    $("body > *").not("#frontendEditor,#djDebug").remove()
    $('body').prepend(html);
  }
}
