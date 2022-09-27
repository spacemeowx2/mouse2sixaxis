import { IMUData } from "./imu";

export class MouseData {
    onChange?: (data: IMUData[]) => void = () => { }

    constructor() {
    }

    input(events: MouseEvent[]) {

    }
}
