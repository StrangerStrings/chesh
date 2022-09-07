import { css, customElement, html, internalProperty, LitElement, property } from "lit-element";
import { defaultStyles } from "../defaultStyles";
import { ISquare } from "../lib/Board";
import { Position } from "../lib/PossibleMoves";
import { pieceStyles } from "./PieceStyles";

/**
 * Just one configurable component for use and reuse
 */
@customElement("a-square")
export class Square extends LitElement{
	static styles = [
		defaultStyles,
    pieceStyles,
		css`
      * {
				display: flex;
        justify-content: center;
        align-items: center;
      }
			.square {
				height: 100%;
				width: 100%;
				background: #f599a6;
				border: solid 1.1vh transparent;
        transition: border 0.15s ease;
			}
      .even {
				background: #fff0e1;
      }
      .canMoveHere {
        border: solid 1.2vh #ea8555; 
				border: solid 1vh #ffc192;
        border: 0.9vh solid rgb(255, 203, 164);
        padding: 0.2vh;
      }
      .canMoveHere.hasPiece {
        border: solid 1.2vh #ffba92;
				border: solid 1vh #ffc192;
        border: 1.1vh solid #ffb514;
        padding: 0;
      }
      .canMoveHere.hasPiece.even {
				border: solid 1vh #ffc192;
        border: 1.1vh solid #ffc28a;
      }
      .hasPiece.canBeMoved, .canMoveHere {
        cursor: pointer;
      }

      .inner {
        height: 88%;
        width: 88%;
				border: solid 0.4vh transparent;
        transition: all 0.15s ease;
      }
      .canBeMoved:hover .inner,
      .currentlySelected .inner {
        height: 97%;
        width: 97%;
      }
      .loser .inner {
        height: 50%;
        width: 50%;
      }
      .winner .inner {
        height: 110%;
        width: 110%;
      }
      .checkM8 .inner {
        height: 50%;
        width: 50%;
      }
		`
	];

  @property({type: Object}) square: ISquare;

	@property({type: Number}) x: number;
	@property({type: Number}) y: number;
	@property({type: String}) piece?: string;
	@property({type: String}) color?: string;
	@property({type: Boolean}) canMoveHere: boolean;
	@property({type: Boolean}) currentlySelected: boolean;
	@property({type: Boolean}) isInCheck: boolean;
	@property({type: Boolean}) loser: boolean;
	@property({type: Boolean}) winner: boolean;
	@property({type: Boolean}) checkM8: boolean;
	@property({type: Boolean}) canBeMoved: boolean = false;

  @internalProperty() pinged: boolean = false;


  private onClick() {
    if (this.canMoveHere) {
      this.moveHere()
      return
    }

    if (this.canBeMoved) {
      this.startMove()
    }
  }

  private startMove() {
    this.dispatchEvent(new CustomEvent<Position>(
      'startMove', 
      {detail: {
        x: this.x,
        y: this.y
      }}
    ))
	}

  private moveHere() {
    if (!this.canMoveHere) {
      return;
    }

    this.dispatchEvent(new CustomEvent<Position>(
      'moveHere', 
      {detail: {
        x: this.x,
        y: this.y
      }}
    ))
	}

  public ping() {
    console.log('pinged');
    
    this.pinged = true
    setTimeout(() => this.pinged = false, 400)
  }

  computeSquareClasses(): string {
    const classes = ['square']
   
    const even = (this.x+this.y)%2 == 0;
    if (even) {
      classes.push('even')
    }
    if (this.canBeMoved) {
      classes.push('canBeMoved')
    }
    if (this.canMoveHere) {
      classes.push('canMoveHere')
    }
    if (this.isInCheck) {
      classes.push('isInCheck')
    }

    if (this.loser) {
      classes.push('loser')
    }
    if (this.winner) {
      classes.push('winner')
    }

    if (this.checkM8) {
      classes.push('checkM8')
    }
    if (this.currentlySelected) {
      classes.push('currentlySelected')
    }
    
    if (this.piece) {
      if (this.x == 8 && this.y == 6) {
        console.log('hasPiece: ',this.piece);
      }
      classes.push('hasPiece')
    }

    if (this.pinged) {
      classes.push('pinged')
    }

    return classes.join(' ');
  }

  renderPiece() {
    if (!this.piece) {
      return html``
    }

    const classes = ['piece', this.piece, this.color].join(' ');
    
    return html`<div class=${classes}><div class="secondary"></div></div>`;
  }

	render() {
    const squareClasses = this.computeSquareClasses();
    const piece = this.renderPiece()

		return html`
			<div class=${squareClasses} 
        @click=${this.onClick}>
        <div class="inner">
          ${piece}
        </div>
      </div>
		`;
	}

}
