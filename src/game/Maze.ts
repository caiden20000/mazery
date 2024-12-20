import { PointLight, Scene, Vector3 } from 'three';
import * as CANNON from 'cannon-es';
import { Wall } from './objects/Wall';

// Shuffle array
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

enum Face {
  TOP,
  BOTTOM,
  LEFT,
  RIGHT,
}

// Width and height are in cells
export class Maze {
  walls: Map<string, boolean> = new Map();
  constructor(public width: number, public height: number) {
    this.initWalls();
  }

  _posToKey(x: number, y: number, face: Face) {
    return `${x},${y},${face}`;
  }

  setWall(x: number, y: number, face: Face, value: boolean) {
    this.walls.set(this._posToKey(x, y, face), value);
  }

  getWallValue(
    x: number,
    y: number,
    face: Face,
    countEdgesAsWalls: boolean = false
  ): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    console.log(x, y);
    if (face == Face.BOTTOM || face == Face.RIGHT) {
      return this.walls.get(this._posToKey(x, y, face)) as boolean;
    } else {
      if (face == Face.LEFT) {
        if (x == 0) return countEdgesAsWalls;
        return this.getWallValue(x - 1, y, Face.RIGHT);
      } else if (face == Face.TOP) {
        if (y == 0) return countEdgesAsWalls;
        return this.getWallValue(x, y - 1, Face.BOTTOM);
      }
    }
    return false;
  }

  // We store walls normalized to RIGHT and BOTTOM.
  // This means 0,0 is the top left corner.
  initWalls() {
    for (const wallPos of this.allWallPos()) {
      this.setWall(wallPos.x, wallPos.y, wallPos.face, true);
    }
  }

  *allWallPos() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (x != this.width) yield { x, y, face: Face.RIGHT };
        if (y != this.height) yield { x, y, face: Face.BOTTOM };
      }
    }
  }

  getCellWalls(x: number, y: number, countEdgesAsWalls: boolean = false) {
    // Our walls are normalized BOTTOM and RIGHT
    return {
      [Face.TOP]: this.getWallValue(x, y, Face.TOP, countEdgesAsWalls),
      [Face.BOTTOM]: this.getWallValue(x, y, Face.BOTTOM, countEdgesAsWalls),
      [Face.LEFT]: this.getWallValue(x, y, Face.LEFT, countEdgesAsWalls),
      [Face.RIGHT]: this.getWallValue(x, y, Face.RIGHT, countEdgesAsWalls),
    };
  }

  toString(): string {
    let result = ' _'.repeat(this.width) + '\n';
    for (let y = 0; y < this.height; y++) {
      let row = '|';
      for (let x = 0; x < this.width; x++) {
        row += this.getWallValue(x, y, Face.BOTTOM) ? `_` : ' ';
        row += this.getWallValue(x, y, Face.RIGHT) ? '|' : ' ';
      }
      result += row + '\n';
    }
    return result;
  }

  getAllTrueWalls() {
    const walls = [...this.allWallPos()].filter((p) =>
      this.getWallValue(p.x, p.y, p.face)
    );
    return walls;
  }
}

type KCell = {
  x: number;
  y: number;
  set: number;
};

export function kruzkal_maze(width: number, height: number) {
  // Initialize cell sets
  const cells: KCell[] = [];
  let setIndex = 0;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      cells.push({ x, y, set: setIndex });
      setIndex++;
    }
  }

  function getCellCoordinatesFromWall(x: number, y: number, face: Face) {
    if (face == Face.RIGHT)
      return [
        { x, y },
        { x: x + 1, y },
      ];
    return [
      { x, y },
      { x, y: y + 1 },
    ];
  }

  function combineSets(primary: number, secondary: number) {
    for (const cell of cells) {
      if (cell.set == secondary) cell.set = primary;
    }
  }

  const maze = new Maze(width, height);
  let wallArr = [...maze.allWallPos()];
  wallArr = shuffleArray(wallArr);

  for (const wall of wallArr) {
    const [c1, c2] = getCellCoordinatesFromWall(wall.x, wall.y, wall.face);
    let firstSet = undefined;
    for (const cell of cells) {
      if (
        (cell.x == c1.x && cell.y == c1.y) ||
        (cell.x == c2.x && cell.y == c2.y)
      ) {
        if (firstSet === undefined) firstSet = cell.set;
        // Here they belong to the same set already.
        else if (cell.set == firstSet) continue;
        else {
          // Here they belong to 2 different sets.
          // Remove the wall
          maze.setWall(wall.x, wall.y, wall.face, false);
          // Combine the sets
          combineSets(firstSet, cell.set);
        }
      }
    }
  }
  return maze;
}

export class WallMaze {
  walls: Wall[] = [];
  origin: Vector3;
  constructor(
    public maze: Maze,
    private scene: THREE.Scene,
    private physicsWorld: CANNON.World,
    public scale: number
  ) {
    this.origin = new Vector3(0, this.scale / 2, 0);
    for (const wall of maze.getAllTrueWalls()) {
      let wallPosition = new Vector3().copy(this.origin);
      wallPosition.add(
        new Vector3(wall.x * this.scale, 0, wall.y * this.scale)
      );
      if (wall.face == Face.BOTTOM)
        wallPosition.add(new Vector3(0, 0, this.scale / 2));
      else wallPosition.add(new Vector3(this.scale / 2, 0, 0));

      this.walls.push(
        new Wall(
          this.scene,
          this.physicsWorld,
          wallPosition,
          wall.face == Face.RIGHT ? Math.PI / 2 : 0,
          this.scale,
          this.scale
        )
      );
    }
    // Add X capping walls
    for (let x = 0; x < this.maze.width - 1; x++) {
      let wallPosition = new Vector3().copy(this.origin);
      wallPosition.add(new Vector3(x * this.scale, 0, -(this.scale / 2)));
      this.walls.push(
        new Wall(
          this.scene,
          this.physicsWorld,
          wallPosition,
          0,
          this.scale,
          this.scale
        )
      );
    }
    // Add Y capping walls
    for (let y = 0; y < this.maze.height; y++) {
      let wallPosition = new Vector3().copy(this.origin);
      wallPosition.add(new Vector3(-(this.scale / 2), 0, y * this.scale));
      this.walls.push(
        new Wall(
          this.scene,
          this.physicsWorld,
          wallPosition,
          Math.PI / 2,
          this.scale,
          this.scale
        )
      );
    }
  }
}

export class LightGrid {
  public lights: PointLight[] = [];
  constructor(
    scene: Scene,
    public width: number,
    public height: number,
    public scale: number
  ) {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const newLight = new PointLight(0xffffff, 1, 0, 1);
        newLight.position.set(
          x * scale + scale / 2,
          scale - scale / 5,
          y * scale + scale / 2
        );
        newLight.castShadow = true;
        scene.add(newLight);
        this.lights.push(newLight);
      }
    }
  }
}
