var execSync = require('exec-sync');
var sleep = require('sleep');

var combineStudentFiles = function(workDir, studentNetId) {
	var getFilesCmd = "ls " + workDir + "/" + studentNetId + "_*";
	var filesRaw = execSync(getFilesCmd);
	var files = filesRaw.split("\n");

	var joinCmd = "\"/System/Library/Automator/Combine PDF Pages.action/Contents/Resources/join.py\" -o \"" + workDir + "/" + studentNetId + ".pdf\"";
	// var numPages = [];
	for (var i = 0 ; i < files.length ; i++) {
		joinCmd += " \"" + files[i] + "\"";
		// var pagesInThisPdf = countPages(files[i]);
		// numPages.push(pagesInThisPdf);
		// console.log(files[i] + " has [" + pagesInThisPdf + "] pages...");
	}
	console.log("Joining via [" + joinCmd + "]...");

	try {
		execSync(joinCmd);
	} catch (e) {
		console.log("WARNING WHILE JOINING (" + e + ") - probably ok but check this...");
	}

	for (var i = 0 ; i < files.length ; i++) {
		execSync("rm \"" + files[i] + "\"");
	}

	var pagesInCombo = countPages(workDir + "/" + studentNetId + ".pdf");
	console.log("combined pdf has [" + pagesInCombo + "] pages...");
	// generatePdfOnTheFly('<b>this</b> is a<p>test!', workDir + "/blank.pdf");
	if (pagesInCombo % 2 == 1) {
		console.log("add padding page to end...");
		execSync("mv \"" + workDir + "/" + studentNetId + ".pdf" + "\" \"" + workDir + "/" + studentNetId + "_prepad.pdf\"");
		try {
			joinCmd = "\"/System/Library/Automator/Combine PDF Pages.action/Contents/Resources/join.py\" -o \"" + workDir + "/" + studentNetId + ".pdf\" \"" + workDir + "/" + studentNetId + "_prepad.pdf\" \"" + workDir + "/blankPage.pdf" + "\"";
			execSync(joinCmd);
		} catch(e) {
		}
		execSync("rm \"" + workDir + "/" + studentNetId + "_prepad.pdf\"");
	}
};

var generatePdfOnTheFly = function(html, filename) {
	cmd = "echo '" + html + "' | wkhtmltopdf -q - '" + filename + "'";
	execSync(cmd);
};

var countPages = function(pdfPath, attemptNum) {
	if (attemptNum == null) { attemptNum = 1; }
	console.log("counting pages, attempt #" + attemptNum);

	if (attemptNum > 5) { return 0; }

	var countCmd = "mdls \"" + pdfPath + "\" | awk '/kMDItemNumberOfPages/{print $3}'";
	try {
		var numPages = execSync(countCmd);
		var rv = Number(numPages);

		if (rv == 0) {
			console.log("waiting " + attemptNum + " second(s) before retry...");
			sleep.sleep(attemptNum);
			rv = countPages(pdfPath, attemptNum+1);
			return rv;
		} else {
			return rv;
		}
	} catch (e) {
		console.log("error counting pages: " + e);
		return 0;
	}
};

module.exports = {
	combineStudentFiles: combineStudentFiles,
	generatePdfOnTheFly: generatePdfOnTheFly
	// countPages: countPages
};
