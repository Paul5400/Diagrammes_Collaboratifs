module.exports = {
  initialize: jest.fn(),
  parse: jest.fn().mockResolvedValue(true),
  render: jest.fn().mockResolvedValue({ svg: '<svg></svg>' }),
  default: {
    initialize: jest.fn(),
    parse: jest.fn().mockResolvedValue(true),
    render: jest.fn().mockResolvedValue({ svg: '<svg></svg>' }),
  },
};