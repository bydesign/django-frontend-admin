class FrontAdmin {
  constructor() {
    console.log('initializing Front Admin');

    this.templates = {};
    this.tags = {};
    this.processor;

  }

  process(templates) {
    var that = this;

    templates.forEach(function(tempData) {
      that.templates[tempData.name] = tempData;
      if (tempData.start) {
        that.processor = new Processor(tempData, that);
        that.template = tempData;
      }
    });
    this.processor.parse();
  }

  getTag(num) {
    return this.processor.getTag(num);
  }

  render(context) {
    var html = this.processor.render(context);
    //console.log(html);
    html = html.replace(/^.+\<body\>/,'').replace('</body>','').replace('</html>','');
    $("body > *").not("#frontEditor,#FE,#djDebug").remove()
    $('body').prepend(html);
  }

  registerTags(tags) {
    var that = this;
    tags.forEach(function(tag) {
      that.tags[tag.name] = tag.class;
    });
  }
}
