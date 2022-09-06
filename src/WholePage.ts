import { css, customElement, html, internalProperty, LitElement, property, TemplateResult }
	from "lit-element";
import {defaultStyles} from './defaultStyles';
import './components/Game';
import './components/Square';
import './components/Start';
import './components/Lobby';

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
	challengedBy?: string;
}

const refreshRate = 1000 * 2
const userTimeout = 1000 * 1000


const centreSquare = (board: ISquare[]): ISquare => {
	return board.find(sq => 
		sq.x == 4 && sq.y == 4	
	)
}

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
		`
	];


	db: fs.Firestore
	game?: DocumentReference<DocumentData>;
	activeUsersDoc?: DocumentReference<DocumentData>;
	
	activeUsersUnsubscribe: Unsubscribe
	scheduleLobby: NodeJS.Timeout;

	@internalProperty() lobby: boolean = false;
	@internalProperty() playing: boolean = false;

	@internalProperty() currentUser: string;
	
	@internalProperty() activeUsers: User[] = []
	@internalProperty() boardData?: ISquare[];
	@internalProperty() turn?: Color;
	
	@internalProperty() color?: Color;


	async connectedCallback() {
		super.connectedCallback();

		const app = fb.initializeApp(firebaseConfig);
		this.db = fs.getFirestore(app);

		this.activeUsersDoc = fs.doc(this.db, users, active)
	}

	// subscribe to changes..
	// AND set a timer updating the time. Easy.



	challenge(ev: CustomEvent) {
		const userToChallenge = this.activeUsers.find(user => 
			user.name == ev.detail
		); 
		userToChallenge.challengedBy = this.currentUser;

		fs.setDoc(this.activeUsersDoc, {all: this.activeUsers})
	}


	async addUser(ev: CustomEvent) {
		const userName = ev.detail;

		const activeUsers = (await fs.getDoc(this.activeUsersDoc)).data().all as User[];

		console.log(activeUsers);
		
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
		}

		// subscribe

		this.scheduleLobby = setInterval(async () => {
			await this.filterActiveUsers()
			await this.tryCreateGame()
		}, refreshRate)

		
		const plusNewUser = [...activeUsers, user]
		
		fs.setDoc(this.activeUsersDoc, {all: plusNewUser})
		
		
		this.activeUsers = plusNewUser
		this.currentUser = userName;
		this.lobby = true
	}




	async filterActiveUsers() {
		const activeUsersDocDoc = await fs.getDoc(this.activeUsersDoc)

		const activeUsers = activeUsersDocDoc.data().all as User[]

		const onlineUsers = activeUsers.filter(user => {
			const thirtySecondsAgo = Date.now() - userTimeout
			return user.lastOnline > thirtySecondsAgo
		})

		this.activeUsers = onlineUsers

		fs.setDoc(this.activeUsersDoc, {all: onlineUsers})

		console.log(this.activeUsers);
	}



	// new game stuff
	async tryCreateGame() {
		const currentUser = this.activeUsers.find(u => u.name == this.currentUser);
		if (!currentUser?.challengedBy) {
			return;
		}

		const challengedBy = this.activeUsers.find(u => u.name == currentUser.challengedBy);
		if (challengedBy?.challengedBy != currentUser.name) {
			return;
		}

		await this.gameOn(currentUser, challengedBy)
	}
	
	async gameOn(player1: User, player2: User) {
		const gameName = this.computeGameName(player1, player2);
		this.color = gameName.startsWith(this.currentUser) ? 'white' : 'black'
		console.log('theres a game on! ',gameName, ' ', this.color);

		this.game = fs.doc(this.db, boards, gameName);
		const gameDoc = await fs.getDoc(this.game);

		// console.log(gameDoc.data());
		
		if (!gameDoc.data()) {
			this.color = 'white'
			this.boardData = setupBoard()
			await fs.setDoc(this.game, {
				board: JSON.stringify(this.boardData),
				turn: this.color
			})
		}

		const unsub = fs.onSnapshot(this.game, (doc) => {
			// console.log("Current data: ", doc.data().board);
			this.turn = doc.data().turn
			this.boardData = JSON.parse(doc.data().board);
			console.log(this.turn);
		});

		clearInterval(this.scheduleLobby)
		this.playing = true;
	}

	computeGameName(player1: User, player2: User): string {
		const alphabetical = [player1, player2].sort((a, b) => {
			const nameA = a.name.toUpperCase();
			const nameB = b.name.toUpperCase();
			return nameA.localeCompare(nameB);
		})

		return alphabetical.map(i => i.name).join('');
	}
	// new game stuff





	async testMove() {
		const board = this.shadowRoot.querySelector<Game>('the-game').board
		console.log(centreSquare(board.squares));

		
		await fs.setDoc(this.game, {
			board: JSON.stringify(board.squares),
			turn: board.turn
		});
	}

	renderContent(): TemplateResult {
		if (this.playing) {
			return html`
				<the-game 
					color=${this.color}
					turn=${this.turn}
					.boardData=${this.boardData}
					@test=${this.testMove}
				></the-game>`
		}
		else if (this.lobby) {
			return html`
				<the-lobby 
					.users=${this.activeUsers} 
					currentUser=${this.currentUser} 
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

	render() {
		return html`
			<div class="container">
				${this.renderContent()}
			</div>
		`;
	}
}
