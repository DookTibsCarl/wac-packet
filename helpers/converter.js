var execSync = require('exec-sync');
var path = require('path');
var fs = require('fs');
var csg = require('../helpers/coverSheetGenerator');

var countInArray = function(arr, searchString) {
	var el;
	var count = 0;
	for (var i = 0; i < arr.length ; i++) {
		el = arr[i];
		if (el.indexOf(searchString) != -1) {
			count++;
		}
	}
	return count;
};

var execSyncWrapper = function(cmd) {
	console.log("CMD [" + cmd + "]");
	execSync(cmd);
};

var	doesSubmissionLookValid =  function(files) {
	// we need an essay, and at least 3 prompt/paper pairs. Emphasis on PAIRS.
	var essayCount = countInArray(files, "/essay/");
	var paper1PCount = countInArray(files, "/paper1_prompt/");
	var paper1SCount = countInArray(files, "/paper1_submission/");
	var paper2PCount = countInArray(files, "/paper2_prompt/");
	var paper2SCount = countInArray(files, "/paper2_submission/");
	var paper3PCount = countInArray(files, "/paper3_prompt/");
	var paper3SCount = countInArray(files, "/paper3_submission/");

	return essayCount == 1
		&& (paper1PCount == 1 && paper1SCount == 1)
		&& (paper2PCount == 1 && paper2SCount == 1)
		&& (paper3PCount == 1 && paper3SCount == 1);
	/*
	return essayCount == 1 &&
		paper1Count == 2 &&
		paper2Count == 2 &&
		paper3Count == 2 &&
		(paper4Count == 2 || paper4Count == 0) &&
		(paper5Count == 2 || paper5Count == 0);
	*/
};

var convertSingleFile = function(filename, destinationDir, netId, singleFileCounter) {
	var sourcePath = path.resolve(filename);
	console.log("full path [" + sourcePath + "]");

	var enclosingDir = sourcePath.substr(0, sourcePath.lastIndexOf("/")+1);
	var justName = sourcePath.substr(sourcePath.lastIndexOf("/") + 1, sourcePath.lastIndexOf("."));
	var extension = sourcePath.substr(sourcePath.lastIndexOf(".") + 1).toLowerCase();
	var nameWithoutExt = justName.substr(0, justName.lastIndexOf("."));

	// var destPath = path.resolve(destinationDir + "/" + nameWithoutExt + ".pdf");
	var destPath = path.resolve(destinationDir + "/" + netId + "_" + singleFileCounter + ".pdf");

	// console.log("source [" + sourcePath + "], name [" + justName + "], ext [" + extension + "], dest [" + destPath + "]");

	if (extension == "pdf") {
		console.log("pdf - requires no further processing");
		var cmd = "cp '" + sourcePath + "' '" + destPath + "'";
		execSyncWrapper(cmd);
	} else if (extension == "doc" || extension == "docx") {
		console.log("converting Word doc...");
		var cmd = "./helpers/wordToPdf.scpt \"" + sourcePath + "\"";
		execSyncWrapper(cmd);
		cmd = "mv '" + enclosingDir + "wordToPdfConverted.pdf' '" + destPath + "'";
		execSyncWrapper(cmd);
	} else if (extension == "txt" || extension == "html") {
		console.log("converting html/text file...");
		var cmd = "wkhtmltopdf -q '" + sourcePath + "' '" + destPath + "'";
		execSyncWrapper(cmd);
	} else if (extension == "jpeg" || extension == "jpg" || extension == "png") {
		console.log("converting image...");
		var cmd = "convert '" + sourcePath + "' '" + destPath + "'";
		try {
			execSyncWrapper(cmd);
		} catch (e) {
			console.log("possible error: [" + e + "]; continuing...");
		}
	} else {
		console.log("cannot handle this format: [" + extension + "] -- NEED TO LOG THIS SOMEHOW!!!");
		return false;
	}
	return true;
};

var zeroPad = function(num) {
	var rv = "" + num;
	while (rv.length < 2) {
		rv = "0" + rv;
	}
	return rv;
};

// order the files:
// essays come before papers
// papers come in order (1, 2, 3(, 4(, 5)))
// within paperX, go by increasing file size (attempt to get prompt before response)
var fileSorter = function(a, b) {
	var aChunks = a.split("/");
	var bChunks = b.split("/");
	var aArea = aChunks[aChunks.length - 2];
	var bArea = bChunks[bChunks.length - 2];

	if (aArea == "essay" && bArea != "essay") {
		return -1;
	} else if (aArea != "essay" && bArea == "essay") {
		return 1;
	} else {
		var aPaperNum = Number(aArea.substr(5, 1));
		var bPaperNum = Number(bArea.substr(5, 1));

		if (aPaperNum < bPaperNum) {
			return -1;
		} else if (aPaperNum > bPaperNum) {
			return 1;
		} else {
			// "p" for prompt or "s" for submission
			var aType = aArea.substr(7, 1);
			var bType = bArea.substr(7, 1);

			if (aType < bType) {
				return -1;
			} else if (aType > bType) {
				return 1;
			} else {
				return 0;
			}
			/*
			var aStats = fs.statSync(a);
			var bStats = fs.statSync(b);

			var aSize = Number(aStats["size"]);
			var bSize = Number(bStats["size"]);
			if (aSize < bSize) {
				return -1;
			} else if (aSize > bSize) {
				return 1;
			}
			*/
		}
	}
	return 0;	
};

var convertStudentFiles = function(sourceDir, destDir, studentFullName, filesystemKey, studentNetId, rawStudentData) {
	console.log("working on [" + studentFullName + "]/[" + filesystemKey + "]/[" + studentNetId + "]");

	var findCmd = "find " + sourceDir + " -name \"" + filesystemKey + "_*\"";
	var inputFilesRaw = execSync(findCmd);

	if (inputFilesRaw.length > 0) {
		var inputFiles = inputFilesRaw.split("\n");

		inputFiles.sort(fileSorter);

		if (doesSubmissionLookValid(inputFiles)) {
			console.log("submission valid - proceeding");
			var madeCoverSheet = csg.generateCoversheet(sourceDir, destDir, studentNetId, rawStudentData);

			if (!madeCoverSheet) { console.log("FAILED creating coversheet; bailing..."); return false; }

			for (var i = 0 ; i < inputFiles.length ; i++) {
				var lastAttempt = convertSingleFile(inputFiles[i], destDir, studentNetId, zeroPad(i+1));

				if (lastAttempt == false) { return false; }
			}
			return true;
		} else {
			console.log("submission not valid; missing essay, papers, or prompts.");
		}
	}
	return false;
};

module.exports = {
	convertStudentFiles: convertStudentFiles
};
