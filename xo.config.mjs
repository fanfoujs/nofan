const xoConfig = [
	{
		prettier: true,
		rules: {
			camelcase: 'off',
			'sort-imports': [
				'error',
				{
					ignoreCase: false,
					ignoreDeclarationSort: true,
					ignoreMemberSort: false,
					memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
					allowSeparatedGroups: false,
				},
			],
			'import-x/no-extraneous-dependencies': 'off',
			'import-x/no-named-as-default': 'off',
			'import-x/extensions': 'off',
			'import-x/order': [
				'error',
				{
					groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
					alphabetize: {
						order: 'asc',
						caseInsensitive: true,
					},
					warnOnUnassignedImports: true,
					'newlines-between': 'never',
				},
			],
			'unicorn/no-process-exit': 'off',
		},
	},
];

export default xoConfig;
