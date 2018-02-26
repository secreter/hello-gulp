const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const uglify = require('gulp-uglify');
const Qiniu = require('gulp-qiniu-utils');
const replace = require('gulp-replace');
const runSequence = require('run-sequence');
const del = require('del');

// var livereload = require('gulp-livereload');
/*
	监听文件变动
 */
gulp.task('watch',()=>{
	livereload.listen();//开启服务器
	return gulp.watch('index.html',()=>{
		console.log('from watch')
		// livereload()
		return livereload.reload();
	})
})

/*
	压缩文件
 */
gulp.task('minify', function () {
  gulp.src('js/app.js')
    .pipe(uglify())
    .pipe(gulp.dest('./build/js/'))
  return gulp.src('./index.html')
    .pipe(gulp.dest('./build/'))
});
/*
	压缩图片
 */
gulp.task('imagemin', function() {
    return gulp.src(['./img/*.{png,jpg,jpeg,gif}'])
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }]
        }))
        .pipe(gulp.dest('./build/img/'))
});

/*
	上传静态文件到七牛云,并替换资源路径
 */
var qiniuOptions = {
  ak: 'BdMhDATEg-Vo930YQH0zjJ7Tswtw1oOePocHcoJeO',
  sk: 'FDTlBgQOCA0fywdHzx1y5tZs-5gW500LvvooVJyHE',
  uploadDir: './build/img/', //本地需上传的目录
  bucket: 'item-redream', //七牛空间名
  prefix: 'test-gulp/', //上传时添加的前缀，可省略
  zone: 'Zone_z0', //空间对应存储区域（华东：z0，华北：z1，华南：z2，北美：na0）
  url: 'http://images.redream.cn', //域名
  remoteDir: 'test-gulp', //七牛空间目录（前缀），如果和下面三个相同，下面三个可省略
  prefetchDir: 'test-gulp',//需预取目录
  removeDir: 'test-gulp',//需删除目录
  refreshDir: 'test-gulp'//需刷新目录
}

gulp.task('upload', function (cb) {
  var qiniu = new Qiniu(qiniuOptions)
  return  qiniu.remove()
    .then(r => qiniu.upload()) //根据自己的需求来调用相应的方法
    .then(r => qiniu.refresh())
    .then(r => qiniu.prefetch())
    .then(replaceAssets)
})


function replaceAssets(){
	return  gulp.src(['./build/*.*'])
	    .pipe(replace(/(\.\/)?img\/.+\.(jpg|png|gif)/g, (match, p1, offset, string)=>{
	    	// console.log(match, p1, offset, string)
	    	if(match.substring(0,2)==='./'){
	    		match=match.substring(2)
	    		console.log(match)
	    	}
	    	return 'http://images.redream.cn/test-gulp/build/'+match
	    }))
	    .pipe(gulp.dest('./build'))
}
/*
	删除文件
 */
gulp.task('clean', function (cb) {
	// 要加上return ，runSequence才能串行执行
  return del([
    './build/**/*',
    // 这里我们使用一个通配模式来匹配 `mobile` 文件夹中的所有东西
    // 'dist/mobile/**/*',
    // // 我们不希望删掉这个文件，所以我们取反这个匹配模式
    // '!dist/mobile/deploy.json'
  ], cb);
});
/*
	组合多个任务
 */
gulp.task("default",  function(cb) {
	//整体是串行执行
	runSequence('clean',
        ['minify', 'imagemin'],       //并行执行
        'upload',
        cb);
});


