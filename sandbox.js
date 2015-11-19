var roto = require('./roto-image');

var options = {
        colorCount: {
            min: 2,
            max: 4,
            step: 1
        },
        despeckleLevel: {
            min: 0,
            max: 20,
            step: 5
        },
        filterIterations: {
            min: 100,
            max: 1500,
            step: 100
        }
    };

roto(__dirname + '/images/ldg.jpg', options, __dirname + '/output', function(err) {
    if (!!err) {
        console.log(err);
    }
    console.log('done.');
});
