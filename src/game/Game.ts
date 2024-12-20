import { GameScene } from './GameScene';
import { Controller } from './Controller';

export class Game {
  private scene: GameScene;
  private controller: Controller;

  constructor() {
    this.scene = new GameScene();
    this.controller = new Controller(this.scene.player, document.body);
    
    this.setupInstructions();
    this.start();
  }

  private setupInstructions() {
    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.top = '50%';
    instructions.style.left = '50%';
    instructions.style.transform = 'translate(-50%, -50%)';
    instructions.style.textAlign = 'center';
    instructions.style.color = 'white';
    instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    instructions.style.padding = '20px';
    instructions.style.borderRadius = '5px';
    instructions.innerHTML = `
      Click to start<br><br>
      WASD or Arrow Keys to move<br>
      Space to jump<br>
      Mouse to look around
    `;
    document.body.appendChild(instructions);

    document.addEventListener('click', () => {
      instructions.style.display = 'none';
      this.controller.lock();
    });
  }

  private start() {
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (this.controller.isLocked) {
        this.controller.update();
        this.scene.player.update();
      }
      this.scene.update();
    };

    animate();
  }
}