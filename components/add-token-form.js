const React = require( 'react' );
const el = React.createElement;

function AddTokenForm( { token, openUrl, writeToken, showCancel, hideEditToken } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	let tokenField = null;
	const saveTokenField = ( field ) => {
		tokenField = field;
	};
	const saveToken = () => {
		if ( tokenField ) {
			writeToken( tokenField.value );
			hideEditToken();
		}
	};
	return el( 'div', { className: 'add-token-form' },
		el( 'p', null,
			'You must generate a GitHub authentication token so this app can see your notifications. It will need the `notifications` and `repo` scopes. You can generate a token ',
			el( 'a', { href: 'https://github.com/settings/tokens', onClick: openLink }, 'here.' )
		),
		el( 'label', { htmlFor: 'add-token-form__input' }, 'GitHub Token:' ),
		el( 'input', { type: 'text', className: 'add-token-form__input', id: 'add-token-form__input', defaultValue: token, ref: saveTokenField } ),
		el( 'button', { className: 'add-token-form__save-button btn', onClick: saveToken }, 'Save Token' ),
		showCancel && el( 'a', { href: '#', onClick: hideEditToken }, 'Cancel' )
	);
}

module.exports = AddTokenForm;
