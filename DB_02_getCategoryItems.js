/**
 * Created by huangzhangjiang@isesol.com on 2017/12/11.
 * 将各朝代存入数据库
 */
var http = require("http");
var fs = require("fs");
var superagent = require("superagent");
var cheerio = require("cheerio");
var stringify = require('json-stringify');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123456',
  database : 'juzimi',
  multipleStatements: true
});

var categoryIdList = [];

function start() {
    function onRequest(req, res) {
        console.log("started ...");
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});

        res.write("<p>" + stringify(connection.state) + "</p>");

        var sql = "";
        sql = "select * from category";
        connection.query(sql, function (error, results, fields) {
            if (error) throw error;
            for(var i = 0, length = results.length; i < length; i++){
                categoryIdList.push(results[i].id)
            }
            res.write("<p>" + categoryIdList + "</p>");
            // getCategoryItems(res);
            console.log(">>> getCategoryItems");
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});

            var requestUrl = encodeURI("http://www.juzimi.com/writers");
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
                    var $wrlist = $(".block-inner .wrlist");
                    console.log($wrlist.length);
                    for (var j = 0, wrlistlength = $wrlist.length;j < wrlistlength; j++) {
                        var $category = $wrlist[j];
                        console.log($category.children);
                    }
                    console.log()
                    console.log("=================================================================")
                    console.log()
                });
            });
    }

    http.createServer(onRequest).listen(5000);
}

// 获取这个年代的作者们
function getCategoryItems(res) {

}

exports.start = start;
