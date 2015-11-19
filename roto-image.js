var spawn = require('child_process')
    .spawn,
    Promise = require('bluebird'),
    mkdirp = Promise.promisify(require('mkdirp')),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    util = require('util');

module.exports = exports = function(file, options, outputDirectory, cb) {

    options = _.defaultsDeep(options, {
        colorCount: {
            min: 6,
            max: 144,
            step: 6
        },
        despeckleLevel: {
            min: 1,
            max: 24,
            step: 1
        },
        filterIterations: {
            min: 10,
            max: 200,
            step: 10
        }
    });

    console.log(util.inspect(options));

    var outputFiles = []
    var makePromise = function(iteration, colorCount, despeckleLevel, filterIterations) {
        var svgOutputName = path.resolve(outputDirectory, 'svg',
            _.padLeft(iteration.toString(), 6, '0') + '_' +
            _.padLeft(colorCount.toString(), 4, '0') + '_' +
            _.padLeft(despeckleLevel.toString(), 2, '0') + '_' +
            _.padLeft(filterIterations.toString(), 5, '0') + '_' +
            path.basename(file, path.extname(file)) + '.svg');

        var jpgOutputName = path.resolve(outputDirectory, 'jpg',
            _.padLeft(iteration.toString(), 6, '0') + '_' +
            _.padLeft(colorCount.toString(), 4, '0') + '_' +
            _.padLeft(despeckleLevel.toString(), 2, '0') + '_' +
            _.padLeft(filterIterations.toString(), 5, '0') + '_' +
            path.basename(file, path.extname(file)) + path.extname(file));

        outputFiles.push(jpgOutputName);
        return mkdirp(path.resolve(outputDirectory, 'svg'))
            .then(mkdirp(path.resolve(outputDirectory, 'jpg')))
            .then(function() {
                return (new Promise(function(resolve, reject) {
                    console.log('path: ' + svgOutputName);
                    var tracer = spawn('autotrace', [path.resolve(file),
                        '--output-format=svg',
                        '--color-count=' + colorCount,
                        '--despeckle-level=' + despeckleLevel,
                        '--filter-iterations=' + filterIterations,
                        '--output-file=' + svgOutputName
                    ]);

                    var diemsg = '';
                    tracer.stderr.on('data', function(data) {
                        diemsg += data;
                    });

                    tracer.on('close', function(code) {
                        console.log('\t\t iteration %s autotracer complete', iteration);
                        if (!!code) {
                            console.log(code + ': ' + diemsg);
                            return reject('problem running autotrace');
                        }
                        return resolve();
                    });
                }))
            })
            .then(function() {
                return new Promise(function(resolve, reject) {
                    var im = spawn('convert', [svgOutputName, jpgOutputName]);
                    var diemsg = '';
                    im.stderr.on('data', function(data) {
                        diemsg += data;
                    });
                    im.on('close', function(code) {
                        console.log('\t\t iteration %s convert complete', iteration);
                        if (!!code) {
                            console.log(diemsg);
                        return reject('problem running imagemagick convert');
                        }
                        return resolve();
                    });
                });
            })
            .then(function() {
                console.log('iteration %s completed.', iteration);
                return;
            })

    };

    var promises = [];
    for (var colorCount = options.colorCount.min; colorCount <= options.colorCount.max; colorCount += options.colorCount.step) {
        for (var despeckleLevel = options.despeckleLevel.min; despeckleLevel <= options.despeckleLevel.max; despeckleLevel += options.despeckleLevel.step) {
            for (var filterIterations = options.filterIterations.min; filterIterations <= options.filterIterations.max; filterIterations += options.filterIterations.step) {
                promises.push(makePromise(promises.length, colorCount, despeckleLevel, filterIterations));
            }
        }
    }

    console.log('about to execute ' + promises.length + ' promises.');
    Promise.all(promises)
        .then(function() {
            fs.writeFileSync(path.resolve(outputDirectory, 'gallery.html'), _.reduce(outputFiles, function(str, path) {
                str += '<div><img style="width:120px" src="http://localhost:8080/' + path.slice(outputDirectory.length) + '"/></div>';
                return str;
            }, ''));
            cb();
        })
        .error(function(err) {
            cb(err);
        });
};
