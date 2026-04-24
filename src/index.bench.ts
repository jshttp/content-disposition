import { bench, describe } from 'vitest';
import { create, parse } from './index.js';

describe('create', () => {
  bench('create()', () => {
    create();
  });

  bench('create(filename)', () => {
    create('plans.pdf');
  });
});

describe('parse', () => {
  bench('parse(header)', () => {
    parse('attachment; filename="plans.pdf"');
  });

  bench('parse(header) with UTF-8 extended parameter', () => {
    parse("attachment; filename*=UTF-8''%E2%82%AC%20rates.pdf");
  });
});
