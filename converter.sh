#!/usr/local/bin/node

//1. have homebrew
//2. have ImageMagick
//3. install Open Office
//4. brew install unoconv (had to change perms on a few areas, /usr/local/bin, /usr/local/share/man/man1/, via "sudo chown -R tfeiler:admin <path>" to get linking to work)
//5. set up env, ex: "declare -x UNO_PATH=/Applications/OpenOffice.app/Contents"

try {
	var argv = require('optimist')
		.describe('inputDir', 'directory containing source files')
		.describe('outputDir', 'directory to place temp work and final output files')
		.demand(['inputDir', 'outputDir'])
		.argv;
	var fs = require('fs');
	var xmldoc = require('xmldoc');
	var execSync = require('exec-sync');
} catch (e) {
	console.log("Error loading dependencies; did you run 'npm install'?");
	return;
}

execSync("rm " + argv.outputDir + "/*");

var fs = require('fs');
var files = fs.readdirSync(argv.inputDir);
for (var i in files) {
	var filename = files[i];
	console.log("file #" + (Number(i)+1) + ": [" + filename + "] (" + (new Date()) + ")");

	var justName = filename.substr(0, filename.lastIndexOf("."));
	var extension = filename.substr(filename.lastIndexOf(".") + 1).toLowerCase();
	if (extension == "pdf") {
		console.log("pdf - requires no further processing");
		var cmd = "cp '" + argv.inputDir + "/" + filename + "' '" + argv.outputDir + "/" + filename + "'";
		execSync(cmd);
	} else {
		if (extension == "docx" || extension == "txt") {
			console.log("converting OpenOffice doc...");
			var cmd = "unoconv --format pdf --output '" + argv.outputDir + "/" + justName + ".pdf' '" + argv.inputDir + "/" + filename + "'";
			console.log(cmd);
			execSync(cmd);
		} else if (extension == "jpeg" || extension == "jpg" || extension == "png") {
			console.log("converting image...");
			var cmd = "convert '" + argv.inputDir + "/" + filename + "' '" + argv.outputDir + "/" + justName + ".pdf'";
			try {
				execSync(cmd);
			} catch (e) {
				console.log("possible error: [" + e + "]; continuing...");
			}
		} else {
			console.log("cannot handle this format: [" + extension + "] -- NEED TO LOG THIS SOMEHOW!!!");
		}
	}
	
	console.log("-----");
}
console.log("DONE!");
