const Mocks = require('../utils/mocks');

describe('sprd.manager.PrintTypeEqualizer', () => {

  let Module;
  const MockProductUtil = {};

  before(() => {
    Mocks.createParent('js/core/Bindable');
    Mocks.createDependency('sprd/util/ProductUtil', MockProductUtil);
    Mocks.createDependency('sprd/entity/ConcreteElement');
    Mocks.createDependency('sprd/model/PrintType', {
      Mapping: {
        SpecialFlex: 'mock.printType.specialFlex',
        Flock: 'mock.printType.Flock',
      }
    });
  });

  after(() => {
    Mocks.undefDependency('sprd/model/PrintType');
    Mocks.undefDependency('sprd/entity/ConcreteElement');
    Mocks.undefDependency('sprd/util/ProductUtil');
    Mocks.undefDependency('js/core/Bindable');
  });

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
    let config;
    let product;
    let excludedConfiguration;

    const PRT1 = Mocks.createModel({ id: '1' }); // DT
    const PRT14 = Mocks.createModel({ id: '14' }); // DD
    const PRT17 = Mocks.createModel({ id: '17' }); // FLEX
    const APP2 = Mocks.createModel({ id: '2' });
    const PT812 = Mocks.createModel({ printAreas: { $items: [] } });

    beforeEach(() => {
      sandbox = sinon.createSandbox();

      config = Mocks.createModel({ printType: PRT17 });
      config.getPossiblePrintTypesForPrintArea = sandbox.stub();
      config.isPrintTypeAvailable = sandbox.stub();

      product = Mocks.createModel({ productType: PT812, appearance: APP2 });
      product.getConfigurationsOnPrintAreas = sandbox.stub().returns([config]);

      MockProductUtil.isSpecial = sandbox.stub();
      MockProductUtil.isRealisticFlex = sandbox.stub();
      MockProductUtil.getPossiblePrintTypesForPrintAreas = sandbox.stub();
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('with target print type', () => {

      it('target print type is possible', () => {
        config.getPossiblePrintTypesForPrintArea.returns([PRT14, PRT17]);
        config.isPrintTypeAvailable.returns(true);
        
        MockProductUtil.isSpecial.returns(false);
        MockProductUtil.isRealisticFlex.returns(false);
        MockProductUtil.getPossiblePrintTypesForPrintAreas.returns([PRT14, PRT17]);

        Module.equalizeConfigurationsOnProduct(product, PRT14, excludedConfiguration);
        expect(config.$.printType).to.deep.equal(PRT14);
        expect(config.$.originalEqPrintType).to.deep.equal(PRT17);
      });

      it('DEV-127060 target print type is _not_ possible', () => {
        config.getPossiblePrintTypesForPrintArea.returns([PRT17, PRT1]);
        config.set('printType', PRT1); // config 1 is now DT
        config.isPrintTypeAvailable.returns(true);
        
        MockProductUtil.isSpecial.returns(false);
        MockProductUtil.isRealisticFlex.returns(false);
        MockProductUtil.getPossiblePrintTypesForPrintAreas.returns([PRT17, PRT1]);

        Module.equalizeConfigurationsOnProduct(product, PRT14, excludedConfiguration);
        expect(config.$.printType).to.deep.equal(PRT1);
        expect(config.$.originalEqPrintType).to.be.undefined;
      });

      it('target print type is possible for one of 2 configs', () => {
        const config2 = Mocks.createModel({ printType: PRT17 });
        config2.getPossiblePrintTypesForPrintArea = sandbox.stub().returns([PRT17]);
        product.getConfigurationsOnPrintAreas = sandbox.stub().returns([config, config2]);
        config2.isPrintTypeAvailable = sandbox.stub().returns(true);

        config.getPossiblePrintTypesForPrintArea.returns([PRT17, PRT1]);
        config.isPrintTypeAvailable.returns(true);

        MockProductUtil.isSpecial.returns(false);
        MockProductUtil.isRealisticFlex.returns(false);
        MockProductUtil.getPossiblePrintTypesForPrintAreas.returns([PRT17, PRT1]);

        Module.equalizeConfigurationsOnProduct(product, PRT1, excludedConfiguration);
        expect(config.$.printType).to.deep.equal(PRT1);
        expect(config.$.originalEqPrintType).to.deep.equal(PRT17);
        expect(config2.$.printType).to.deep.equal(PRT17);
        expect(config2.$.originalEqPrintType).to.be.undefined;
      });
    })
  })
});