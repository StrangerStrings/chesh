import { ISquare, Piece } from "./Board";

const orderOfPieces: Piece[] = [
  'castle',
  'horse',
  'bishop',
  'king',
  'queen',
  'bishop',
  'horse',
  'castle'
  ]


  const orderOfPieces1: Piece[] = [
    'pawn',
    'pawn',
    'pawn',
    'king',
    'pawn',
    'pawn',
    'pawn',
    'pawn'
    ]
const orderOfPieces2: Piece[] = [
  'queen',
  'queen',
  'queen',
  'king',
  'queen',
  'queen',
  'queen',
  'queen'
  ]
  
export const setupBoard = (): ISquare[] => {
  const a: ISquare[] = [];

  //white pieces
  a.push(...orderOfPieces.map((piece, y) => white(piece, y+1, 1)))
  a.push(...Array.from({ length: 8 }, (_, y) => white('pawn', y+1, 2)))
  //no mans land
  for (let x=3; x<=6; x++) {
  // for (let x=2; x<=7; x++) {
    a.push(...Array.from({ length: 8 }, (_, y) => empty(y+1, x)))
  }
  //black pieces
  a.push(...Array.from({ length: 8 }, (_, y) => black('pawn', y+1, 7)))
  a.push(...orderOfPieces.map((piece, y) => black(piece, y+1, 8)))

  return a
}

const black = (piece: Piece, x, y) => {
  return createSquare(piece, x, y, 'black')
}

const white = (piece: Piece, x, y) => {
  return createSquare(piece, x, y, 'white')
}

const empty = (x, y) => {
  return createSquare(undefined, x, y)
}

const createSquare = (piece: Piece|undefined, x, y, color?): ISquare => {
  return {
    piece, x, y, color, 
    canMoveHere: false, 
    currentlySelected: false, 
    isInCheck: false,
    checkM8: false
  }
}
