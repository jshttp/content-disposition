
var assert = require('assert')
var contentDisposition = require('..')

describe('contentDisposition()', function () {
  it('should create an attachment header', function () {
    assert.equal(contentDisposition(), 'attachment')
  })
})

describe('contentDisposition(filename)', function () {
  it('should require a string', function () {
    assert.throws(contentDisposition.bind(null, 42),
      /argument filename.*string/)
  })

  it('should create a header with file name', function () {
    assert.equal(contentDisposition('plans.pdf'),
      'attachment; filename="plans.pdf"')
  })

  it('should use the basename of the string', function () {
    assert.equal(contentDisposition('/path/to/plans.pdf'),
      'attachment; filename="plans.pdf"')
  })

  describe('when "filename" is US-ASCII', function () {
    it('should only include filename parameter', function () {
      assert.equal(contentDisposition('plans.pdf'),
        'attachment; filename="plans.pdf"')
    })

    it('should escape quotes', function () {
      assert.equal(contentDisposition('the "plans".pdf'),
        'attachment; filename="the \\"plans\\".pdf"')
    })
  })

  describe('when "filename" is ISO-8859-1', function () {
    it('should only include filename parameter', function () {
      assert.equal(contentDisposition('«plans».pdf'),
        'attachment; filename="«plans».pdf"')
    })

    it('should escape quotes', function () {
      assert.equal(contentDisposition('the "plans" (1µ).pdf'),
        'attachment; filename="the \\"plans\\" (1µ).pdf"')
    })
  })

  describe('when "filename" is Unicode', function () {
    it('should include filename* parameter', function () {
      assert.equal(contentDisposition('планы.pdf'),
        'attachment; filename="?????.pdf"; filename*=UTF-8\'\'%D0%BF%D0%BB%D0%B0%D0%BD%D1%8B.pdf')
    })

    it('should include filename fallback', function () {
      assert.equal(contentDisposition('£ and € rates.pdf'),
        'attachment; filename="£ and ? rates.pdf"; filename*=UTF-8\'\'%C2%A3%20and%20%E2%82%AC%20rates.pdf')
      assert.equal(contentDisposition('€ rates.pdf'),
        'attachment; filename="? rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf')
    })

    it('should encode special characters', function () {
      assert.equal(contentDisposition('€\'*%().pdf'),
        'attachment; filename="?\'*%().pdf"; filename*=UTF-8\'\'%E2%82%AC%27%2A%25%28%29.pdf')
    })
  })

  describe('when "filename" contains hex escape', function () {
    it('should include filename* parameter', function () {
      assert.equal(contentDisposition('the%20plans.pdf'),
        'attachment; filename="the%20plans.pdf"; filename*=UTF-8\'\'the%2520plans.pdf')
    })

    it('should handle Unicode', function () {
      assert.equal(contentDisposition('€%20£.pdf'),
        'attachment; filename="?%20£.pdf"; filename*=UTF-8\'\'%E2%82%AC%2520%C2%A3.pdf')
    })
  })
})

describe('contentDisposition(filename, options)', function () {
  describe('with "fallback" option', function () {
    it('should require a string or Boolean', function () {
      assert.throws(contentDisposition.bind(null, 'plans.pdf', { fallback: 42 }),
        /option fallback.*string/)
    })

    it('should default to true', function () {
      assert.equal(contentDisposition('€ rates.pdf'),
        'attachment; filename="? rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf')
    })

    describe('when "false"', function () {
      it('should not generate ISO-8859-1 fallback', function () {
      assert.equal(contentDisposition('£ and € rates.pdf', { fallback: false }),
        'attachment; filename*=UTF-8\'\'%C2%A3%20and%20%E2%82%AC%20rates.pdf')
      })

      it('should keep ISO-8859-1 filename', function () {
        assert.equal(contentDisposition('£ rates.pdf', { fallback: false }),
          'attachment; filename="£ rates.pdf"')
      })
    })

    describe('when "true"', function () {
      it('should generate ISO-8859-1 fallback', function () {
        assert.equal(contentDisposition('£ and € rates.pdf', { fallback: true }),
          'attachment; filename="£ and ? rates.pdf"; filename*=UTF-8\'\'%C2%A3%20and%20%E2%82%AC%20rates.pdf')
      })

      it('should pass through ISO-8859-1 filename', function () {
        assert.equal(contentDisposition('£ rates.pdf', { fallback: true }),
          'attachment; filename="£ rates.pdf"')
      })
    })

    describe('when a string', function () {
      it('should require an ISO-8859-1 string', function () {
        assert.throws(contentDisposition.bind(null, '€ rates.pdf', { fallback: '€ rates.pdf' }),
          /option fallback.*iso-8859-1/i)
      })

      it('should use as ISO-8859-1 fallback', function () {
        assert.equal(contentDisposition('£ and € rates.pdf', { fallback: '£ and EURO rates.pdf' }),
          'attachment; filename="£ and EURO rates.pdf"; filename*=UTF-8\'\'%C2%A3%20and%20%E2%82%AC%20rates.pdf')
      })

      it('should use as fallback even when filename is ISO-8859-1', function () {
        assert.equal(contentDisposition('"£ rates".pdf', { fallback: '£ rates.pdf' }),
          'attachment; filename="£ rates.pdf"; filename*=UTF-8\'\'%22%C2%A3%20rates%22.pdf')
      })

      it('should do nothing if equal to filename', function () {
        assert.equal(contentDisposition('plans.pdf', { fallback: 'plans.pdf' }),
          'attachment; filename="plans.pdf"')
      })

      it('should use the basename of the string', function () {
        assert.equal(contentDisposition('€ rates.pdf', { fallback: '/path/to/EURO rates.pdf' }),
          'attachment; filename="EURO rates.pdf"; filename*=UTF-8\'\'%E2%82%AC%20rates.pdf')
      })

      it('should do nothing without filename option', function () {
        assert.equal(contentDisposition(undefined, { fallback: 'plans.pdf' }),
          'attachment')
      })
    })
  })

  describe('with "type" option', function () {
    it('should default to attachment', function () {
      assert.equal(contentDisposition(),
        'attachment')
    })

    it('should require a string', function () {
      assert.throws(contentDisposition.bind(null, undefined, { type: 42 }),
        /option type.*string/)
    })

    it('should require a valid type', function () {
      assert.throws(contentDisposition.bind(null, undefined, { type: 'invlaid;type' }),
        /option type.*valid token/)
    })

    it('should create a header with inline type', function () {
      assert.equal(contentDisposition(undefined, { type: 'inline' }),
        'inline')
    })

    it('should create a header with inline type & filename', function () {
      assert.equal(contentDisposition('plans.pdf', { type: 'inline' }),
        'inline; filename="plans.pdf"')
    })

    it('should normalize type', function () {
      assert.equal(contentDisposition(undefined, { type: 'INLINE' }),
        'inline')
    })
  })
})
