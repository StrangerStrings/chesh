import { css, customElement, html, internalProperty, LitElement, property } from "lit-element";
import { defaultStyles } from "../defaultStyles";
import { ISquare } from "../lib/Board";
import { Position } from "../lib/PossibleMoves";
import { pieceStyles } from "./PieceStyles";
import { classMap, ClassInfo } from 'lit-html/directives/class-map';


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
				border: min(1.1vh, 0.8vw) solid transparent;
        transition: border 0.15s ease;
			}
      .even {
				background: #fff0e1;
      }

      .hasPiece.canBeMoved, .canMoveHere {
        cursor: pointer;
      }
      .canMoveHere {
				border: solid 1vh #ffc192;
        border: 0.9vh solid rgb(255, 203, 164);
        padding: 0.2vh;
      }
      .canMoveHere.hasPiece {
        border: 1.1vh solid #ffb514;
        padding: 0;
      }
      .canMoveHere.hasPiece.even {
        border: 1.1vh solid #ffc28a;
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
      .winner .inner {
        height: 110%;
        width: 110%;
      }
      .loser .inner {
        height: 50%;
        width: 50%;
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

public ping() {
    this.pinged = true
    setTimeout(() => this.pinged = false, 400)
  }

  private onClick() {
    if (this.canMoveHere) {
      this.moveHere()
    } else if (this.canBeMoved) {
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

  renderPiece() {
    if (!this.piece) {
      return html``
    }

    const classes = {
      piece: true,
      [this.piece]: true,
      [this.color]: true
    };
    
    return html`<div class=${classMap(classes)}><div class="secondary"></div></div>`;
  }

	render() {
    const squareClasses = {
      square: true,
      even: (this.x+this.y)%2 == 0,
      hasPiece: this.piece,
      canBeMoved: this.canBeMoved,
      currentlySelected: this.currentlySelected,
      canMoveHere: this.canMoveHere,
      isInCheck: this.isInCheck,
      checkM8: this.checkM8,
      // loser: this.loser,
      // winner: this.winner,
      // probs swap checkM8 for winner and loser
      pinged: this.pinged
    }
    const piece = this.renderPiece()

		return html`
			<div class=${classMap(squareClasses)} 
        @click=${this.onClick}>
        <div class="inner">
          ${piece}
        </div>
      </div>
		`;
	}

}
