class FrontAdmin {
  init() {
    console.log('initializing Front Admin');

    this.templateList = [];
    this.mainTemplate;
    var that = this;

    TEMPLATES.forEach(function(tempData) {
      that.templateList.push(template);
      var template = new Template(tempData.name, tempData.content, '');
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
