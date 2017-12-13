/**
 * Created by huangzhangjiang@isesol.com on 2017/12/11.
 * 将分类存入数据库
 */
var http = require("http");
var fs = require("fs");
var mysql = require('mysql');
var stringify = require('json-stringify');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123456',
  database : 'juzimi',
  multipleStatements: true // 多行插入
});

var categoryList = ["按名人朝代", "按名人国家", "按句子/名言类别", "按名言内容类型"];

function start() {
    function onRequest(req, res) {
        console.log("started ...");
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});

        res.write("<p> State: " + stringify(connection.state) + "</p>");
        // 拼接SQL
        var sqls = "";
        categoryList.forEach(item => {
            sqls += 'insert into category(category) value("' + item + '");'
        });
        // 打印SQL
        printSQL(sqls);
        // 执行SQL
        connection.query(sqls, function (error, results, fields) {
            if (error) throw error;
            console.log('### 成功执行SQL命令:', results.length);
            connection.end();
            process.exit(); // 退出进程
        });
    }

    http.createServer(onRequest).listen(5000);
}

// 打印执行的SQL到控制台
function printSQL(sqls){
    console.log("SQL:");
    sqls.split(";").forEach(item => console.info(item));
}

exports.start = start;
