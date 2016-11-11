console.log('getting started');

TEMPLATES.forEach(function(template) {
  console.log(template);
  console.log(template.name);

  var parser = new TemplateParser(template.content);
  parser.parse();
});
