(function(window, document, undefined) {
  window.Taggify = Object.assign({}, window.Taggify, {
    'autocomplete_dict': [],
    'settings': {
      'caret_between_tags': true,
      'delete_button': true,
      'delete_whole_tags': false,
      'override_tab': true,
      'automatically_start_editing_last_tag': false,
      'debugging': false
    },
    'buggy_settings': [
      // 'automatically_start_editing_last_tag'
    ],
    'taggify_element': function(ele) {
      var div;
      console.log(ele.tagName);
      if (ele.tagName.toLowerCase() == 'div') {
        div = ele;
      } else {
        div = document.createElement('div');
        ele.parentElement.insertBefore(div, ele);
      }
      div.classList.add('taggify-input');
      var tags_container = document.createElement('div');
      tags_container.className = 'tags';
      if (ele.tagName.toLowerCase() == 'input') {
        input = ele;
      } else {
        var input = document.createElement('input');
        input.type = 'text';
      }
      var autocomplete = document.createElement('div');
      autocomplete.className = 'autocomplete';
      div.appendChild(tags_container.cloneNode());
      div.appendChild(input);
      div.appendChild(tags_container);
      div.appendChild(autocomplete);
      Taggify.taggify(div);
      Taggify.add_css();
    },
    'add_css': function() {
      // var link = document.createElement( "link" );
      // link.href = "./taggify.css";
      // link.type = "text/css";
      // link.rel = "stylesheet";
      // document.getElementsByTagName( "head" )[0].appendChild( link );
    },
    'create_settings_form': function(ele) {
      for (var setting in window.Taggify.settings) {
        if (!window.Taggify.buggy_settings.includes(setting)) {
          var group = document.createElement('div');
          group.className = 'group';
          var input = document.createElement('input');
          input.name = setting;
          input.value = SETTINGS[setting];
          input.type = 'checkbox';
          input.checked = SETTINGS[setting];
          var label = document.createElement('label');
          label.setAttribute('for', setting);
          label.textContent = setting;
          group.appendChild(input);
          group.appendChild(label);
          ele.appendChild(group);
        }
      }
      ele.addEventListener('change', function() {
        var inputs = this.getElementsByTagName('input');
        for (var i = 0; i < inputs.length; i++) {
          var input = inputs[i];
          window.Taggify.settings[input.name] = input.checked;
        }
      });
    }
  });
  var SETTINGS = window.Taggify.settings



  const getTextWidth = window.Taggify.helpers.getTextWidth;
  const css = window.Taggify.helpers.css;
  const caretPos = window.Taggify.helpers.caretPos;
  const setCaretPosition = window.Taggify.helpers.setCaretPosition;
  const htmlEncode = window.Taggify.helpers.htmlEncode;

  function checkKeyCode(e, num, name) {
    return (e.which == num || e.keyCode == num || e.code == name || e.key == name);
  }

  function fillInput(input, container) {
    var tag_input = input.parentElement;
    var start_tags_container = tag_input.children[0];
    var end_tags_container = tag_input.children[2];

    if (container == end_tags_container) {
      var ele = container.children[0];
    } else if (container == start_tags_container) {
      var ele = container.children[container.children.length-1];
    }
    if (ele != undefined) {
      input.value = ele.textContent;
      container.removeChild(ele);
    }
    resize_input(input);
    input.focus()
  }

  function tagExists(val, tagInput) {
    /* the approch of going off of tag name is not used elsewhere in the code */
    var containers = tagInput.getElementsByClassName('tags');
    var tags = [];
    for (var j = 0; j < containers.length; j++) {
      var tag_elements = containers[j].children;
      for (var i = 0; i < tag_elements.length; i++) {
        var tag_ele = tag_elements[i];
        tags.push(tag_ele.textContent);
      }
    }
    return tags.includes(val);
  }

  function generateTagEle(val, container) {
    var tag_input = container.parentElement;
    var start_tags_container = tag_input.children[0];
    var end_tags_container = tag_input.children[2];

    if (val != '' && !tagExists(val, tag_input)) {
      var new_tag = document.createElement('span');
      new_tag.textContent = val.trim();
      new_tag.className = 'tag';
      if (SETTINGS.delete_button) {
        var delete_mark = document.createElement('i');
        delete_mark.className = 'fas fa-sm fa-times-circle delete';
        new_tag.appendChild(delete_mark);
      }
      if (container == end_tags_container) {
       container.insertBefore(new_tag, container.firstChild);
      } else if (container == start_tags_container) {
        container.append(new_tag);
      }
    }
  }

  function moveInput(input, container) {
    if (input.value.trim() != '') {
      if (input.value.replace(/\s/g,'').length == input.value.length) {
        generateTagEle(input.value.trim(), container);
        input.value = '';
      } else if (caretPos(input) != 0) {
        var vals = input.value.split(' ');
        for (var i = 0; i < vals.length - 1; i++) {
          generateTagEle(vals[i].trim(), container);
        }
        input.value = vals[vals.length-1].trim();
        if (input.createTextRange) {
          var part = input.createTextRange();
          part.move("character", 0);
          part.select();
        } else if (input.setSelectionRange) {
          input.setSelectionRange(0, 0);
        }
        input.focus();
      }
    }
    resize_input(input);
    input.focus();
  }

  function moveElementsTo(container, times = 1) {
    console.log("Moving elements "+times+" times");
    var tag_input = container.parentElement;
    var start_tags_container = tag_input.children[0];
    var end_tags_container = tag_input.children[2];
    if (times == null) {
      if (container == start_tags_container) {
        times = end_tags_container.children.length;
      } else if (container == end_tags_container) {
        times = start_tags_container.children.length;
      }
    }
    for (var i = 0; i < times; i++) {
      if (container == start_tags_container && end_tags_container.children.length > 0) {
        console.log("Moving one tag from end to start")
        start_tags_container.appendChild(end_tags_container.firstChild);
      } else if (container == end_tags_container && start_tags_container.children.length > 0) {
        console.log("Moving one tag from start to end")
        end_tags_container.insertBefore(start_tags_container.lastChild, end_tags_container.firstChild);
      }
    }
  }

  function handleContainerClick(container, mouseX) {
    var tag_input = container.parentElement;
    var start_tags_container = tag_input.children[0];
    var input = tag_input.children[1];
    var end_tags_container = tag_input.children[2];
    var autocomplete = tag_input.children[3];

    var tag_elements = container.children;
    var widths = [];
    var other_container;

    if (container == start_tags_container) {
      other_container = end_tags_container;
    } else if (container == end_tags_container) {
      other_container = start_tags_container;
    }

    for (var i = 0; i < tag_elements.length; i++) {
      var dims = tag_elements[i].getBoundingClientRect();
      widths.push(dims.x);
      widths.push(dims.x+dims.width);
    }

    moveInput(input, other_container);

    if (mouseX > widths[0] && mouseX < widths[widths.length-1]) {
      console.log("Click was within a container")
      var counter = 0;
      for (var i = 1; i < widths.length; i = i + 2) {
        counter++;
        console.log("Checking tag")
        if (widths[i-1] < mouseX && mouseX < widths[i+1]) {
          if (container == start_tags_container) {
            moveElementsTo(other_container, start_tags_container.children.length - counter);
          } else {
            moveElementsTo(other_container, counter);
          }
          if (widths[i-1] < mouseX && mouseX < widths[i]) {
            fillInput(input, start_tags_container);
          }
          console.log("Click was on the ~"+counter+" tag");
          break;
        }
      }
      if (widths[widths.length-2] < mouseX && mouseX < widths[widths.length-1]) {
        console.log("Click was on the last tag")
        if (container == end_tags_container) {
          moveElementsTo(start_tags_container, null)
        }
        fillInput(input, start_tags_container);
      }
    } else if (container == start_tags_container && mouseX < widths[0]) {
      console.log("Click was before the start of the start tag");
      moveElementsTo(end_tags_container, null);
    } else if (container == end_tags_container && mouseX > widths[widths.length-1]) {
      console.log("Click was afte the end of the end tags");
      if (SETTINGS.automatically_start_editing_last_tag) {
        moveElementsTo(start_tags_container, null);
      }
    }
    input.focus();
  }

  function taggify(tag_input) {
    var start_tags_container = tag_input.children[0];
    var input = tag_input.children[1];
    var end_tags_container = tag_input.children[2];
    var autocomplete = tag_input.children[3];

    // Delete tag handlers
    // These need to go first to override the tag onclick handlers

    start_tags_container.addEventListener('click', function(e) {
      var start_tags_container = this.parentElement.children[0];
      var input = this.parentElement.children[1];
      var end_tags_container = this.parentElement.children[2];

      var start_tags = start_tags_container.children;
      var end_tags = end_tags_container.children;

      var tag = e.target;

      if (tag.classList.contains('delete')) {
        tag = tag.parentElement;
        tag.parentElement.removeChild(tag);
        input.focus();
      }
    });

    end_tags_container.addEventListener('click', function(e) {
      var start_tags_container = this.parentElement.children[0];
      var input = this.parentElement.children[1];
      var end_tags_container = this.parentElement.children[2];

      var start_tags = start_tags_container.children;
      var end_tags = end_tags_container.children;

      var tag = e.target;

      if (tag.classList.contains('delete')) {
        tag = tag.parentElement;
        tag.parentElement.removeChild(tag);
        input.focus();
      }
    });

    // Container click listeners
    // These are for when you click on/between/over/around a tag,
    // getting the tag to actually become editable.

    start_tags_container.addEventListener('click', function(e) {
      handleContainerClick(this, e.clientX);
    });

    end_tags_container.addEventListener('click', function(e) {
      handleContainerClick(this, e.clientX);
    });

    // This is a fallback for the start_tags_container and end_tags_container click handlers -- some parts
    // of the input aren't in the start_tags_container or end_tags_container and need to be handeled here.
    input.parentElement.addEventListener('click', function(e) {
      var start_tags_container = this.children[0];
      var input = this.children[1];
      var end_tags_container = this.children[2];

      var start_tags = start_tags_container.children;
      var end_tags = end_tags_container.children;

      var widths = [];

      for (var i = 0; i <= 2; i++) {
        var ele = this.children[i];
        var rect = ele.getBoundingClientRect();
        widths.push(rect.x);
        widths.push(rect.x+rect.width);
      }

      var mouseX = e.clientX;

      if (e.target == this) {
        if (widths[widths.length-1] < mouseX) {
          console.log("DEEE DOOOOP")
          if (end_tags.length != 0) {
            moveInput(input, start_tags_container);
            while (end_tags_container.children.length > 0) {
              start_tags_container.appendChild(end_tags_container.firstChild);
            }
          }
          if (SETTINGS.automatically_start_editing_last_tag && input.value == '') {
            fillInput(input, start_tags_container);
          }
          input.focus();
          moveCaretToEnd(input);
        } else if (widths[0] > mouseX) {
          if (start_tags.length != 0) {
            moveInput(input, start_tags_container);
            while (start_tags_container.children.length > 0) {
              end_tags_container.insertBefore(start_tags_container.lastChild, end_tags_container.firstChild);
            }
          }
          setCaretPosition(input, 0);
        } else {
          printWidths(widths);
          if (mouseX < widths[2]) {
            console.log("START");
            handleContainerClick(start_tags_container, mouseX);
          } else {
            console.log("END");
            handleContainerClick(end_tags_container, mouseX);
          }
        }
      }
    });

    // Autocomplete fun

    autocomplete.addEventListener('click', function(e) {
      var input = this.parentElement.children[1];

      var target = e.target;

      while (target.parentElement != this && target != this) {
        target = target.parentElement;
      }

      if (target != this) {
        input.value = target.getAttribute('data-tag');
        moveInput(input, start_tags_container);
        input.focus();
        clearSuggestions(autocomplete);
      }
    });

    autocomplete.addEventListener('keydown', function(e) {
      var input = this.parentElement.children[1];
      var start_tags_container = this.parentElement.children[0];
      console.log(input.value.length);
      var index = Array.prototype.indexOf.call(this.children, e.target);
      const rowlen = 3;
      var colNum = index % rowlen;
      var rowNum = Math.floor(index / (rowlen-1+0.001));

      if (checkKeyCode(e, 38, "ArrowUp") && rowNum == 0) {
        input.focus();
        moveCaretToEnd(input);
        e.preventDefault();
        return false;
      } else if (checkKeyCode(e, 38, "ArrowUp")) {
        var newTarget = e.target;
        for (var i = 0; i < rowlen; i++) {
          newTarget = newTarget.previousSibling;
        }
        newTarget.focus();
        e.preventDefault();
        return false;
      }

      if (checkKeyCode(e, 40, "ArrowDown")) {
        var newTarget = e.target;
        for (var i = 0; i < rowlen; i++) {
          newTarget = newTarget.nextSibling;
          if (newTarget == undefined) {
            return true;
          }
        }
        newTarget.focus();
        e.preventDefault();
        return false;
      }

      if (checkKeyCode(e, 27, "Escape")) {
        input.focus();
        moveCaretToEnd(input);
        e.preventDefault();
        return false;
      }

      if (checkKeyCode(e, 39, "ArrowRight") && index != this.children.length-1) {
        e.target.nextSibling.focus();
        e.preventDefault();
        return false;
      }

      if ((checkKeyCode(e, 37, "ArrowLeft") || (checkKeyCode(e, 9, "Tab") && e.shiftKey && SETTINGS.override_tab)) && index != 0) {
        e.target.previousSibling.focus();
        e.preventDefault();
        return false;
      }

      if (checkKeyCode(e, 9, "Tab") && index == this.children.length-1 && SETTINGS.override_tab) {
        e.preventDefault();
        return false;
      }

      if (checkKeyCode(e, 13, "Enter")) {
        var val = e.target.getAttribute('data-tag');
        input.value = '';
        generateTagEle(val, start_tags_container);
        input.focus();
        clearSuggestions(this);
        return false;
      }

      return true;
    });

    // This is autocomplete with a bit of input handling mixed in.
    // I need to refactor it.

    input.addEventListener('keydown', function(e) {
      var start_tags_container = this.parentElement.children[0];
      var input = this.parentElement.children[1];
      var end_tags_container = this.parentElement.children[2];
      var suggestionEle = this.parentElement.children[3];

      var start_tags = start_tags_container.children;
      var end_tags = end_tags_container.children;

      if (checkKeyCode(e, 8, "Backspace") && caretPos(input) == 0 && start_tags.length != 0) {
        if (SETTINGS.delete_whole_tags) {
          start_tags_container.removeChild(start_tags_container.lastChild);
        } else {
          var val = input.value;
          var len = start_tags[start_tags.length-1].textContent.length;
          fillInput(input, start_tags_container);
          input.value = (input.value+val).trim();
          resize_input(input);
          setCaretPosition(input, len);
          e.preventDefault();
        }
        return false;
      }

      if (checkKeyCode(e, 27, "Escape")) {
        clearSuggestions(suggestionEle);
        input.focus();
        e.preventDefault();
        return false;
      }

      if (checkKeyCode(e, 40, "ArrowDown") && suggestionEle.children.length != 0) {
        console.log("Transitioned focus to");
        console.log(suggestionEle.firstChild);
        suggestionEle.firstChild.focus();
        return false;
      }

      if (checkKeyCode(e, 37, "ArrowLeft") && caretPos(input) == 0) {
        if (!SETTINGS.caret_between_tags || input.value.length == 0) {
          moveInput(input, end_tags_container);
          fillInput(input, start_tags_container);
          e.preventDefault();
        } else {
          moveInput(input, end_tags_container);
          resize_input(input, 0);
        }
        return false;
      }

      if (checkKeyCode(e, 39, "ArrowRight") && caretPos(input) == input.value.length) {
        if (!SETTINGS.caret_between_tags || input.value.length == 0) {
          moveInput(input, start_tags_container);
          fillInput(input, end_tags_container);
          setCaretPosition(input, 0);
          e.preventDefault();
        } else {
          moveInput(input, start_tags_container);
          resize_input(input, 0);
        }
        return false;
      }
      return true;
    });

    // Enter or space needs to be keyup so that the char exists on the page
    input.addEventListener('keyup', function(e) {
      var start_tags_container = this.parentElement.children[0];
      var input = this.parentElement.children[1];
      var end_tags_container = this.parentElement.children[2];

      var start_tags = start_tags_container.children;
      var end_tags = end_tags_container.children;

      if (checkKeyCode(e, 13, "Enter") || checkKeyCode(e, 32, "Space")) {
        if (caretPos(input) != 0) {
          moveInput(input, start_tags_container);
        }
        return false;
      }

      return true;
    });

    // Suggestions

    input.addEventListener('input', function(){
      resize_input(this);
      renderSuggestions(this, this.parentElement.children[3]);
    });

    input.parentElement.addEventListener('focusout', function(e) {
      if (!document.hasFocus(this.children[3])) {
        clearSuggestions(this.children[3]);
      }
    });
  }

  window.Taggify['taggify'] = taggify;

  function printWidths(widths) {
    if (!SETTINGS.debugging) {
      return;
    }
    var todelete = document.getElementsByClassName('delme');
    for (var i = 0; i < todelete.length; i++) {
      todelete[i].parentElement.removeChild(todelete[i]);
    }
    for (var i = 0; i < widths.length+2; i = i+2) {
      var div = document.createElement('div');
      if (i % 4 == 0) {
        div.style.background = 'black';
      } else {
        div.style.background = 'white';
      }
      div.style.height = '10px';
      div.style.position = 'absolute';
      div.style.left = widths[i];
      div.style.top = '5em';
      div.className = 'delme';
      div.style.width = widths[i+1] - widths[i];
      document.body.appendChild(div);
    }
  }

  function resize_input(inpt, min_width = 10) {
    var style = "font-family:"+css(inpt, 'font-family')+";font-size:"+css(inpt, 'font-size')+";";
    var width = getTextWidth(inpt.value, style)+inpt.value.length*2+4;
    if (width < min_width) { width = min_width; }
    inpt.style.width = width+"px";
  }

  function generateSuggestionBox(name, desc, input = '') {
    var ele = document.createElement('div');
    ele.setAttribute('data-tag', name);
    ele.className = 'suggestion';
    ele.setAttribute('tabindex', 0);
    var header_container = document.createElement('h3');
    var header = document.createElement('span');
    if (input.length > 0) {
      name = htmlEncode(name).replace(htmlEncode(input), "<b><u>"+htmlEncode(input)+"</u></b>");
      header.innerHTML = name;
    } else {
      header.textContent = name;
    }
    header.className = 'tag';
    header_container.appendChild(header);
    var body = document.createElement('p');
    body.textContent = desc;
    ele.appendChild(header_container);
    ele.appendChild(body);
    return ele;
  }

  function moveCaretToEnd(input) {
    setTimeout(function(){ input.selectionStart = input.selectionEnd = 10000; }, 0);
  }

  function clearSuggestions(suggestionEle) {
    while (suggestionEle.firstChild) {
      suggestionEle.removeChild(suggestionEle.lastChild);
    }
  }

  function renderSuggestions(input, suggestionEle) {
    clearSuggestions(suggestionEle);
    var suggestions = Taggify.autocomplete_dict;
    console.log(suggestions);
    for (var i = 0; i < suggestions.length; i++) {
      if (suggestions[i][0].includes(input.value)) {
        var name = suggestions[i][0];
        var desc = suggestions[i][1];
        suggestionEle.appendChild(generateSuggestionBox(name, desc, input.value));
      }
    }
  }
}(window, document));