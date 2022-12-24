declare module 'gridicons' {
	export default class Gridicon extends React.Component<GridiconProps> {}

	export interface GridiconProps {
		icon: string;
		size?: number;
		className?: string;
	}
}
