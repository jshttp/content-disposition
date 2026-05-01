import { assert, describe, it } from 'vitest';
import { format } from './index';

describe('format(obj)', function () {
  it('should format a header with only type', function () {
    assert.strictEqual(format({ type: 'attachment' }), 'attachment');
  });

  it('should format token parameters without quotes', function () {
    assert.strictEqual(
      format({
        type: 'attachment',
        parameters: { filename: 'plans.pdf', foo: 'bar' },
      }),
      'attachment; filename=plans.pdf; foo=bar',
    );
  });

  it('should quote text parameter values', function () {
    assert.strictEqual(
      format({
        type: 'attachment',
        parameters: { filename: 'the plans.pdf' },
      }),
      'attachment; filename="the plans.pdf"',
    );
  });

  it('should escape quotes and backslashes in quoted values', function () {
    assert.strictEqual(
      format({
        type: 'attachment',
        parameters: { filename: 'the "plans" \\.pdf' },
      }),
      'attachment; filename="the \\"plans\\" \\\\.pdf"',
    );
  });

  it('should quote ISO-8859-1 parameter values', function () {
    assert.strictEqual(
      format({
        type: 'attachment',
        parameters: { filename: '£ rates.pdf' },
      }),
      'attachment; filename="£ rates.pdf"',
    );
  });

  it('should encode Unicode parameter values as extended fields', function () {
    assert.strictEqual(
      format({
        type: 'attachment',
        parameters: { filename: '€ rates.pdf' },
      }),
      "attachment; filename*=UTF-8''%E2%82%AC%20rates.pdf",
    );
  });

  it('should maintain case sensitivity', function () {
    assert.strictEqual(
      format({
        type: 'Attachment',
        parameters: { Filename: 'Plans.pdf' },
      }),
      'Attachment; Filename=Plans.pdf',
    );
  });

  it('should throw for missing type', function () {
    assert.throws(format.bind(null, {}), /invalid type/i);
  });

  it('should throw for invalid disposition type', function () {
    assert.throws(format.bind(null, { type: 'invalid type' }), /invalid type/i);
  });

  it('should throw for invalid parameter name', function () {
    assert.throws(
      format.bind(null, {
        type: 'attachment',
        parameters: { 'file name': 'plans.pdf' },
      }),
      /invalid parameter name/i,
    );
  });
});
