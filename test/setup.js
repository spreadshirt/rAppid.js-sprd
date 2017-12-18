const path = require('path');
const chai = require('chai');

global.expect = chai.expect;
global.sinon = require('sinon');
global._ = require('underscore');

requirejs = require('requirejs');
requirejs.config({
  baseUrl: path.resolve(__dirname, '..'),
});