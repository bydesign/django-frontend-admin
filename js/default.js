class FrontAdmin {
  constructor() {
    console.log('initializing Front Admin');

    this.templates = {};
    this.tags = {};
    this.processor;

  }

  process(templates) {
    var that = this;

    templates.forEach(function(tempData, index) {
      tempData.id = index;
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

  getNodeId(cursor) {
    return this.processor.getNodeId(cursor);
  }

  render(mode, context) {
    var html = this.processor.render(mode, context);
    html = html.replace(/^.+\<body\>/,'').replace('</body>','').replace('</html>','');
    $("body > *").not("#frontAdmin,#FA,#djDebug").remove();
    var safeIds = [
      'frontAdmin',
      'FA',
      'djDebug'
    ];

    $('body').contents().each(function(index, child) {
      if (child.id == undefined || safeIds.indexOf(child.id) == -1) {
        child.parentNode.removeChild(child);
      }
    });
    $('body').prepend(html);
  }

  registerTags(tags) {
    var that = this;
    tags.forEach(function(tag) {
      that.tags[tag.name] = tag.class;
    });
  }
}
