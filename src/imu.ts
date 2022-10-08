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

export const vectorAdd = (a: Vector, b: Vector): Vector => ({
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
})

export const vectorSub = (a: Vector, b: Vector): Vector => ({
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
})

export const VECTOR_ZERO: Vector = { x: 0, y: 0, z: 0 }

export const vector3 = (vec: Vector): Vector3 => {
    return new Vector3(
        vec.x,
        -vec.z,
        vec.y,
    )
}

export const direction3 = (vec: Vector): Vector3 => {
    const v = new Vector3(
        vec.x,
        -vec.z,
        vec.y,
    )
    return v
}

const ACC_SCALE = 0.000244
const GYRO_SCALE = 0.0001694

export const packIMUData = (imuData: IMUData, rangeRange: number = 0): number[] => {
    const rnd = () => Math.round(Math.random() * rangeRange * 2 - rangeRange)
    const { acc, gyro } = imuData
    const dat = new Int16Array([
        acc.x / ACC_SCALE + rnd(),
        acc.y / ACC_SCALE + rnd(),
        acc.z / ACC_SCALE + rnd(),
        gyro.x / GYRO_SCALE + rnd(),
        gyro.y / GYRO_SCALE + rnd(),
        gyro.z / GYRO_SCALE + rnd(),
    ])
    return [...new Uint8Array(dat.buffer)]
}

export const parseIMUData = (data: Uint8Array): IMUData[] => {
    const view = new DataView(data.buffer)
    const result: IMUData[] = []

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
