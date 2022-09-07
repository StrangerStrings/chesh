import { css, customElement, html, internalProperty, LitElement, property } from "lit-element";
import { defaultStyles } from "../defaultStyles";
import { classMap } from 'lit-html/directives/class-map';
import { TemplateResult } from "lit-html";
import { Board, Color, ISquare } from "../lib/Board";
import { Position } from "../lib/PossibleMoves";
import { Square } from "./Square";
import { setupBoard } from "../lib/BoardSetup";


const centreSquare = (board: ISquare[]): ISquare => {
	return board.find(sq => 
		sq.x == 4 && sq.y == 4	
	)
}


/**
 * Just one configurable component for use and reuse
 */
@customElement("the-game")
export class Game extends LitElement{
	static styles = [
		defaultStyles,
		css`
			.board {
				height: 100%;
				width: 100%;
				display: flex;
				flex-direction: column;
				border: solid 2vh #ffbab3;
				border: solid 12px #bc6fb1;
				border: solid 12px #f599a6;
				transition: transform 0.18s ease-in
			}
			.board.rotated {
				transform: rotate(180deg);
			}
			.row {
				display: flex;
				flex: 1;
			}
			a-square {
				flex: 1;
			}
		`
	];

	@property({type: Array}) boardData: ISquare[];
	@property({type: String}) color: Color;
	@property({type: String}) turn: Color;

	@internalProperty() board: Board;
	// @internalProperty() turn: Color = 'white';
	@internalProperty() pieceSelected: boolean = false;

	protected updated(change: Map<string | number | symbol, unknown>): void {
		if (change.has('boardData')) {
			this.board = new Board(this.boardData, this.turn)
			this.requestUpdate();
		}
	}

	onStartMove(ev: CustomEvent<Position>) {
		this.board.startMove(ev.detail.x, ev.detail.y);
		this.requestUpdate()
	}

	onMoveHere(ev: CustomEvent<Position>) {
		const hasMoved = this.board.moveHere(ev.detail.x, ev.detail.y);
		if (hasMoved) {
			this.nextTurn();
		} else {
			const king = this.board.getKing(this.board.turn)
			const cmps = this.shadowRoot.querySelectorAll<Square>('a-square')
			const kingCmp = Array.from(cmps).find((cmp) => 
				cmp.x == king.x && cmp.y == king.y
			)
			kingCmp.ping()
		}
		
		this.requestUpdate();

		this.dispatchEvent(new Event('piece-moved'));
	}

	nextTurn() {
		this.board.turn = this.board.oppisiteColor(this.board.turn)
	}

	renderSquare(x: number, y: number): TemplateResult {
		const square = this.board.getSquare(x, y);

		const playersTurn = this.color === this.board.turn;
		const couldBeMoved = 
				(square.piece !== undefined && square.color == this.board.turn) 
				|| (this.pieceSelected && square.piece == undefined);
		const canBeMoved = playersTurn && couldBeMoved;

		// lost = true/false/undefined
		let lost = this.board.lost ? 
			(square.color == this.board.lost ? true : false)
			: undefined;

			console.log(this.board.lost);
			

		return html`
			<a-square 
				@startMove=${this.onStartMove}
				@moveHere=${this.onMoveHere}
				x=${square.x}
				y=${square.y}
				.piece=${square.piece}
				.color=${square.color}
				?canMoveHere=${square.canMoveHere}
				?currentlySelected=${square.currentlySelected}
				?isInCheck=${square.isInCheck}
				?checkM8=${square.checkM8}
				?loser=${lost == true}
				?winner=${lost == false}
				?canBeMoved=${canBeMoved}
			></a-square>`;
	}
	
	render() {
		if (!this.board) {
			return;
		}

		const selected = this.board.currentlySelected()
		if (selected != undefined) {
			this.pieceSelected = true
		}
		
		const board = [];
		for (let y=8; y>=1; y--) {
			const row = [];
			for (let x=1; x<=8; x++) {
				const square = this.renderSquare(x, y);
				row.push(square);
			}

			board.push(
				html`<div class="row">${row}</div>`
			);
		}

		const boardClasses = {
			board: true,
			rotated: this.color == 'black'
		}
		
		return html`
			<div class=${classMap(boardClasses)}>
				${board}
			</div>
		`;
	}
}
