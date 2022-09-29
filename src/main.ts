import { SixAxisViewer } from './6-axis-viewer'
import { HIDData } from './hid-data'
import { Gamepad } from './gamepad'

const hidData = new HIDData()
const RESET_KEY = 'KeyR'

const PROXY_MODE = true
const sixAxisViewer = new SixAxisViewer('#renderCanvas')
const mainDiv = document.querySelector('#main')!
const lockedTips = document.querySelector('#locked-tips')!
const tips = document.querySelector('#tips')!
const connectBtn = document.querySelector('#connect')!
const gp = new Gamepad()
const ws = new WebSocket('ws://localhost:26214')
if (PROXY_MODE) {
    hidData.onChange = (data) => {
        const report = [0xa1, 0x30, ...data]
        ws.send(JSON.stringify(report))
    }
}
hidData.onIMUChange = (data) => {
    for (const i of data) {
        sixAxisViewer.update(i)
    }
    tips.textContent = JSON.stringify(data[0], null, 2)
}

async function main() {
    await sixAxisViewer.load()
    hidData.restore()
    connectBtn.addEventListener('click', async () => {
        await hidData.connect()
    })

    let locking = false
    let lastEventTime = 0
    let lowestDelta = Infinity
    let mouseEvent: MouseEvent[] = []

    mainDiv.addEventListener('mousemove', (e) => {
        if (!locking) {
            return
        }

        mouseEvent.push(e as MouseEvent)
    })
    document.addEventListener('keypress', (e) => {
        if (!locking) {
            return
        }
        if (e.code === RESET_KEY) {
            console.log('Reset the 6-axis data')
        }
    })

    const raf = () => {
        requestAnimationFrame(raf)
        const now = performance.now()
        if (lastEventTime === 0) {
            lastEventTime = now
            return
        }

        const delta = now - lastEventTime
        if (delta < lowestDelta) {
            lowestDelta = delta
        }

        gp.onMouseMove(mouseEvent)
        mouseEvent = []

        const report = gp.getReport()
        // console.log(report)
        if (!PROXY_MODE) {
            ws.send(JSON.stringify(report))
        }

        lastEventTime = now
    }

    requestAnimationFrame(raf)

    const setLocked = (locked: boolean) => {
        locking = locked
        if (locked) {
            console.log('Pointer locked')
            mainDiv.classList.add('locked')
        } else {
            console.log('Pointer unlocked')
            mainDiv.classList.remove('locked')
        }
    }
    mainDiv.addEventListener('click', (e) => {
        if (e.target !== mainDiv) {
            return
        }
        mainDiv.requestPointerLock()
    })
    document.addEventListener('pointerlockchange', () => {
        setLocked(document.pointerLockElement === mainDiv)
    })

    document.addEventListener('keydown', ({ keyCode }) => {
        if (locking) {
            gp.onKeyDown(keyCode)
        }
    }, false)
    document.addEventListener('keyup', ({ keyCode }) => {
        if (locking) {
            gp.onKeyUp(keyCode)
        }
    })
    document.addEventListener('mousedown', ({ button }) => {
        if (locking) {
            gp.onMouseDown(button)
        }
    }, false)
    document.addEventListener('mouseup', ({ button }) => {
        if (locking) {
            gp.onMouseUp(button)
        }
    })

}

main()
