#!/usr/local/bin/node

// try  "tail -f whatever.log | grep "\(working\|BREAKING\|cannot\)"

// ./main.sh --token 07d41b4fb246b36061f499494acac7c0 --courseId 15741 --inputDir ../realData --outputDir output

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
	var fs = require('fs');
	var xmldoc = require('xmldoc');
	var execSync = require('exec-sync');
} catch (e) {
	console.log("Error loading dependencies; did you run 'npm install'?");
	return;
}

var config = require('./helpers/config').config;

console.log("Opening ssh tunnel...");
execSync("./helpers/tunnelManager.sh open " + config.localTunnelPort + " " + config.remoteTunnelPort + " " + config.tunnelUser + " " + config.tunnelHost);

var studentDataFetcher = require('./helpers/studentDataFetcher');

// var foo = studentDataFetcher.getLdapData("reillya");
// console.log("got back colleague id [" + foo.carlColleagueId + "], year [" + foo.carlCohortYear + "]");

// var csg = require('./helpers/coverSheetGenerator');
var converter = require('./helpers/converter');
var combiner = require('./helpers/combiner');

// STEP 1 - fetch users
stampLog("STEP 1 - fetching user data via Moodle webservices api...");

var justLabelData = false;

// var studentPackage = studentDataFetcher.getStudentData(config.courseId, config.moodleApiToken);
var studentPackage = studentDataFetcher.getCompletedStudentData(config.inputDir + "/progress.csv", config.fullNameAliases, justLabelData);
var studentsFound = studentPackage.count;
var studentUsernameToData = studentPackage.data;

if (studentsFound == 0) {
	console.log("no students found - exiting");
	return;
} else {
	stampLog("starting to work on [" + studentsFound + "] students...");
}

// execSync("rm -f " + config.outputDir + "/*");

var i = 0;
var numConverted = 0;

var blankPath = config.outputDir + "/blankPage.pdf";
combiner.generatePdfOnTheFly('<center>this page intentionally left blank</center>', blankPath);

function checkForExistingFile(netId) {
	var existingFile = execSync("find " + config.outputDir + " -name " + netId + ".pdf");
	return existingFile;
}

for (username in studentUsernameToData) {
	var data = studentUsernameToData[username];
	var fullName = data.name;
	var submissionDate = new Date(Date.parse(data.submissionDate));

	stampLog("Processing [" + i + "]/[" + fullName + "]/[" + data.username + "]/[" + data.fsKey + "]/[" + submissionDate + "]...");

	/*
	if (submissionDate.getMonth() >= 3) {
		console.log("CURRENTLY NOT RUNNING FOR STUDENTS WHO SUBMITTED AFTER MARCH, 2015");
		continue;
	}
	*/

	if (justLabelData) {
		var ldapData = studentDataFetcher.getLdapData(data.username);
		console.log("LABELREPORT" + "\t" + fullName + "\t" + data.username + "\t" + ldapData.carlColleagueId + "\t" + ldapData.carlCohortYear);
		continue;
	}


	/*
	var outputFileProbe = config.outputDir + "/" + data.username + ".pdf";
	var fileExists = false;
	try {
		var fileStats = fs.lstatSync(outputFileProbe);
		if (fileStats.isFile()) {
			fileExists = true;
		}
	} catch (e) {
	}
	*/
	var outputFileProbe = checkForExistingFile(data.username);

	if (outputFileProbe != "") {
		console.log("FILE '" + outputFileProbe + "' ALREADY EXISTS FOR THIS USER; NOT PROCESSING");
	} else {
		// var madeCoverSheet = csg.generateCoversheet(config.inputDir, config.outputDir, data.username);

		// if (madeCoverSheet) {
		if (true) {
			var didConvert = converter.convertStudentFiles(config.inputDir, config.outputDir, fullName, data.fsKey, data.username, data);

			if (didConvert) {
				combiner.combineStudentFiles(config.outputDir, data.username);
				numConverted++;
			} else {
				console.log("FAILED TO CONVERT [" + data.username + "]");
			}

			if (config.chunkSize > 0) {
				if (numConverted >= config.chunkSize) { console.log("BREAKING EARLY AFTER [" + config.chunkSize + "] conversions!!!"); break; }
			}
		}
	}
	i++;
}

// first 20: 3:29
// second 20: 3:59

execSync("rm " + blankPath);

// here's how to count pages in a pdf, on OSX
// mdls PROBLEMCHART\ -\ Laina\ Cross_71748_assignsubmission_file_Laina\ Cross\ BIOL\ 125.pdf  | awk '/kMDItemNumberOfPages/{print $3}'
// here's how to count for EVERY fle in a dir:
// for file in output/*.pdf; do printf "$file: "; mdls $file | awk '/kMDItemNumberOfPages/{print $3}'; done
// 
// here's how to sum it all up:
// for file in output/*.pdf; do mdls $file | awk '/kMDItemNumberOfPages/{print $3}'; done | awk '{ SUM += $1 } END { print SUM }'

console.log("Closing ssh tunnel...");
execSync("./helpers/tunnelManager.sh close " + config.localTunnelPort + " " + config.remoteTunnelPort + " " + config.tunnelUser + " " + config.tunnelHost);
stampLog("FINISHED RUN");
