#!/usr/local/bin/node

// bit of a mess. Node.js but uses a ton of shell commands/scripts (sed, find, etc.). Requires a MS Word install, ImageMagick, wkhtmltopdf. Uses AppleScript!
// whose idea was this anyway?

// ImageMagick, Word, wkhtmltopdf

//1. have homebrew
//2. have ImageMagick
//3. install Open Office
//4. brew install unoconv (had to change perms on a few areas, /usr/local/bin, /usr/local/share/man/man1/, via "sudo chown -R tfeiler:admin <path>" to get linking to work)
//5. set up env, ex: "declare -x UNO_PATH=/Applications/OpenOffice.app/Contents"

function stampLog(msg) {
	console.log(msg + " [" + (new Date()) + "]");
}

stampLog("BEGIN PROCESSING");

try {
	var argv = require('optimist')
		.describe('token', 'Moodle web services API token')
		.describe('courseId', 'Moodle course id')
		.describe('inputDir', 'directory containing source files')
		.describe('outputDir', 'directory to place temp work and final output files')
		.demand(['token', 'courseId', 'inputDir', 'outputDir'])
		.argv;
	var fs = require('fs');
	var xmldoc = require('xmldoc');
	var execSync = require('exec-sync');
} catch (e) {
	console.log("Error loading dependencies; did you run 'npm install'?");
	return;
}

var studentDataFetcher = require('./helpers/studentDataFetcher');
var converter = require('./helpers/converter');
var combiner = require('./helpers/combiner');

// STEP 1 - fetch users
stampLog("STEP 1 - fetching user data via Moodle webservices api...");

var studentPackage = studentDataFetcher.getStudentData(argv.courseId, argv.token);
var studentsFound = studentPackage.count;
var studentFullNameToData = studentPackage.data;

if (studentsFound == 0) {
	console.log("no students found - exiting");
	return;
} else {
	stampLog("starting to work on [" + studentsFound + "] students...");
}

// execSync("rm -f " + argv.outputDir + "/*");

var i = 0;
var numConverted = 0;

var blankPath = argv.outputDir + "/blankPage.pdf";
combiner.generatePdfOnTheFly('<center>this page intentionally left blank</center>', blankPath);

for (fullName in studentFullNameToData) {
	var data = studentFullNameToData[fullName];
	var outputFileProbe = argv.outputDir + "/" + data.username + ".pdf";
	stampLog("Processing [" + i + "]/[" + fullName + "]...");

	var fileExists = false;
	try {
		var fileStats = fs.lstatSync(outputFileProbe);
		if (fileStats.isFile()) {
			fileExists = true;
		}
	} catch (e) {
	}

	if (fileExists) {
		console.log("FILE '" + outputFileProbe + "' ALREADY EXISTS FOR THIS USER; NOT PROCESSING");
	} else {
		var didConvert = converter.convertStudentFiles(argv.inputDir, argv.outputDir, fullName, data.username);

		if (didConvert) {
			combiner.combineStudentFiles(argv.outputDir, data.username);
			numConverted++;
		}

		if (numConverted >= 1) { console.log("BREAKING EARLY!!!"); break; }
	}
	i++;
}

execSync("rm " + blankPath);

// here's how to count pages in a pdf, on OSX
// mdls PROBLEMCHART\ -\ Laina\ Cross_71748_assignsubmission_file_Laina\ Cross\ BIOL\ 125.pdf  | awk '/kMDItemNumberOfPages/{print $3}'
