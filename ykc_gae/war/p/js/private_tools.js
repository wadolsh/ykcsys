var mongolab_url = "https://api.mongolab.com/api/1";
var mongolab_db_url = mongolab_url + "/databases/ykcsys";
var private_tools_doc_url_base = mongolab_db_url + "/collections/private_tools";
var apiKey = "50ee07c6e4b0a0d1d01344f3";
var s43_doc_url = s43_doc_url_base + "?apiKey=" + apiKey;
var kendo_meta_data_doc_url = mongolab_db_url + "/collections/kendo_meta_data?apiKey=" + apiKey;
var _id_key = "_id";

$.ajaxSetup({
	url: private_tools_doc_url_base,
	contentType: "application/json",
	//processData: false
});
