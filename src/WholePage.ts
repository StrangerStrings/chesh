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
import { DocumentData, DocumentReference, Unsubscribe } from "firebase/firestore";
import { Color, ISquare } from "./lib/Board";
import { firebaseConfig } from "./firebaseConfig";
import { setupBoard } from "./lib/BoardSetup";
import { Game } from "./components/Game";
import { Form } from "./components/Start";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

//firestore collections
const users = "users"
const games = "games"
//firestore documents
const active = "activeUsers"

export type User = {
	name:  string;
	lastOnline: number;
	challenging?: string;
	playing: boolean;
}

type GameJson = {
	board: string; //cause it's stringified
	turn: Color;
	lost?: Color;
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
			}

			the-game {
				height: 95vh;
				width: 95vh;
				max-height: 95vw;
				margin: 2vw;
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
	gameUnsubscribe: Unsubscribe;

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

		const firebaseApp = fb.initializeApp(firebaseConfig);
		this.db = fs.getFirestore(firebaseApp);

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
			lastOnline: Date.now(),
			playing: false
		};

		this.activeUsers = [...activeUsers, user];
		
		fs.setDoc(this.activeUsersDoc, {all: this.activeUsers})
		
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
		let activeUsers = (await fs.getDoc(this.activeUsersDoc)).data().all as User[];

		this.currentUser.lastOnline = Date.now();

		// remove current user, re-add with updated .lastOnline and sort alphabetically
		activeUsers = activeUsers.filter(u => u.name !== this.currentUser.name);

		activeUsers.push(this.currentUser);

		activeUsers = activeUsers.sort((a,b) => {
			return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
		});

		// filter out user who were last online too long ago and set firebase document
		activeUsers = activeUsers.filter(user => {
			const inactiveDeadline = Date.now() - refreshRate * 2;
			return user.lastOnline > inactiveDeadline;
		})

		this.activeUsers = activeUsers
		fs.setDoc(this.activeUsersDoc, {all: this.activeUsers})

		console.log(this.activeUsers);
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
		// garbage collect old games
		const allGames = await fs.getDocs(fs.collection(this.db, 'boards'));
		allGames.forEach(game => {
			// try do something where i compare the two arrays
			// to check if one contains all the other
			// eg a.every(i => b.includes(i))
			// const userNames = this.activeUsers.map(u => u.name);
			// const twoUserNames = board.id.split('-');

			let userNamesInBoardId = 0;
			this.activeUsers.forEach((user) => {
				if (game.id.includes(user.name)) {
					userNamesInBoardId++;
				}
			});

			if (userNamesInBoardId < 2) {
				const gameDoc = fs.doc(this.db, games, game.id)
				fs.deleteDoc(gameDoc)
			}
		});


		const gameName = this.computeGameName([this.currentUser.name, challenger.name]);
		this.color = gameName.startsWith(this.currentUser.name) ? 'white' : 'black'
		console.log('theres a game on! ',gameName, ' ', this.color);

		this.game = fs.doc(this.db, games, gameName);
		const gameDoc = await fs.getDoc(this.game);
		
		if (!gameDoc.data()) {
			this.boardData = setupBoard()
			await fs.setDoc(this.game, {
				board: JSON.stringify(this.boardData),
				turn: 'white'
			})
		}

		this.gameUnsubscribe = fs.onSnapshot(this.game, (doc) => {
			if (!doc.data()) {
				return;
			}
			this.lost = doc.data().lost
			this.turn = doc.data().turn
			this.boardData = JSON.parse(doc.data().board);
			
			if (this.lost) {
				this.gameUnsubscribe()
			}
		});

		this.currentUser.playing = true;
		this.activeUsers.find(u => u.name == this.currentUser.name).playing = true;
		fs.setDoc(this.activeUsersDoc, {all: this.activeUsers})

		// clearInterval(this.activeUsersInterval)
		this.activeUsersUnsubscribe()
		this.playing = true;
	}

	computeGameName(players: string[]): string {
		const alphabetical = players.sort((a, b) => {
			return a.toUpperCase().localeCompare(b.toUpperCase());
		})

		return alphabetical.join('-');
	}


	async pieceMoved() {
		const game = this.shadowRoot.querySelector<Game>('the-game').board;
		
		if (game.lost) {
			this.lost = game.lost
			console.log(this.lost);
		}

		const gameJson: GameJson = {
			board: JSON.stringify(game.squares),
			turn: game.turn
		}
		if (game.lost) {
			gameJson.lost = game.lost;
		}

		fs.setDoc(this.game, gameJson);
	}

	async restart() {
		this.lost = undefined;
		this.color = undefined;
		this.playing = false;

		fs.deleteDoc(this.game)

		delete this.currentUser.challenging;
		this.currentUser.playing = false;

		let activeUsers = (await fs.getDoc(this.activeUsersDoc)).data().all as User[];

		activeUsers = activeUsers.filter(u => u.name !== this.currentUser.name);

		activeUsers.push(this.currentUser);

		activeUsers = activeUsers.sort((a,b) => {
			return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
		});

		console.log('adding user');
		fs.setDoc(this.activeUsersDoc, {all: this.activeUsers})
	
		this.removeInactiveUsers();
		// this.activeUsersInterval = setInterval(
		// 	this.removeInactiveUsers.bind(this), refreshRate
		// );

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
