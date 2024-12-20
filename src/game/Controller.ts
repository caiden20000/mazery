import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { Player } from "./Player";

// BUG: When walking at a shallow angle to an axis,
// the player moves at a more severe angle.
// This problem is exhibited on holding the key down.
// If you tap forward, it does not occur.
// This could be due to the physics engine, or something we're doing here.

// Update to bug:
// When setting walk/run speed, the player DOESN'T GO FASTER,,,
// EXCEPT when going WEIRDLY DIAGONAL!
// SO whatever is happening is VERY related to that.

const WALK_SPEED = 8;
const RUN_SPEED = 16;

export class Controller {
  private controls: PointerLockControls;
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private shift = false;
  private movementDirection = new THREE.Vector3();

  constructor(private player: Player, element: HTMLElement) {
    this.controls = new PointerLockControls(this.player.camera, element);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          this.moveForward = true;
          break;
        case "ArrowDown":
        case "KeyS":
          this.moveBackward = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          this.moveLeft = true;
          break;
        case "ArrowRight":
        case "KeyD":
          this.moveRight = true;
          break;
        case "Space":
          this.player.jump();
          break;
        case "ShiftLeft":
          this.shift = true;
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          this.moveForward = false;
          break;
        case "ArrowDown":
        case "KeyS":
          this.moveBackward = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          this.moveLeft = false;
          break;
        case "ArrowRight":
        case "KeyD":
          this.moveRight = false;
          break;
        case "ShiftLeft":
          this.shift = false;
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  }

  public update() {
    if (!this.controls.isLocked) return;

    // Calculate movement direction
    this.movementDirection.set(0, 0, 0);

    if (this.moveForward) this.movementDirection.z += 1;
    if (this.moveBackward) this.movementDirection.z -= 1;
    if (this.moveLeft) this.movementDirection.x -= 1;
    if (this.moveRight) this.movementDirection.x += 1;

    if (this.movementDirection.length() > 0) {
      this.movementDirection.normalize();

      // Apply movement in the direction the camera is facing
      const cameraDirection = new THREE.Vector3();
      this.player.camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();

      const sideways = new THREE.Vector3(
        -cameraDirection.z,
        0,
        cameraDirection.x
      );

      const moveX =
        this.movementDirection.x * sideways.x +
        this.movementDirection.z * cameraDirection.x;
      const moveZ =
        this.movementDirection.x * sideways.z +
        this.movementDirection.z * cameraDirection.z;

      this.player.setMovementDirection(new THREE.Vector3(moveX, 0, moveZ));
    } else {
      this.player.setMovementDirection(new THREE.Vector3(0, 0, 0));
    }

    this.player.MOVE_SPEED = this.shift ? RUN_SPEED : WALK_SPEED;
  }

  public lock() {
    this.controls.lock();
  }

  public get isLocked(): boolean {
    return this.controls.isLocked;
  }
}
