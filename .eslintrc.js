module.exports = {
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	extends: ['eslint:recommended', 'plugin:react/recommended'],
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly',
	},
	parserOptions: {
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 2018,
	},
	plugins: ['react', 'react-hooks'],
	rules: {
		'react/display-name': 'off',
		'react/prop-types': 'off',
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'warn',
		'no-console': 'off',
	},
	settings: { react: { version: 'detect' } },
	overrides: [
		{
			files: ['**/*.ts', '**/*.tsx'],
			extends: [
				'eslint:recommended',
				'plugin:@typescript-eslint/eslint-recommended',
				'plugin:@typescript-eslint/recommended',
			],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: './tsconfig.json',
			},
			plugins: ['@typescript-eslint'],
		},
	],
};
