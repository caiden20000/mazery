import * as THREE from "three";
import * as CANNON from "cannon-es";
import { MATERIALS } from "./physics/PhysicsMaterials";

const HEAD_BOB_CYCLE_LENGTH = 60;
const HEAD_BOB_HEIGHT = 0.1;
const FLASHLIGHT_SPEED = 0.3;

export class Player {
  public body: CANNON.Body;
  private movementDirection = new THREE.Vector3();
  public MOVE_SPEED = 25;
  private readonly MAX_VELOCITY = 50;
  public light: THREE.SpotLight;
  public distanceWalked = 0;
  public verticalOffset = 0;

  constructor(
    private physicsWorld: CANNON.World,
    public camera: THREE.PerspectiveCamera
  ) {
    this.setupPhysicsBody();
    this.camera.position.set(0, 2, 5);

    this.light = new THREE.SpotLight(0xffffff, 3, 0, Math.PI / 5, 0.3, 0.5);
  }

  private setupPhysicsBody() {
    const radius = 0.2;
    const height = 1.8;
    const playerShape = new CANNON.Cylinder(radius, radius, height, 8);

    const quaternion = new CANNON.Quaternion();
    quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);

    this.body = new CANNON.Body({
      mass: 75,
      shape: playerShape,
      material: MATERIALS.player,
      position: new CANNON.Vec3(0, 5, 0),
      fixedRotation: true,
      linearDamping: 0.9,
      angularDamping: 0.9,
    });

    this.body.quaternion.copy(quaternion);

    const footShape = new CANNON.Sphere(radius);
    this.body.addShape(footShape, new CANNON.Vec3(0, -height / 2, 0));

    this.physicsWorld.addBody(this.body);
  }

  public setMovementDirection(direction: THREE.Vector3) {
    this.movementDirection.copy(direction);
  }

  public jump() {
    const JUMP_THRESHOLD = 0.1;
    if (Math.abs(this.body.velocity.y) < JUMP_THRESHOLD && this.isGrounded()) {
      this.body.velocity.y = 7;
    }
  }

  private isGrounded(): boolean {
    const start = this.body.position;
    const end = new CANNON.Vec3(start.x, start.y - 1.1, start.z);
    const ray = new CANNON.Ray(start, end);
    ray.skipBackfaces = true;

    const result = new CANNON.RaycastResult();
    ray.intersectWorld(this.physicsWorld, { result });

    return result.hasHit;
  }

  public update() {
    // Apply movement based on current direction
    if (this.movementDirection.lengthSq() > 0) {
      const targetVelocityX = this.movementDirection.x * this.MOVE_SPEED;
      const targetVelocityZ = this.movementDirection.z * this.MOVE_SPEED;

      // Smoothly interpolate current velocity to target velocity
      this.body.velocity.x += (targetVelocityX - this.body.velocity.x) * 0.15;
      this.body.velocity.z += (targetVelocityZ - this.body.velocity.z) * 0.15;

      // Clamp velocity
      const velocityMagnitude = Math.sqrt(
        this.body.velocity.x ** 2 + this.body.velocity.z ** 2
      );
      if (velocityMagnitude > this.MAX_VELOCITY) {
        const scale = this.MAX_VELOCITY / velocityMagnitude;
        this.body.velocity.x *= scale;
        this.body.velocity.z *= scale;
      }
      this.distanceWalked += velocityMagnitude;
    } else {
      // Apply friction when no movement input
      this.body.velocity.x *= 0.85;
      this.body.velocity.z *= 0.85;
      const velocityMagnitude = Math.sqrt(
        this.body.velocity.x ** 2 + this.body.velocity.z ** 2
      );
      this.distanceWalked += velocityMagnitude;
    }

    // Head bobbing
    this.verticalOffset =
      Math.sin((this.distanceWalked / HEAD_BOB_CYCLE_LENGTH) % Math.PI) *
      HEAD_BOB_HEIGHT;

    // Update camera position
    this.camera.position.x = this.body.position.x;
    this.camera.position.y = this.body.position.y + 1.5 + this.verticalOffset;
    this.camera.position.z = this.body.position.z;

    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);

    // Calculate the desired target position based on the camera's position and direction
    const desiredTargetPosition = new THREE.Vector3()
      .copy(this.camera.position)
      .add(cameraDirection);

    // Interpolate the spotlight's current target position 85% toward the desired target position
    const easedTargetPosition = new THREE.Vector3()
      .copy(this.light.target.position)
      .lerp(desiredTargetPosition, FLASHLIGHT_SPEED);

    // Update the spotlight's target position
    this.light.target.position.copy(easedTargetPosition);
    this.light.target.updateMatrixWorld();

    // Ensure the light follows the camera's position
    this.light.position.copy(this.camera.position);
  }
}
