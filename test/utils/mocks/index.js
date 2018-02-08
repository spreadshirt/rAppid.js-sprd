const requirejs = require('requirejs');
const ModelMocks = require('./Model');

const createDependency = (name, base = {}) => {
  if (!name) {
    throw Error('Module definition needs a name');
  }
  requirejs.define(name, [], () => base);
}

const createParent = (name, base = {}) => {
  const inherit = (moduleName, module) => module;
  createDependency(name, Object.assign({}, base, { inherit }));
}

module.exports = {
  createModel: ModelMocks.create,
  createDependency,
  createParent,
}