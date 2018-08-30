var inputs = document.getElementsByClassName('taggify-input');
for (var i = 0; i < inputs.length; i++) {
  Taggify.taggify(inputs[i]);
}
Taggify.create_settings_form(document.getElementById('settings'));
Taggify.autocomplete_dict = [
  ['foo', 'bar baz'],
  ['testing', 'just a test'],
  ['taggify', 'a great tagging framework']
]