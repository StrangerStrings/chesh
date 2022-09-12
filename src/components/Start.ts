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
				display: flex;
				flex-direction: column;
				width: 300px;
				gap: 10px;
			}

			input {
				background: #fcfdff;
				padding: 9px;
				outline: none;
				border: solid #a0a5b1 1px;
				border-radius: 5px;
				font-size: 110%;
				text-align: center;
			}
			input:focus {
				padding: 8px;
				border: solid #a0a5b1 2px;
			}

			.button {
				background: #e3ebff;
				padding: 6px;
				border: 1px solid #a0a5b1;
				border-radius: 5px;
				font-size: 90%;
				text-align: center;
				cursor: pointer;
			}

			.error {
				padding: 7px;
				font-size: 90%;
				text-align: center;
				font-style: italic;
			}
		`
	];


  @property({type: Boolean}) userNameTakenError: boolean = false;

	keyPress(ev: KeyboardEvent) {
		this.userNameTakenError = false;

		if (ev.key == "Enter") {
			this.addUser();
		}
	}

  addUser() {
    const input = this.shadowRoot.querySelector<HTMLInputElement>('#user');
    const name = input.value.trim();
		if (!name) {
			return;
		}
    this.dispatchEvent(new CustomEvent('add-user', {detail: name}));
  }

	render() {
		const buttonOrError = !this.userNameTakenError ?
			html`<div class="button" @click=${this.addUser}>Find Game</div>`:
			html`<div class="error">This name is already in use</div>`;

		return html`
			<div class="container" @keydown=${this.keyPress}>
        <input id="user" type="text" placeholder="ur name" autofocus>
				${buttonOrError}
			</div>
		`;
	}
}
