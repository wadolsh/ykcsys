/**
 * CHOI SUNGHO
 */
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
                	this.data.get(options.data[_id_key]).save(options.data, this.resultProcess(options));
                	/*
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
                	*/
                },
                destroy: function(options) {
                	this.data.get(options.data[_id_key]).destroy(this.resultProcess(options));
                },
                create: function(options) {
                	// uniqueの_id生成ロジックが必要（適当に時分秒にしてみた。）
                	options.data[_id_key] = Date.now().toString();
                	this.data.create(options.data, this.resultProcess(options));
                },
                parameterMap: function(options, operation) {
                    if (operation !== "read" && options.models) {
                        return kendo.stringify(options.models);
                    }
                },
                resultProcess : function(kendoOption) {
                	var process = {                	
	                	success: function(model, response, options) {
	                		kendoOption.success(response);
		                },
		                error: function(model, xhr, options) {
		                	kendoOption.error(response);
		                }
	                };
                	
                	return process;
                }
            })
        }
    });
})(window.kendo.jQuery);

