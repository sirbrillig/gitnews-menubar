const menubar = require( 'menubar' );
const bar = menubar();

bar.on( 'after-create-window', () => {
	bar.window.openDevTools();
} );
