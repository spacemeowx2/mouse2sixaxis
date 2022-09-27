from websocket_server import WebsocketServer
from pyjoycon import JoyCon, get_R_id
from threading import Thread
from time import sleep
from json import dumps

joycon_id = get_R_id()
joycon = JoyCon(*joycon_id)

server = WebsocketServer(host='127.0.0.1', port=0x6666)

thread = Thread(target = server.run_forever)
thread.start()
print('Server started on port', server.port)
while True:
    data = {
        "raw": [int(i) for i in joycon._input_report]
    }
    server.send_message_to_all(dumps(data))
    sleep(0.01)
