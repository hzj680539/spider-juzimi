/**
 * Created by huangzhangjiang@isesol.com on 2017/12/11.
 * 根据朝代获取各朝代的作者并存储到DB
 */
var http = require("http");
var fs = require("fs");
var superagent = require("superagent");
var cheerio = require("cheerio");
var eventproxy = require("eventproxy");
var stringify = require('json-stringify');
// var connection = require('./model_connect_DB.js')
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123456',
  database : 'juzimi'
});

var ep = new eventproxy();
var dynastyList = ["先秦", "汉朝", "魏晋", "南北朝", "隋唐五代", "宋朝", "元朝", "明朝", "清朝", "近现代"];

function start() {
    function onRequest(req, res) {
        console.log("started ...");
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
        res.write("<p>" + stringify(connection) + "</p>");
        dynastyList.forEach(function(dynastyName){
            var sql = 'insert into dynasty(name) value("' + dynastyName + '")'
            connection.query(sql, function (error, results, fields) {
                if (error) throw error;
                console.log('The results is: ', results);
            });
        })
    }

    http.createServer(onRequest).listen(5000);
}

exports.start = start;
