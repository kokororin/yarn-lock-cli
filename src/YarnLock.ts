import * as fs from 'fs';
import chalk from 'chalk';
import * as program from 'commander';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import * as pkg from 'pjson';
import IRegistry from './IRegistry';

export = class YarnLock {
	private registries: Array<IRegistry> = [
		{
			name: 'npmjs',
			domain: 'registry.npmjs.org',
			format: 'https://registry.npmjs.org/{pkgName}/-/{fileName}'
		},
		{
			name: 'yarnpkg',
			domain: 'registry.yarnpkg.com',
			format: 'https://registry.yarnpkg.com/{pkgName}/-/{fileName}'
		},
		{
			name: 'taobao',
			domain: 'registry.npm.taobao.org',
			format: 'http://registry.npm.taobao.org/{pkgName}/download/{fileName}'
		}
	];

	public async start(): Promise<any> {
		program.version(pkg.version).parse(process.argv);

		let fileContent;
		try {
			fileContent = fs.readFileSync('yarn.lock');
			fileContent = String(fileContent);
		} catch (e) {
			return console.log(
				chalk.bold.red('Cannot find yarn.lock in current folder')
			);
		}

		if (program.args.length === 0) {
			const list: Array<any> = [
				{
					type: 'list',
					name: 'registry',
					message: "Which registry you'd like to transform to?",
					choices: this.registries.map(registry => {
						return {
							name: registry.domain,
							value: registry.name
						};
					})
				}
			];
			const answers: inquirer.Answers = await inquirer.prompt(list);

			const expectRegistry = _.find(
				this.registries,
				registry => registry.name === answers.registry
			) as IRegistry;

			const expectFormat: string = expectRegistry.format;

			for (const registry of this.registries) {
				fileContent = fileContent.replace(
					new RegExp(
						registry.format
							.replace('/', '/')
							.replace('{pkgName}', '(.*)')
							.replace('{fileName}', '(.*)'),
						'g'
					),
					expectFormat.replace('{pkgName}', '$1').replace('{fileName}', '$2')
				);
			}

			try {
				fs.writeFileSync('yarn.lock', fileContent);
				console.log(chalk.bold.green('Transform yarn.lock successfully'));
			} catch (e) {
				console.log(chalk.bold.red('Cannot write changes to yarn.lock'));
			}
		}
	}
};
