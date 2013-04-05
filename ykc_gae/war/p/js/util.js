
var _MapUtil = function() {
};

_MapUtil.prototype = {
	cpos : null,
	hl :'ja',
	geocoder : new google.maps.Geocoder(),
	
	mapOptions : {
        	center: (new google.maps.LatLng(-34.397, 150.644)),
        	zoom: 17,
        	mapTypeId: google.maps.MapTypeId.ROADMAP
    },
    
	newMap : function(id, option) {
		option = option || this.mapOptions;
		return new google.maps.Map(document.getElementById(id), option);
	},
	
	mapAppLink : function(loc, content) {
		//return '<a href="http://maps.google.com/maps?q=' + content + "@" + loc + '" target="_blank">[google]</a>';
		return '<a href="http://maps.google.com/maps?q=' + loc + '&hl=' + this.hl + '" target="_blank">[google]</a>';
	},
	
	s43DragAbleMarkerMapByPos : function(map, pos, fun2) {
		map.setCenter(pos);
		var marker = new google.maps.Marker({
			map: map,
			draggable:true,
			animation: google.maps.Animation.DROP,
			title: 'Draggable marker',
			position: pos
		});
		
		google.maps.event.addListener(marker, 'dragend', function() {  
			MapUtil.getAddressByPos(marker.getPosition(), fun2);
		}); 
	},
	
	s43RoofMarkerMapByPos : function(map, markerArray, _docId, pos, cid, content) {
		var idx = markerArray.length;
		markerArray[idx] = new google.maps.Marker({
			map: map,
			animation: google.maps.Animation.DROP,
			position: pos,
			icon: './img/map_icon/lwt_map_icons/blue/' + Number(cid) + '.png'
		});
		
		var infowindow = new google.maps.InfoWindow({
			content : content
		});
		
    	google.maps.event.addListener(markerArray[idx], 'click', function() {
    		if (infowindow.isOpen) {
    			infowindow.close();
    			infowindow.isOpen = false;
    		} else {
				infowindow.setContent(content + " " + MapUtil.mapAppLink(pos, _docId));
				infowindow.open(map, markerArray[idx]);
				infowindow.isOpen = true;
    		}
    	});
	},
	
	s43MarkerMapByAddress : function(map, address, fun, fun2) {
	   
		this.geocoder.geocode( { 'address': address}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				map.setCenter(results[0].geometry.location);
				var marker = new google.maps.Marker({
					map: map,
					draggable:true,
					animation: google.maps.Animation.DROP,
					title: 'Draggable marker',
					position: results[0].geometry.location,
					icon: './img/map_icon/lwt_map_icons/green/T.png'
				});
				
				//marker.getIcon().scaledSize = 1;
				
				google.maps.event.addListener(marker, 'dragend', function() {  
					MapUtil.getAddressByPos(marker.getPosition(), fun2);
				}); 
				
				if (fun) {
					fun(results);
					google.maps.event.trigger(marker, "resize");
				}
				
			} else {
				alert("Geocode was not successful for the following reason: " + status);
			}
		});
	},
	
	markerMapByAddress : function(map, address, fun) {
		   
		this.geocoder.geocode( { 'address': address}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				map.setCenter(results[0].geometry.location);
				var marker = new google.maps.Marker({
					map: map,
					animation: google.maps.Animation.DROP,
					position: results[0].geometry.location,
					icon: './img/map_icon/lwt_map_icons/green/S.png'
				});

				if (fun) {
					fun(marker, results);
				}
				
			} else {
				alert("Geocode was not successful for the following reason: " + status);
			}
		});
	},
	
	getAddressByPos : function(pos, fun) {  
		this.geocoder.geocode({ latLng: pos }, function(responses) {  
			if (responses && responses.length > 0) {  
				fun(pos, responses);
			} else {
				fun(pos, null);
				alert('住所確認不可');  
			}
		});  
    },
	
	getCurrentPosition : function(map, fun) {
	    if(navigator.geolocation) {
	    	navigator.geolocation.getCurrentPosition(function(position) {
	    		
	    		if (MapUtil.cpos_marker) {
	    			// 既存マーカーを消す
	    			MapUtil.cpos_marker.setMap(null);
	    		}
	    		
	    		MapUtil.cpos = new google.maps.LatLng(position.coords.latitude,
	                                           position.coords.longitude);
	        	map.setCenter(MapUtil.cpos);
	        	
	        	MapUtil.cpos_marker = new google.maps.Marker({
					map: map,
					animation: google.maps.Animation.DROP,
					title: '現在位置',
					position: MapUtil.cpos,
					draggable:true,
					icon: './img/map_icon/lwt_map_icons/green/I.png'
				});
				
				var infowindow = new google.maps.InfoWindow({
				});
				
	        	google.maps.event.addListener(MapUtil.cpos_marker, 'click', function() {
	        		if (infowindow.isOpen) {
	        			infowindow.close();
	        			infowindow.isOpen = false;
	        		} else {
						MapUtil.getAddressByPos(MapUtil.cpos_marker.getPosition(), function(pos, result) {
							infowindow.setContent(result[0].formatted_address);
							infowindow.open(map, MapUtil.cpos_marker);
							infowindow.isOpen = true;
						});
	        		}
	        	});
	        	
				google.maps.event.addListener(MapUtil.cpos_marker, 'dragend', function() {
					MapUtil.getAddressByPos(MapUtil.cpos_marker.getPosition(), function(pos, result) {
						infowindow.setContent(result[0].formatted_address);
					});
				});
	        	
	        }, function() {
	        	// 
	        	//alert('a');
	      	});
	   	} else {
	        // Browser doesn't support Geolocation
	   		//alert('b');
	    }
	    
	    return null;
	},
	
	detectBrowser : function(divId) {
		var useragent = navigator.userAgent;
		var mapdiv = document.getElementById(divId);

        /*
		if (useragent.indexOf('iPhone') != -1 || useragent.indexOf('Android') != -1 ) {
			mapdiv.style.width = '100%';
		    mapdiv.style.height = '400px';
		} else {
			mapdiv.style.width = '100%';
			mapdiv.style.height = '400px'; 
		}
        */
	}
};
var MapUtil = new _MapUtil();






function s43csvInput() {
	
	var s43csv_string = $('#s43csv_input_textarea').val();
	var array = eval(s43csv_string);
	

	
	for (var ind in array) {
		$.post(s43_doc_url, JSON.stringify(array[ind]), function () {
			
		}, "json");
	}
	

	/*
	$.ajax({
	    url: s43_doc_url,
	    data: {_doc : $('#s43csv_input_textarea').val() },
	    type: 'POST',
	    crossDomain: true,
	    dataType: 'jsonp',
	    success: function() { alert("Success"); },
	    error: function() { alert('Failed!'); }
	    //,beforeSend: setHeader
	});
	*/
}






function getCookie(c_name) {
	if (document.cookie.length>0) {
		c_start=document.cookie.indexOf(c_name + "=");
		if (c_start!=-1) { 
			c_start=c_start + c_name.length+1;
			c_end=document.cookie.indexOf(";",c_start);
			
			if (c_end==-1) c_end=document.cookie.length;
			return unescape(document.cookie.substring(c_start,c_end));
		} 
	}
	return "";
}

function setCookie () {
	var name = "ACSID";
	var value = getCookie(name);
	var expires = null;
	var secure = null;
	var domain = ".appspot.com";
	var path = "/";
	
	document.cookie = name + "=" + escape (value) + 
    	((expires) ? "; expires=" + expires.toGMTString() : "") + 
    	((path) ? "; path=" + path : "") + 
    	((domain) ? "; domain=" + domain : "") + 
    	((secure) ? "; secure" : ""); 
}