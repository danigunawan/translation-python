require('../js/lib/annyang.js')
require("../css/translation-page.css")
require('../css/favicon.png')

$(document).ready(function(){
    var output = ""
    var chosen_language = $('#translation-language').val()
    var current_api = $('#translator').val() === 'google_translate' ? "google_translate" : "yandex_translate"
    var recognized_language = $('#recognition-language').val()
    var commands = {
      'given': translate_input_text,
      'save :shortcut': {'regexp': /^save (\w+)$/, 'callback': save_translation},
      'recognize :language': {'regexp': /^recognize (\w+)$/, 'callback': set_recognized_language},
      'translate :language': {'regexp': /^translate (\w+)$/, 'callback': set_translation_language},
      'translator :translator': {'regexp': /^translator (\w+)$/, 'callback': set_translator}
    }

    var recent_translation = {
      original_text: "",
      translated_text: "",
      original_language: "",
      translated_language: "",
      shortcut: ""
    }

    var parameters = {
      onend: recognize_with_annyang
    }

    $('#listen').on('click', function(){
      recognize_with_annyang()
    })

    function save_translation(shortcut){
      recent_translation['shortcut'] = shortcut
      $.ajax({
        type: 'POST',
        url: '/save_translation',
        data: recent_translation,
        dataType: 'json',
        success: function(data){
          responsiveVoice.speak("Saved the translation", "US English Female", parameters)
        }
      })
    }

    function list_saved_translations(){
      $.ajax({
        type: 'GET',
        url: '/list_saved_translations',
        dataType: 'json',
        success: function(data){

        }
      })
    }

    function translate_input_text(){
      let trimmed_input = $.trim($('#input').val())
      if(trimmed_input){
        dictate_translation(trimmed_input, chosen_language, current_api)
      }else{
        responsiveVoice.speak("No input text to translate.", "US English Female", parameters)
      }
    }

    function set_recognized_language(language){
      let trimmed_language = $.trim(language)
      if($.inArray(trimmed_language, ['English', 'Filipino', 'Japanese']) !== -1){
        let new_value = 'en-US'
        if(trimmed_language === 'Filipino'){
          new_value = 'fil-PH'
        }else if(trimmed_language === 'Japanese'){
          new_value = 'ja'
        }
        recognized_language = new_value
        $('label[for="recognition-language"]').text("Recognition Language: " + trimmed_language)
        responsiveVoice.speak(("Recognition language set to " + trimmed_language), "US English Female", parameters)
      }else{
        responsiveVoice.speak("Language not supported.", "US English Female", parameters)
      }
    }

    function set_translation_language(language){
      let trimmed_language = $.trim(language)
      if($.inArray(trimmed_language, ['English', 'Filipino', 'Japanese']) !== -1){
        let new_value = 'en'
        if(trimmed_language === 'Filipino'){
          new_value = 'tl'
        }else if(trimmed_language === 'Japanese'){
          new_value = 'ja'
        }
        chosen_language = new_value
        $('label[for="translation-language"]').text("Translation Language: " + trimmed_language)
        responsiveVoice.speak(("Translation language set to " + trimmed_language), "US English Female", parameters)
      }else{
        responsiveVoice.speak("Language not supported.", "US English Female", parameters)
      }
    }

    function set_translator(translator){
      let trimmed_translator = $.trim(translator)
      if($.inArray(trimmed_translator, ['Google', 'Yandex']) !== -1){
        let new_value = trimmed_translator === 'Google' ? 'google_translate' : 'yandex_translate'
        current_api = $('#translator').val() === 'google_translate' ? "google_translate" : "yandex_translate"
        $('label[for="translator"]').text("Translator: " + trimmed_translator)
        responsiveVoice.speak(("Translator set to " + trimmed_translator), "US English Female", parameters)
      }else{
        responsiveVoice.speak("Translator not supported.", "US English Female", parameters)
      }
    }

    function set_recent_translation(original_text, translated_text, original_language, translated_language){
      recent_translation['original_text'] = original_text
      recent_translation['translated_text'] = translated_text
      recent_translation['original_language'] = original_language
      recent_translation['translated_language'] = translated_language
    }

    function dictate_translation(text, selected_language, api){
      $.ajax({
        type: "POST",
        url: '/translate',
        data: {
          text: text,
          dest: selected_language,
          src: recognized_language,
          api: api
        },
        dataType: 'json',
        success: function(data){
          let destinationLanguage = $('#translation-language').val()

          if($.trim(data.translated_text).length){
            // responsiveVoice.speak("This is what you said: ", 'US English Female')
            $('#untranslated-input').val(data.original_text)
            $('#translated-input').val(data.translated_text)

            set_recent_translation(data.original_text, data.translated_text, data.source_language, data.destination_language)

            let voice_language = 'Spanish Female'

            if(destinationLanguage === 'ja'){
              voice_language = 'Japanese Female'
            }else if(destinationLanguage === 'en'){
              voice_language = 'US English Female'
            }

            responsiveVoice.speak(data.translated_text, voice_language, parameters)
          }else{
            responsiveVoice.speak("No input provided", 'US English Female', parameters)
            $('#untranslated-input').val("")
            $('#translated-input').val("")
          }
        },
        complete: function(data){
          output = ""
        }
      })
    }

    function recognize_with_annyang(){
      if(annyang){
        annyang.removeCallback()
        annyang.removeCommands()

        annyang.addCallback('resultNoMatch', function(phrases){
          output = output + " " + phrases[0]
          let trimmed_output = $.trim(output)
          dictate_translation(trimmed_output, chosen_language, current_api)
        })

        annyang.addCallback('start', function(){
          $('#listen').text("Currently Listening")
          $('#listen').toggleClass('btn-primary btn-danger')
          $('#listen').prop('disabled', true)
        })

        annyang.addCallback('end', function(){
          $('#listen').text("Listen")
          $('#listen').toggleClass('btn-primary btn-danger')
          $('#listen').prop('disabled', false)
        })

        annyang.setLanguage(recognized_language)
        annyang.addCommands(commands)
        annyang.start({autoRestart: false, continuous: false})

      }else{
        responsiveVoice.speak("Annyang Recognition API not started", 'US English Female', parameters)
      }
  }
  $(function(){
    if($('#translation-area').length){
      recognize_with_annyang()
    }
  })
})
