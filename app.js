var fs = require('fs');
const express = require('express')
const app = express()
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var b = browserify({
    entries: ['views/index.js'],
    cache: {},
    packageCache: {},
    plugin: [watchify]
});

b.on('update', bundle);
bundle();

function bundle() {
    b.bundle()
        .on('error', console.error)
        .pipe(fs.createWriteStream('./views/bundle.js'));
}

app.use(express.static(__dirname + '/views'));

//app.set('view engine', 'pug')
app.set('views', './views')
app.get('/', (req, res) => {
    res.render("./views/index.html", { root: __dirname })
})

app.listen(4444, () => console.log("Listening on port 4444"))