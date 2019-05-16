from flask import Flask, request, abort

from linebot import (
    LineBotApi, WebhookHandler
)
from linebot.exceptions import (
    InvalidSignatureError
)
from linebot.models import (
    MessageEvent, TextMessage, TextSendMessage, ImageSendMessage,TemplateSendMessage,ButtonsTemplate,PostbackTemplateAction
)
import os
app = Flask(__name__)

# Channel Access Token
line_bot_api = LineBotApi(os.environ['lineToken'])
# Channel Secret
handler = WebhookHandler(os.environ['lineSecret'])

# 監聽所有來自 /callback 的 Post Request
@app.route("/callback", methods=['POST'])
def callback():
    # get X-Line-Signature header value
    signature = request.headers['X-Line-Signature']

    # get request body as text
    body = request.get_data(as_text=True)
    app.logger.info("Request body: " + body)

    # handle webhook body
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)

    return 'OK'


@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    print(event)
    """
    * event.message.text 是 使用者傳回來的對話
    * TextSendMessage 則是把傳回來的對話改成可以replay or push 的格式
    * 建議讀者可以自行更改(text=event.message.text) 例如改成 (text="Hello World")
    """
    message = TextSendMessage(text=event.message.text)
    
    replay_message(event,message)
 
def replay_message(event,text):
    line_bot_api.reply_message(
        event.reply_token,
        text)
        
def push_message(event,text):
    line_bot_api.push_message(
        event.source.user_id,
        text)        


    
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
