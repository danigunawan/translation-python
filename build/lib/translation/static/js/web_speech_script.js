$(document).ready(function(){
  var output = ""
  var chosen_language = $('#translation-language').val()
  var current_translator_url = $('#translator').val()

  $('#translation-language').on('change', function(){
    chosen_language = $(this).val()
  })

  $('#translator').on('change', function(){
    let button_text = $(this).val() == 'google_translate' ? "Google Trans" : "Yandex Translate"
    current_translator_url = $(this).val() == 'google_translate' ? "/google_translate" : "/yandex_translate"
    $('#speak').text("Translate with " + button_text)
  })

  function disable_fields(){
    $('#speak').prop('disabled', true)
    $('select').prop('disabled', true)
  }

  function enable_fields(){
    $('#speak').prop('disabled', false)
    $('select').prop('disabled', false)
    $('#speak').data('click', 'off')
  }

  function dictate_translation(text, chosen_language, current_translator_url){
    $.ajax({
      type: "POST",
      url: current_translator_url,
      data: {
        text: text,
        dest: chosen_language
      },
      dataType: 'json',
      success: function(data){
        let destinationLanguage = $('#translation-language').val()

        if($.trim(data.translation).length){
          responsiveVoice.speak("This is what you said: ", 'US English Female')
          if(destinationLanguage === 'ja'){
            responsiveVoice.speak(data.translation, 'Japanese Female')
          }else if(destinationLanguage === 'en'){
            responsiveVoice.speak(data.translation, 'US English Female')
          }else{
            responsiveVoice.speak(data.translation, 'Spanish Female')
          }
          $('#untranslated-input').val(data.original_text)
          $('#translated-input').val(data.translation)
        }else{
          responsiveVoice.speak("No input provided", 'US English Female')
          $('#untranslated-input').val("")
          $('#translated-input').val("")
        }
      },
      complete: function(data){
        enable_fields()
      }
    })
  }

  function recognize_with_annyang(){
    if(annyang){
      annyang.addCallback('result', function(phrases){
        output = output + " " + phrases[0]
        annyang.abort()
      })

      annyang.addCallback('end', function(){
        let trimmed_output = $.trim(output)
        if(trimmed_output){
          dictate_translation(trimmed_output, chosen_language, current_translator_url)
        }else{
          annyang.abort()
          enable_fields()
          responsiveVoice.speak('No input provided in annyang', 'US English Female')
        }
      })

      $('#speak').on("click", function() {
        let trimmed_input = $.trim($('#input').val())
        disable_fields()
        if(trimmed_input){
          dictate_translation(trimmed_input, chosen_language, current_translator_url)
        }else{
          output = ""
          annyang.setLanguage($('#recognition-language').val())
          annyang.start()
        }
      })
    }else{
      responsiveVoice.speak("Annyang Recognition API not started", 'US English Female')
    }

  }

  $(function(){
    recognize_with_annyang()
  })
})
