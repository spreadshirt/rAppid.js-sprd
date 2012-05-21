var chai = require('chai'),
    expect = chai.expect,
    rAppid = require('rAppid.js');

var C = {};

describe('SprdApiDataSource', function () {

    var api,
        shop;

    before(function (done) {

        rAppid.requireClasses({
            SprdApiDataSource: 'xaml!sprd/data/SprdApiDataSource',
            Shop: 'sprd/model/Shop',
            Basket: 'sprd/model/Basket',
            Model: 'js/data/Model'
        }, C, done);
    });

    beforeEach(function () {
        api = new C.SprdApiDataSource({
            endPoint: 'http://api.spreadshirt.net/api/v1',
            gateway: 'http://api.spreadshirt.net/api/v1',
            apiKey: '2b065dd3-88b7-44a8-87fe-e564ed27f904'
        }, null, rAppid.TestRunner.createSystemManager());
    });

//    describe('load', function(){
//
//        it('#load shop', function (done) {
//
//            shop = api.createEntity(C.Shop, 205909);
//            shop.fetch(null, function (err, s) {
//
//                expect(err).to.not.exist;
//                expect(shop).to.exist.and.to.be.eql(s);
//
//                done();
//            })
//
//        });
//
//        it('#load articles', function (done) {
//
//            shop.$.productTypes.fetch(null, function(err, productTypes) {
//                expect(err).to.not.exits;
//                expect(shop).to.exits;
//                expect(shop.$.productTypes === productTypes).to.be.ok;
//
//                done();
//            });
//
//        });
//
//    });

    describe('#save', function() {

        beforeEach(function(done) {
            shop = api.createEntity(C.Shop, 205909);
            shop.fetch(null, done);
        });

        it ('create model from collection', function() {
            var basket = shop.$.baskets.createItem();
            expect(basket).to.exist.and.to.be.an.instanceof(C.Basket);
        });

        it('save basket to api', function (done) {
            var basket = shop.$.baskets.createItem();
            expect(basket).to.exist.and.to.be.an.instanceof(C.Basket);
            expect(basket.status() === C.Model.STATE.NEW).to.be.ok;

            basket.save(null, function(err, basket) {
                expect(err).to.not.exist;
                expect(basket).to.exist;
                expect(basket.status() === C.Model.STATE.CREATED).to.be.ok;

                done();
            });

        });

    });


});

