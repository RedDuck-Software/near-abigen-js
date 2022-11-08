#!/usr/bin/env node
import { Command } from 'commander';
import { parseTsFile } from './lib/parser';
import { DEFAULT_OUTPUT_ABIS_PATH } from './constants';

const program = new Command();

program.name('Near AbiGen utility').description('Near AbiGen utility').version('0.0.1-dev');

program
  .description('Generates Typescript entities from a given contract ABIs')
  .arguments('<contractsFolder>')
  .option('-o, --output <item>', 'generated abis folder path', DEFAULT_OUTPUT_ABIS_PATH)
  .action((contractsFolder, { output }) => {
    console.log({ contractsFolder, output })

    return parseTsFile(contractsFolder);
  });


program.parse(process.argv);
