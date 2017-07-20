import os
from flask import Flask, request, render_template, url_for, jsonify
from googletrans import Translator
from yandex_translate import YandexTranslate
from flask_bootstrap import Bootstrap

app = Flask(__name__) # create the application instance
Bootstrap(app)
app.config.from_object(__name__) # load config from this file i.e. translation.py

# Load default config and override config from an environment variable
# generated the secret key by importing os and binascii
# then calling binsacii.hexlify(os.urandom(24))
app.config.update(dict(
    SECRET_KEY='ba847f1861cb636b722ed59097bc82ce66b42da6ddf2e290'
))

app.config.from_envvar('FLASKR_SETTINGS', silent=True)

@app.route('/')
def index():
    languages = { "English": "en", "Filipino": "tl", "Japanese": "ja" }
    recognitions = { "English": "en-US", "Filipino": "fil-PH", "Japanese": "ja" }
    translators = { "Google Translate" : "google_translate" , "Yandex Translate": "yandex_translate" }

    return render_template('index.html', languages=languages, recognitions=recognitions, translators=translators)

@app.route('/yandex_translate', methods=['POST'])
def yandex_translate():
    translated_text = ""
    if len(request.form['text']) > 0:
        translator = YandexTranslate("trnsl.1.1.20170124T023923Z.db368f9b9c7a7f06.26bd8be0cf53946d203c786ae83d24c73ea5954d")
        translated_text = translator.translate(request.form['text'], request.form['dest'])['text'][0]

    return jsonify({ 'translation': translated_text, 'original_text': request.form['text'] })

@app.route('/google_translate', methods=['POST'])
def google_translate():
    translated_text = ""
    if len(request.form['text']) > 0:
        translator = Translator()
        translated_text = translator.translate(request.form['text'], dest=request.form['dest']).text
    return jsonify({ 'translation': translated_text, 'original_text': request.form['text'] })


@app.context_processor
def override_url_for():
    return dict(url_for=dated_url_for)

def dated_url_for(endpoint, **values):
    if endpoint == 'static':
        filename = values.get('filename', None)
        if filename:
            file_path = os.path.join(app.root_path,
                                     endpoint, filename)
            values['q'] = int(os.stat(file_path).st_mtime)
    return url_for(endpoint, **values)
