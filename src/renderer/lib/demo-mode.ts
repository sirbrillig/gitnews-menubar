import { Note } from '../types';
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

function createDemoNotification(initialDate: Date): Note {
	const repositoryName = [...Array(2)].map(getRandomWord).join('-');
	const owner = getRandomWord();
	const isMerged = randomNumber(1, 2) === 1;
	const isOpen = isMerged ? false : randomNumber(1, 2) === 1;
	const isPR = randomNumber(1, 2) === 1;
	const isUnread = randomNumber(1, 2) === 1;

	return {
		updatedAt: new Date(
			initialDate.getTime() - hourInMiliseconds * randomNumber(1, 23)
		).getTime(),
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
		api: {
			subject: {
				state: isOpen ? 'open' : 'closed',
				merged: isMerged,
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
