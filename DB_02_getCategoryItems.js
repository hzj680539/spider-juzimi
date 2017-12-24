/**
 * Created by huangzhangjiang@isesol.com on 2017/12/11.
 * 将各分类条目（名称、href）根据分类存入数据库
 */
var http = require("http");
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
var categoryItemList = []

function start() {
    function onRequest(req, res) {
        console.log("started ...");
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});

        res.write("<p>" + stringify(connection.state) + "</p>");

        var sql = "select * from category"
        connection.query(sql, function (error, results, fields) {
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});

            if (error) throw error;
            for(var i = 0, length = results.length; i < length; i++){
                categoryIdList.push(results[i].id)
            }
            console.log("categoryIdList:", categoryIdList)
            console.log(">>> getCategoryItems")

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
                    var $ = cheerio.load(sres.text)
                    var $wrlist = $(".block-inner .wrlist")
                    console.log("$wrlist.length:", $wrlist.length)
                    for (var j = 0, wrlistlength = $wrlist.length;j < wrlistlength; j++) {
                        var $category = $wrlist[j]
                        for (var jj = 0, nameLength = $category.children.length; jj < nameLength; jj++) {
                            var id = "", title = "", href = ""
                            for (var item in $category.children[jj]) {
                                var category = $category.children[jj][item]
                                // console.log("key  :", item)
                                // console.log("value:", category)
                                if (item === "attribs") {
                                    id = categoryIdList[j]
                                    href = category.href
                                }
                                if(item === "firstChild" && category) {
                                    // console.log("firstChild")
                                    // console.log(category)
                                    title = category.data
                                }
                            }
                            if (title) {
                                categoryItemList.push({
                                    id: id,
                                    category: title,
                                    href: href
                                })
                            }
                        }
                    }
                    saveCategoryItems(categoryItemList)
                    console.log()
                    console.log("=================================================================")
                    console.log()
                });
            });
    }

    http.createServer(onRequest).listen(5000);
}

// 获取这个年代的作者们
function saveCategoryItems(categoryItemList) {
    console.log("save to DB +++++++++++++++++++++++++++++++++++++++++++")
    console.log("分类详情list")
    console.log(categoryItemList)
    sqls = ""
    for(var k = 0, len = categoryItemList.length; k < len; k++) {
        let item = categoryItemList[k]
        let sql = "insert into category_item(category_id, category_item, href) value("+ item.id +", '"+ item.category +"', '"+ item.href +"');"
        sqls += sql
    }
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

// 打印执行的SQL到控制台
function printSQL(sqls){
    console.log("SQL:");
    sqls.split(";").forEach(item => console.info(item));
}

exports.start = start;
