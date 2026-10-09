import { Note, NoteReason } from '../types';
import { defaultAccountInfo } from './constants';
import { words } from './random-words';

const hourInMiliseconds = 3600000;

function randomNumber(min: number, max: number): number {
	return Math.round(Math.random() * (max - min) + min);
}

function getRandomWord() {
	return words[randomNumber(0, words.length - 1)];
}

function capitalizeFirstLetter(string: string): string {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

const demoReasons: NoteReason[] = [
	'subscribed',
	'subscribed',
	'comment',
	'author',
	'review_requested',
	'mention',
];

function createDemoNotification(initialDate: Date): Note {
	const repositoryName = [...Array(2)].map(getRandomWord).join('-');
	const owner = getRandomWord();
	const isMerged = randomNumber(1, 2) === 1;
	const isOpen = isMerged ? false : randomNumber(1, 2) === 1;
	const isPR = randomNumber(1, 2) === 1;
	const isUnread = randomNumber(1, 2) === 1;

	return {
		gitnewsAccountId: defaultAccountInfo.id,
		commentUsername: owner,
		commentExcerpt: [...Array(randomNumber(8, 60))]
			.map(getRandomWord)
			.join(' '),
		url: '',
		updatedAt: new Date(
			initialDate.getTime() - hourInMiliseconds * randomNumber(1, 23)
		).toISOString(),
		unread: isUnread,
		repositoryName,
		repositoryFullName: `${owner}/${repositoryName}`,
		title: [...Array(randomNumber(3, 7))]
			.map(getRandomWord)
			.map(capitalizeFirstLetter)
			.join(' '),
		type: isPR ? 'PullRequest' : 'Issue',
		id: [...Array(randomNumber(1, 8))].map(getRandomWord).join(''),
		repositoryOwnerAvatar:
			'https://avatars1.githubusercontent.com/u/887802?v=4',
		subjectUrl: 'https://github.com/sirbrillig/gitnews-menubar/pull/65',
		commentUrl: 'https://github.com/sirbrillig/gitnews-menubar/pull/65',
		commentAvatar: 'https://avatars2.githubusercontent.com/u/2036909?v=4',
		authoredByYou: randomNumber(1, 3) === 1,
		api: {
			subject: {
				state: isOpen ? 'open' : 'closed',
				merged: isMerged,
			},
			notification: {
				reason: demoReasons[randomNumber(0, demoReasons.length - 1)],
			},
		},
	};
}

export function createDemoNotifications(): Note[] {
	const initialDate = new Date();
	return [...Array(randomNumber(1, 6))].map(() =>
		createDemoNotification(initialDate)
	);
}

/**
 * Simulate new activity on some read notes, as if someone pushed a commit to
 * them. Occasionally the new activity is a mention instead.
 */
export function bumpDemoNotifications(notes: Note[]): Note[] {
	return notes.map((note) => {
		if (note.unread || randomNumber(1, 3) !== 1) {
			return note;
		}
		const isNewMention = randomNumber(1, 4) === 1;
		return {
			...note,
			unread: true,
			updatedAt: new Date().toISOString(),
			// A mention comes with a new comment; a push does not.
			commentUrl: isNewMention
				? `${note.subjectUrl}#issuecomment-${randomNumber(1000, 9999)}`
				: note.commentUrl,
			latestCommentMentionsYou: isNewMention,
			api: {
				...note.api,
				notification: isNewMention
					? { reason: 'mention' }
					: note.api.notification,
			},
		};
	});
}
