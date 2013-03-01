(function($, undefined) {
	

    $.extend(true, kendo.data, {
    	transports: {
            /** ykcsys basic */
            "ykcsys_transport" : kendo.Class.extend({
                init: function(options) {
                	alert("init");
                    this.data = options.data;
                },

                read: function(options) {
                	alert("read");
                    options.success(this.data);
                },
                update: function(options) {
                    options.success(options.data);
                },
                create: function(options) {
                    options.success(options.data);
                },
                destroy: function(options) {
                    options.success(options.data);
                }
            })
        }
    });
})(window.kendo.jQuery);

