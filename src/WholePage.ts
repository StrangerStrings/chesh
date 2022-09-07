import { css, customElement, html, internalProperty, LitElement, property, TemplateResult }
	from "lit-element";
import {defaultStyles} from './defaultStyles';
import './components/Game';
import './components/Square';
import './components/Start';
import './components/Lobby';
import './components/Restart';

import * as fs from 'firebase/firestore';// Import the functions you need from the SDKs you need
import * as fb from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { DocumentData, DocumentReference, Timestamp, Unsubscribe } from "firebase/firestore";
import { Board, Color, ISquare } from "./lib/Board";
import { firebaseConfig } from "./firebaseConfig";
import { setupBoard } from "./lib/BoardSetup";
import { Game } from "./components/Game";
import { Form } from "./components/Start";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

//firestore collections
const users = "users"
const boards = "boards"
//firestore documents
const active = "activeUsers"

export type User = {
	name:  string;
	lastOnline: number;
	challenging?: string;
}

const refreshRate = 1000 * 20
// const userTimeout = 1000 * 1000


@customElement('whole-page')
/**
 * The Page which will contain and surround our components
 */
export class WholePage extends LitElement {

	static styles = [
		defaultStyles,
		css`
			.container {
				height: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
				background: #ffd7b9;
				/* background: #ffbeb8; */
			}

			the-game {
				height: 95vh;
				width: 95vh;
			}

			win-lose {
				position: absolute;
				height: 100%;
				width: 100%;
			}
		`
	];


	db: fs.Firestore
	game?: DocumentReference<DocumentData>;
	activeUsersDoc?: DocumentReference<DocumentData>;
	
	activeUsersInterval: NodeJS.Timeout;
	activeUsersUnsubscribe: Unsubscribe;

	@internalProperty() lobby: boolean = false;
	@internalProperty() playing: boolean = false;

	@internalProperty() currentUser: User;
	
	@internalProperty() activeUsers: User[] = []
	@internalProperty() boardData?: ISquare[];
	@internalProperty() turn?: Color;
	
	@internalProperty() color?: Color;
	@internalProperty() lost?: Color;


	async connectedCallback() {
		super.connectedCallback();

		const app = fb.initializeApp(firebaseConfig);
		this.db = fs.getFirestore(app);

		this.activeUsersDoc = fs.doc(this.db, users, active)
	}

	async addUser(ev: CustomEvent<string>) {
		const userName = ev.detail;

		const activeUsers = (await fs.getDoc(this.activeUsersDoc)).data().all as User[];

		const userNames = activeUsers.map(u => u.name);
		if (userNames.includes(userName)) {
			const start = this.shadowRoot.querySelector<Form>('user-form');
			start.userNameTakenError = true;
			
			console.log('name taken');
			return;
		}

		const user: User = {
			name: userName,
			lastOnline: Date.now()
		};

		const plusNewUser = [...activeUsers, user];
		
		fs.setDoc(this.activeUsersDoc, {all: plusNewUser})
		
		this.activeUsers = plusNewUser;
		this.currentUser = user;
		this.lobby = true;

		this.removeInactiveUsers();
		this.activeUsersInterval = setInterval(
			this.removeInactiveUsers.bind(this), refreshRate
		);

		this.activeUsersUnsubscribe = fs.onSnapshot(this.activeUsersDoc, (doc) => {
			console.log('snapshotta');
			
			this.activeUsers = doc.data().all;
			this.tryCreateGame();
		});
	}


	async removeInactiveUsers() {
		const activeUsersDocDoc = await fs.getDoc(this.activeUsersDoc);

		this.currentUser.lastOnline = Date.now();

		// remove current user, re-add with updated .lastOnline and sort alphabetically
		let activeUsers = activeUsersDocDoc.data().all as User[];
		activeUsers = activeUsers.filter(u => u.name !== this.currentUser.name);

		activeUsers.push(this.currentUser);

		activeUsers = activeUsers.sort((a,b) => {
			return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
		});

		// filter out user who were last online too long ago and set firebase document
		const onlineUsers = activeUsers.filter(user => {
			const inactiveDeadline = Date.now() - refreshRate * 2;
			return user.lastOnline > inactiveDeadline;
		})

		this.activeUsers = onlineUsers
		fs.setDoc(this.activeUsersDoc, {all: onlineUsers})

		console.log(onlineUsers);
	}


	challenge(ev: CustomEvent) {
		this.currentUser.challenging = ev.detail;

		this.activeUsers.find(u => u.name == this.currentUser.name).challenging = ev.detail;

		fs.setDoc(this.activeUsersDoc, {all: this.activeUsers})
	}



	// new game stuff
	async tryCreateGame() {
		if (!this.currentUser.challenging) {
			return;
		}

		const challengers = this.activeUsers.filter(u => u.challenging == this.currentUser.name);

		for (let i=0; i<challengers.length; i++) {
			const challenger = challengers[i];
			const areChallengingEachOther = 
					challenger.challenging == this.currentUser.name 
					&& this.currentUser.challenging == challenger.name;
			if (areChallengingEachOther) {
				this.gameOn(challenger)
				return;
			}
		}
	}
	
	async gameOn(challenger: User) {
		const gameName = this.computeGameName([this.currentUser.name, challenger.name]);
		this.color = gameName.startsWith(this.currentUser.name) ? 'white' : 'black'
		console.log('theres a game on! ',gameName, ' ', this.color);

		this.game = fs.doc(this.db, boards, gameName);
		const gameDoc = await fs.getDoc(this.game);
		
		if (!gameDoc.data()) {
			this.boardData = setupBoard()
			await fs.setDoc(this.game, {
				board: JSON.stringify(this.boardData),
				turn: 'white'
			})
		}

		const unsub = fs.onSnapshot(this.game, (doc) => {
			// console.log("Current data: ", doc.data().board);
			this.lost = doc.data().lost
			this.turn = doc.data().turn
			this.boardData = JSON.parse(doc.data().board);
		});

		clearInterval(this.activeUsersInterval)
		this.activeUsersUnsubscribe()
		this.playing = true;
	}

	computeGameName(players: string[]): string {
		const alphabetical = players.sort((a, b) => {
			return a.toUpperCase().localeCompare(b.toUpperCase());
		})

		return alphabetical.join('');
	}


	async pieceMoved() {
		const board = this.shadowRoot.querySelector<Game>('the-game').board;
		
		console.log(board.lost);
		if (board.lost) {
			
			this.lost = board.lost
			console.log(this.lost);
			
		}

		const game = {
			board: JSON.stringify(board.squares),
			turn: board.turn
		}
		if (board.lost) {
			game['lost'] = board.lost
		}

		fs.setDoc(this.game, game);
	}

	async restart() {
		this.lost = undefined;
		this.color = undefined;
		this.playing = false;

		delete this.currentUser.challenging;

		const activeUsersDocDoc = await fs.getDoc(this.activeUsersDoc);

		let activeUsers = activeUsersDocDoc.data().all as User[];
		activeUsers = activeUsers.filter(u => u.name !== this.currentUser.name);

		activeUsers.push(this.currentUser);

		activeUsers = activeUsers.sort((a,b) => {
			return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
		});

		console.log('adding user');
		fs.setDoc(this.activeUsersDoc, {all: this.activeUsers})
	
		this.removeInactiveUsers();
		this.activeUsersInterval = setInterval(
			this.removeInactiveUsers.bind(this), refreshRate
		);

		console.log('setting snapshot');
		this.activeUsersUnsubscribe = fs.onSnapshot(this.activeUsersDoc, (doc) => {
			this.activeUsers = doc.data().all;
			this.tryCreateGame();
		});
	}

	renderContent(): TemplateResult {
		if (this.playing) {
			return html`
				<the-game 
					color=${this.color}
					turn=${this.turn}
					.boardData=${this.boardData}
					@piece-moved=${this.pieceMoved}
				></the-game>`
		}
		else if (this.lobby) {
			return html`
				<the-lobby 
					.users=${this.activeUsers} 
					.currentUser=${this.currentUser} 
					@challenge=${this.challenge} 
				></the-lobby>`
		}
		else {
			return html`
				<user-form 
					@add-user=${this.addUser}
				></user-form>`
		}
	}

	renderWinLose() {
		if (this.lost) {
			return html`
				<win-lose
					lost=${this.lost}
					color=${this.color}
					.currentUser=${this.currentUser}
					@restart=${this.restart}
				></win-lose>`;
		}
	}

	render() {
		return html`
			<div class="container">
				${this.renderContent()}
				${this.renderWinLose()}
			</div>
		`;
	}
}
