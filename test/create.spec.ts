import { describe, it, assert } from 'vitest';
import { create } from '../src';

describe('create()', function () {
  it('should create an attachment header', function () {
    assert.strictEqual(create(), 'attachment');
  });
});

describe('create(filename)', function () {
  it('should require a string', function () {
    assert.throws(create.bind(null, 42 as any), /filename.*string/);
  });

  it('should create a header with file name', function () {
    assert.strictEqual(create('plans.pdf'), 'attachment; filename="plans.pdf"');
  });

  it('should use the basename of a posix path', function () {
    assert.strictEqual(
      create('/path/to/plans.pdf'),
      'attachment; filename="plans.pdf"',
    );
  });

  it('should use the basename of a windows path', function () {
    assert.strictEqual(
      create('\\path\\to\\plans.pdf'),
      'attachment; filename="plans.pdf"',
    );
  });

  it('should use the basename of a windows path with drive letter', function () {
    assert.strictEqual(
      create('C:\\path\\to\\plans.pdf'),
      'attachment; filename="plans.pdf"',
    );
  });

  it('should use the basename of a posix path with trailing slash', function () {
    assert.strictEqual(
      create('/path/to/plans.pdf/'),
      'attachment; filename="plans.pdf"',
    );
  });

  it('should use the basename of a windows path with trailing slash', function () {
    assert.strictEqual(
      create('\\path\\to\\plans.pdf\\'),
      'attachment; filename="plans.pdf"',
    );
  });

  it('should use the basename of a windows path with drive letter and trailing slash', function () {
    assert.strictEqual(
      create('C:\\path\\to\\plans.pdf\\'),
      'attachment; filename="plans.pdf"',
    );
  });

  it('should use the basename of a posix path with trailing slashes', function () {
    assert.strictEqual(
      create('/path/to/plans.pdf///'),
      'attachment; filename="plans.pdf"',
    );
  });

  it('should use the basename of a windows path with trailing slashes', function () {
    assert.strictEqual(
      create('\\path\\to\\plans.pdf\\\\\\'),
      'attachment; filename="plans.pdf"',
    );
  });

  it('should use the basename of a windows path with drive letter and trailing slashes', function () {
    assert.strictEqual(
      create('C:\\path\\to\\plans.pdf\\\\\\'),
      'attachment; filename="plans.pdf"',
    );
  });

  describe('when "filename" is US-ASCII', function () {
    it('should only include filename parameter', function () {
      assert.strictEqual(
        create('plans.pdf'),
        'attachment; filename="plans.pdf"',
      );
    });

    it('should escape quotes', function () {
      assert.strictEqual(
        create('the "plans".pdf'),
        'attachment; filename="the \\"plans\\".pdf"',
      );
    });
  });

  describe('when "filename" is ISO-8859-1', function () {
    it('should only include filename parameter', function () {
      assert.strictEqual(
        create('«plans».pdf'),
        'attachment; filename="«plans».pdf"',
      );
    });

    it('should escape quotes', function () {
      assert.strictEqual(
        create('the "plans" (1µ).pdf'),
        'attachment; filename="the \\"plans\\" (1µ).pdf"',
      );
    });
  });

  describe('when "filename" is Unicode', function () {
    it('should include filename* parameter', function () {
      assert.strictEqual(
        create('планы.pdf'),
        'attachment; filename="?????.pdf"; filename*=UTF-8\'\'%D0%BF%D0%BB%D0%B0%D0%BD%D1%8B.pdf',
      );
    });

    it('should include filename fallback', function () {
      assert.strictEqual(
        create('£ and € rates.pdf'),
        'attachment; filename="£ and ? rates.pdf"; filename*=UTF-8\'\'%C2%A3%20and%20%E2%82%AC%20rates.pdf',
      );
      assert.strictEqual(
        create('€ rates.pdf'),
        'attachment; filename="? rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf',
      );
    });

    it('should encode special characters', function () {
      assert.strictEqual(
        create("€'*%().pdf"),
        "attachment; filename=\"?'*%().pdf\"; filename*=UTF-8''%E2%82%AC%27%2A%25%28%29.pdf",
      );
    });
  });

  describe('when "filename" contains hex escape', function () {
    it('should include filename* parameter', function () {
      assert.strictEqual(
        create('the%20plans.pdf'),
        'attachment; filename="the%20plans.pdf"; filename*=UTF-8\'\'the%2520plans.pdf',
      );
    });

    it('should handle Unicode', function () {
      assert.strictEqual(
        create('€%20£.pdf'),
        'attachment; filename="?%20£.pdf"; filename*=UTF-8\'\'%E2%82%AC%2520%C2%A3.pdf',
      );
    });
  });
});

describe('create(filename, options)', function () {
  describe('with "fallback" option', function () {
    it('should require a string or Boolean', function () {
      assert.throws(
        create.bind(null, 'plans.pdf', { fallback: 42 } as any),
        /fallback.*string/,
      );
    });

    it('should default to true', function () {
      assert.strictEqual(
        create('€ rates.pdf'),
        'attachment; filename="? rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf',
      );
    });

    describe('when "false"', function () {
      it('should not generate ISO-8859-1 fallback', function () {
        assert.strictEqual(
          create('£ and € rates.pdf', { fallback: false }),
          "attachment; filename*=UTF-8''%C2%A3%20and%20%E2%82%AC%20rates.pdf",
        );
      });

      it('should keep ISO-8859-1 filename', function () {
        assert.strictEqual(
          create('£ rates.pdf', { fallback: false }),
          'attachment; filename="£ rates.pdf"',
        );
      });
    });

    describe('when "true"', function () {
      it('should generate ISO-8859-1 fallback', function () {
        assert.strictEqual(
          create('£ and € rates.pdf', { fallback: true }),
          'attachment; filename="£ and ? rates.pdf"; filename*=UTF-8\'\'%C2%A3%20and%20%E2%82%AC%20rates.pdf',
        );
      });

      it('should pass through ISO-8859-1 filename', function () {
        assert.strictEqual(
          create('£ rates.pdf', { fallback: true }),
          'attachment; filename="£ rates.pdf"',
        );
      });
    });

    describe('when a string', function () {
      it('should require an ISO-8859-1 string', function () {
        assert.throws(
          create.bind(null, '€ rates.pdf', { fallback: '€ rates.pdf' }),
          /fallback.*iso-8859-1/i,
        );
      });

      it('should use as ISO-8859-1 fallback', function () {
        assert.strictEqual(
          create('£ and € rates.pdf', { fallback: '£ and EURO rates.pdf' }),
          'attachment; filename="£ and EURO rates.pdf"; filename*=UTF-8\'\'%C2%A3%20and%20%E2%82%AC%20rates.pdf',
        );
      });

      it('should use as fallback even when filename is ISO-8859-1', function () {
        assert.strictEqual(
          create('"£ rates".pdf', { fallback: '£ rates.pdf' }),
          'attachment; filename="£ rates.pdf"; filename*=UTF-8\'\'%22%C2%A3%20rates%22.pdf',
        );
      });

      it('should do nothing if equal to filename', function () {
        assert.strictEqual(
          create('plans.pdf', { fallback: 'plans.pdf' }),
          'attachment; filename="plans.pdf"',
        );
      });

      it('should use the basename of a posix path', function () {
        assert.strictEqual(
          create('€ rates.pdf', { fallback: '/path/to/EURO rates.pdf' }),
          'attachment; filename="EURO rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf',
        );
      });

      it('should use the basename of a windows path', function () {
        assert.strictEqual(
          create('€ rates.pdf', { fallback: '\\path\\to\\EURO rates.pdf' }),
          'attachment; filename="EURO rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf',
        );
      });

      it('should use the basename of a windows path with drive letter', function () {
        assert.strictEqual(
          create('€ rates.pdf', { fallback: 'C:\\path\\to\\EURO rates.pdf' }),
          'attachment; filename="EURO rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf',
        );
      });

      it('should do nothing without filename option', function () {
        assert.strictEqual(
          create(undefined, { fallback: 'plans.pdf' }),
          'attachment',
        );
      });
    });
  });

  describe('with "type" option', function () {
    it('should default to attachment', function () {
      assert.strictEqual(create(), 'attachment');
    });

    it('should require a string', function () {
      assert.throws(
        create.bind(null, undefined, { type: 42 } as any),
        /invalid type/,
      );
    });

    it('should require a valid type', function () {
      assert.throws(
        create.bind(null, undefined, { type: 'invalid;type' }),
        /invalid type/,
      );
    });

    it('should create a header with inline type', function () {
      assert.strictEqual(create(undefined, { type: 'inline' }), 'inline');
    });

    it('should create a header with inline type & filename', function () {
      assert.strictEqual(
        create('plans.pdf', { type: 'inline' }),
        'inline; filename="plans.pdf"',
      );
    });

    it('should normalize type', function () {
      assert.strictEqual(create(undefined, { type: 'INLINE' }), 'inline');
    });
  });
});
