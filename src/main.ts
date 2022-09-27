import { SixAxisViewer } from './6-axis-viewer'
import { HIDData } from './hid-data'
import { MouseData } from './mouse-data'


const hidData = new HIDData()
const mousueData = new MouseData()
const RESET_KEY = 'KeyR'

const sixAxisViewer = new SixAxisViewer('#renderCanvas')
const mainDiv = document.querySelector('#main')!
const lockedTips = document.querySelector('#locked-tips')!
const tips = document.querySelector('#tips')!
const connectBtn = document.querySelector('#connect')!
hidData.onChange = (data) => {
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

        mousueData.input(mouseEvent)
        mouseEvent = []

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

}

main()
