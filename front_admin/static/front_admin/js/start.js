$('body').append('<div id="frontAdmin" class="FAbtn" title="Open FrontAdmin">FA</div>');

var context = {
  not: 'definitely (resolved)',
  footerCode: 'footer code value (resolved)',
  finalvariable: 'my last words (resolved)'
};
var MODE_TEMPLATES = 0,
    MODE_CONTENT = 1,
    MODE = MODE_TEMPLATES;

function render() {
  rendering = true;
  FA.process(TEMPLATES);
  FA.render(MODE, context);
  rendering = false;
}

var rendering = false;
$('#frontAdmin').click(function() {
  var data = JSON.parse($('#fa-data')[0].text);
  console.log(data);
  $(this).hide();
  window.FA = new FrontAdmin();
  FA.registerTags(BUILTIN_TAGS);
  render();
  var curTemplate = FA.template;
  var navActiveClass = 'FAnavActive';

  $('body').append('<div class="FA" id="FA"><div class="FAtitle">FrontAdmin <span class="FAutils"><span class="FAtab" id="FATemplateTab">Templates</span> <span class="FAtab" id="FAContentTab">Content</span> <i class="material-icons" id="closeFA" title="Close FrontAdmin">highlight_off</i></span></div><div class="FAlistPane" id="FAlistPane"></div><div class="FAcontentPane" id="FAcontentPane"></div></div>');

  var activeClass = 'FAactive';
  function templateMode() {
    MODE = MODE_TEMPLATES;
    var navList = '<ul class="FAnavList">';
    TEMPLATES.forEach(function(template, index) {
      navList += '<li fa-template-id="'+index+'"';
      if (template == curTemplate) {
        navList += ' class="'+ navActiveClass +'"';
      }
      navList += '>'+ template.name +'</li>';
    });
    navList += '</ul>';
    $('#FAlistPane').html(navList);
    $('.FAnavList > li').click(function() {
      var templateId = Number( $(this).attr('fa-template-id') );
      selectTemplate(templateId);
    });

    $('#FAcontentPane').html('<textarea id="myTextarea"></textarea>');
    var myTextarea = document.getElementById('myTextarea');

    var editor = CodeMirror.fromTextArea(myTextarea, {
      lineNumbers: true,
      theme: 'duotone-light',
      mode: 'django'
    });
    editor.setValue(curTemplate.content);
    editor.on('changes', function(cm, change) {
      console.log('document changed');
      if (rendering) {
        console.log('waiting for render ...');
      } else {
        curTemplate.content = editor.getValue();
        render();
        activateNodeFromCursor(cm.getCursor());
      }
    });
    editor.on('cursorActivity', function(cm) {
      activateNodeFromCursor(cm.getCursor());
    });

    function selectTemplate(templateId) {
      if (templateId != curTemplate.id) {
        curTemplate = TEMPLATES[templateId];
        editor.setValue(curTemplate.content);
        $('.'+navActiveClass).removeClass(navActiveClass);
        $('.FAnavList > li:eq('+templateId+')').addClass(navActiveClass);
      }
    }

    $(document).click(function(event) {
      event.preventDefault();
      var $target = $(event.target);
      var tagIdStr = $target.attr('fa-tag-id');
      if (tagIdStr != undefined) {
        var tag = FA.getTag( tagIdStr );
        selectTemplate(tag.template);
        editor.setSelection(tag.start, tag.end);
        editor.focus();
      }
    });

    $('#FAContentTab').removeClass('FAactiveTab');
    $('#FATemplateTab').addClass('FAactiveTab');

    render();
  }

  function contentMode() {
    MODE = MODE_CONTENT;
    $(document).off('click');

    var navList = '<ul class="FAnavList">';
    for (var name in context) {
      navList += '<li>' + name + '</li>';
    }
    navList += '</ul>';

    $('#FAlistPane').html(navList);

    $('#FAcontentPane').html('Something great coming soon.');

    $('#FAContentTab').addClass('FAactiveTab');
    $('#FATemplateTab').removeClass('FAactiveTab');

    render();

    /*$('.FAnavList > li').click(function() {
      var templateId = Number( $(this).attr('fa-template-id') );
      selectTemplate(templateId);
    });*/
  }

  $('#FAContentTab').click(contentMode);
  $('#FATemplateTab').click(templateMode);

  templateMode();

  $('#closeFA').click(function() {
    $('#FA').remove();
    $('#frontAdmin').show();
    $(document).off('click');
    activateNode();
  });

  function activateNodeFromCursor(cursor) {
    var nodeId = FA.getNodeId(cursor);
    var node = $('[fa-tag-id='+nodeId+']');
    activateNode(node);
  }

  function activateNode($node) {
    $('.'+activeClass).removeClass(activeClass);
    if ($node != undefined) {
      $node.addClass(activeClass);
    }
  }
});
