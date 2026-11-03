import { bench, describe } from 'vitest';
import {
  create,
  decodeExtended,
  encodeExtended,
  format,
  parse,
} from './index.js';

describe('create', () => {
  bench('create()', () => {
    create();
  });

  bench('create(filename)', () => {
    create('plans.pdf');
  });
});

describe('parse', () => {
  const longToken = 'attachment; filename=' + 'a'.repeat(256) + ' \t; x=y';

  bench('parse(long token parameter)', () => {
    parse(longToken);
  });

  bench('parse(type)', () => {
    parse('attachment');
  });

  bench('parse(uppercase type and parameter)', () => {
    parse('ATTACHMENT; FILENAME=plans.pdf');
  });

  bench('parse(token parameter)', () => {
    parse('attachment; filename=plans.pdf');
  });

  bench('parse(header)', () => {
    parse('attachment; filename="plans.pdf"');
  });

  bench('parse(header) with escaped quotes', () => {
    parse('attachment; filename="the \\"plans\\".pdf"');
  });

  bench('parse(header) with UTF-8 extended parameter', () => {
    parse("attachment; filename*=UTF-8''%E2%82%AC%20rates.pdf");
  });

  bench('parse(header) with multipart enabled', () => {
    parse('attachment; filename="the %22plans%22.pdf"', { multipart: true });
  });
});

describe('decodeExtended', () => {
  const longTail = "ISO-8859-1''%A3" + 'a'.repeat(256);
  const denseEscapes = "ISO-8859-1''" + '%A3'.repeat(64);

  bench('decodeExtended(latin1 with long literal tail)', () => {
    decodeExtended(longTail);
  });

  bench('decodeExtended(latin1 with dense escapes)', () => {
    decodeExtended(denseEscapes);
  });

  bench('decodeExtended(latin1 without escapes)', () => {
    decodeExtended("ISO-8859-1''rates.pdf");
  });

  bench('decodeExtended(latin1 with invalid encoding)', () => {
    decodeExtended("ISO-8859-1''%A3%ZZ");
  });

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

describe('format', () => {
  for (const [name, value] of Object.entries({
    token: 'plans.pdf',
    quoted: 'the plans.pdf',
    escaped: 'the "plans" \\.pdf',
    latin1: '£ rates.pdf',
    extended: '€ rates.pdf',
    longToken: 'a'.repeat(256),
    longQuoted: 'a'.repeat(256) + ' file.pdf',
  })) {
    const obj = { type: 'attachment', parameters: { filename: value } };
    bench(name, () => {
      format(obj);
    });
    bench(name + ' multipart', () => {
      format(obj, { multipart: true });
    });
  }
});
