/**
 * Created by huangzhangjiang@isesol.com on 2017/12/11.
 * 根据国家获取作者并存储到DB
 */
var http = require("http")
var fs = require("fs")
var superagent = require("superagent")
var cheerio = require("cheerio")
var mysql      = require('mysql')
// var stringify = require('json-stringify')

var countryCount = 0
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

        // 获取各国家列表
        getCountryList(countryList => {
            console.log('function >> getCountryList')
            setIntervalQuery(countryList)
        })

        // 获取各国家列表
        function getCountryList(cb) {
            let countryList = [], sql = 'select id, category_item, href from category_item where category_id = 2;'
            connection.query(sql, function (error, results, fields) {
                if (error) throw error
                results.forEach(item => {
                    countryList.push({id: item.id, country: item.category_item, href: item.href})
                })
                if(typeof cb === "function") cb(countryList)
            })
        }

        function setIntervalQuery (countryList) {
            console.log('function >> executeQuery')
            var countrySums = countryList.length
            // innerQuery(countryList[0]) // 先执行第一个
            // 顺序间隔执行其他的
            var intervalCountry = setInterval(() => {
                innerInterval()
            }, 3*60*1000) // 设置查询间隔（五分钟一组）
            // 内置间隔
            function innerInterval(){
                if(countryCount < countrySums){
                    innerQuery(countryList[countryCount])
                    ++countryCount // 计数
                } else {
                    console.log("遍历执行完成!!")
                    clearInterval(intervalCountry)
                    connection.end()
                    process.exit() // 退出进程
                }
            }
            // 内置方法
            function innerQuery(country) {
                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
                console.log(">>> 国家编号：", country.id)
                console.log(">>> 国家名称：", country.country)
                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
                if(country.href) getMaxPage(country)
            }
        }

        // 获取最大页码数
        function getMaxPage(country) {
            console.log("function >> getMaxPage")
            var requestUrl = encodeURI(reqPath + country.href)
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
                    setIntervalQueryWriters(country, maxPage)
                })
        }

        // 设置间隔查询作者方法
        function setIntervalQueryWriters(country, maxPage){
            console.log("function >> setIntervalQueryWriters")
            var pageNum = 0
            // 先执行第一个
            getWriters(country, pageNum, maxPage)
            // 顺序间隔执行其他的
            var intervalQuery = setInterval(() => {
                if (++pageNum < maxPage){
                    getWriters(country, pageNum, maxPage)
                } else {
                    clearInterval(intervalQuery)
                }
            }, 20*1000) // 设置每隔20秒执行一次查询
        }

        // 获取这个年代的作者们
        function getWriters(country, pageNum, maxPage) {
            console.log("function >> getWriters")
            console.log('当前国家：', country.country, '，总页码：', maxPage, '，当前页码：', pageNum + 1)
            var requestUrl = encodeURI(reqPath + country.href + "?page=" + pageNum)
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
                        sqls += 'insert into writers(country_id, writer, href) value(' + country.id + ',"' + item.title + '","' + decodeURI(item.href) + '");'
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
