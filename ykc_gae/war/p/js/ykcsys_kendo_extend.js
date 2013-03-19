(function($, undefined) {
	
    $.extend(true, kendo.data, {
    	transports: {
            /** ykcsys basic */
            "ykcsys_transport" : kendo.Class.extend({
                init: function(options) {
                	// backbone collection
                	this.data = options.data;
                },
                read: function(options) {
                	options.success(this.data.toJSON());
                },
                update: function(options) {
                	//for (var ind in options.data.models) {
                		var model = options.data;
                		var that = this;
                    	$.ajax({
                    		url : that.collections_url + "/" + model[_id_key] + "?apiKey=" + apiKey,
                    		type: 'PUT',
                            dataType: "json",
                            data: JSON.stringify(model),
                            success: function(result) {
                                // notify the DataSource that the operation is complete
                                options.success(result);
                            },
                            error: options.error
                        });
                	//}
                },
                destroy: {
                	url: function(params) {
            			return this.collections_url + "?apiKey=" + apiKey;
            		},
                    //type: 'DELETE',
                    dataType: "json"
                },
                create: {
                	url: function(params) {
            			return this.collections_url + "?apiKey=" + apiKey;
            		},
                    //type: 'POST',
                    dataType: "json"
                },
                parameterMap: function(options, operation) {
                    if (operation !== "read" && options.models) {
                        return kendo.stringify(options.models);
                    }
                }
            })
        }
    });
})(window.kendo.jQuery);

