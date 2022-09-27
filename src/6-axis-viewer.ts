import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, TransformNode, CreateCylinder, Color3, SceneLoader, Mesh, DynamicTexture, AxesViewer, Space, Axis } from "@babylonjs/core"
import { GridMaterial } from '@babylonjs/materials'
import { vector3, IMUData, direction3 } from "./imu"

export class SixAxisViewer {
    canvas: HTMLCanvasElement
    engine: Engine
    scene: Scene
    acc: TransformNode
    box: Mesh

    constructor(canvasSelector: string) {
        const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement
        if (!canvas) {
            throw new Error('Canvas not found')
        }
        const engine = new Engine(canvas, true)
        const scene = this.createScene()

        const greenColoredMaterial = new StandardMaterial("", scene);
        greenColoredMaterial.disableLighting = true;
        greenColoredMaterial.emissiveColor = Color3.Green().scale(0.9);
        this.acc = SixAxisViewer.createArrow(scene, greenColoredMaterial, 1)
        this.acc.position = new Vector3(0, 0, 0)
        this.acc.setDirection(new Vector3(0, 1, 0))
        this.acc.scaling.setAll(30)

        const box = MeshBuilder.CreateBox('box', { width: 30, height: 30, depth: 15 }, scene)
        box.position.x = 30
        this.box = box

        // Register a render loop to repeatedly render the scene
        engine.runRenderLoop(function () {
            scene.render()
        })

        // Watch for browser/canvas resize events
        window.addEventListener("resize", function () {
            engine.resize()
        })

        this.canvas = canvas
        this.engine = engine
        this.scene = scene
    }
    async load() {
    }
    createScene() {
        // Creates a basic Babylon Scene object
        const scene = new Scene(this.engine)
        // Creates and positions a free camera
        const camera = new ArcRotateCamera("camera1",
            0, Math.PI / 4, 100,
            Vector3.Zero(), scene)
        // This attaches the camera to the canvas
        camera.attachControl(this.canvas, true)
        camera.lowerRadiusLimit = 2
        camera.upperRadiusLimit = 200
        camera.wheelDeltaPercentage = 0.01
        // Creates a light, aiming 0,1,0 - to the sky
        const light = new HemisphericLight("light",
            new Vector3(0, 1, 0), scene)
        // Dim the light a small amount - 0 to 1
        light.intensity = 0.7
        // Built-in 'sphere' shape.
        const sphere = MeshBuilder.CreateSphere("sphere",
            { diameter: 1, segments: 32 }, scene)

        // Ground for positional reference
        const ground = MeshBuilder.CreateGround("ground", { width: 250, height: 250 })
        const gridMaterial = new GridMaterial("groundMaterial")
        gridMaterial.backFaceCulling = false
        gridMaterial.opacity = 0.7
        ground.material = gridMaterial

        new AxesViewer(scene, 10);

        return scene
    }
    update(data: IMUData) {
        const acc = vector3(data.acc)
        const gyro = vector3(data.gyro)
        this.acc.setDirection(acc)
        // this.box.setDirection(direction3(acc), Math.PI / 2)
        const SAMPLE_RATE = 100
        this.box.rotate(Axis.X, Math.PI * gyro.x / SAMPLE_RATE, Space.LOCAL)
        this.box.rotate(Axis.Y, Math.PI * gyro.y / SAMPLE_RATE, Space.LOCAL)
        this.box.rotate(Axis.Z, Math.PI * gyro.z / SAMPLE_RATE, Space.LOCAL)
    }
    static createArrow(scene: Scene, material: StandardMaterial, thickness: number = 1, isCollider = false): TransformNode {
        const arrow = new TransformNode("arrow", scene);
        const cylinder = CreateCylinder("cylinder", { diameterTop: 0, height: 0.075, diameterBottom: 0.0375 * (1 + (thickness - 1) / 4), tessellation: 96 }, scene);
        const line = CreateCylinder("cylinder", { diameterTop: 0.005 * thickness, height: 0.275, diameterBottom: 0.005 * thickness, tessellation: 96 }, scene);

        // Position arrow pointing in its drag axis
        cylinder.parent = arrow;
        cylinder.material = material;
        cylinder.rotation.x = Math.PI / 2;
        cylinder.position.z += 0.3;

        line.parent = arrow;
        line.material = material;
        line.position.z += 0.275 / 2;
        line.rotation.x = Math.PI / 2;

        if (isCollider) {
            line.visibility = 0;
            cylinder.visibility = 0;
        }
        return arrow;
    }
}
