'use strict';

/**
 * This script gets the difference of two json files and stores it into a new file
 * 
 * It accepts 3 input arguments:
 * 
 * file1: first json file
 * file2: second json file
 * [outputFile]: file to store the difference in; 
 *               when not given, diff gets stored in a file named filename1_diff_filename2.json
 *
 * @author mapf
 * 
*/
var fs = require('fs'),
    nodeCommand = process.title,
    filename1, filename2,
    outputFilename,
    json1, json2,
    obj1, obj2, diffObj = {},
    args = process.argv,
    i;

// throw out node command and script file parameter
if (args[0] === nodeCommand) {
    args.shift();
}

if (args[0] === __filename) {
    args.shift();
}

// get input file parameters
filename1 = args.shift();
filename2 = args.shift();

if (!(filename1 && filename2)) {
    console.error('not enough arguments');
    console.log('usage: ' + [nodeCommand, __filename.match(/[^/]+$/), 'inputFile1', 'inputFile2', '[outputFilename]'].join(' '));
    process.exit(1);
}

// get output filename from args or user 'file1_diff_file2' as default
outputFilename = args.shift() || filename1.match(/([^/.]+)\..*?$/)[1] + '_diff_' + filename2.match(/([^/.]+)\..*?$/)[1] + '.json';

// read files
if (fs.existsSync(filename1)) {
    json1 = fs.readFileSync(filename1).toString();
} else {
    console.error('file "' + filename1 + '" doesn\'t exist.');
}

if (fs.existsSync(filename2)) {
    json2 = fs.readFileSync(filename2).toString();
} else {
    console.error('file "' + filename2 + '" doesn\'t exist.');
}

// parse json out of files
try {
    obj1 = JSON.parse(json1);
    obj2 = JSON.parse(json2);
} catch (e) {
    console.error('one of the files doesn\'t contain valid JSON');
    process.exit(1);
}
// helper method to find out, whether an object is empty
function isEmptyObject (obj) {
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            return false;
        }
    }

    return true;
}

diffObj = (function getDiff (obj1, obj2) {
    var key, value1, value2,
        diff = {},
        tmp;

    for (i in obj1) {
        if (obj1.hasOwnProperty(i)) {
            key = i;
            value1 = obj1[key];
            value2 = obj2[key];

            // if value1 is an array, return error and break
            if (typeof value1 === 'object' && value1.length) {
                console.error('arrays are not supported');
                process.exit(1);
            }

            if (!value2) {
                // if key not in object2, add it
                diff[key] = value1;
            } else if (typeof value1 === 'object') {
                tmp = getDiff(value1, value2);

                // when type of object iterate over children
                if (tmp) {
                    diff[key] = tmp;
                }
            } else if (value1 !== value2) {
                diff[key] = value1;
            }
        }
    }

    return isEmptyObject(diff) ? null : diff;
}(obj1, obj2)) || {};

fs.writeFileSync(outputFilename, JSON.stringify(diffObj, null, 4));

console.info('done.');
