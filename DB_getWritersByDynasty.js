/**
 * Created by huangzhangjiang@isesol.com on 2017/12/11.
 * 根据朝代获取各朝代的作者并存储到DB
 */
var http = require("http");
var fs = require("fs");
var superagent = require("superagent");
var cheerio = require("cheerio");
var eventproxy = require("eventproxy");
var mysql      = require('mysql');
var stringify = require('json-stringify');

var ep = new eventproxy();
// var dynastyList = ["先秦", "汉朝", "魏晋", "南北朝", "隋唐五代", "宋朝", "元朝", "明朝", "清朝", "近现代"];
var dynastyList = ["先秦"];
var reqPath = "http://www.juzimi.com/dynasty/";

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
        var maxPage = 5; // 最大页码数量
        var index = 0;
        var timeInterval = 10000;
        dynastyList.forEach(function (dynasty) {
            for(var page = 0; page < maxPage; page++){
                var requestUrl = encodeURI(reqPath + dynasty + "?page=" + page);
                getWriters(requestUrl, index++);
            }
        });

        function getWriters(requestUrl, index) {
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
                        var writerNameObjList = $(".view-content .views-field-name a");
                        var writerNameList = [];
                        for(var i=0,length=writerNameObjList.length; i < length; i++){
                          writerNameList.push(writerNameObjList[i].attribs.title)
                        }
                        console.log(writerNameList);
                        res.write("<p>"+ stringify(writerNameObjList) + "</p>");
                        // var juziSql = 'insert into sentence(writer_id, sentence) value(1,"' + juziTotal + '")'
                        // connection.query(juziSql, function (error, results, fields) {
                        //     if (error) throw error;
                        //     console.log('The results is: ', results);
                        // });
                        // res.write("<p>"+ juziTotal + "</p>");
                        // proverbString += juziTotal + "\r";

                    });
            },index*timeInterval);
        }
    }

    http.createServer(onRequest).listen(5000);
}

exports.start = start;
