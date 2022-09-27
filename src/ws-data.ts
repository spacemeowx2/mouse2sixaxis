import { IMUData, parseIMUData } from './imu'


export type JCData = {
    raw: number[]
}
export class WSData {
    ws: WebSocket
    rawData?: Uint8Array
    imuData?: IMUData[]
    onChange?: (data: IMUData[]) => void

    constructor(url: string) {
        this.ws = new WebSocket(url)
        this.ws.onmessage = (event) => {
            const currentData: JCData = JSON.parse(event.data)
            this.rawData = new Uint8Array(currentData.raw.slice(13, 13 + 12 * 3))
            this.imuData = parseIMUData(this.rawData)
            this.onChange?.(this.imuData)
        }
    }
}
