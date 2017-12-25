/**
 * Created by huangzhangjiang@isesol.com on 2017/12/11.
 * 根据朝代获取各朝代的作者并存储到DB
 */
var http = require("http")
var fs = require("fs")
var superagent = require("superagent")
var cheerio = require("cheerio")
var mysql      = require('mysql')
// var stringify = require('json-stringify')

var dynastyCount = 0
var maxPage = 10 // 默认最大页码数量
var reqPath = "http://www.juzimi.com"

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123456',
  database : 'juzimi',
  multipleStatements: true
})

function start() {
    function onRequest(req, res) {
        console.log("started ...")
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'})

        // 获取中国各朝代列表
        getDynastyList(dynastyList => {
            console.log('function >> getDynastyList')
            setIntervalQuery(dynastyList)
        })

        // 获取中国各朝代列表
        function getDynastyList(cb) {
            let dynastyList = [], sql = 'select id, category_item, href from category_item where category_id = 1;'
            connection.query(sql, function (error, results, fields) {
                if (error) throw error
                results.forEach(item => {
                    dynastyList.push({id: item.id, dynasty: item.category_item, href: item.href})
                })
                if(typeof cb === "function") cb(dynastyList)
            })
        }

        function setIntervalQuery (dynastyList) {
            console.log('function >> executeQuery')
            var dynastySums = dynastyList.length
            // innerQuery(dynastyList[0]) // 先执行第一个
            // 顺序间隔执行其他的
            var intervalDynasty = setInterval(() => {
                if(dynastyCount < dynastySums){
                    innerQuery(dynastyList[dynastyCount])
                    ++dynastyCount // 计数
                } else {
                    console.log("遍历执行完成!!")
                    clearInterval(intervalDynasty)
                    connection.end()
                    process.exit() // 退出进程
                }
            }, 3*60*1000) // 设置查询间隔（五分钟一组）
            // 内置方法
            function innerQuery(dynasty) {
                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
                console.log(">>> 朝代编号：", dynasty.id)
                console.log(">>> 朝代名称：", dynasty.dynasty)
                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
                if(dynasty.href) getMaxPage(dynasty)
            }
        }

        // 获取最大页码数
        function getMaxPage(dynasty) {
            console.log("function >> getMaxPage")
            var requestUrl = encodeURI(reqPath + dynasty.href)
            console.log("requestUrl:", requestUrl)
            superagent.get(requestUrl)
                .set('User-Agent', "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36")
                .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
                .set('Accept-Encoding', 'gzip, deflate, sdch')
                .set('Cache-Control', 'no-cache')
                .set('Connection', 'keep-alive')
                .set('Upgrade-Insecure-Requests', 1)
                .end(function (err, sres) {
                    if(err) return false
                    var $ = cheerio.load(sres.text)
                    maxPage = $(".item-list .pager-next").prev().text()
                    maxPage = parseInt(maxPage)
                    setIntervalQueryWriters(dynasty, maxPage)
                })
        }

        // 设置间隔查询作者方法
        function setIntervalQueryWriters(dynasty, maxPage){
            console.log("function >> setIntervalQueryWriters")
            var pageNum = 0
            // 先执行第一个
            getWriters(dynasty, pageNum, maxPage)
            // 顺序间隔执行其他的
            var intervalQuery = setInterval(() => {
                if (++pageNum < maxPage){
                    getWriters(dynasty, pageNum, maxPage)
                } else {
                    clearInterval(intervalQuery)
                }
            }, 30*1000) // 设置每隔30秒执行一次查询
        }

        // 获取这个年代的作者们
        function getWriters(dynasty, pageNum, maxPage) {
            console.log("function >> getWriters")
            console.log('当前朝代：', dynasty.dynasty, '，总页码：', maxPage, '，当前页码：', pageNum + 1)
            var requestUrl = encodeURI(reqPath + dynasty.href + "?page=" + pageNum)
            superagent.get(requestUrl)
                .set('User-Agent', "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36")
                .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
                .set('Accept-Encoding', 'gzip, deflate, sdch')
                .set('Cache-Control', 'no-cache')
                .set('Connection', 'keep-alive')
                .set('Upgrade-Insecure-Requests', 1)
                .end(function (err, sres) {
                    if(err) return false
                    var $ = cheerio.load(sres.text)
                    var writerObjList = $(".view-content .views-field-name a")
                    var writerList=[], i=0, length=writerObjList.length, sqls = ""
                    for(; i < length; i++){
                      writerList.push({title: writerObjList[i].attribs.title, href: writerObjList[i].attribs.href})
                    }
                    // 拼接SQL
                    writerList.forEach(item => {
                        sqls += 'insert into writers(dynasty_id, writer, href) value(' + dynasty.id + ',"' + item.title + '","' + decodeURI(item.href) + '");'
                    })
                    printSQL(sqls)
                    connection.query(sqls, function (error, results, fields) {
                        if (error) throw error
                    })
                    console.log()
                    console.log("=================================================================")
                    console.log()
                })
        }
    }

    http.createServer(onRequest).listen(5000)
}

// 打印执行的SQL到控制台
function printSQL(sqls){
    console.log("SQL:")
    sqls.split(";").forEach(item => console.info(item))
}

exports.start = start
