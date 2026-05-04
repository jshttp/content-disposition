import { bench, describe } from 'vitest';
import { create, decodeExtended, encodeExtended, parse } from './index.js';

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

  bench('parse(header) with multipart enabled', () => {
    parse('attachment; filename="the %22plans%22.pdf"', { multipart: true });
  });
});

describe('decodeExtended', () => {
  bench('decodeExtended(value)', () => {
    decodeExtended("UTF-8''%E2%82%AC%20rates.pdf");
  });

  bench('decodeExtended(value) with invalid encoding', () => {
    decodeExtended("UTF-8''%E2%82%AC%20rates.pdf%ZZ");
  });

  bench('decodeExtended(value) with latin1 encoding', () => {
    decodeExtended("ISO-8859-1''%E2%82%AC%20rates.pdf");
  });
});

describe('encodeExtended', () => {
  bench('encodeExtended(filename)', () => {
    encodeExtended('€ rates.pdf');
  });
});
