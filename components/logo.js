const React = require( 'react' );

function Logo( { onClick } ) {
	return <h1><a href="https://github.com/sirbrillig/gitnews-menubar" onClick={ onClick } >Gitnews</a></h1>;
}

module.exports = Logo;
