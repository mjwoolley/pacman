import { DIR } from "../constants.js";

export class InputHandler {
  constructor(pacman) {
    this.pacman = pacman;
    this._onKeyDown = this._onKeyDown.bind(this);
    window.addEventListener("keydown", this._onKeyDown);
  }

  _onKeyDown(e) {
    const dirMap = {
      ArrowUp:    DIR.UP,
      ArrowDown:  DIR.DOWN,
      ArrowLeft:  DIR.LEFT,
      ArrowRight: DIR.RIGHT,
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
