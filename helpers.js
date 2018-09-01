(function(window, document) {
  window.Taggify = Object.assign({}, window.Taggify, {
    'helpers': {
      'getTextWidth': function(text, style) {
        var context;

        // re-use canvas context object for better performance
        if (Taggify.helpers.getTextWidth.context) {
          context = Taggify.helpers.getTextWidth.context;
        } else {
          context Taggify.helpers.getTextWidth.context = document.createElement("canvas").getContext("2d");
        }
        context.style = style;
        var metrics = context.measureText(text);
        return metrics.width;
      },
      'css': function(element, property) {
        return window.getComputedStyle(element, null).getPropertyValue(property);
      },
      'caretPos': function(el) {
        var pos = 0;

        // IE Support
        if (document.selection) {
          el.focus();
          var sel = document.selection.createRange();
          var selLength = document.selection.createRange().text.length;
          sel.moveStart ('character', -el.value.length);
          pos = sel.text.length - selLength;
        }

        // Firefox support
        else if (el.selectionStart || el.selectionStart === '0') {
          pos = el.selectionStart;
        }

        return pos;
      },
      'setCaretPosition': function(ctrl, pos) {
        // Modern browsers
        if (ctrl.setSelectionRange) {
          ctrl.focus();
          ctrl.setSelectionRange(pos, pos);
        }

        // IE8 and below
        else if (ctrl.createTextRange) {
          var range = ctrl.createTextRange();
          range.collapse(true);
          range.moveEnd('character', pos);
          range.moveStart('character', pos);
          range.select();
        }
      },
      'htmlEncode': function( html ) {
        return document.createElement('a').appendChild(document.createTextNode(html)).parentNode.innerHTML;
      }
    }
  });
}(window, document));