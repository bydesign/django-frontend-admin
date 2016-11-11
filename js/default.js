console.log('getting started');

var templateList = [];
var mainTemplate;

TEMPLATES.forEach(function(tempData) {
  templateList.push(template);
  var template = new Template(tempData.name, tempData.content, '');
  if (tempData.start) {
    mainTemplate = template;
  }
});

$('#replace').click(function() {
  var html = mainTemplate.render();
  html = html.replace(/^.+\<body\>/,'').replace('</body>','').replace('</html>','');
  $("body > *").not("#frontendEditor,#djDebug").remove()
  $('body').prepend(html);
})
