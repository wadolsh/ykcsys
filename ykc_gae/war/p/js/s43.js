

function objView(myObj) {
	var str = "";
	for (myKey in myObj){
		str += "■myObj["+myKey +"] = "+ myObj[myKey] + "\n";
	}
	alert(str);
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
		
		response['管理番号'] = response['_id'] + '-' + //response['区域名'] + 
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
		new _S43MainMapView({model : this.filterd_collection});
				
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
				
				if (model.get('geocode_lat') && model.get('geocode_lng')) {
					model.set('latlng', new google.maps.LatLng(model.get('geocode_lat'), model.get('geocode_lng')));
				}
				
				return true;
			});
		} else {
			filterd_data = s43TabView.collection;
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
		
		var currentSide = $("#mode_container .current");
		var thisSide = $("#map_mode");
		
        if (currentSide[0] == thisSide[0]) {
        	return;
        }
		
		currentSide.removeClass("current");
		thisSide.addClass("current");
		kendo.fx("#mode_container").flipHorizontal(currentSide, thisSide).play();
	},
	
	s4PrintModeToggle : function() {
	}
});

var _S43ViewModeView = Backbone.View.extend({
	el : $('#view_mode'),
	
	initialize : function() {
		this.model.on('reset', this.render, this);
		this.render();
	},
	
	render : function() {
		var view = this;
		var html1 = _.template($('#tpl_s43_card_list').html(), {
				'data' : this.model.toJSON()
		});
	
		this.$el.kendoTooltip({
            filter: ".toolTip",
            content: function(event) {
            	var template = kendo.template($("#tpl_visit_history_input").html());
            	var $template = $(template(view.model.toJSON()));
            	$template.find('#meetType').kendoDropDownList();
            	$template.find("#datepicker").kendoDatePicker();
            	$template.find("#timepicker").kendoTimePicker();
            	return $template;
            },
            showOn: "click",
            autoHide: false,
            width: 400,
            height: 200,
            position: "top"
        });

		
		var $s43_card_list = $('#s43_card_list');
		$s43_card_list.find('tbody').remove();
		$s43_card_list.append(html1);
		
		return this;
	}
});


var _S43EditModeView = Backbone.View.extend({
	el : $('#edit_mode'),
	
	events : {
		"click td[data-docid]" : "toggleEditArea",
		"click a.geocoding" : "geocoding",
		"click a.markerAdd" : "markerAdd"
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
		var listView = $('#edit_mode_grid').kendoListView(this.meta_s43_kendoGrid).data("kendoListView");
		$(".k-add-button").click(function(e) {
            listView.add();
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
	
	geocoding : function(event) {
		
		var docid = $(event.target).data('docid');
		var $geocode_map = $('#geocode_map' + docid);
		var $tr = $geocode_map.parent().parent();
		
		if($tr.css('display') != 'none') {
			$tr.hide();
			return;
		} else {
			$tr.show();
		}
		
		$geocode_map.parent().height(300);
		
	    var map = MapUtil.newMap("geocode_map" + docid);
	    
	    var markerDropStop = function(pos, result) {
	    	$('#geocode_lat' + docid).val(pos.lat());
			$('#geocode_lng' + docid).val(pos.lng());
			$('#geocode_span_lat' + docid).text(pos.lat());
			$('#geocode_span_lng' + docid).text(pos.lng());
			
	    	alert(result[0].formatted_address);
		};
		var model = s43TabView.collection.get(docid);
	    if (model.get('geocode_lat') && model.get('geocode_lng')) {
	    	MapUtil.s43DragAbleMarkerMapByPos(map, new google.maps.LatLng(model.get('geocode_lat'), model.get('geocode_lng')), markerDropStop);
	    	return;
	    } else {
		    MapUtil.s43MarkerMapByAddress(map, model.get('住所'), function(results) {
				$('#geocode_lat' + docid).val(results[0].geometry.location.lat());
				$('#geocode_lng' + docid).val(results[0].geometry.location.lng());
				$('#geocode_span_lat' + docid).text(results[0].geometry.location.lat());
				$('#geocode_span_lng' + docid).text(results[0].geometry.location.lng());
		    }, markerDropStop);
	    }
	    google.maps.event.trigger(map, 'resize');

	},
	
	markerAdd : function() {
		var docid = $(event.target).data('docid');
		var model = s43TabView.collection.get(docid);

		model.set('geocode_lat', $('#geocode_lat' + docid).val());
		model.set('geocode_lng', $('#geocode_lng' + docid).val());
		
		//model.save({});
		
		$.post(s43_doc_url + '?_method=put', {_id_key : model.get(_id_key), 'geocode_lat' : model.get('geocode_lat'), 'geocode_lng' : model.get('geocode_lng')}, function () {
			
		}, "json");
		
		alert("saved");
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
		"click #map_address_search_button" : "addressSearch",
		"click #current_position_button" : "currentPosition"
	},
	
	initialize : function() {
		var mapDivId = 'map_canvas';
		
		this.markerArray = new Array();
		this.map = MapUtil.newMap(mapDivId);
		MapUtil.getCurrentPosition(this.map);
		MapUtil.detectBrowser(mapDivId);
		this.model.on('reset', this.render, this);
		
		this.render();
	},
	
	render : function() {
		for (var ind in this.markerArray) {
			// 既存マップをマーカーをクリア
			this.markerArray[ind].setMap(null);
		}
		
		var view = this;
		
		this.markerArray.length = 0;
		
		this.model.each(function(model1){
			if (model1.get('latlng')) {
				MapUtil.s43RoofMarkerMapByPos(view.map, 
											  view.markerArray,
											  model1.get(_id_key),
											  model1.get('latlng'),
											  model1.get('枝番号'),
											  (model1.get('住所') + '<br/>' + model1.get('住所詳細')));
			}
		});
		
		// 最初目をマップの中央に表示
		if (this.markerArray.length > 0) {
			this.map.setCenter(this.markerArray[0].getPosition());
			this.map.setZoom(13);
		}
	},
	
	addressSearch : function() {
		
		var address = $('#map_address_input').val();
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



