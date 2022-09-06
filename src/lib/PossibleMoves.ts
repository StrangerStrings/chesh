import { Board, ISquare } from "./Board";
export type Position = {x: number; y: number}

export const bishopMoves = (square: ISquare, board: Board): Position[] => {
  const vectors: Vectors = []
  for (let x=-1; x<=1; x+=2) {
    for (let y=-1; y<=1; y+=2) {
      vectors.push({x: x as Vector, y: y as Vector})
    }
  }

  return straightLineMover(vectors, square, board)
}

export const castleMoves = (square: ISquare, board: Board): Position[] => {
  const vectors: Vectors = []
  for (let i=-1; i<=1; i+=2) {
    vectors.push({x: i as Vector, y: 0})
    vectors.push({x: 0, y: i as Vector})
  }

  return straightLineMover(vectors, square, board)
}

export const queenMoves = (square: ISquare, board: Board): Position[] => {
  const vectors: Vectors = []
  for (let x=-1; x<=1; x++) {
    for (let y=-1; y<=1; y++) {
      vectors.push({x: x as Vector, y: y as Vector})
    }
  }

  return straightLineMover(vectors, square, board)
}

export const horseMoves = (square: ISquare, board: Board): Position[] => {
  const moves = [];

  for (let i=-2; i<=2; i++) {
    for (let j=-2; j<=2; j++) {
      if (i == 0 || j == 0) {
        continue;
      }
      if (Math.abs(i) == Math.abs(j)) {
        continue;
      }

      const x = square.x + i;
      const y = square.y + j;
      
      const moveTo = board.tryGetSquare(x, y);
        
      const status = checkSquare(square, moveTo);
      
      if (status.enemy || status.emptySquare) {
        moves.push({x, y});
      }
    }
  }

  return moves
}

export const kingMoves = (square: ISquare, board: Board): Position[] => {
  const moves: Position[] = [];
  
  for (let i=-1; i<=1; i++) {
    for (let j=-1; j<=1; j++) {
      const x = square.x + i;
      const y = square.y + j;
      
      const moveTo = board.tryGetSquare(x, y);
      const status = checkSquare(square, moveTo);
      if (status.enemy || status.emptySquare) {
        moves.push({x, y});
      }
    }
  }

  return moves;
}

type Vector = -1|0|1
type Vectors = {x: Vector, y: Vector}[]
const straightLineMover = 
  (vectors: Vectors, square: ISquare, board: Board): Position[] => {
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
const checkSquare = 
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

export const pawnMoves = (square: ISquare, board: Board, onlyAttacks?: boolean): Position[] => {
  const moves = []
  const forward = square.color == 'white' ? 1 : -1

  const leftAttack = board.getSquare(square.x - 1, square.y + forward)
  const leftAttackStatus = checkSquare(square, leftAttack) 
  if (leftAttackStatus.enemy) {
    moves.push({x: leftAttack.x, y: leftAttack.y})
  }

  const rightAttack = board.getSquare(square.x + 1, square.y + forward)
  const rightAttackStatus = checkSquare(square, rightAttack) 
  if (rightAttackStatus.enemy) {
    moves.push({x: rightAttack.x, y: rightAttack.y})
  }

  if (onlyAttacks) {
    return moves
  }

  const firstSquare = board.getSquare(square.x, square.y + forward) 
  if (firstSquare.piece) {
    return moves
  }
  moves.push({x: firstSquare.x, y: firstSquare.y})

  const isFirstMove =  isPawnsFirstMove(square, board.height);
  const secondSquare = board.getSquare(square.x, square.y + (2*forward)) 
  if (secondSquare.piece || !isFirstMove) {
    return moves
  }
  moves.push({x: secondSquare.x, y: secondSquare.y})

  return moves
}

const isPawnsFirstMove = (square: ISquare, boardHeight: number): boolean => {
  if (square.color == 'white' && square.y == 2) {
    return true;
  }  
  if (square.color == 'black' && square.y == boardHeight - 1) {
    return true;
  }
} 

