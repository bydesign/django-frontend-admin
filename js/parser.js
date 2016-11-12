class TemplateParser {
  constructor(code, tags) {
    this.code = code;
    this.blocks = {};
    this.tags = tags;
    this.root = [];
    this.context = {};
  }

  getTagClass(name) {
    return this.tags[name];
  }

  getTemplate(name) {
    name = name.replace(/\"/g, '');
    var template = FA.templates[name];

    return template;
  }

  parse() {
    var NORM = 0,
        TAG = 1,
        VAR = 2,
        STATE = NORM,
        EXTENDS = this.code.includes('{% extends ');
    var code = this.code,
        newCode = '',
        prevChar = '',
        nextChar = '',
        curPart = '',
        partStart = 0,
        curTagName = '',
        curTagVars = [],
        curParent,
        curTag,
        curTagList = this.root,
        context = this.context;
    for (var i=0, len=code.length; i<len; i++) {
      var char = code[i];
      if (i+1 < len) {
        nextChar = code[i+1];
      }

      // state machine to parse content of templates
      if (STATE == NORM) {
        // template tag
        if (char == '{' && nextChar == '%') {
          STATE = TAG;
          if (!EXTENDS) {
            curTag = new Text(undefined, curPart, partStart, i);
            curTagList.push(curTag);
          }
          partStart = i;
          curPart = char;

        // template variable
        } else if (char == '{' && nextChar == '{') {
          STATE = VAR;
          curPart += char;

        // standard text
        } else {
          curPart += char;
        }

      // parse tag parts, construct tag, and return tag value
      } else if (STATE == TAG) {
        if (char == '%' && prevChar == '{') {
          curPart = '';
        } else if (char == '}' && prevChar == '%') {
          partStart = i;
          var TagClass = this.getTagClass(curTagName);
          if (TagClass == undefined) {
            console.log('TAG NAME NOT FOUND: ' + curTagName);
          } else {
            curTag = new TagClass(curParent, partStart, i, context, curTagVars);
            curTagList.push(curTag);
            curPart = '',
            curTagName = '',
            curTagVars = [];
            STATE = NORM;
          }

          /*if (curTag.name == 'extends') {
            var parent = this.getTemplate(curTag.vars[0]);
            console.log(parent);
          }
          curTag = { vars: [] };*/

        } else if (char == ' ') {
          if (curPart.length > 0) {
            if (curTagName.length == 0) {
              curTagName = curPart;
            } else {
              curTagVars.push(curPart);
            }
            curPart = '';
          }

        } else {
          curPart += char;
        }

      // parse variable insertion and return value
      } else if (STATE == VAR) {
        curPart += char;
        if (char == '}' && prevChar == '}') {
          STATE = NORM;
          curPart = '';
        }
      }
      prevChar = char;
    }

    return this.root;
  }
}
