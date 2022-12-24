declare module 'gitnews' {
	export interface NoteGetterOptions {
		log: (message: string) => void;
		fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
	}

	export interface NoteApi {
		subject?: { state?: string; merged?: boolean };
	}

	export interface Note {
		id: string;
		title: string;
		unread: boolean;
		repositoryFullName: string;
		api: NoteApi;
		commentUrl: string;
		updatedAt: number;
		repositoryName: string;
		type: string;
		subjectUrl: string;
		commentAvatar?: string;
		repositoryOwnerAvatar?: string;
	}

	export type NoteGetter = (token: string) => Promise<Note[]>;

	export function createNoteGetter(options: NoteGetterOptions): NoteGetter;
}
