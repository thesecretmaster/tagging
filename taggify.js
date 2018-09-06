(function(window, document) {
  window.Taggify = Object.assign({}, window.Taggify, {
    'default_autocomplete_dict': [],
    'settings': {
      'caret_between_tags': true,
      'delete_button': true,
      'delete_whole_tags': false,
      'override_tab': true,
      'automatically_start_editing_last_tag': false,
      'debugging': false,
      'submit_uncompleted_tags': true,
      'limit_suggestions': true
    },
    'buggy_settings': [
      // 'automatically_start_editing_last_tag'
    ],
    'taggify_element': function(ele) {
      var div;
      if (ele.tagName.toLowerCase() === 'div') {
        div = ele;
      } else {
        div = document.createElement('div');
        ele.parentElement.insertBefore(div, ele);
      }
      div.classList.add('taggify-input');
      var tags_container = document.createElement('div');
      tags_container.className = 'tags';
      if (ele.tagName.toLowerCase() === 'input') {
        input = ele;
        var input_tags = input.className.split(' ');
        for (var i = 0; i < input_tags.length; i++) {
          if (input_tags[i] != '') {
            div.classList.add(input_tags[i]);
          }
        }
        input.className = '';
      } else {
        var input = document.createElement('input');
        input.type = 'text';
      }
      input.setAttribute('autocomplete', 'off')
      var taggify_datalist = ele.getAttribute('taggify-datalist');
      if (taggify_datalist != null) {
        div.setAttribute('taggify-datalist', taggify_datalist);
      }
      var taggify_initial_tags = ele.getAttribute('taggify-initial-tags');
      if (taggify_initial_tags != null) {
        div.setAttribute('taggify-initial-tags', taggify_initial_tags);
      }
      if (input.form != undefined) {
        input.form.addEventListener('submit', function(e) {
          var taggify_inputs = this.getElementsByClassName('taggify-input');
          for (var i = 0; i < taggify_inputs.length; i++) {
            var tag_input = taggify_inputs[i];
            if (SETTINGS.submit_uncompleted_tags) {
              moveInput(input, tag_input.children[0]);
            }
            var start_tags = tag_input.children[0].children;
            var end_tags = tag_input.children[2].children;
            var tags = [];
            for (var j = 0; j < start_tags.length; j++) {
              tags.push(start_tags[j].textContent);
            }
            for (var j = 0; j < end_tags.length; j++) {
              tags.push(end_tags[j].textContent);
            }
            var hidden_input = document.createElement('input');
            hidden_input.type = 'hidden';
            var old_id = input.id;
            var old_name = input.name;
            input.removeAttribute('name');
            hidden_input.name = old_name+'[]';
            for (var j =0; j < tags.length; j++) {
              hidden_input_ele = hidden_input.cloneNode();
              hidden_input_ele.value = tags[j];
              this.appendChild(hidden_input_ele);
            }
          }
        });
      }
      var autocomplete = document.createElement('div');
      autocomplete.className = 'autocomplete';
      var start_tags_container = tags_container.cloneNode();
      var taglist = ele.getAttribute('taggify-datalist');
      if (taglist != undefined && document.getElementById(taglist)) {
        var taglist_elements = document.getElementById(taglist).children;
        if (!div.autocomplete_dict) { div.autocomplete_dict = Taggify.default_autocomplete_dict; }
        for (var i = 0; i < taglist_elements.length; i++) {
          div.autocomplete_dict.push([taglist_elements[i].value, taglist_elements[i].textContent]);
        }
      }
      div.reset_tags = function() {
        resetTags(this);
      }
      div.reset_tags.bind(div);
      div.appendChild(start_tags_container);
      div.appendChild(input);
      div.appendChild(tags_container);
      div.appendChild(autocomplete);
      Taggify.taggify(div);
      div.reset_tags();
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
    return (e.which === num || e.keyCode === num || e.code === name || e.key === name);
  }

  function resetTags(tag_input) {
    var start_tags_container = tag_input.children[0];
    var input = tag_input.children[1];
    var end_tags_container = tag_input.children[2];
    while (end_tags_container.children.length > 0) {
      end_tags_container.removeChild(end_tags_container.firstChild);
    }
    while (start_tags_container.children.length > 0) {
      start_tags_container.removeChild(start_tags_container.firstChild);
    }
    input.value = '';
    var initial_tags = tag_input.getAttribute('taggify-initial-tags');
    if (initial_tags != undefined) {
      var inital_tags = initial_tags.split(',');
      for (var i = 0; i < inital_tags.length; i++) {
        if (inital_tags[i].trim() != '') {
          var start_tag = generateTagEleRaw(inital_tags[i]);
          start_tags_container.appendChild(start_tag);
        }
      }
    }
  }

  function fillInput(input, container) {
    var tag_input = input.parentElement;
    var start_tags_container = tag_input.children[0];
    var end_tags_container = tag_input.children[2];

    if (container === end_tags_container) {
      var ele = container.children[0];
    } else if (container === start_tags_container) {
      var ele = container.children[container.children.length-1];
    }
    if (ele != undefined) {
      input.value = ele.textContent;
      container.removeChild(ele);
      handleTagChange(tag_input);
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

  function generateTagEleRaw(val) {
    var new_tag = document.createElement('span');
    new_tag.textContent = val.trim();
    new_tag.className = 'tag';
    if (SETTINGS.delete_button) {
      var delete_mark = document.createElement('i');
      delete_mark.className = 'fas fa-sm fa-times-circle delete';
      new_tag.appendChild(delete_mark);
    }
    return new_tag;
  }

  function handleTagChange(tag_input) {
    var event = new Event('tag_change');
    tag_input.dispatchEvent(event);
  }

  function generateTagEle(val, container) {
    var tag_input = container.parentElement;
    var start_tags_container = tag_input.children[0];
    var end_tags_container = tag_input.children[2];

    if (val != '' && !tagExists(val, tag_input)) {
      handleTagChange(tag_input);
      var new_tag = generateTagEleRaw(val.trim());
      if (container === end_tags_container) {
       container.insertBefore(new_tag, container.firstChild);
      } else if (container === start_tags_container) {
        container.append(new_tag);
      }
    }
  }

  function moveInput(input, container) {
    if (input.value.trim() != '') {
      if (input.value.replace(/\s/g,'').length === input.value.length) {
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
    var tag_input = container.parentElement;
    var start_tags_container = tag_input.children[0];
    var end_tags_container = tag_input.children[2];
    if (times == null) {
      if (container === start_tags_container) {
        times = end_tags_container.children.length;
      } else if (container === end_tags_container) {
        times = start_tags_container.children.length;
      }
    }
    for (var i = 0; i < times; i++) {
      if (container === start_tags_container && end_tags_container.children.length > 0) {
        start_tags_container.appendChild(end_tags_container.firstChild);
      } else if (container === end_tags_container && start_tags_container.children.length > 0) {
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

    if (container === start_tags_container) {
      other_container = end_tags_container;
    } else if (container === end_tags_container) {
      other_container = start_tags_container;
    }

    for (var i = 0; i < tag_elements.length; i++) {
      var dims = tag_elements[i].getBoundingClientRect();
      widths.push(dims.x);
      widths.push(dims.x+dims.width);
    }

    moveInput(input, other_container);

    if (mouseX > widths[0] && mouseX < widths[widths.length-1]) {
      var counter = 0;
      for (var i = 1; i < widths.length; i = i + 2) {
        counter++;
        if (widths[i-1] < mouseX && mouseX < widths[i+1]) {
          if (container === start_tags_container) {
            moveElementsTo(other_container, start_tags_container.children.length - counter);
          } else {
            moveElementsTo(other_container, counter);
          }
          if (widths[i-1] < mouseX && mouseX < widths[i]) {
            fillInput(input, start_tags_container);
          }
          break;
        }
      }
      if (widths[widths.length-2] < mouseX && mouseX < widths[widths.length-1]) {
        if (container === end_tags_container) {
          moveElementsTo(start_tags_container, null)
        }
        fillInput(input, start_tags_container);
      }
    } else if (container === start_tags_container && mouseX < widths[0]) {
      moveElementsTo(end_tags_container, null);
    } else if (container === end_tags_container && mouseX > widths[widths.length-1]) {
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
      var tag_input = this.parentElement;
      var start_tags_container = tag_input.children[0];
      var input = tag_input.children[1];
      var end_tags_container = tag_input.children[2];

      var start_tags = start_tags_container.children;
      var end_tags = end_tags_container.children;

      var tag = e.target;

      if (tag.classList.contains('delete')) {
        tag = tag.parentElement;
        tag.parentElement.removeChild(tag);
        handleTagChange(tag_input);
        input.focus();
      }
    });

    end_tags_container.addEventListener('click', function(e) {
      var tag_input = this.parentElement;
      var start_tags_container = tag_input.children[0];
      var input = tag_input.children[1];
      var end_tags_container = tag_input.children[2];

      var start_tags = start_tags_container.children;
      var end_tags = end_tags_container.children;

      var tag = e.target;

      if (tag.classList.contains('delete')) {
        tag = tag.parentElement;
        tag.parentElement.removeChild(tag);
        handleTagChange(tag_input);
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

      if (e.target === this) {
        if (widths[widths.length-1] < mouseX) {
          if (end_tags.length != 0) {
            moveInput(input, start_tags_container);
            while (end_tags_container.children.length > 0) {
              start_tags_container.appendChild(end_tags_container.firstChild);
            }
          }
          if (SETTINGS.automatically_start_editing_last_tag && input.value === '') {
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
            handleContainerClick(start_tags_container, mouseX);
          } else {
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
      var index = Array.prototype.indexOf.call(this.children, e.target);
      const rowlen = 3;
      var colNum = index % rowlen;
      var rowNum = Math.floor(index / (rowlen-1+0.001));

      if (checkKeyCode(e, 38, "ArrowUp") && rowNum === 0) {
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

      if (checkKeyCode(e, 9, "Tab") && index === this.children.length-1 && SETTINGS.override_tab) {
        e.preventDefault();
        return false;
      }

      if (checkKeyCode(e, 13, "Enter")) {
        var val = e.target.getAttribute('data-tag');
        input.value = '';
        generateTagEle(val, start_tags_container);
        input.focus();
        clearSuggestions(this);
        e.preventDefault();
        return false;
      }

      return true;
    });

    // This is autocomplete with a bit of input handling mixed in.
    // I need to refactor it.

    input.addEventListener('keydown', function(e) {
      var tag_input = this.parentElement;
      var start_tags_container = tag_input.children[0];
      var input = tag_input.children[1];
      var end_tags_container = tag_input.children[2];
      var suggestionEle = tag_input.children[3];

      var start_tags = start_tags_container.children;
      var end_tags = end_tags_container.children;

      if (checkKeyCode(e, 8, "Backspace") && caretPos(input) === 0 && start_tags.length != 0) {
        if (SETTINGS.delete_whole_tags) {
          start_tags_container.removeChild(start_tags_container.lastChild);
          handleTagChange(tag_input);
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
        suggestionEle.firstChild.focus();
        return false;
      }

      if (checkKeyCode(e, 37, "ArrowLeft") && caretPos(input) === 0) {
        if (!SETTINGS.caret_between_tags || input.value.length === 0) {
          moveInput(input, end_tags_container);
          fillInput(input, start_tags_container);
          e.preventDefault();
        } else {
          moveInput(input, end_tags_container);
          resize_input(input, 0);
        }
        return false;
      }

      if (checkKeyCode(e, 39, "ArrowRight") && caretPos(input) === input.value.length) {
        if (!SETTINGS.caret_between_tags || input.value.length === 0) {
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
      if (i % 4 === 0) {
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
    var header_container = document.createElement('p');
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
    var suggestions = input.parentElement.autocomplete_dict;
    var max_suggestions = 9;
    var max_suggestion_count;
    if (SETTINGS.limit_suggestions && suggestions.length > max_suggestions) {
      max_suggestion_count = max_suggestions;
    } else {
      max_suggestion_count = suggestions.length;
    }
    var max_suggestion_count = suggestions.length;
    for (var i = 0; i < max_suggestion_count; i++) {
      if (suggestions[i][0].includes(input.value)) {
        var name = suggestions[i][0];
        var desc = suggestions[i][1];
        suggestionEle.appendChild(generateSuggestionBox(name, desc, input.value));
      }
    }
  }
}(window, document));
