
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

  it('should not accept filename with NULLs', function () {
    assert.throws(contentDisposition.bind(null, 'plans\u0000.pdf'),
      /invalid.*value/)
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

  describe('when "filename" is Unicode', function () {
    it('should include filename* parameter', function () {
      assert.equal(contentDisposition('планы.pdf'),
        'attachment; filename="?????.pdf"; filename*=UTF-8\'\'%D0%BF%D0%BB%D0%B0%D0%BD%D1%8B.pdf')
    })

    it('should include filename fallback', function () {
      assert.equal(contentDisposition('«bye».pdf'),
        'attachment; filename="?bye?.pdf"; filename*=UTF-8\'\'%C2%ABbye%C2%BB.pdf')
      assert.equal(contentDisposition('«hi».pdf'),
        'attachment; filename="?hi?.pdf"; filename*=UTF-8\'\'%C2%ABhi%C2%BB.pdf')
    })

    it('should encode special characters', function () {
      assert.equal(contentDisposition('«\'*%()».pdf'),
        'attachment; filename="?\'*%()?.pdf"; filename*=UTF-8\'\'%C2%AB%27%2A%25%28%29%C2%BB.pdf')
    })
  })

  describe('when "filename" contains hex escape', function () {
    it('should include filename* parameter', function () {
      assert.equal(contentDisposition('the%20plans.pdf'), 'attachment; filename="the%20plans.pdf"; filename*=UTF-8\'\'the%2520plans.pdf')
    })

    it('should handle Unicode', function () {
      assert.equal(contentDisposition('«%20».pdf'), 'attachment; filename="?%20?.pdf"; filename*=UTF-8\'\'%C2%AB%2520%C2%BB.pdf')
    })
  })
})

describe('contentDisposition(filename, options)', function () {
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
