class TemplateParser {
  constructor(code, tags) {
    this.code = code;
    this.blocks = [];
    this.tags = tags;
    this.root = [];
    this.elements = {};
    this.extends = false;
  }

  getTagClass(name) {
    return this.tags[name];
  }

  getTemplate(name) {
    name = name.replace(/\"/g, '');
    var template = FA.templates[name];

    return template;
  }

  getBlocks() {
    return this.blocks;
  }

  getElements() {
    return this.elements;
  }

  parse(code, templateNum) {
    if (code.includes('{% extends ')) {
      this.extends = true;
    }
    var NORM = 0,
        TAG = 1,
        VAR = 2,
        STATE = NORM,
        extendsTemplate;
    var TEXT = 0,
        ATTR = 2,
        TAGCLOSE = 3,
        HTMLSTATE = TEXT;
    var //code = this.code,
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
        htmlRoot = [],
        attrChar = '',
        curHtmlTag,
        parentHtmlTag,
        curHtmlCode = '',
        curTagNum = 1,
        lineNum = 0,
        chNum = 0;

    for (var i=0, len=code.length; i<len; i++) {
      var char = code[i];
      if (i+1 < len) {
        nextChar = code[i+1];
      }
      if (char == '\n') {
        lineNum++;
        chNum = 0;
      }

      // parse the markup to map tags to template code
      if (HTMLSTATE == TEXT) {
        // open HTML tag
        if (char.match(/[a-zA-Z]/) != null && prevChar == '<') {
          HTMLSTATE = TAG;
          parentHtmlTag = curHtmlTag;
          curHtmlTag = {
            template: templateNum,
            start: { line:lineNum, ch:chNum-1 },
            parent: parentHtmlTag,
            id: curTagNum
          }
          this.elements[templateNum + '-' + curTagNum] = curHtmlTag;
          if (parentHtmlTag == undefined) {
            htmlRoot.push(curHtmlTag);
          } else {
            if (parentHtmlTag.children == undefined) {
              parentHtmlTag.children = [];
            }
            parentHtmlTag.children.push(curHtmlTag);
          }
          curTagNum++;
          curHtmlCode += prevChar + char;
        // close HTML tag
        } else if (char == '/' & prevChar == '<') {
          HTMLSTATE = TAGCLOSE;
        }
      } else if (HTMLSTATE == ATTR) {
        curHtmlCode += char;
        if (char == attrChar) {
          HTMLSTATE = TAG;
          attrChar = '';
        }

      } else if (HTMLSTATE == TAG) {
        curHtmlCode += char;
        if (char == '"' || char == "'") {
          HTMLSTATE = ATTR;
          attrChar = char;
        } else if (char == '>') {
          HTMLSTATE = TEXT;
          curHtmlTag.code = curHtmlCode;
          curHtmlCode = '';
          curPart += ' fa-tag-id="'+ curHtmlTag.template + '-' + curHtmlTag.id +'"';
        }
      } else if (HTMLSTATE == TAGCLOSE) {
        if (char == '>') {
          if (curHtmlTag != undefined) {
            curHtmlTag.end = { line:lineNum, ch:chNum+1 };
            HTMLSTATE = TEXT;
            curHtmlTag = curHtmlTag.parent;
          }
        }
      }

      // state machine to parse template language content
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

            // if template extends another template,
            // then save block tags for later
            if (this.extends) {
              this.blocks.push(curParent);
              /*var blockName = curParent.blockName;
              if (this.blocks[blockName] == undefined) {
                this.blocks[blockName] = [];
              }
              this.blocks[blockName].push(curParent);*/
            }
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

            // tag name not found
            if (TagClass == undefined) {
              console.log('TAG NAME NOT FOUND: ' + curTagName);

            // extends tag with custom inheritance functionality
          } else if (curTagName == 'extends') {
              extendsTemplate = curTagVars[0].replace(/[\'|\"]/g, '');
              curPart = '',
              curTagName = '',
              curTagVars = [];
              STATE = NORM;

            // standard supported tag
            } else {
              curTag = new TagClass(curParent, partStart, i, curTagVars);
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
          curTag = new Variable(curParent, partStart, i, curPart.replace('}}','').trim());
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

      if (char != '\n') {
        chNum++;
      }
    }

    if (this.extends && extendsTemplate != undefined) {
      var template = this.getTemplate(extendsTemplate);
      //this.code = template.content;
      extendsTemplate = '';
      this.root = [];
      this.parse(template.content, template.id);
    }

    //this.elements = htmlTags;
    //console.log(htmlTags);

    return this.root;
  }
}
