import { css, customElement, html, internalProperty, LitElement, property } from "lit-element";
import { defaultStyles } from "../defaultStyles";
import { classMap } from 'lit-html/directives/class-map';
import { nothing, TemplateResult } from "lit-html";
import { Board, Color } from "../lib/Board";
import { Position } from "../lib/PossibleMoves";
import { Square } from "./Square";
import { User } from "../WholePage";

/**
 * Just one configurable component for use and reuse
 */
@customElement("the-lobby")
export class Lobby extends LitElement{
	static styles = [
		defaultStyles,
		css`
			.lobby {
				display: flex;
				flex-direction: column;
				gap: 10px;	
			}

			.user {
				display: flex;
				align-items: center;
				flex-direction: column;
				gap: 5px;
				width: 250px;
				border-radius: 5px;
				padding: 5px 10px;
				background-color: #f599a6;
				background-color: #8c9abb;
				background-color: #c3dad0;
				background-color: #fff0e1;
				cursor: pointer;
				border: solid 1px transparent;
			}
			.user:hover,
			.user.challenge {
				border-color: #f599a6;
			}
			.user.challenge {
				cursor: initial;
			}
			.user.challenger {
				border-color: transparent;
				cursor: initial;
			}

			.button {
				background: aliceblue;
				padding: 2px 20px;
				border-radius: 4px;
				background: #e3ebff;
				border: 1px solid #a0a5b1;
				cursor: pointer;
			}
			.button:hover {
				background: #dbe4fa;
			}

			span {
				font-size: 80%;
			}
		`
	];

  @property({type: Array}) users: User[] = [];
  @property({type: Object}) currentUser: User;

  addUser() {
    const input = this.shadowRoot.querySelector<HTMLInputElement>('#user')
    const name = input.value
    this.dispatchEvent(new CustomEvent('add-user', {detail: name}))
  }

	challenge(user: User) {
		// need to change these two events maybe to match outer event handler
		this.dispatchEvent(new CustomEvent('challenge', {detail: user.name}))
	}

	renderAcceptChallenge(user: User): TemplateResult {
		return html`
			<div class="user challenger">
				<p><span>Challenged by</span> ${user.name}</p>
				<div @click=${()=>this.challenge(user)} class="button">Accept</div>
			</div>
		`
	}

  renderUser(user: User): TemplateResult {
		if (user.challenging == this.currentUser.name) {
			return this.renderAcceptChallenge(user)
		}

		const challengingBool = this.currentUser.challenging == user.name 
		
		const classes = challengingBool ? "user challenge" : "user";
		const tooltip = challengingBool ? "" : "Challenge";

		const challenging = challengingBool ?
			html`<span>awaiting response</span>` : undefined;

    return html`
			<div 
				class=${classes}
				title=${tooltip}
				@click=${()=>this.challenge(user)} 
			>
				${user.name}
				${challenging}
			</div>
		`;
  }

	render() {
		const otherUsers = this.users.filter(u => 
			u.name !== this.currentUser.name && !u.playing
		);
		
		if (!otherUsers.length) {
			return html`
				<p>No other players are here</p>
			`;
		}

    const users = otherUsers.map(u => this.renderUser(u));

		return html`
			<div class="lobby">
        ${users}
			</div>
		`;
	}
}
