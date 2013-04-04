define(["js/core/Bindable"], function(Bindable){

    return Bindable.inherit('sprd.manager.IBasketManager',{
        addElementToBasket: function(element, quantity, callback){
            callback && callback();
        }


    });


});