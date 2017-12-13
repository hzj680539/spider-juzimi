/**
 * Created by huangzhangjiang@isesol.com on 2017/12/11.
 * 将各朝代存入数据库
 */
var http = require("http");
var fs = require("fs");
var stringify = require('json-stringify');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123456',
  database : 'juzimi',
  multipleStatements: true
});

var categoryList = [];
var dynastyList = ["先秦", "汉朝", "魏晋", "南北朝", "隋唐五代", "宋朝", "元朝", "明朝", "清朝", "近现代"];

function start() {
    function onRequest(req, res) {
        console.log("started ...");
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});

        res.write("<p>" + stringify(connection.state) + "</p>");

        var sql = "";
        sql = "select * from category";
        connection.query(sql, function (error, results, fields) {
            if (error) throw error;
            console.log('The results is: ', typeof results);
        });

        // dynastyList.forEach(function(dynastyName){
        //     var sql = 'insert into dynasty(dynasty) value("' + dynastyName + '")'
        //     connection.query(sql, function (error, results, fields) {
        //         if (error) throw error;
        //         console.log('The results is: ', results);
        //     });
        // })
        connection.end();
    }

    http.createServer(onRequest).listen(5000);
}

exports.start = start;
