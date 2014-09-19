
var assert = require('assert')
var contentDisposition = require('..')

describe('contentDisposition()', function () {
  it('should create an attachment header', function () {
    assert.equal(contentDisposition(), 'attachment')
  })
})

describe('contentDisposition(filename)', function () {
  it('should require a string', function () {
    assert.throws(contentDisposition.bind(null, 42), /argument filename.*string/)
  })

  it('should create a header with file name', function () {
    assert.equal(contentDisposition('plans.pdf'), 'attachment; filename="plans.pdf"')
  })

  it('should use the basename of the string', function () {
    assert.equal(contentDisposition('/path/to/plans.pdf'), 'attachment; filename="plans.pdf"')
  })

  it('should not accept filename with NULLs', function () {
    assert.throws(contentDisposition.bind(null, 'plans\u0000.pdf'), /invalid.*value/)
  })

  describe('when "filename" is US-ASCII', function () {
    it('should only include filename parameter', function () {
      assert.equal(contentDisposition('plans.pdf'), 'attachment; filename="plans.pdf"')
    })

    it('should escape quotes', function () {
      assert.equal(contentDisposition('the "plans".pdf'), 'attachment; filename="the \\"plans\\".pdf"')
    })
  })

  describe('when "filename" is Unicode', function () {
    it('should include filename* parameter', function () {
      assert.equal(contentDisposition('планы.pdf'), 'attachment; filename="?????.pdf"; filename*=UTF-8\'\'%D0%BF%D0%BB%D0%B0%D0%BD%D1%8B.pdf')
    })

    it('should encode special characters', function () {
      assert.equal(contentDisposition('«\'*%».pdf'), 'attachment; filename="?\'*%?.pdf"; filename*=UTF-8\'\'%C2%AB%27%2A%25%C2%BB.pdf')
    })
  })
})
