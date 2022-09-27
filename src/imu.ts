import { Vector3 } from '@babylonjs/core'

export type Vector = {
    x: number
    y: number
    z: number
}
export type IMUData = {
    acc: Vector
    gyro: Vector
}

export const vector3 = (vec: Vector): Vector3 => {
    return new Vector3(
        vec.x,
        vec.z,
        -vec.y,
    )
}

export const direction3 = (vec: Vector): Vector3 => {
    const v = new Vector3(
        vec.x,
        vec.z,
        -vec.y,
    )
    return v
}

export const parseIMUData = (data: Uint8Array): IMUData[] => {
    const view = new DataView(data.buffer)
    const result: IMUData[] = []
    const ACC_SCALE = 0.000244
    const GYRO_SCALE = 0.0001694

    for (let i = 0; i < data.length; i += 12) {
        result.push({
            acc: {
                x: view.getInt16(i, true) * ACC_SCALE,
                y: view.getInt16(i + 2, true) * ACC_SCALE,
                z: view.getInt16(i + 4, true) * ACC_SCALE,
            },
            gyro: {
                x: view.getInt16(i + 6, true) * GYRO_SCALE,
                y: view.getInt16(i + 8, true) * GYRO_SCALE,
                z: view.getInt16(i + 10, true) * GYRO_SCALE,
            },
        })
    }

    return result
}
