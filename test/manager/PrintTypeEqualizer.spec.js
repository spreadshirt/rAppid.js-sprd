const Mocks = require('../utils/mocks');

Mocks.createParent('js/core/Bindable');
const MockProductUtil = {};
Mocks.createDependency('sprd/util/ProductUtil', MockProductUtil);
Mocks.createDependency('sprd/entity/ConcreteElement');
Mocks.createDependency('sprd/model/PrintType', { 
  Mapping: {
    SpecialFlex: 'mock.printType.specialFlex',
    Flock: 'mock.printType.Flock',
  }
});

describe('sprd.manager.PrintTypeEqualizer', () => {

  let Module;

  beforeEach((done) => {
    requirejs(['sprd/manager/PrintTypeEqualizer'], (_Module) => {
      Module = _Module;
      done();
    });
  });

  describe('equalizeConfiguration', () => {
    let product;
    let configurations;
    let targetPrintType;

    it('should return if product or configurations are null/empty', () => {
      // configurations is undefined
      expect(Module.equalizeConfigurations(product, configurations, targetPrintType)).to.be.undefined;

      // configurations is empty
      configurations = [];
      expect(Module.equalizeConfigurations(product, configurations, targetPrintType)).to.be.undefined;

      // not enough configs
      configurations = [{}];
      expect(Module.equalizeConfigurations(product, configurations, targetPrintType)).to.be.undefined;

      configurations = [{}, {}];
      expect(Module.equalizeConfigurations(product, configurations, targetPrintType)).to.be.undefined;
      
      Module.$equalizingConfigurations = false;
      expect(Module.equalizeConfigurations(product, configurations, targetPrintType)).to.be.undefined;
    });
  });

  describe('equalize configs on product', () => {
    let sandbox;
    let config1;
    let config2;
    let product;
    let excludedConfiguration;

    const PT14 = Mocks.createModel({ id: '14' });
    const PT17 = Mocks.createModel({ id: '17' });
    const APP2 = Mocks.createModel({ id: '2' });
    const PT812 = Mocks.createModel({ printAreas: { $items: [] } });

    beforeEach(() => {
      sandbox = sinon.createSandbox();

      config1 = Mocks.createModel({ printType: PT17 });
      config2 = Mocks.createModel({ printType: PT17 });
      config1.getPossiblePrintTypesForPrintArea = sandbox.stub();
      config2.getPossiblePrintTypesForPrintArea = sandbox.stub();
      config1.isPrintTypeAvailable = sandbox.stub();
      config2.isPrintTypeAvailable = sandbox.stub();

      product = Mocks.createModel({ productType: PT812, appearance: APP2 });
      product.getConfigurationsOnPrintAreas = sandbox.stub().returns([config1, config2]);

      MockProductUtil.isSpecial = sandbox.stub();
      MockProductUtil.isRealisticFlex = sandbox.stub();
      MockProductUtil.getPossiblePrintTypesForPrintAreas = sandbox.stub();
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('add configuration handler', () => {

      it('happy path', () => {
        config1.getPossiblePrintTypesForPrintArea.returns([PT14, PT17]);
        config2.getPossiblePrintTypesForPrintArea.returns([PT14, PT17]);
        config1.isPrintTypeAvailable.returns(true);
        config2.isPrintTypeAvailable.returns(true);
        
        MockProductUtil.isSpecial.returns(false);
        MockProductUtil.isRealisticFlex.returns(false);
        MockProductUtil.getPossiblePrintTypesForPrintAreas.returns([PT14, PT17]);

        Module.equalizeConfigurationsOnProduct(product, PT14, excludedConfiguration);
        expect(config1.$.printType).to.deep.equal(PT14);
        expect(config2.$.printType).to.deep.equal(PT14);
      });

      it('print type not possible for one configuration', () => {
        config1.getPossiblePrintTypesForPrintArea.returns([PT17]);
        config2.getPossiblePrintTypesForPrintArea.returns([PT14, PT17]);
        config1.isPrintTypeAvailable.returns(true);
        config2.isPrintTypeAvailable.returns(true);
        
        MockProductUtil.isSpecial.returns(false);
        MockProductUtil.isRealisticFlex.returns(false);
        MockProductUtil.getPossiblePrintTypesForPrintAreas.returns([PT14, PT17]);

        Module.equalizeConfigurationsOnProduct(product, PT14, excludedConfiguration);
        expect(config1.$.printType).to.deep.equal(PT17);
        expect(config2.$.printType).to.deep.equal(PT17);
      });
    })
  })
});