import * as THREE from "three";
import * as CANNON from "cannon-es";
import { Player } from "./Player";
import { MATERIALS, CONTACT_MATERIALS } from "./physics/PhysicsMaterials";
import { SCENE_SETTINGS } from "./constants/SceneConstants";
import { kruzkal_maze, LightGrid, WallMaze } from "./Maze";
import CannonDebugger from "cannon-es-debugger";
import { OfficeTileMaterial } from "./materials/OfficeTileMaterial";
import { CarpetMaterial } from "./materials/CarpetMaterial";

interface PhysicsObject {
  mesh: THREE.Mesh;
  body: CANNON.Body;
}

const CANNON_DEBUG = false;
const CEILING_LEVEL = 6;

export class GameScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public physicsWorld: CANNON.World;
  public player: Player;
  private physicsObjects: PhysicsObject[] = [];
  private debugger: any;

  constructor() {
    this.setupScene();
    this.setupPhysics();
    this.setupPlayer();
    this.setupEnvironment();
    this.setupEventListeners();
  }

  private setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = SCENE_SETTINGS.SKY_COLOR;
    this.scene.fog = new THREE.Fog(
      0,
      SCENE_SETTINGS.FOG_SETTINGS.near,
      SCENE_SETTINGS.FOG_SETTINGS.far
    );

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Lighting
    // const ambientLight = new THREE.AmbientLight(0x404040, 3);
    // this.scene.add(ambientLight);
    // const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // directionalLight.scale.set(100, 100, 100);
    // directionalLight.position.set(10, 10, 10);
    // directionalLight.castShadow = true;

    // // const lightGrid = new LightGrid(this.scene, 3, 3, CEILING_LEVEL);

    // // Configure shadow properties
    // directionalLight.shadow.mapSize.width =
    //   SCENE_SETTINGS.SHADOW_SETTINGS.mapSize;
    // directionalLight.shadow.mapSize.height =
    //   SCENE_SETTINGS.SHADOW_SETTINGS.mapSize;
    // directionalLight.shadow.camera.near =
    //   SCENE_SETTINGS.SHADOW_SETTINGS.camera.near;
    // directionalLight.shadow.camera.far =
    //   SCENE_SETTINGS.SHADOW_SETTINGS.camera.far;
    // const shadowSmoothness = 80;
    // directionalLight.shadow.camera.left = -shadowSmoothness;
    // directionalLight.shadow.camera.right = shadowSmoothness;
    // directionalLight.shadow.camera.top = -shadowSmoothness;
    // directionalLight.shadow.camera.bottom = shadowSmoothness;

    // this.scene.add(directionalLight);
  }

  private setupPhysics() {
    this.physicsWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });

    // Add contact materials
    Object.values(CONTACT_MATERIALS).forEach((material) => {
      this.physicsWorld.addContactMaterial(material);
    });
  }

  private setupPlayer() {
    this.player = new Player(this.physicsWorld, this.camera);
    this.scene.add(this.player.light);
  }

  private setupEnvironment() {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = CarpetMaterial();

    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.receiveShadow = true;
    groundMesh.rotation.x = -Math.PI / 2;
    this.scene.add(groundMesh);

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      material: MATERIALS.ground,
    });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    this.physicsWorld.addBody(groundBody);

    // ceiling
    const ceilingGeom = new THREE.PlaneGeometry(500, 500);
    const ceilingMat = OfficeTileMaterial();
    const ceilingMesh = new THREE.Mesh(ceilingGeom, ceilingMat);
    ceilingMesh.receiveShadow = true;
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(0, CEILING_LEVEL, 0);
    this.scene.add(ceilingMesh);

    const ceilingShape = new CANNON.Plane();
    const ceilingBody = new CANNON.Body({
      mass: 0,
      material: MATERIALS.ground,
    });
    ceilingBody.addShape(ceilingShape);
    ceilingBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    this.physicsWorld.addBody(ceilingBody);

    // Add physics cubes
    // for (let i = 0; i < 5; i++) {
    //   this.addPhysicsCube(
    //     Math.random() * 10 - 5,
    //     Math.random() * 10 + 5,
    //     Math.random() * 10 - 5
    //   );
    // }

    const maze = kruzkal_maze(10, 10);
    new WallMaze(maze, this.scene, this.physicsWorld, CEILING_LEVEL);

    // Add Cannon.js debugger
    const cannonDebugger = new CannonDebugger(this.scene, this.physicsWorld);
    this.debugger = cannonDebugger;
  }

  private addPhysicsCube(x: number, y: number, z: number) {
    const size = 1;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      roughness: 0.7,
      metalness: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
    const body = new CANNON.Body({
      mass: 1,
      shape: shape,
      position: new CANNON.Vec3(x, y, z),
      material: MATERIALS.ground,
    });
    this.physicsWorld.addBody(body);

    this.physicsObjects.push({ mesh, body });
  }

  private setupEventListeners() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public update() {
    this.physicsWorld.step(1 / 60);

    // Update meshes to match physics bodies
    this.physicsObjects.forEach(({ mesh, body }) => {
      mesh.position.copy(body.position as any);
      mesh.quaternion.copy(body.quaternion as any);
    });
    if (CANNON_DEBUG) this.debugger.update();
    this.renderer.render(this.scene, this.camera);
  }
}
