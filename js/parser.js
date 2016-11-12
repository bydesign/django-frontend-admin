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
        curCloseTag = '',
        curParent,
        curTag,
        //curTagList = this.root,
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
          curTag = new Text(undefined, curPart, partStart, i);
          if (curParent != undefined) {
            curParent.addChild(curTag);
          } else {
            this.root.push(curTag);
          }
          partStart = i;
          curPart = '';

        // template variable
        } else if (char == '{' && nextChar == '{') {
          STATE = VAR;
          curTag = new Text(curParent, curPart, partStart, i);
          if (curParent != undefined) {
            curParent.addChild(curTag);
          } else {
            this.root.push(curTag);
          }
          partStart = i;
          curPart = '';

        // standard text
        } else {
          curPart += char;

          if (i == len-1) {
            curTag = new Text(curParent, curPart, partStart, i);
            if (curParent != undefined) {
              curParent.addChild(curTag);
            } else {
              this.root.push(curTag);
            }
          }
        }

      // parse tag parts, construct tag, and return tag value
      } else if (STATE == TAG) {
        if (char == '%' && prevChar == '{') {
          curPart = '';
        } else if (char == '}' && prevChar == '%') {
          partStart = i;

          // close already opened tag
          if (curCloseTag.length > 0 && curTagName == curCloseTag) {
            curParent.end = i;
            curParent = curParent.parent;
            if (curParent != undefined && curParent.needsClosing) {
              curCloseTag = curParent.end;
            } else {
              curCloseTag = '';
            }
            curPart = '',
            curTagName = '',
            curTagVars = [];
            STATE = NORM;

          // add new tag
          } else {
            var TagClass = this.getTagClass(curTagName);
            if (TagClass == undefined) {
              console.log('TAG NAME NOT FOUND: ' + curTagName);
            } else {
              curTag = new TagClass(curParent, partStart, i, context, curTagVars);
              if (curParent == undefined) {
                this.root.push(curTag);
              } else {
                curParent.addChild(curTag);
              }
              if (curTag.needsClosing) {
                curParent = curTag;
                curCloseTag = curTag.end;
              }
              curPart = '',
              curTagName = '',
              curTagVars = [];
              STATE = NORM;
            }
          }

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
        if (char == '{' && prevChar == '{') {
          curPart = '';

        } else if (char == '}' && prevChar == '}') {
          curTag = new Variable(curParent, partStart, i, context, curPart.replace('}}','').trim());
          if (curParent != undefined) {
            curParent.addChild(curTag);
          } else {
            this.root.push(curTag);
          }
          partStart = i;
          curPart = '';
          STATE = NORM;
        }
      }
      prevChar = char;
    }
    console.log(this.root);
    return this.root;
  }
}
