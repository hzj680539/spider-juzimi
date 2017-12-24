DROP DATABASE if exists juzimi;
CREATE DATABASE juzimi DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

use juzimi;

-- 分类表
drop table if exists category;
create table category(
  id int(11) PRIMARY KEY AUTO_INCREMENT,
  category varchar(20) '分类'
);

-- 分类详情表
drop table if exists category_item;
create table category_item(
  id int(11) PRIMARY KEY AUTO_INCREMENT,
  category_id int(11),
  category_item varchar(20) '分类条目',
  href varchar(100) 'URI地址'
);

-- 作家表
drop table if exists writers;
create table writers(
  id int(11) PRIMARY KEY AUTO_INCREMENT,
  country_id int(11) COMMENT '国家',
  dynasty_id int(11) COMMENT '朝代',
  writer varchar(30) COMMENT '名字',
  photo varchar(500) COMMENT '头像',
  href varchar(100) COMMENT 'URI地址',
  books varchar(1000) COMMENT '作品列表',
  information text COMMENT '简介'
);

-- 句子表
drop table if exists proverb;
create table proverb(
  id int(11) PRIMARY KEY AUTO_INCREMENT,
  writer_id int(11),
  book varchar(50) COMMENT '书名',
  star int(11) '评价星级',
  proverb varchar(1000)
);
