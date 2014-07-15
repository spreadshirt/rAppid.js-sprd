var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    _ = require('underscore'),
    testRunner = require('rAppid.js').TestRunner.setup();

var C = {};

describe('sprd.model.UserAddress', function () {

    before(function (done) {
        testRunner.requireClasses({
            Address: 'sprd/model/UserAddress',
            Country: 'sprd/entity/Country'
        }, C, done);

    });

    var address;

    beforeEach(function () {
        address = new C.Address();
    });

    describe('supportsCounty', function () {

        it('should return true for GB and IE', function () {

            address.set('country', new C.Country({code: 'GB'}));

            expect(address.supportsCounty()).to.equal(true);

            address.set('country', new C.Country({code: 'IE'}));

            expect(address.supportsCounty()).to.equal(true);
        });

        it('should return false for everything else', function () {
            address.set('country', new C.Country({code: 'DE'}));

            expect(address.supportsCounty()).to.equal(false);
        });

        it('should have country annotation', function () {
            expect(C.Address.prototype.supportsCounty._attributes).to.contain("country");
        });

    });

    describe('isStateRequired', function () {

        it('should return true for UE and IE', function () {
            address.set('country', new C.Country({code: 'US'}));

            expect(address.isStateRequired()).to.equal(true);

            address.set('country', new C.Country({code: 'IE'}));

            expect(address.isStateRequired()).to.equal(true);
        });

        it('should return false for everything else', function () {
            address.set('country', new C.Country({code: 'DE'}));

            expect(address.isStateRequired()).to.equal(false);
        });


        it('should have country annotation', function () {
            expect(C.Address.prototype.isStateRequired._attributes).to.contain("country");
        });
    });

    describe('needsZipCode', function () {

        it('should return false for IE', function () {
            address.set('country', new C.Country({code: 'IE'}));

            expect(address.needsZipCode()).to.equal(false);
        });

        it('should return true for other country', function () {
            address.set('country', new C.Country({code: 'DE'}));

            expect(address.needsZipCode()).to.equal(true);
        });

        it('should have country annotation', function () {
            expect(C.Address.prototype.needsZipCode._attributes).to.contain("country");
        });

    });

    describe('_commitChangedAttributes', function () {


        it('should set type from PACKSTATION to PRIVATE when switching Country from DE to something else', function () {
            address.set({
                country: new C.Country({code: 'DE'}),
                type: C.Address.ADDRESS_TYPES.PACKSTATION
            });

            expect(address.$.type).to.be.eql(C.Address.ADDRESS_TYPES.PACKSTATION);

            address.set('country', new C.Country({code: 'IE'}));

            expect(address.$.type).to.be.eql(C.Address.ADDRESS_TYPES.PRIVATE);
        });

    });

    describe('street', function () {

        it('should be only required when type is PRIVATE', function () {
            address.set({
                street: "", // empty street name
                country: new C.Country({code: 'DE'}),
                type: C.Address.ADDRESS_TYPES.PACKSTATION
            });

            address.validate({fields: ['street']});

            expect(address.isValid()).to.eql(true);

            address.set('type', C.Address.ADDRESS_TYPES.PRIVATE);

            address.validate({fields: ['street']});

            expect(address.isValid()).to.eql(false);
        });

        it('should not accept "Postfiliale" as value', function () {

            address.set({
                street: "Valid street name"
            });

            address.validate({fields: ["street"]});

            expect(address.isValid()).to.eql(true);

            address.set('street', 'postfiliale 123');

            address.validate({fields: ["street"]});

            expect(address.isValid()).to.eql(false);
        });

        it('should not accept "packstation" or "postnummer" ', function () {
            address.set({
                street: "Valid street name"
            });

            address.validate({fields: ["street"]});

            expect(address.isValid()).to.eql(true);

            address.set('street', 'packstation 123');

            address.validate({fields: ["street"]});

            expect(address.isValid()).to.eql(false);

            address.set('street', 'postnummer 123');

            address.validate({fields: ["street"]});

            expect(address.isValid()).to.eql(false);

        });

    });

    describe('state', function () {

        it('should be only required for countries US and IE', function () {
            address.set({
                state: "", // empty state name
                country: new C.Country({code: 'DE'})
            });

            address.validate({fields: ['state']});

            expect(address.isValid()).to.eql(true);

            address.set('country', new C.Country({code: 'US'}));

            address.validate({fields: ['state']});

            expect(address.isValid()).to.eql(false);

            address.set('country', new C.Country({code: 'IE'}));

            address.validate({fields: ['state']});

            expect(address.isValid()).to.eql(false);
        });

    });

    describe('zipCode', function () {

        it('should be not required for IE', function () {
            address.set({
                zipCode: "", // empty zipCode name
                country: new C.Country({code: 'DE'})
            });

            address.validate({fields: ['zipCode']});

            expect(address.isValid()).to.eql(false);

            address.set('country', new C.Country({code: 'IE'}));

            address.validate({fields: ['zipCode']});

            expect(address.isValid()).to.eql(true);
        });


    });

    describe('postNr', function () {

        it('should be required for address type PACKSTATION', function () {
            address.set({
                postNr: "", // empty street name
                country: new C.Country({code: 'DE'}),
                type: C.Address.ADDRESS_TYPES.PACKSTATION
            });

            address.validate({fields: ['postNr']});

            expect(address.isValid()).to.eql(false);

            address.set('type', C.Address.ADDRESS_TYPES.PRIVATE);

            address.validate({fields: ['postNr']});

            expect(address.isValid()).to.eql(true);
        })

    });

    describe('packStationNr', function () {

        it('should be required for address type PACKSTATION', function () {
            address.set({
                packStationNr: "", // empty street name
                country: new C.Country({code: 'DE'}),
                type: C.Address.ADDRESS_TYPES.PACKSTATION
            });

            address.validate({fields: ['packStationNr']});

            expect(address.isValid()).to.eql(false);

            address.set('type', C.Address.ADDRESS_TYPES.PRIVATE);

            address.validate({fields: ['packStationNr']});

            expect(address.isValid()).to.eql(true);
        })

    });


});
