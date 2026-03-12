export class InputHandler {
  constructor(pacman) {
    this.pacman = pacman;
    this._onKeyDown = this._onKeyDown.bind(this);
    window.addEventListener("keydown", this._onKeyDown);
  }

  _onKeyDown(e) {
    const dirMap = {
      ArrowUp:    { x: 0, y: -1 },
      ArrowDown:  { x: 0, y:  1 },
      ArrowLeft:  { x: -1, y: 0 },
      ArrowRight: { x:  1, y: 0 },
    };
    if (dirMap[e.key]) {
      e.preventDefault();
      this.pacman.setDirection(dirMap[e.key]);
    }
  }

  destroy() {
    window.removeEventListener("keydown", this._onKeyDown);
  }
}
