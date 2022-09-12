import { ISquare, Board } from "./Board";
import { Position } from "./PossibleMoves";

export type Scalar = -1|0|1
export type Vector = {x: Scalar, y: Scalar}
export const straightLineMover = 
  (vectors: Vector[], square: ISquare, board: Board): Position[] => {
    const moves: Position[] = [];

    vectors.forEach(vector => {
      for (let distance=1; distance<=board.largestDimension; distance++) {
        const x = square.x + (vector.x * distance);
        const y = square.y + (vector.y * distance);

        const moveTo = board.tryGetSquare(x, y);
        
        const status = checkSquare(square, moveTo);
        if (status.enemy || status.emptySquare) {
          moves.push({x: moveTo.x, y: moveTo.y})
        }
        const blocked = status.outOfBounds || status.friend || status.enemy
        if (blocked) {
          return;
        }
      }
    })

    return moves;
}

type CheckStatus = {
  outOfBounds: boolean;
  friend: boolean;
  enemy: boolean;
  emptySquare: boolean;
}
export const checkSquare = 
  (moveFrom: ISquare, moveTo: ISquare|undefined): CheckStatus => {
    const outOfBounds = !moveTo;
    if (outOfBounds) {
      return {outOfBounds, friend: false, enemy: false, emptySquare: false};
    }
    const friend = moveTo.piece && moveTo.color == moveFrom.color;
    const enemy = moveTo.piece && moveTo.color != moveFrom.color;
    const emptySquare = !moveTo.piece;

    return {
      outOfBounds, friend, enemy, emptySquare
    };
}
