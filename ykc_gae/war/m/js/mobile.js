var size = jindo.$Document(document).clientSize();
var oRevealSidebarUI;
var oPageLayoutUI = new jindo.m.PageLayoutUI({
    vBaseElement : jindo.$$.getSingle('.rs-body'),
    fnDomReady : function(oData) {
        oRevealSidebarUI = new jindo.m.RevealSidebarUI(oData.welRoot, {
        	nSildeThreshold : size.width - 200
        });
    }
});

var sideMenuOpenTouch = new jindo.m.Touch('mainFooter');
sideMenuOpenTouch.attach({
	hScroll : function(event) {
		if (event.nDistanceX > 100) {
			oRevealSidebarUI.toggleSlide();
		} else if (event.nDistanceX < -100) {
			oRevealSidebarUI.toggleSlide(true);
		}
	}
});

var mapDialog = new jindo.m.Dialog({ sPosition : "all" });
mapDialog.attach({
	show : function(event) {
		new _S43MainMapView({model : this.filterd_collection});
	}
});
var mapDialogTemplate = jindo.$Element("tpl_s43_map_dialog").html();
mapDialog.setTemplate(mapDialogTemplate);




var _S43MainMapView = _S43MainMapView.extend({

});


var _S43TablView = _S43TablView.extend({
	render : function() {
		
	}
});

var s43TabView = new _S43TablView();