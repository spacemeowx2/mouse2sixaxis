# from multiprocessing import Lock, Manager, Process
import logging
import time
import statistics as stat
from random import randint
from nxbt.controller import ControllerTypes, ControllerServer
from nxbt.controller.utils import format_msg_switch, format_msg_controller, replace_subarray
from nxbt.bluez import toggle_clean_bluez, find_devices_by_alias
from websocket_server import WebsocketServer
from json import loads, dumps
from threading import Thread, Lock


def random_colour():
    return [
        randint(0, 255),
        randint(0, 255),
        randint(0, 255),
    ]


class ProController(ControllerServer):

    def __init__(self, adapter_path="/org/bluez/hci0", state=None, colour_body=None,
                 colour_buttons=None):
        toggle_clean_bluez(True)
        super().__init__(ControllerTypes.PRO_CONTROLLER, adapter_path=adapter_path, state=state,
                         colour_body=colour_body, colour_buttons=colour_buttons, lock=Lock())

        # set empty state
        self.state['report'] = dumps(self.protocol.report)

        print('Empty report:', self.protocol.report)

    def _on_exit(self):
        toggle_clean_bluez(False)

    def mainloop(self, itr, ctrl):

        duration_start = time.perf_counter()
        while True:
            # Attempt to get output from Switch
            try:
                reply = itr.recv(50)
                if len(reply) > 40:
                    self.logger.debug(format_msg_switch(reply))
            except BlockingIOError:
                reply = None

            # Set Direct Input
            if self.state["direct_input"]:
                self.input.set_controller_input(self.state["direct_input"])

            report = loads(self.state['report'])
            # self.protocol.report = report
            self.protocol.button_status[0] = report[4]
            self.protocol.button_status[1] = report[5]
            self.protocol.button_status[2] = report[6]
            self.protocol.left_stick_centre[0] = report[7]
            self.protocol.left_stick_centre[1] = report[8]
            self.protocol.left_stick_centre[2] = report[9]
            self.protocol.right_stick_centre[0] = report[10]
            self.protocol.right_stick_centre[1] = report[11]
            self.protocol.right_stick_centre[2] = report[12]

            self.protocol.process_commands(reply)

            if reply is None:
                # replace imu data with report data
                self.protocol.report[14:50] = report[14:50]

            report = bytes(self.protocol.report)

            msg = self.protocol.get_report()

            # print(bytes.hex(msg), len(msg))

            if self.logger_level <= logging.DEBUG and reply and len(reply) > 45:
                self.logger.debug(format_msg_controller(msg))

            try:
                # Cache the last packet to prevent overloading the switch
                # with packets on the "Change Grip/Order" menu.
                if msg[3:] != self.cached_msg:
                    itr.sendall(msg)
                    self.cached_msg = msg[3:]
                # Send a blank packet every so often to keep the Switch
                # from disconnecting from the controller.
                elif self.tick >= 132:
                    itr.sendall(msg)
                    self.tick = 0
            except BlockingIOError:
                continue
            except OSError as e:
                # Attempt to reconnect to the Switch
                itr, ctrl = self.save_connection(e)

            # Figure out how long it took to process commands
            duration_end = time.perf_counter()
            duration_elapsed = duration_end - duration_start
            duration_start = duration_end

            sleep_time = 1/132 - duration_elapsed
            if sleep_time >= 0:
                time.sleep(sleep_time)
            self.tick += 1

            if self.logger_level <= logging.DEBUG:
                self.times.append(duration_elapsed)
                if len(self.times) > 100:
                    self.times.pop()
                mean_time = stat.mean(self.times)

                self.logger.debug(
                    f"Tick: {self.tick}, Mean Time: {str(1/mean_time)}")


if __name__ == "__main__":
    # logging.basicConfig(level=logging.NOTSET)

    # resource_manager = Manager()
    reconnect_address = find_devices_by_alias("Nintendo Switch")

    controller_state = {}
    controller_state["state"] = "initializing"
    controller_state["finished_macros"] = []
    controller_state["errors"] = None
    controller_state["direct_input"] = None
    controller_state["report"] = None

    print("Trying to reconnect to", reconnect_address)

    controller = ProController(state=controller_state)
    # controller.run(reconnect_address)
    controller_process = Thread(
        target=controller.run, args=(reconnect_address,))
    controller_process.daemon = True
    controller_process.start()

    print("Started")

    while not controller.state['state'] == "connected":
        if controller.state['state'] == "crashed":
            raise OSError("The watched controller has crashe with error",
                          controller.state['errors'])
        time.sleep(1)

    print("Connected")

    def recv_message(client, server, message):
        controller.state['report'] = message

    server = WebsocketServer(host='127.0.0.1', port=0x6666)
    server.set_fn_message_received(recv_message)
    server.run_forever()
