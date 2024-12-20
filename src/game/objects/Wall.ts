import * as THREE from "three";
import * as CANNON from "cannon-es";
import { MATERIALS } from "../physics/PhysicsMaterials";
import { WallpaperMaterial } from "../materials/WallpaperMaterial";

export class Wall {
  public mesh: THREE.Mesh;
  public body: CANNON.Body;

  private static readonly WALL_THICKNESS = 0.2;
  private static readonly DEFAULT_HEIGHT = 3;
  private static readonly DEFAULT_WIDTH = 4;
  private static readonly textureLoader = new THREE.TextureLoader();

  constructor(
    private scene: THREE.Scene,
    private physicsWorld: CANNON.World,
    position: THREE.Vector3,
    rotation: number = 0,
    width: number = Wall.DEFAULT_WIDTH,
    height: number = Wall.DEFAULT_HEIGHT
  ) {
    this.createMesh(position, rotation, width, height);
    this.createPhysicsBody(position, rotation, width, height);
    this.addToWorld();
  }

  private createMesh(
    position: THREE.Vector3,
    rotation: number,
    width: number,
    height: number
  ) {
    // Create geometry
    const geometry = new THREE.BoxGeometry(width, height, Wall.WALL_THICKNESS);

    // Load and configure texture
    // const texture = Wall.textureLoader.load(
    //   '/textures/bricks.jpg',
    //   (texture) => {
    //     texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    //     texture.repeat.set(width, height);
    //     texture.needsUpdate = true;
    //   }
    // );

    // // Create material with texture
    // const material = new THREE.MeshStandardMaterial({
    //   map: texture,
    //   roughness: 0.7,
    //   metalness: 0.1,
    //   bumpMap: texture,
    //   bumpScale: 0.02,
    // });

    const material = WallpaperMaterial();

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.rotation.y = rotation;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  private createPhysicsBody(
    position: THREE.Vector3,
    rotation: number,
    width: number,
    height: number
  ) {
    // Create physics shape
    const shape = new CANNON.Box(
      new CANNON.Vec3(width / 2, height / 2, Wall.WALL_THICKNESS / 2)
    );

    // Create physics body
    this.body = new CANNON.Body({
      mass: 0, // Static body
      material: MATERIALS.ground,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });

    // Apply rotation
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
  }

  private addToWorld() {
    this.scene.add(this.mesh);
    this.physicsWorld.addBody(this.body);
  }

  public remove() {
    this.scene.remove(this.mesh);
    this.physicsWorld.removeBody(this.body);
  }

  public update() {
    // Update mesh position and rotation to match physics body
    this.mesh.position.copy(this.body.position as any);
    this.mesh.quaternion.copy(this.body.quaternion as any);
  }
}
