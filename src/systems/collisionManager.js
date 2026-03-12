import { GHOST_MODE } from '../constants.js';

export function checkPacmanGhostCollision(pacman, ghosts) {
  const pacTile = pacman.getTile();
  for (const ghost of ghosts) {
    if (ghost.inHouse || ghost.exitingHouse) continue;
    if (ghost.mode === GHOST_MODE.FRIGHTENED || ghost.mode === GHOST_MODE.EATEN) continue;
    const gt = ghost.getTile();
    if (gt.col === pacTile.col && gt.row === pacTile.row) {
      return { died: true, ghost };
    }
  }
  return { died: false, ghost: null };
}
