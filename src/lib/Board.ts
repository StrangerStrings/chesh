import { setupBoard } from "./BoardSetup";
import * as possible from "./PossibleMoves";

export type Piece = 'pawn'|'castle'|'horse'|'bishop'|'king'|'queen'; 
export type Color = 'white'|'black';
export interface ISquare {
  x: number;
  y: number;
  piece?: Piece;
  color?: Color;
  canMoveHere: boolean;
  currentlySelected: boolean;
  isInCheck: boolean;
  checkM8: boolean;
}

export class Board {
  constructor(squares: ISquare[], turn: Color) {
    this.squares = squares,
    this.turn = turn
  }
  
  squares: ISquare[] = []
  height: number = 8;
  width: number = 8;

  turn: Color = "white"
  lost?: Color;

  get largestDimension() { 
    return Math.max(this.height, this.width); 
  }

  getSquare(x: number, y: number): ISquare {
    return this.squares.find(i => i.x == x && i.y == y);
  }

  tryGetSquare(x: number, y: number): ISquare|undefined {
    return this.squares.find(i => i.x == x && i.y == y);
  }

  getKing(color: Color): ISquare {
    return this.squares.find(sq => sq.piece == 'king' && sq.color == color)
  }

  currentlySelected(): ISquare|undefined {
    return this.squares.find(sq => sq.currentlySelected)
  }

  oppisiteColor(color: Color): Color {
		return color == 'white' ? 'black' : 'white';
  }

  startMove(x:number, y:number) {
		const selected = this.currentlySelected();
    if (x == selected?.x && y == selected?.y) {
      this.resetState();
      return;
    }

    this.resetState()

		const piece = this.getSquare(x, y);
    if (piece.piece == undefined) {
      return;
    }

		const moves = this.possibleMoves(piece);

		moves.forEach(move => {
			const square = this.getSquare(move.x, move.y);
			square.canMoveHere = true;
		});

    if (moves.length) {
		  piece.currentlySelected = true;
    }
  }

  moveHere(x:number, y:number): boolean {
    const moveTo = this.getSquare(x, y);
		const moveFrom = this.currentlySelected();

    const colorMoving = moveFrom.color

    const color = moveTo.color
    const piece = moveTo.piece

		moveTo.piece = moveFrom.piece;
		moveTo.color = moveFrom.color;
		
		moveFrom.piece = undefined;
		moveFrom.color = undefined ;

    if (this.isInCheck(colorMoving)) {
      moveFrom.piece = moveTo.piece;
      moveFrom.color = moveTo.color;
      
      moveTo.piece = piece;
      moveTo.color = color ;

      return false;
    }

    if (this.pawnDoneGood(moveTo)) {
      moveTo.piece = 'queen'
    }
    
    const otherColor = this.oppisiteColor(colorMoving)
    if (this.isInCheck(otherColor)) {
      const king = this.getKing(otherColor);
      king.isInCheck = true
      if (this.isInCheckM8(otherColor)) {
        // do some check m8y stuff
        console.log('checkm8!');
        this.checkM8(otherColor)
      }
    }

		this.resetState();
    this.resetCheck(colorMoving)
    return true
  }

  isInCheck(color: Color): boolean {
    const king = this.getKing(color);

    const enemyPieces = this.squares.filter(sq => sq.piece && sq.color != color);
    
    const allEnemiesMoves = []
    enemyPieces.forEach(sq => {
      allEnemiesMoves.push(...this.possibleMoves(sq, true))
    });
        
    if (allEnemiesMoves.some(i => i.x == king.x && i.y == king.y)) {
      return true;
    }
    return false
  }

  isInCheckM8(color: Color): boolean {
    let couldBeCheckM8 = true;

    // can king move anywhere?
    const king = this.getKing(color)
    const kingMoves = this.possibleMoves(king);
    kingMoves.forEach(({x, y}) => {
      if (!couldBeCheckM8) {
        return;
      }
      couldBeCheckM8 = this.movePieceAndCheckForCheck(king, {x, y})
    })

    // can the rest of the pieces move anywhere to stop it?
    const otherPieces = this.squares.filter(sq => 
      sq.piece && sq.color == color && sq.piece != 'king'
    )
    otherPieces.forEach(piece => {
      if (!couldBeCheckM8) {
        return;
      }
      const moves = this.possibleMoves(piece);
      moves.forEach(({x, y}) => {
        if (!couldBeCheckM8) {
          return;
        }
        couldBeCheckM8 = this.movePieceAndCheckForCheck(piece, {x, y})
      })
    })

    if (!couldBeCheckM8) {
      return false
    }

    return true;
  }

  movePieceAndCheckForCheck(moveFrom: ISquare, moveToPos: possible.Position): boolean {
    console.count('checking');
      
    const moveTo = this.getSquare(moveToPos.x, moveToPos.y)

    const moveToColor = moveTo.color
    const moveToPiece = moveTo.piece

    const moveFromColor = moveFrom.color
    const moveFromPiece = moveFrom.piece

    moveTo.color = moveFrom.color
    moveTo.piece = moveFrom.piece
    moveFrom.color = undefined
    moveFrom.piece = undefined

    let isInCheck = true
    if (!this.isInCheck(moveFromColor)) {
      isInCheck = false;
    }

    //reset pieces
    moveTo.color = moveToColor
    moveTo.piece = moveToPiece
    moveFrom.color = moveFromColor
    moveFrom.piece = moveFromPiece

    return isInCheck
  }

  checkM8(color: Color) {
    this.lost = color
    
    const losers = this.squares.filter(i => i.color == color)
    losers.forEach(i => i.checkM8 = true)
  }


  isInStaleM8(color: Color): boolean {
    // maybe don't need this and just need to run 
    // the above method (and rename)
    // but when check is not currently in
    return false;
  }

  pawnDoneGood(square: ISquare): boolean {
    if (square.piece == 'pawn' && (square.y == 0 || square.y == this.height)) {
      return true;
    }
  }

  resetState() {
    this.squares.forEach(sq => {
			sq.canMoveHere = false
			sq.currentlySelected = false
		});
  }

  resetCheck(color: Color) {
    const king = this.getKing(color)
    king.isInCheck = false
  }

  possibleMoves(square: ISquare, onlyAttacks?: boolean) {
    switch (square.piece) {
      case 'pawn': return possible.pawnMoves(square, this, onlyAttacks)
      case 'bishop': return possible.bishopMoves(square, this)
      case 'castle': return possible.castleMoves(square, this)
      case 'queen': return possible.queenMoves(square, this)
      case 'horse': return possible.horseMoves(square, this)
      case 'king': return possible.kingMoves(square, this)
      default: return []
    }
  } 
}
