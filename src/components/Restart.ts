import { css, customElement, html, internalProperty, LitElement, property } from "lit-element";
import { defaultStyles } from "../defaultStyles";
import { classMap } from 'lit-html/directives/class-map';
import { TemplateResult } from "lit-html";
import { Board, Color } from "../lib/Board";
import { Position } from "../lib/PossibleMoves";
import { Square } from "./Square";
import { User } from "../WholePage";
import { pieceStyles } from "./PieceStyles";

const compliments = ['awesome', 'wild', 'sexy', 'cool', 'flying', 'whooping great'];
const insults = ['smelly', '\'orrible', 'infected', 'grey', 'hollow', 'over confident'];
const things = ['horse', 'cat', 'knight', 'queen', 'player', 'bicycle', '(wo)man', 'bugger'];

/**
 * Just one configurable component for use and reuse
 */
@customElement("win-lose")
export class Restart extends LitElement{
	static styles = [
		defaultStyles,
		pieceStyles,
		css`
			.container {
				display: flex;
				justify-content: center;
				align-items: center;
				height: 100%;
				cursor: pointer;
				font-weight: 900;
			}

			h1 {
				width: 80%;
				color: var(--main);
				font-size: 900%;
				font-weight: 900;
				text-align: center;
				line-height: 120px;
				text-transform: uppercase;
			}
		`
	];


  @property({type: Object}) currentUser: User;
  @property({type: String}) color: Color;
  @property({type: String}) lost: Color;

	randomWord(words: string[]): string {
		const idx = Math.floor(Math.random()*words.length);
		return words[idx];
	}
	
	restart() {
		this.dispatchEvent(new Event('restart'));
	}

	render() {
		const winner = this.lost != this.color;
		console.log('winner: ', winner);
		
		const verb = winner ? 'won' : 'lost';

		const adjective = winner ? 
			this.randomWord(compliments) 
			: this.randomWord(insults);

		const noun = this.randomWord(things)

		return html`
			<div class="container ${this.color}"
				@click=${this.restart}>
				<h1>
					You ${verb} ${this.currentUser.name} you ${adjective} ${noun}
				</h1>
			</div>
		`;
	}
}
