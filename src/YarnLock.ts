import * as fs from 'fs';
import * as chalk from 'chalk';
import { program } from 'commander';
import * as inquirer from 'inquirer';
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
      name: 'taobao-http',
      domain: 'registry.npm.taobao.org',
      format: 'http://registry.npm.taobao.org/{pkgName}/download/{fileName}'
    },
    {
      name: 'taobao-https',
      domain: 'registry.npm.taobao.org',
      format: 'https://registry.npm.taobao.org/{pkgName}/download/{fileName}'
    },
    {
      name: 'npmmirror',
      domain: 'registry.npmmirror.com',
      format: 'https://registry.npmmirror.com/{pkgName}/-/{fileName}'
    }
  ];

  public async start(): Promise<any> {
    program.version(pkg.version)
      .option('--registry <name>')
      .parse(process.argv);

    const options = program.opts();

    let fileContent;
    try {
      fileContent = fs.readFileSync('yarn.lock');
      fileContent = String(fileContent);
    } catch (e) {
      return console.log(
        chalk.bold.red('Cannot find yarn.lock in current folder')
      );
    }

    let expectRegistry: IRegistry | undefined;

    if (options.registry) {
      expectRegistry = this.registries.find(
        registry => registry.name === options.registry
      );
    } else {
      const list: Array<any> = [
        {
          type: 'list',
          name: 'registry',
          message: "Which registry you'd like to transform to?",
          choices: this.registries.map(registry => {
            return {
              name: `${registry.name}(${registry.domain})`,
              value: registry.name
            };
          })
        }
      ];
      const answers = await inquirer.prompt(list);
      expectRegistry = this.registries.find(
        registry => registry.name === answers.registry
      );
    }

    if (!expectRegistry) {
      return console.log(
        chalk.bold.red('Cannot find your registry')
      );
    }

    const expectFormat = expectRegistry.format;

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
};
