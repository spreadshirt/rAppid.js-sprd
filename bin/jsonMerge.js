#!/usr/local/bin/node

'use strict';

/**
 * This script merges two json files and stores the result into a new file
 *
 * It accepts 3 input arguments:
 *
 * file1: first json file
 * file2: second json file
 * [outputFile]: file to store the merge in;
 *               when not given, merge gets stored in a file named filename1_merge_filename2.json
 *
 * @author mapf
 *
*/
var fs = require('fs'),
    nodeCommand = process.title,
    filename1, filename2,
    outputFilename,
    json1, json2,
    obj1, obj2, mergeObj,
    args = process.argv.splice(2),
    i;

// get input file parameters
filename1 = args.shift();
filename2 = args.shift();

if (!(filename1 && filename2)) {
    console.error('not enough arguments');
    console.log('usage: ' + [nodeCommand, __filename.match(/[^/]+$/), 'inputFile1', 'inputFile2', '[outputFilename]'].join(' '));
    process.exit(1);
}

// get output filename from args or user 'file1_merge_file2' as default
outputFilename = args.shift() || filename1.match(/([^/\\.]+)\..*?$/)[1] + '_merge_' + filename2.match(/([^/\\.]+)\..*?$/)[1] + '.json';

// read files
if (fs.existsSync(filename1)) {
    json1 = fs.readFileSync(filename1, 'utf8').toString().replace(/^\uFEFF/, '');
} else {
    console.error('file "' + filename1 + '" doesn\'t exist.');
}

if (fs.existsSync(filename2)) {
    json2 = fs.readFileSync(filename2, 'utf8').toString().replace(/^\uFEFF/, '');
} else {
    console.error('file "' + filename2 + '" doesn\'t exist.');
}

// parse json out of files

try {
    obj1 = JSON.parse(json1);
} catch (e) {
    console.error('the first file doesn\'t contain valid JSON');
	 console.error(e);
	 console.info('json:', json1);
    process.exit(1);
}

try {
    obj2 = JSON.parse(json2);
} catch (e) {
    console.error('the second file doesn\'t contain valid JSON');
	 console.error(e);
	 console.info('json:', json2);
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

mergeObj = (function getMerge (obj1, obj2) {
    var key, value1, value2,
        merge = obj1,
        tmp;

    for (i in obj2) {
        if (obj2.hasOwnProperty(i)) {
            key = i;
            value1 = obj1[key];
            value2 = obj2[key];

            // if value1 is an array, return error and break
            if (typeof value1 === 'object' && value1.length) {
                console.error('arrays are not supported');
                process.exit(1);
            }

            if (!value1) {
                // if key not in object1, add it
                merge[key] = value2;
            } else if (typeof value2 === 'object') {
                tmp = getMerge(value1, value2);

                // when type of object, iterate over children
                if (tmp) {
                    merge[key] = tmp;
                }
            } else{
                merge[key] = value2;
            }
        }
    }

    return isEmptyObject(merge) ? null : merge;
}(obj1, obj2)) || {};

fs.writeFileSync(outputFilename, JSON.stringify(mergeObj, null, 4));

console.info('done.');
