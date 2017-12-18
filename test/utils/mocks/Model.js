const sinon = require('sinon');

const create = (jsObject = {}) => {
  const get = function(prop) {
    return this.$[prop];
  };

  const set = function(prop, value) {
    return this.$[prop] = value;
  };

  return {
    $: jsObject,
    get,
    set,
  }
}

module.exports = {
  create,
}