DROP DATABASE juzimi;
CREATE DATABASE juzimi DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

use juzimi;

drop table if exists dynasty;
create table dynasty(
  id int(11) PRIMARY KEY AUTO_INCREMENT,
  dynasty varchar(20)
);
commit;

drop table if exists writers;
create table writers(
  id int(11) PRIMARY KEY AUTO_INCREMENT,
  dynasty_id int(11),
  writer varchar(30) COMMENT '名字',
  photo varchar(500) COMMENT '头像',
  href varchar(100) COMMENT '跳转链接',
  books varchar(1000) COMMENT '作品列表',
  information text COMMENT '简介'
);
commit;

drop table if exists proverb;
create table proverb(
  id int(11) PRIMARY KEY AUTO_INCREMENT,
  writer_id int(11),
  book varchar(50) COMMENT '书名',
  star int(11),
  proverb varchar(1000)
);
commit;
