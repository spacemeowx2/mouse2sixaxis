import { IMUData, packIMUData } from "./imu"

type Calibration = {
    center_x: number;
    center_y: number;
    min_x: number;
    max_x: number;
    min_y: number;
    max_y: number;
}

// Left Stick calibration values
const LEFT_STICK_CALIBRATION: Calibration = {
    "center_x": 2159,
    "center_y": 1916,
    // Zeroed Min/Max X and Y
    "min_x": -1466,
    "max_x": 1517,
    "min_y": -1583,
    "max_y": 1465,
}
// Right Stick calibration values
const RIGHT_STICK_CALIBRATION: Calibration = {
    "center_x": 2070,
    "center_y": 2013,
    // Zeroed Min/Max X and Y
    "min_x": -1522,
    "max_x": 1414,
    "min_y": -1531,
    "max_y": 1510,
}

class AnalogStick {
    _x: number = 0.5
    _y: number = 0.5
    constructor(public calibration: Calibration) {
        this.move()
    }
    move() {
        // TODO
    }
    set x(v) {
        if (v > 1) {
            v = 1
        }
        if (v < 0) {
            v = 0
        }
        this._x = v
        this.move()
    }
    get x() {
        return this._x
    }
    set y(v) {
        if (v > 1) {
            v = 1
        }
        if (v < 0) {
            v = 0
        }
        this._y = v
        this.move()
    }
    get y() {
        return this._y
    }
    toBytes() {
        const xx = this.x * 2 - 1
        const yy = this.y * 2 - 1

        const { min_x, max_x, min_y, max_y, center_x, center_y } = this.calibration
        let x = xx < 0 ? (Math.abs(xx) * min_x + center_x) : (xx * max_x + center_x)
        let y = yy < 0 ? (Math.abs(yy) * min_y + center_y) : (yy * max_y + center_y)

        x = Math.round(x)
        y = Math.round(y)

        const data = [x & 0xFF, ((y & 0xF) << 4) | ((x >> 8) & 0xF), y >> 4]

        return data
    }
}
class MouseSixAxis {
    rX = 0
    rY = 0
    lt = performance.now()
    ds = []
    onMove(x: number, y: number) {
        this.rX += x
        this.rY += y
        const MAX = 800
        if (this.rX > MAX) {
            this.rX = MAX
        } else if (this.rX < -MAX) {
            this.rX = -MAX
        }
        if (this.rY > MAX) {
            this.rY = MAX
        } else if (this.rY < -MAX) {
            this.rY = -MAX
        }
    }
    onSend() {
        const A = 25
        const x = this.rX * A
        const y = this.rY * A
        this.rX = this.rY = 0
    }
}
class PadButton {
    btns: (0 | 1)[]
    constructor() {
        this.btns = []
        for (let i = 0; i < 22; i++) {
            this.btns.push(0)
        }
    }
    toBytes() {
        const btns = this.btns
        let byte1 = 0, byte2 = 0, byte3 = 0
        for (let i = 0; i < 8; i++) {
            byte1 |= (btns[i] & 1) << i
        }
        for (let i = 0; i < 6; i++) {
            byte2 |= (btns[i + 8] & 1) << i
        }
        for (let i = 0; i < 8; i++) {
            byte3 |= (btns[i + 8 + 6] & 1) << i
        }
        return [byte1, byte2, byte3]
    }
}

class SixAxis {
    data = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0]
    ]
    imuData: IMUData = {
        acc: {
            x: 0,
            y: 0,
            z: 0
        },
        gyro: {
            x: 0,
            y: 0,
            z: 0
        },
    }
    randomRange = 0.0001
    update() {
        const cur = packIMUData(this.imuData, 0)

        const { data } = this
        data[2] = data[1]
        data[1] = data[0]
        data[0] = cur
    }
    toBytes() {
        const { data } = this
        const dat = new Uint8Array([...data[0], ...data[1], ...data[2]])
        return [...dat]
    }
}

export class Gamepad {
    seqId = 0
    button = new PadButton()
    ls = new AnalogStick(LEFT_STICK_CALIBRATION)
    rs = new AnalogStick(RIGHT_STICK_CALIBRATION)
    sixAxis = new SixAxis()
    ms = new MouseSixAxis()
    btnMap = new Map([
        [73, 15], // ijkl, dpad
        [75, 14],
        [76, 16],
        [74, 17],

        [32, 2],   // space, B
        [70, 6],   // f, R
        [82, 1],   // r, X
        [88, 1],   // x, X
        [49, 8],   // 1, -
        [50, 9],   // 2, +
        [81, 10],  // q, RClick
        [76, 11],  // l, LClick
        [89, 0],   // y, Y
        [69, 3],   // e, A
        [66, 2],   // b, B

        [72, 12],  // h, HOME
        [80, 13],  // p, CAPTURE
    ])
    mouseBtnMap = new Map([
        [0, 7],    // ZR
        [2, 21]     // ZL
    ])
    fakeLSMap = new Map([
        [87, [0, 1]],
        [83, [0, -1]],
        [68, [1, 0]],
        [65, [-1, 0]]
    ])
    fakeLSState = new Map([...this.fakeLSMap.keys()].map(k => [k, 0]))
    rX = 0
    rY = 0

    onMouseMove(events: MouseEvent[]) {
        for (let e of events) {
            this.onMove(e.movementX, e.movementY)
        }
    }
    bind(ipt: Element) {
        ipt.addEventListener('mousemove', (e) => {
            const { movementX, movementY } = e as MouseEvent
            if (document.pointerLockElement === ipt) {
                this.onMove(movementX, movementY)
            }
        })
        document.addEventListener('keydown', ({ keyCode }) => {
            this.onKeyDown(keyCode)
        }, false)
        document.addEventListener('keyup', ({ keyCode }) => {
            this.onKeyUp(keyCode)
        })
        document.addEventListener('mousedown', ({ button }) => {
            this.onMouseDown(button)
        }, false)
        document.addEventListener('mouseup', ({ button }) => {
            this.onMouseUp(button)
        })
    }
    fakeLS() {
        let x = 1, y = 1
        for (let k of this.fakeLSMap.keys()) {
            if (this.fakeLSState.get(k) === 1) {
                let t = this.fakeLSMap.get(k)!
                x += t[0]
                y += t[1]
            }
        }
        this.ls.x = x / 2
        this.ls.y = y / 2
    }
    onMouseDown(b: number) {
        const btns = this.button.btns
        if (this.mouseBtnMap.has(b)) {
            btns[this.mouseBtnMap.get(b)!] = 1
        }
        // this.send()
    }
    onMouseUp(b: number) {
        const btns = this.button.btns
        if (this.mouseBtnMap.has(b)) {
            btns[this.mouseBtnMap.get(b)!] = 0
        }
        // this.send()
    }
    onKeyDown(c: number) {
        const btns = this.button.btns
        if (this.fakeLSState.has(c)) {
            this.fakeLSState.set(c, 1)
            this.fakeLS()
        } else if (this.btnMap.has(c)) {
            btns[this.btnMap.get(c)!] = 1
        }
        // this.send()
    }
    onKeyUp(c: number) {
        const btns = this.button.btns
        if (this.fakeLSState.has(c)) {
            this.fakeLSState.set(c, 0)
            this.fakeLS()
        } else if (this.btnMap.has(c)) {
            btns[this.btnMap.get(c)!] = 0
        }
        // this.send()
    }
    onMove(x: number, y: number) {
        this.ms.onMove(x, y)
        this.rX += x
        this.rY += y
    }
    mouseToBytes() {
        const x = this.rX * 20
        const y = this.rY * 20
        const ary = new Int16Array([x, y])

        this.rX = this.rY = 0
        return [...new Uint8Array(ary.buffer)]
    }
    getReport() {
        this.sixAxis.update()
        const bytes = [
            0xA1, 0x30, 0, 0x90,
            ...this.button.toBytes(),
            ...this.ls.toBytes(),
            ...this.rs.toBytes(),
            0x00,
            ...this.sixAxis.toBytes(),
            // 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            // 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]

        // const bytes = [
        //     0xA1, 0x30,
        //     ...this.button.toBytes(),
        //     ...this.ls.toBytes(),
        //     ...this.rs.toBytes(),
        //     ...this.mouseToBytes()
        // ]
        return bytes
    }
}