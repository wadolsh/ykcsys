var apiKey = "50ee07c6e4b0a0d1d01344f3";
var mongolab_url = "https://api.mongolab.com/api/1";
var mongolab_db_url = mongolab_url + "/databases/ykcsys";
var s43_doc_url_base = mongolab_db_url + "/collections/s43";
var s43_doc_url = s43_doc_url_base + "?apiKey=" + apiKey;
var s43_visit_history_doc_url_base = mongolab_db_url + "/collections/s43_visit_history";
var s43_visit_history_doc_url = s43_visit_history_doc_url_base + "?apiKey=" + apiKey;
var kendo_meta_data_doc_url = mongolab_db_url + "/collections/kendo_meta_data?apiKey=" + apiKey;
var _id_key = "_id";