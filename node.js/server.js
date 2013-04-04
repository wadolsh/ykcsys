// reference the http module so we can create a webserver
var http = require("http");
var fs = require('fs');

// create a server
http.createServer(function(req, res) {
    //console.log(req.headers);
    // on every request, we'll output 'Hello world'
    //res.end("Hello world from Cloud9!---");
    fs.readFile('ykc_gae/war' + (req.url.charAt(req.url.length - 1) == '/' ? req.url + 'index.html' : req.url) , function(error, data) {
        var n = null;
        if ((n = req.url.lastIndexOf(".")) != -1) {
            //console.log(ext);
            switch (req.url.substring(n)) {
                case '.js' :
                    res.writeHead(200, {'Content-Type': 'text/javascript'});
                    break;
                case '.css' :
                    res.writeHead(200, {'Content-Type': 'text/css'});
                    break;
                case '.gif' :
                    res.writeHead(200, {'Content-Type': 'image/gif'});
                    break;
                case '.png' :
                    res.writeHead(200, {'Content-Type': 'image/png'});
                    break;
                case '.jpg' :
                    res.writeHead(200, {'Content-Type': 'image/jpeg'});
                    break;
                default :
                    res.writeHead(200, {'Content-Type': 'text/html'});
            }
        }

        //res.writeHead(200, {'Content-Type': 'text/html'});
        //res.writeHead(200);
        res.end(data);
    });
    
    
}).listen(process.env.PORT, process.env.IP);

// Note: when spawning a server on Cloud9 IDE, 
// listen on the process.env.PORT and process.env.IP environment variables

// Click the 'Run' button at the top to start your server,
// then click the URL that is emitted to the Output tab of the console