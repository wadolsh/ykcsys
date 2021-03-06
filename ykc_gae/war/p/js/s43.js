

function objView(myObj) {
	var str = "";
	for (myKey in myObj){
		str += "■myObj["+myKey +"] = "+ myObj[myKey] + "\n";
	}
	alert(str);
}

function titleToggle(that) {
	//kendo.fx($(this).next()).slideIn("up").play();
	$(that).parent().next().toggle('slow');
}

$.ajaxSetup({
	url: s43_doc_url,
	contentType: "application/json",
	//processData: false
});

var side_list_array = {};
//var s43_all = null;

var _S43Model = Backbone.Model.extend({
	idAttribute : _id_key,
	url: function() {
		if (this.id) {
			return s43_doc_url_base + "/" + this.id + "?apiKey=" + apiKey;
		}
	    return s43_doc_url;
	},
	parse : function(response) {
		if (response == null) {
			return response;
		}
		response['住所'] = response['都県名'] + response['区市名'] + response['町名'] + response['丁目']
						+ (response['番地'] ? "-" + response['番地'] : "") +  (response['号'] ? "-" + response['号'] : "");
						
						
		response['title'] = '<a href="http://maps.google.com/maps?q=' + response['住所'] + '">' + response['住所'] + '</a>'
                                + '&nbsp;&nbsp; ' + '<a href="javascript:void(0);" onclick="latlngTool.open(' + response[_id_key] + ')">位置マップ</a>';
		
		response['no'] = response[_id_key] + '-' + //response['区域名'] + 
								response['区域番号'] + response['カード番号'] + response['枝番号'];

		return response;
	},
	
	initialize : function() {
	}
});

var _S4Collection = Backbone.Collection.extend({
	url : s43_doc_url,
    model: _S43Model,

    parse: function(response) {
        return response;
    },
});

var _S43VisitHistoryModel = Backbone.Model.extend({
    idAttribute : _id_key,
    
    initialize: function() {
        this.on('add change', function() {
            var strDate = kendo.toString(this.get('訪問日'), "MM/dd");
            this.set('訪問日', strDate, {silent: true});
            
            strDate = kendo.toString(this.get('時間'), "hh:mm");
            this.set('時間', strDate, {silent: true});
        });
    },
    
	url: function() {
		if (this.id) {
			return s43_visit_history_doc_url_base + "/" + this.id + "?apiKey=" + apiKey;
		}
	    return s43_visit_history_doc_url;
	},
	parse : function(response) {
		if (response == null) {
			return response;
		}
        
        response['title'] = response['出会い有無'] + '&nbsp;&nbsp;' + response['訪問日'] + '&nbsp;' + response['時間'] + '&nbsp;' + response['訪問者'];
		
		response['no'] = '';//response['_id'];
        
		return response;
	}
});

var _S43VisitHistoryCollection = Backbone.Collection.extend({
    _s43_id: null,
	url : s43_visit_history_doc_url,
    model: function(attrs, options) {
        if (!attrs._s43_id) {
            attrs._s43_id = options.collection._s43_id;
        }
        return new _S43VisitHistoryModel(attrs, options);
    },
    parse: function(response) {
        return response;
    },
});










var _S43TabView = Backbone.View.extend({
	el : $('#s43_tab'),
	filterd_collection : new _S4Collection(),
	
	events : {
		"click #s43_side_list li a" : "s43CardListReset",
		"click #s43_sync_button" : "s43Sync",
		"click #s43_view_button" : "s43viewModeToggle",
		"click #s43_edit_button" : "s43EditModeToggle",
		"click #s43_map_button" : "s43MapModeToggle",
		"click #s43_print_button" : "s4PrintModeToggle",
	},
	
	initialize : function() {
		
		if (!window.localStorage){
			alert("使用不可ブラウザです。");
		}
		
		this.s43MetaSync();
		
		new _S43ViewModeView({model : this.filterd_collection});
		new _S43EditModeView({model : this.filterd_collection});
		this.mapModeView = new _S43MainMapView({model : this.filterd_collection});
        	
		this.collection = new _S4Collection();
		this.collection.on('reset', this.render, this);
		
		this.collection.reset(JSON.parse(localStorage.getItem('s43_all')));
		this.render();
	},
	
	render : function() {

		$('#view_mode, #map_mode').toggle(false);
		
		//s43TabReset();
		side_list_array = {};
		$('#s43_get_date').html(localStorage.getItem('s43_get_date'));
		var s43_all = this.collection.toJSON();
		
		var temp_array = null;
		
		var key1, key2, key3, key23 = null;

		this.collection.each(function(model) {

			key1 = model.get('区域名');
			key2 = model.get('区域番号');
			key3 = (model.get('カード番号') || "" );
			key23 = key2 + key3;
			
			temp_array = side_list_array[key2];
			
			if (!temp_array) {
				side_list_array[key2] = {};
				temp_array = side_list_array[key2];
			}
			if (!temp_array[key2]) {
				temp_array[key2] = {name : key1 + key2, code1 : key2, code2 : ""};
			}
			if (!temp_array[key23]) {
				temp_array[key23] = {name : key1 + key2 + key3, code1 : key2, code2 : key3};
			}
			temp_array[key2]['count'] = (temp_array[key2]['count'] || 0) + 1;
			temp_array[key23]['count'] = (temp_array[key23]['count'] || 0) + 1;

		});
		
		localStorage.setItem('s43_all', JSON.stringify(s43_all));
		localStorage.setItem('side_list_array', JSON.stringify(side_list_array));
		
		var html = _.template($('#tpl_s43_side_list').html(), {
				'data' : side_list_array
		});
		
		$('#s43_side_tota_count').html(s43_all ? s43_all.length : 0);
		
		var $s43_side_list = $('#s43_side_list');
		$s43_side_list.find('li.list').remove();
		$s43_side_list.append(html);

		return this;
	},
	
	s43Sync : function() {
		
		this.collection.fetch({
			//async : false,
			//url : '',
			
			success : function(collection, response) {
				if (window.localStorage){

					if (response['redirect']) {
						$('<iframe />').attr('src', s43_doc_url).appendTo('body').load(function(){
							//localStorage.setItem('s43_all', $(this).contents().find('body'));
						});
						return;
					} else {
						//localStorage.setItem('s43_all', JSON.stringify(response));
					}
					alert("データ格納成功");
					
					var nowDate = new Date();
					var nowDateString = nowDate.getFullYear() + "-" +
												(nowDate.getMonth() + 1) + "-" +
												nowDate.getDate() + " " +
												nowDate.getHours() + ":" +
												nowDate.getMinutes() + ":" +
												nowDate.getSeconds();
					
					localStorage.setItem('s43_get_date', nowDateString);
					
				} else {
					alert("使用不可ブラウザです。");
					localStorage.setItem('s43_get_date', "");
				}
			}
		});
	},
	/** kendo용 메타데이터 취득 */
	s43MetaSync : function() {
		$.getJSON(kendo_meta_data_doc_url, function(data, textStatus, jqXHR) {
			for (var ind  in data) {
				var metaData = data[ind];
				localStorage.setItem(metaData[_id_key], JSON.stringify(metaData));
			}
		});
	},
	
	s43CardListReset : function(event, cardName, cardNum) {
		var $this = $(event.target);
		var filterd_data = null;
		var cardName = $this.data('cardname');
		var cardNum = $this.data('cardnum');

		
		if (cardName) {
			filterd_data = s43TabView.collection.filter(function(model) {
				if (model.get('区域番号') != cardName) {
					return false;
				}
				if (cardNum) {
					if (model.get('カード番号') != cardNum) {
						return false;
					}
				}
				
                /*
				if (model.get('geocode_lat') && model.get('geocode_lng')) {
					model.set('latlng', new google.maps.LatLng(model.get('geocode_lat'), model.get('geocode_lng')));
				}
                */
				
				return true;
			});
		} else {
			filterd_data = s43TabView.collection.toArray();
		}

		
		var name = cardName ? "" : "全件";
		//cardName = cardName || "全件";
		cardNum = cardNum || "";
		$('#s43_data_title').html((name || side_list_array[cardName][cardName + cardNum]['name']) + " - " + filterd_data.length + "件");

		this.filterd_collection.reset(filterd_data);
	},
	
	s43viewModeToggle : function(event) {
		var currentSide = $("#mode_container .current");
        var thisSide = $("#view_mode");
        
        if (currentSide[0] == thisSide[0]) {
        	return;
        }
        
		currentSide.removeClass("current");
		thisSide.addClass("current");
         
		//$('#edit_mode, #map_mode').removeClass("current");
		//$('#view_mode').addCalss("current");
		kendo.fx("#mode_container").flipHorizontal(currentSide, thisSide).play();
	},
	
	s43EditModeToggle : function(event) {
		//$('#edit_mode').toggle();
		
		var currentSide = $("#mode_container .current");
        var thisSide = $("#edit_mode");
        
        if (currentSide[0] == thisSide[0]) {
        	return;
        }
        
		currentSide.removeClass("current");
		thisSide.addClass("current");
		kendo.fx("#mode_container").flipHorizontal(currentSide, thisSide).play();
	},
	
	s43MapModeToggle : function(event) {
		//$('#map_mode').toggle();
        var view = this;
        
		$('#map_mode').kendoWindow({
			appendTo: "body",
            width: "430px",
            height: "500px",
            title: "マップツール",
            actions: ["Close", "Maximize"],
            activate : function(ev) {
                this.center();
                this.maximize();
                view.mapModeView.render();
            },
            close : function(ev) {
            	//this.destroy();
                this.restore();
            }

        }).data("kendoWindow").open();

	},
	
	s4PrintModeToggle : function() {
	}
});

var _S43ViewModeView = Backbone.View.extend({
	el : $('#view_mode'),
	
	initialize : function() {
        
        this.visitCollection = new _S43VisitHistoryCollection();
        //this.visitHistoryCollection = new _S43VisitHistoryCollection();

        var meta_s43_dataSource = JSON.parse(localStorage.getItem('meta_s43_visit_history_dataSource'));
		meta_s43_dataSource.data = this.visitCollection;
		this.visitHistoryDataSource = new kendo.data.DataSource(meta_s43_dataSource);
        
	    var kendoList = JSON.parse(localStorage.getItem('meta_s43_visit_history_kendoList'));
		kendoList.template = kendo.template($("#s43_kendo_grid_detail").html());
		kendoList.editTemplate = kendo.template($("#s43_kendo_grid_detail_edit").html());
		kendoList.dataSource = this.visitHistoryDataSource;

        //$('#visit_history_list').replaceWith('<div id="visit_history_list"></div>');
        var $listView = $('#visit_history_list').kendoListView(kendoList).data("kendoListView");
    	this.$el.find(".k-add-button").click(function(e) {
			$listView.add();
            e.preventDefault();
        });
        
		this.model.on('reset', this.render, this);
		this.render();
	},
	
	render : function() {
		var view = this;
        var ids = new Array();
        this.model.each(function(model){
            ids.push(model.id)
        });
        
        this.visitCollection.fetch({
            data: {q : '{_s43_id: {$in: [' +  ids.toString() + ']} }',
                   s : '{訪問日: -1}'},
            success : function(collection, response, options) {
                var html1 = _.template($('#tpl_s43_card_list').html(), {
                    'data' : view.model.toJSON(),
                    'subData' : collection.toJSON()
        		});
        
        		var $s43_card_list = $('#s43_card_list');
        		$s43_card_list.find('tbody').remove();
        		$s43_card_list.append(html1);
 
        		view.$el.find('tbody tr:first-child td:first-child').click(function(e) {

                    var id = $(this).data('id');
                	var model = view.model.get(id);
                    
                    // 新規登録時にmodelに_s43_idを設定するための保管
                    view.visitCollection._s43_id = id;
                    
                    //var visitData = view.visitCollection.filter(function(v){ 
                    //    return v.get('_s43_id') == id; 
                    //});
                    //view.visitHistoryCollection.reset(visitData);
                    
                    view.visitHistoryDataSource.filter({
                        logic: "or",
                        filters: [
                            { field: "_s43_id", operator: "eq", value: id },
                            { field: "_id", operator: "eq", value: "" }
                        ]
                    });
                    view.visitHistoryDataSource.read();
                    
                    /*
                    view.$el.find(".k-add-button").click(function(e) {
                    	$listView.add();
                        e.preventDefault();
                    });
                    */
                    
        			$('#visit_history_window').kendoWindow({
        				appendTo: "body",
                        width: "430px",
                        height: "500px",
                        title: "訪問履歴入力",
                        actions: ["Close", "Maximize"],
                        activate : function(ev) {
                            this.center();
                            this.maximize();
                        },
                        close : function(ev) {
                        	//this.destroy();
                            this.restore();
                            view.render();
                        }

                    }).data("kendoWindow").open();
                    
                });
            }
        });
        
		return this;
	}
});


var _S43EditModeView = Backbone.View.extend({
	el : $('#edit_mode'),
	
	events : {
		"click td[data-docid]" : "toggleEditArea"
	},
	
	initialize : function() {
		var view = this;
		
		var meta_s43_dataSource = JSON.parse(localStorage.getItem('meta_s43_dataSource'));
		/*meta_s43_dataSource['transport'] = {
                read: function(options) {
                	options.success(view.model.toJSON());
                },
                update: function(options) {
                	for (var ind in options.data.models) {
                		var model = options.data.models[ind];
                    	$.ajax({
                    		url : s43_doc_url_base + "/" + model[_id_key] + "?apiKey=" + apiKey,
                    		type: 'PUT',
                            dataType: "json",
                            data: JSON.stringify(model),
                            success: function(result) {
                                // notify the DataSource that the operation is complete
                                options.success(result);
                            },
                            error: options.error
                        });
                	}

                },
                destroy: {
                	url: s43_doc_url,
                    type: 'DELETE',
                    dataType: "json"
                },
                create: {
                	url: s43_doc_url,
                    type: 'POST',
                    dataType: "json"
                },
                parameterMap: function(options, operation) {
                    if (operation !== "read" && options.models) {
                        return kendo.stringify(options.models);
                    }
                }
            };		
		*/
		
		meta_s43_dataSource.data = this.model;
		this.dataSource = new kendo.data.DataSource(meta_s43_dataSource);
		
		
		this.meta_s43_kendoGrid = JSON.parse(localStorage.getItem('meta_s43_kendoGrid'));
		this.meta_s43_kendoGrid['template'] = kendo.template($("#s43_kendo_grid_detail").html());
		this.meta_s43_kendoGrid['editTemplate'] = kendo.template($("#s43_kendo_grid_detail_edit").html());
		this.meta_s43_kendoGrid['dataSource'] = this.dataSource;
		this.meta_s43_kendoGrid['dataBound'] = function(e) {
			/*
			$("#edit_mode_grid .list-title").click(function(e) {
				//kendo.fx($(this).next()).slideIn("up").play();
				$(this).next().toggle('slow');
		    });
		    */
		    
			/*
			$("#edit_mode_grid").kendoPanelBar({
	            expandMode: "single"
	        });
	        */
	    };
		
		//this.meta_s43_kendoGrid['detailTemplate'] = kendo.template($("#s43_kendo_grid_detail").html());
		/*
		this.meta_s43_kendoGrid['detailInit'] = function(e) {
            var detailRow = e.detailRow;

            detailRow.find(".tabstrip").kendoTabStrip({
                animation: {
                    open: { effects: "fadeIn" }
                }
            });
            detailRow.find(".vistHistory").kendoGrid({
                dataSource: {
                    type: "odata",
                    transport: {
                        read: "http://demos.kendoui.com/service/Northwind.svc/Orders"
                    },
                    serverPaging: true,
                    serverSorting: true,
                    serverFiltering: true,
                    pageSize:6,
                    filter: { field: "EmployeeID", operator: "eq", value: e.data.EmployeeID }
                },
                scrollable: false,
                sortable: true,
                pageable: true,
                columns: [
                    { field: "OrderID", width: 70 },
                    { field: "ShipCountry", title:"Ship Country", width: 100 },
                    { field: "ShipAddress", title:"Ship Address" },
                    { field: "ShipName", title: "Ship Name", width: 200 }
                ]
            });
        };
        if (!this.meta_s43_kendoGrid['change']) {
        	this.meta_s43_kendoGrid['change'] = function() {
            	// row選択時
                var selectedRows = this.select();
                var selectedDataItems = [];
                for (var i = 0; i < selectedRows.length; i++) {
                    var dataItem = this.dataItem(selectedRows[i]);
                    selectedDataItems.push(dataItem);
                }
                // selectedDataItems now contains all selected data records
             };
        }
        */
        
	    //$('#edit_mode_grid').kendoGrid(this.meta_s43_kendoGrid);
		var $listView = $('#edit_mode_grid').kendoListView(this.meta_s43_kendoGrid).data("kendoListView");
		this.$el.find(".k-add-button").click(function(e) {
			$listView.add();
            e.preventDefault();
        });
		

		this.model.on('reset', this.render, this);
		//this.render();
	},
	
	render : function() {
		// データ投入
		this.dataSource.read();
		
		/*
		var html1 = _.template($('#tpl_s43_card_list').html(), {
				'data' : this.model.toJSON()
		});
	
		var $s43_card_list = $('#s43_card_list');
		$s43_card_list.find('tbody').remove();
		$s43_card_list.append(html1);
		*/
		return this;
	},
	
	toggleEditArea : function(event) {
		var docid = $(event.target).data('docid');
		var $edit_area = $('#edit_area' + docid);
		
		var $tr = $edit_area.parent().parent();
		
		if($tr.css('display') != 'none') {
			$tr.hide();
			return;
		} else {
			$tr.show();
		}
	}
});

var _S43MainMapView = Backbone.View.extend({
	el : $('#map_mode'),
	
	events : {
		"click .map_address_search_button" : "addressSearch",
		"click .current_position_button" : "currentPosition"
	},
	
	initialize : function() {
		var mapDivId = 'map_canvas';
		this.map = MapUtil.newMap(mapDivId);
		MapUtil.getCurrentPosition(this.map);
		MapUtil.detectBrowser(mapDivId);
		this.model.on('reset', this.render, this);
		
		//this.render();
	},
	
	render : function() {
		MapUtil.clearAllMarker(this.map);
		
		var view = this;
		
		this.model.each(function(target_model){
			if (target_model.get('geocode_lat') && target_model.get('geocode_lng')) {
				MapUtil.s43RoofMarkerMapByPos(view.map,
											  target_model.get(_id_key),
											  //target_model.get('latlng'),
                                              new google.maps.LatLng(target_model.get('geocode_lat'), target_model.get('geocode_lng')),
											  target_model.get('枝番号'),
											  (target_model.get('住所') + '<br/>' + target_model.get('住所詳細')));
			}
		});
		
		// 最初目をマップの中央に表示
        MapUtil.markerMoveToCenter(this.map);
        google.maps.event.trigger(this.map, 'resize');
        return this;
	},

	addressSearch : function() {
		
		var address = this.$el.find('.map_address_input').val();
		if (!address) {
			return;
		}
		
		var view = this;
		if (view.searchdMarker) {
			view.searchdMarker.setMap(null);
		}
		
		MapUtil.markerMapByAddress(this.map, address, function(marker, results) {
			view.searchdMarker = marker;
		});
	},
	
	currentPosition : function(event) {
		MapUtil.getCurrentPosition(this.map);
	}
});



var _S43latlngMapView = Backbone.View.extend({
    el : $('#latLng_tool'),
	
	events : {
        "click .latlngAdd" : "latlngAdd",
		"click .map_address_search_button" : "addressSearch",
		"click .current_position_button" : "currentPosition"
	},
	
	initialize : function() {
		var mapDivId = 'latLng_canvas';
        this.map = MapUtil.newMap(mapDivId);
		MapUtil.getCurrentPosition(this.map);
		MapUtil.detectBrowser(mapDivId);
		this.model.on('reset', this.render, this);
		
		//this.render();
	},
    
	render : function() {
        MapUtil.clearAllMarker(this.map);
        
		var view = this;

        this.geocoding();
        return this;
	},
	
    
    geocoding : function() {
        var view = this;
        
	    // 転送住所取得成功時に実行されるハンドラ
	    if (this.model.get('geocode_lat') && this.model.get('geocode_lng')) {
            $('#latLng_tool_geocode_lat').val(this.model.get('geocode_lat'));
			$('#latLng_tool_geocode_lng').val(this.model.get('geocode_lng'));
            $('#latLng_tool_geocode_address').val(this.model.get('住所'));
            
	    	MapUtil.s43DragAbleMarkerMapByPos(this.map,
                                              new google.maps.LatLng(this.model.get('geocode_lat'), this.model.get('geocode_lng')), 
                                              this.markerDropStop);

            // 最初目をマップの中央に表示
            MapUtil.markerMoveToCenter(this.map);
            google.maps.event.trigger(this.map, 'resize');
            
	    	return;
	    } else {
		    MapUtil.s43MarkerMapByAddress(this.map, this.model.get('住所'), function(results) {
				$('#latLng_tool_geocode_lat').val(results[0].geometry.location.lat());
				$('#latLng_tool_geocode_lng').val(results[0].geometry.location.lng());
				//$('#latLng_tool_geocode_span_lat').text(results[0].geometry.location.lat());
				//$('#latLng_tool_geocode_span_lng').text(results[0].geometry.location.lng());
                $('#latLng_tool_geocode_address').val(results[0].formatted_address);
                
                // 最初目をマップの中央に表示
                MapUtil.markerMoveToCenter(view.map);
                google.maps.event.trigger(view.map, 'resize');
        
		    }, this.markerDropStop);
	    }
	},
	
    /** 住所から位置情報を取得 */
    markerDropStop : function(pos, result) {
    	$('#latLng_tool_geocode_lat').val(pos.lat());
		$('#latLng_tool_geocode_lng').val(pos.lng());
		//$('#latLng_tool_geocode_span_lat').text(pos.lat());
		//$('#latLng_tool_geocode_span_lng').text(pos.lng());
		$('#latLng_tool_geocode_address').val(result[0].formatted_address);
	},
    
    /** 位置情報をさーばーに転送 */
    latlngAdd : function() {
        var view = this;
		this.model.set('geocode_lat', $('#latLng_tool_geocode_lat').val());
		this.model.set('geocode_lng', $('#latLng_tool_geocode_lng').val());
		
        this.$el.find('.latlngAdd').removeClass('btn-error').addClass('btn-info');
        
		this.model.save({},{
            success: function(model, response, options) {
                view.$el.find('.latlngAdd').removeClass('btn-info');
	        },
	        error: function(model, xhr, options) {
                view.$el.find('.latlngAdd').removeClass('btn-info').addClass('btn-error');
	        }});
	},
    
	addressSearch : function() {
		
		var address = this.$el.find('.map_address_input').val();
		if (!address) {
			return;
		}
		
		var view = this;
		if (view.searchdMarker) {
			view.searchdMarker.setMap(null);
		}
		
		MapUtil.markerMapByAddress(this.map, address, function(marker, results) {
			view.searchdMarker = marker;
		});
	},
	
	currentPosition : function(event) {
		MapUtil.getCurrentPosition(this.map);
	},
    
    open: function(id) {
        var view = this;
        // idを全体データーから取得
        this.model = s43TabView.collection.get(id);
        this.$el.kendoWindow({
			appendTo: "body",
            width: "430px",
            height: "500px",
            title: "住所座標ツール",
            actions: ["Close", "Maximize"],
            activate : function(ev) {
                this.center();
                this.maximize();
                view.render();
            },
            close : function(ev) {
            	//this.destroy();
                this.restore();
            }

        }).data("kendoWindow").open();
    }
});

var latlngTool = new _S43latlngMapView({model: new _S4Collection()});
