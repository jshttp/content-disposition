import { bench, describe } from 'vitest';
import { create, parse } from './index.js';

describe('create', function () {
  bench('create()', function () {
    create();
  });

  bench('create(filename)', function () {
    create('plans.pdf');
  });
});

describe('parse', function () {
  bench('parse(header)', function () {
    parse('attachment; filename="plans.pdf"');
  });
});
