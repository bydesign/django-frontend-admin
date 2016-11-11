class TemplateParser {
  constructor(code) {
    this.code = code;
    this.tags = new Tags();
  }

  parse() {
    var NORM = 0,
        TAG = 1,
        VAR = 2,
        STATE = NORM;
    var code = this.code,
        newCode = '',
        prevChar = '',
        nextChar = '',
        curPart = '',
        curTag = { vars: [] };
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
          curPart += char;

        // template variable
        } else if (char == '{' && nextChar == '{') {
          STATE = VAR;
          curPart += char;

        // standard text
        } else {
          newCode += char;
        }

      // parse tag parts, construct tag, and return tag value
      } else if (STATE == TAG) {
        if (char == '%' && prevChar == '{') {
          curPart = '';
        } else if (char == '}' && prevChar == '%') {
          STATE = NORM;
          curPart = '';
          newCode += this.renderTag(curTag);
          curTag = { vars: [] };

        } else if (char == ' ') {
          if (curPart.length > 0) {
            if (curTag.name == undefined) {
              curTag.name = curPart;
            } else {
              curTag.vars.push(curPart);
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
          console.log(curTag);
          curPart = '';
        }
      }
      prevChar = char;
    }

    return newCode;
  }

  renderTag(tag) {
    console.log(tag);
    return '[tag goes here]';
  }
}
