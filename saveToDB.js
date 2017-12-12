/**
 * Created by huangzhangjiang@isesol.com on 2016/9/16.
 */
var http = require("http");
var fs = require("fs");
var superagent = require("superagent");
var cheerio = require("cheerio");
var eventproxy = require("eventproxy");
var mysql      = require('mysql');

var ep = new eventproxy();
var writerArray = ["三毛"];
var siteUrl = "http://www.juzimi.com/writer/";

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123456',
  database : 'juzimi'
});

function start() {
    function onRequest(req, res) {
        console.log("started ...");
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
        var proverbString = "";
        var maxPage = 3; // 最大页码数量
        var index = 0;
        var timeInterval = 10000;
        writerArray.forEach(function (writer) {
            for(var page = 0; page < maxPage; page++){
                var requestUrl = encodeURI(siteUrl + writer + "?page=" + page);
                getAndWrite(requestUrl, index++);
            }
            // setTimeout(function () {
            //     fs.writeFile('document/'+ writer +".txt", proverbString, function (err) {
            //         if(err) {
            //             return console.error(err);
            //             console.log("数据保存成功！");
            //         }
            //     });
            // },maxPage*timeInterval)
        });

        function getAndWrite(requestUrl, index) {
            setTimeout(function () {
                var page = index + 1;
                res.write("<p>Page:"+ page + "</p>");
                superagent.get(requestUrl)
                    .set('User-Agent', "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36")
                    .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
                    .set('Accept-Encoding', 'gzip, deflate, sdch')
                    .set('Cache-Control', 'no-cache')
                    .set('Connection', 'keep-alive')
                    .set('Upgrade-Insecure-Requests', 1)
                    .end(function (err, sres) {
                        if(err){
                            return false;
                        }
                        var $ = cheerio.load(sres.text);
                        var juziObject = $(".view-content .xlistju");
                        for(var j=0; j < juziObject.length; j++){
                            var juziTotal = "";
                            var juziArray = juziObject[j].children;
                            for(var k in juziArray){
                                var juzi = juziArray[k];
                                var juziText = (juzi.data || "").replace("\r","").replace(/\s/g,"");
                                juziTotal += juziText;
                            }
                            var juziSql = 'insert into sentence(writer_id, sentence) value(1,"' + juziTotal + '")'
                            connection.query(juziSql, function (error, results, fields) {
                                if (error) throw error;
                                console.log('The results is: ', results);
                            });
                            res.write("<p>"+ juziTotal + "</p>");
                            proverbString += juziTotal + "\r";
                        }
                    });
            },index*timeInterval);
        }
    }

    http.createServer(onRequest).listen(5000);
}

exports.start = start;
