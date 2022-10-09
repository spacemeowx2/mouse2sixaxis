# mouse2sixaxis

## Introduction

This program allows you to use keyboard and mouse as Pro Controller on Nintendo Switch.

It is currently under development.

## Dependencies

```sh
# The script must be run as root. So install it with sudo.
sudo python3 -m pip install nxbt websocket_server
yarn install
```

See also: [Installation Guide in nxbt](https://github.com/Brikwerk/nxbt#installation)

## Usage

Run `agent.py`, and open "Change Grip/Order Menu". After connected, the console will print `Connected`, with port `26214` open.

Run `yarn start`, and open http://localhost:1234 in your browser(Chrome or Edge is recommended, Firefox currently lakes of WebHID support). Click "Click to start" button.

The default keymap is:

| Key  | Action                                 |
| ---- | -------------------------------------- |
| WSAD | Left analog stick                      |
| IJKL | DPad                                   |
| Space| Button B                               |
| F    | R |
| R    | X |
| 1    | - |
| 2    | + |
| Q    | Right analog stick click               |
| L    | Left analog stick click                |
| Y    | Button Y (Also reset six-axis to zero) |
| E    | Button A |
| B    | Button B |
| H    | Home |
| P    | Capture |
| Left Mouse Button     | ZR |
| Right Mouse Button    | ZL |
