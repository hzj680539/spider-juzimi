CREATE DATABASE juzimi DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

drop table if exists dynasty;
create table dynasty(
  id int(11) primary key AUTO_INCREMENT,
  name varchar(20)
);

drop table if exists writers;
create table writers(
  id int(11) primary key AUTO_INCREMENT,
  dynasty_id int(11),
  name varchar(20) COMMENT '名字',
  books varchar(1000) COMMENT '作品列表',
  max_page int(11) COMMENT '最大页面',
  information text COMMENT '简介'
);

drop table if exists sentence;
create table sentence(
  id int(11) primary key AUTO_INCREMENT,
  writer_id int(11),
  book varchar(50) COMMENT '书名',
  star int(11),
  sentence varchar(1000)
);

delete from writers;
insert into writers(dynasty_id, name) value(10, "三毛");

delete from sentence;
insert into sentence(writer_id, sentence) value(1,"这里是描述1");
