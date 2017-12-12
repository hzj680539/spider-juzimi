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
var dynastyList = ["先秦", "汉朝", "魏晋", "南北朝", "隋唐五代", "宋朝", "元朝", "明朝", "清朝", "近现代"];
var dynastyNun = 0;
var maxPage = 5; // 默认最大页码数量
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

        var dynastyListLength = dynastyList.length;
        var intervalDynasty = setInterval(() => {
            dynastyNun = dynastyNun + 1; // 下一个朝代ID
            if(dynastyNun > dynastyListLength){
                console.log("执行完成!!");
                clearInterval(intervalDynasty);
                connection.end();
                process.exit(); // 退出进程
            } else {
                console.log("intervalDynasty >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                console.log("朝代ID：", dynastyNun);
                console.log("朝代名称：", dynastyList[dynastyNun-1]);
                getMaxPage(dynastyList[dynastyNun-1]);
            }
        }, 2*60*1000); // 五分钟一组

        // 获取最大页码数
        function getMaxPage(dynastyName) {
            console.log(">>> getMaxPage");
            var requestUrl = encodeURI(reqPath + dynastyName);
            console.log("requestUrl:", requestUrl);
            res.write("<p>"+ requestUrl + "</p>");
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
                    maxPage = $(".item-list .pager-next").prev().text();
                    maxPage = parseInt(maxPage);
                    console.log("maxPage: ", maxPage);
                    executeQuery(dynastyName, maxPage);
                });
        }

        // 执行查询方法
        function executeQuery(dynastyName, maxPage){
            console.log(">>> executeQuery");
            var pageNum = 0;
            var intervalQuery = setInterval(() => {
                getWriters(dynastyName, pageNum);
                ++pageNum;
                if (pageNum == maxPage){
                    clearInterval(intervalQuery);
                }
            }, 10*1000); // 设置每隔20秒执行一次查询
        }

        // 获取这个年代的作者们
        function getWriters(dynastyName, pageNum) {
            console.log(">>> getWriters");
            var requestUrl = encodeURI(reqPath + dynastyName + "?page=" + pageNum);
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
                    var writerObjList = $(".view-content .views-field-name a");
                    var writerList=[], i=0, k=0, length=writerObjList.length, item, sql;
                    for(; i < length; i++){
                      writerList.push({title: writerObjList[i].attribs.title, href: writerObjList[i].attribs.href})
                    }
                    // 循环写入DB
                    for(; k<length; k++){
                        item = writerList[k];
                        sql = 'insert into writers(dynasty_id, writer, href) value(' + dynastyNun + ',"' + item.title + '","' + decodeURI(item.href) + '")';
                        console.log('sql', sql);
                        connection.query(sql, function (error, results, fields) {
                            if (error) throw error;
                        });
                    }
                    console.log()
                    console.log("=================================================================")
                    console.log()
                });
        }
    }

    http.createServer(onRequest).listen(5000);
}

exports.start = start;
