import { IMUData, parseIMUData } from "./imu"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// protocol from pyjoycon
class JoyconDevice {
    onReport?: (data: DataView) => void = () => { }
    packetNumber = 0
    rumbleData = [0x00, 0x01, 0x40, 0x40, 0x00, 0x01, 0x40, 0x40]

    /**
     * 
     * @param device Opened HIDDevice
     */
    constructor(public device: HIDDevice) {
        device.addEventListener('inputreport', (e) => {
            this.onReport?.(e.data)
        })
    }
    async writeOutputReport(command: number, subcommand: number, argument: number) {
        this.device.sendReport(command, new Uint8Array([
            this.packetNumber,
            ...this.rumbleData,
            subcommand,
            argument,
        ]))
        this.packetNumber = (this.packetNumber + 1) & 0xF
    }
    async setupSensors() {
        // Enable 6 axis sensors
        this.writeOutputReport(0x01, 0x40, 0x01)

        await sleep(50)

        // Change format of input report
        this.writeOutputReport(0x01, 0x03, 0x30)
    }
}

export class HIDData {
    onChange?: (data: IMUData[]) => void = () => { }
    constructor() {
    }
    async restore() {
        const devices = await navigator.hid.getDevices()
        if (devices.length === 0) {
            return
        }
        const device = devices[0]
        console.log('Restoring device', device)
        await device.open()
        const jcDevice = new JoyconDevice(device)
        await jcDevice.setupSensors()

        jcDevice.onReport = (data) => {
            const imuRawData = new Uint8Array(data.buffer)
            this.onChange?.(parseIMUData(imuRawData.slice(12, 12 + 12 * 3)))
        }
    }
    async connect() {
        const devices = await navigator.hid.requestDevice({
            filters: [{
                vendorId: 0x057E,
                productId: 0x2006, // Joy-Con (L)
            }, {
                vendorId: 0x057E,
                productId: 0x2007, // Joy-Con (R)
            }, {
                vendorId: 0x057E,
                productId: 0x2008, // Joy-Con (Paired)
            }, {
                vendorId: 0x057E,
                productId: 0x2009, // Pro Controller
            }]
        })
        if (devices.length !== 1) {
            throw new Error('Only support one device')
        }
        const device = devices[0]
        console.log('Listening to device', device)
        await device.open()
        const jcDevice = new JoyconDevice(device)
        await jcDevice.setupSensors()

        jcDevice.onReport = (data) => {
            const imuRawData = new Uint8Array(data.buffer)
            this.onChange?.(parseIMUData(imuRawData.slice(12, 12 + 12 * 3)))
        }
    }
}
