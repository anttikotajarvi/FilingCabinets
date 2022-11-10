// File system access
// All synchronous
const fs = require('fs');
import { CabinetDefinition } from './def';
import { SHITBED } from './err';
module.exports = {
  exists: (filepath: string): boolean => {
    return fs.existsSync(filepath);
  },

  mkdir: (p: string) => {
    if (!fs.existsSync(p)) fs.mkdirSync(p);
  },

  rm: (filepath: string): void => {
    fs.rmSync(filepath);
  },

  writeDoc: (filepath: string, data: any): void => {
    try {
      fs.writeFileSync(filepath, JSON.stringify(data));
    } catch (error) {
      SHITBED('doc_write_failed', {
        filepath,
        data,
        error
      });
    }
    return;
  },
  readDoc: <BaseType>(
    filepath: string
  ): BaseType | null => {
    try {
      return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    } catch (error) {
      SHITBED('doc_read_failed', { filepath, error });
    }
    return null;
  },

  writeFile: (filepath: string, data: any): void => {
    try {
      fs.writeFileSync(filepath, data);
    } catch (error) {
      SHITBED('file_write_failed', {
        filepath,
        data,
        error
      });
    }
  },

  readFile: (filepath: string): Buffer | null => {
    try {
      return fs.readFileSync(filepath);
    } catch (error) {
      SHITBED('file_read_failed', { filepath, error });
    }
    return null;
  }
};
