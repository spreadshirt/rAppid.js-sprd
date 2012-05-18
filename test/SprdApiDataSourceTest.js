var should = require('chai').should();
var rAppid = require('rAppid.js');

var C = {};

describe('SprdApiDataSource', function () {

    var api,
        shop;

    before(function (done) {

        rAppid.requireClasses({
            SprdApiDataSource: 'xaml!sprd/data/SprdApiDataSource',
            Shop: 'sprd/model/Shop'
        }, C, done);
    });

    beforeEach(function () {
        api = new C.SprdApiDataSource({
            endPoint: 'http://api.spreadshirt.net/api/v1',
            gateway: 'http://api.spreadshirt.net/api/v1'
        }, null, rAppid.TestRunner.createSystemManager());
    });

    describe('load', function(){

        it('#load shop', function (done) {

            shop = api.createEntity(C.Shop, 205909);
            shop.fetch(null, function (err, s) {

                should.not.exist(err);
                shop.should.eql(s);

                done();
            })

        });

        it('#load articles', function (done) {

            shop.$.productTypes.fetch(null, function(err, productTypes) {
                should.not.exist(err);
                shop.$.productTypes.should.eql(productTypes);

                done();
            });

        });

    });


});

