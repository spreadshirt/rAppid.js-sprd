var should = require('chai').should();
var rAppid = require('rAppid.js');

var SprdApiDataSource,
    Model = rAppid.require('js/data/Model'),
    Basket = rAppid.require('sprd/model/Basket');

describe('SprdApiDataSource', function () {

    var api;

    before(function (done) {
        rAppid.require(['xaml!sprd/data/SprdApiDataSource'], function (ds) {
            SprdApiDataSource = ds;
            done();
        });
    });

    beforeEach(function () {
        api = new SprdApiDataSource({
            endPoint: 'http://api.spreadshirt.net/api/v1',
            gateway: 'http://api.spreadshirt.net/api/v1',
            apiKey: 'foo'
        }, null, rAppid.TestRunner.createSystemManager());
    });

    describe('load', function(){

        it('#load shop', function (done) {

            var shop = api.createModel(Model, 205909, "Shop");
            shop.fetch(null, function (err, s) {

                should.not.exist(err);
                shop.should.eql(s);

                done();
            })

        });
    });

    describe('basket', function() {

        it('#create basket', function(done) {

            var basket = api.createModel(Basket);

            basket.save(function(err, b) {
                should.not.exist(err);
                basket.should.eql(b);


            })

        });

    })


});


//var api = rAppid.require('xaml!sprd/data/SprdApiDataSource');
