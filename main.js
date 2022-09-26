const RESET_KEY = 'KeyR';

const main = document.querySelector('#main');
const lockedTips = document.querySelector('#locked-tips');

let locking = false;
let lastEventTime = 0;
let lowestDelta = Infinity;
/**
 * @type {MouseEvent[]}
 */
let mouseEvent = [];

main.addEventListener('mousemove', (e) => {
    if (!locking) {
        return;
    }

    mouseEvent.push(e);
})
document.addEventListener('keypress', (e) => {
    if (!locking) {
        return;
    }
    if (e.code === RESET_KEY) {
        console.log('Reset the 6-axis data');
    }
})

const raf = () => {
    requestAnimationFrame(raf);
    const now = performance.now();
    if (lastEventTime === 0) {
        lastEventTime = now;
        return;
    }

    const delta = now - lastEventTime;
    if (delta < lowestDelta) {
        lowestDelta = delta;
    }

    for (const i of mouseEvent) {
        console.log(i.timeStamp)
    }
    mouseEvent = []

    lastEventTime = now;
};

requestAnimationFrame(raf);

const setLocked = (locked) => {
    locking = locked;
    if (locked) {
        console.log('Pointer locked');
        main.classList.add('locked');
    } else {
        console.log('Pointer unlocked');
        main.classList.remove('locked');
    }
}
main.addEventListener('click', () => {
    main.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
    setLocked(document.pointerLockElement === main);
});
