var chai = require('chai'),
    expect = chai.expect,
    flow = require('flow.js').flow,
    testRunner = require('rAppid.js').TestRunner.setup();

var C = {};

describe.skip('SprdApiDataSource', function () {

    var api,
        shop,
        stage;

    before(function (done) {

        flow()
            .seq(function (cb) {

                testRunner.requireClasses({
                    SprdApiDataSource: 'xaml!sprd/data/SprdApiDataSource',
                    Shop: 'sprd/model/Shop',
                    Basket: 'sprd/model/Basket',
                    Model: 'js/data/Model',
                    Product: 'sprd/model/Product',
                    ConcreteElement: 'sprd/entity/ConcreteElement'
                }, C, cb);
            })
            .seq(function (cb) {
                testRunner.createSystemManager(null, function (err, result) {
                    stage = result;

                    cb(err);
                })
            })
            .exec(done);
    });

    beforeEach(function () {
        api = new C.SprdApiDataSource({
            endPoint: 'http://api.spreadshirt.net/api/v1',
            gateway: 'http://api.spreadshirt.net/api/v1',
            apiKey: '2b065dd3-88b7-44a8-87fe-e564ed27f904'
        }, null, stage);
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
//           S     expect(shop).to.exits;
//                expect(shop.$.productTypes === productTypes).to.be.ok;
//
//                done();
//            });
//
//        });
//
//    });

    describe('#save', function () {

        var basketId = '2d8bebe4-6428-4605-aed3-7a3abf9c0763';

        beforeEach(function (done) {
            shop = api.createEntity(C.Shop, 205909);
            shop.fetch(null, done);
        });

        it('create model from collection', function () {
            var basket = shop.$.baskets.createItem();
            expect(basket).to.exist.and.to.be.an.instanceof(C.Basket);
        });

        it('save basket to api', function (done) {
            var basket = shop.$.baskets.createItem();
            expect(basket).to.exist.and.to.be.an.instanceof(C.Basket);
            expect(basket.status() === C.Model.STATE.NEW).to.be.ok;

            basket.save(null, function (err, basket) {
                expect(err).to.not.exist;
                expect(basket).to.exist;
                expect(basket.status() === C.Model.STATE.CREATED).to.be.ok;

                basketId = basket.$.id;

                done();
            });

        });


        it('load basket from api', function (done) {

            var basket = api.createEntity(C.Basket, basketId);
            expect(basket).to.exist.and.to.be.an.instanceof(C.Basket);
            expect(basket.status() === C.Model.STATE.CREATED).to.be.ok;

            basket.fetch(null, function (err, b) {
                expect(err).to.not.exist;
                expect(b === basket).to.be.ok;

                done();
            })

        });

        it('add item to basket and save to api', function (done) {

            var basket = api.createEntity(C.Basket, basketId);
            expect(basket).to.exist.and.to.be.an.instanceof(C.Basket);
            expect(basket.status() === C.Model.STATE.CREATED).to.be.ok;

            var basketItem,
                product;

            flow()
                .seq(function (cb) {
                    basket.fetch(null, cb);
                })
                .seq(function (cb) {
                    product = api.shop(205909).createEntity(C.Product, 103737096);
                    product.fetch({
                        fetchSubModels: ["ProductType"]
                    }, cb);
                })
                .seq(function () {
                    basketItem = basket.$.basketItems.createItem();
                    basketItem.set({
                        element: new C.ConcreteElement({
                            item: product,
                            appearance: product.$.appearance,
                            size: product.$.productType.$.sizes[0]
                        })
                    });
                    basket.$.basketItems.add(basketItem);

                })
                // save basket
                .seq(function (cb) {
                    basketItem.save(null, cb);
                }).
                exec(function (err) {
                    expect(err).to.not.exist;
                    done();
                });

        });

        it('update basket item', function (done) {

            var basket = api.createEntity(C.Basket, basketId);
            expect(basket).to.exist.and.to.be.an.instanceof(C.Basket);
            expect(basket.status() === C.Model.STATE.CREATED).to.be.ok;

            var basketItem;

            flow()
                .seq(function (cb) {
                    basket.fetch(null, cb);
                })
                .seq(function () {
                    basketItem = basket.$.basketItems.at(0);
                    basketItem.set('quantity', basketItem.get('quantity') + 1);
                })
                // save basket item
                .seq(function (cb) {
                    basketItem.save(null, cb);
                }).
                exec(function (err) {
                    expect(err).to.not.exist;
                    done();
                });

        });

    });


});

