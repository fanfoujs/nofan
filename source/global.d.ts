declare namespace NodeJS {
	interface Process {
		spinner: import('ora').Ora;
	}
}
