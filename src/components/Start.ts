import { css, customElement, html, internalProperty, LitElement, property } from "lit-element";
import { defaultStyles } from "../defaultStyles";
import { classMap } from 'lit-html/directives/class-map';
import { TemplateResult } from "lit-html";
import { Board, Color } from "../lib/Board";
import { Position } from "../lib/PossibleMoves";
import { Square } from "./Square";

/**
 * Just one configurable component for use and reuse
 */
@customElement("user-form")
export class Form extends LitElement{
	static styles = [
		defaultStyles,
		css`
			.container {
				width: 300px;
				display: flex;
				flex-direction: column;
				gap: 10px;
			}

			input {
				padding: 9px;
				border: solid #a0a5b1 1px;
				border-radius: 5px;
				outline: none;
				text-align: center;
				font-size: 110%;
				background: #fcfdff;
			}
			input:focus {
				border: solid #a0a5b1 2px;
				padding: 8px;
				/* outline: none; */
			}

			.button {
				padding: 6px;
				background: #e3ebff;;
				border-radius: 5px;
				text-align: center;
				font-size: 90%;
				border: 1px solid #a0a5b1;
				cursor: pointer;
			}

			.error {
				font-size: 90%;
				padding: 7px;
				text-align: center;
				font-style: italic;
			}
		`
	];


  @property({type: Boolean}) userNameTakenError: boolean = false;

	keyPress(ev: KeyboardEvent) {
		console.log(ev.key);
		
		this.userNameTakenError = false;
		// this.userNameTakenError = !this.userNameTakenError;
		if (ev.key == "Enter") {
			this.addUser()
		}
	}

  addUser() {
    const input = this.shadowRoot.querySelector<HTMLInputElement>('#user')
    const name = input.value.trim()
		if (!name) {
			return;
		}
    this.dispatchEvent(new CustomEvent('add-user', {detail: name}))
  }

	render() {
		const buttonOrError = !this.userNameTakenError ?
			html`<div class="button" @click=${this.addUser}>Find Game</button>`:
			html`<div class="error">This name is already in use</div>`;

		return html`
			<div class="container" @keydown=${this.keyPress}>
        <input id="user" type="text"  placeholder="ur name" autofocus>
				${buttonOrError}
			</div>
		`;
	}
}
