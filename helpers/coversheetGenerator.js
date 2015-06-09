var studentDataFetcher = require('../helpers/studentDataFetcher');
var fs = require('fs');
var execSync = require('exec-sync');

var MD_SUBMISSIONDATE = 1;
var MD_FULLNAME = 7;
var MD_NETID = 8;
var MD_PROJECT_1 = 9;
var MD_PROJECT_2 = 19;
var MD_PROJECT_3 = 29;
var MD_PROJECT_4 = 39;
var MD_PROJECT_5 = 49;

var MD_OFFSET_DEPT = 0;
var MD_OFFSET_COURSENUM = 1;
var MD_OFFSET_TERM = 2;
var MD_OFFSET_INSTRUCTOR = 3;
var MD_OFFSET_REVISED = 4;
var MD_OFFSET_CRITERIA = 5;

var zeroPad = function(x) {
	return (x < 10 ? "0" : "") + x;
}

var formatDate = function(d) {
	var delim = "-";
	var rv = d.getFullYear() + delim;
	rv += zeroPad(d.getMonth()+1) + delim;
	rv += zeroPad(d.getDate()) + " ";

	delim = ":";
	rv += zeroPad(d.getHours()) + delim;
	rv += zeroPad(d.getMinutes());

	return rv;
};

var getProjectMetadata = function(md, projectNum, offset) {
	if (md == null) { return ""; }

	var baseIdx = 0;
	if (projectNum == 1) { baseIdx = MD_PROJECT_1; }
	if (projectNum == 2) { baseIdx = MD_PROJECT_2; }
	if (projectNum == 3) { baseIdx = MD_PROJECT_3; }
	if (projectNum == 4) { baseIdx = MD_PROJECT_4; }
	if (projectNum == 5) { baseIdx = MD_PROJECT_5; }

	var actualIdx = baseIdx + offset;

	return md[actualIdx];
}

var massageDate = function(d) {
	var dateAndTime = d.split(" ");
	var datePortion = dateAndTime[0];
	var chunks = datePortion.split("/");
	return chunks[2] + "-" + chunks[1] + "-" + chunks[0];
}

// if this order changes in Moodle we'll need to update...
var criteria = [ "Observation", "Analysis", "Interpretation", "Documented Sources", "Thesis-driven Argument" ];
var criteriaWidths = [ 15, 15, 20, 25, 25 ];

var generateProjectHtml = function(md, projectNum) {
	var html = "<b><u>Project " + projectNum + "</u></b><br>";

	html += "<table border=0 width=100%><tr>";
	html += "<tr>";
	html += "<td width=33%>Department: " + getProjectMetadata(md, projectNum, MD_OFFSET_DEPT) + "</td>";
	html += "<td width=33%>Course Number: " + getProjectMetadata(md, projectNum, MD_OFFSET_COURSENUM) + "</td>";
	html += "<td width=33%>Term Enrolled: " + getProjectMetadata(md, projectNum, MD_OFFSET_TERM).substring(4) + "</td>";
	html += "</tr></table>";
	html += "<table border=0 width=100%><tr>";
	html += "<td width=50%>Instructor: " + getProjectMetadata(md, projectNum, MD_OFFSET_INSTRUCTOR) + "</td>";
	html += "<td width=50%>Project Revised for portofolio? " + (1 == getProjectMetadata(md, projectNum, MD_OFFSET_REVISED) ? "Yes" : "No") + "</td>";
	html += "</tr>";
	html += "</table>";

	html += "<table border=0 width=100%>";
	// html += "<tr><td colspan=5>This assignment addresses the following criteria:</td></tr>";
	html += "<tr>";
	for (var i = 0 ; i < 5 ; i++) {
		var val = getProjectMetadata(md, projectNum, MD_OFFSET_CRITERIA + i);
		var checkedOrNot = val == "1" ? " checked" : "";
		html += "<td width=" + criteriaWidths[i] + "%><input type='checkbox'" + checkedOrNot + "><font size=-1>" + criteria[i] + "</font></td>";
	}
	html += "</tr>";
	html += "</table>";

	html += "<p>";

	if (projectNum < 5) { html += "<hr>"; }

	return html;
}

var generateBlankCoversheet = function(outputFilename) {
	html = "";
	html += "<center><h3>Carleton College: Portfolio Submission Form</h3></center><p>";
		html += "<table width=100% border=0><tr>";
			html += "<td width=50%>Name: </td>";
			html += "<td>Colleague ID: </td>";
			html += "</tr><tr>";
			html += "<td>Class Year: </td>";
			html += "<td>Date Submitted: </td>";
		html += "</tr></table><p>";

	for (var i = 1 ; i <= 5 ; i++) {
		html += generateProjectHtml(null, i);
	}

	fs.writeFileSync(outputFilename, html);
}

var generateCoversheet = function(inputDir, outputDir, netId, rawStudentData) {
	console.log("generating coversheet for [" + netId + "]...");

	try {
		var ldapData = studentDataFetcher.getLdapData(netId);
		var colleagueId = ldapData.carlColleagueId;
		var classYear = ldapData.carlCohortYear;

		// var readMetadataCmd = "awk -F \"\\t\" '$" + MD_NETID + " == \"" + netId + "\" {print}' \"" + inputDir + "/metadata.txt\"";
		var readMetadataCmd = "cat \"" + inputDir + "/metadata.txt\" | awk -F \"\\t\" '$" + (MD_NETID+1) + " == \"" + netId + "\" {print}'";
		console.log("read cmd [" + readMetadataCmd + "]");
		var rawMetadata = execSync(readMetadataCmd);
		var md = rawMetadata.split("\t");

		// for (var i = 0 ; i < md.length ; i++) { console.log("[" + i + "] [" + md[i] + "]"); }

		console.log("got metadata [" + md[MD_FULLNAME] + "]");
		if (md[MD_FULLNAME] == undefined) {
			console.log("no metadata; bailing!");
			return false;
		}

		var html = "";

		var submissionDate = new Date(Date.parse(rawStudentData.submissionDate));
		var formattedDate = formatDate(submissionDate);
		html += "<center><h3>Carleton College: Portfolio Submission Form</h3></center><p>";
			html += "<table width=100% border=0><tr>";
				html += "<td width=50%>Name: " + md[MD_FULLNAME] + " (" + netId + ")</td>";
				html += "<td>Colleague ID: " + colleagueId + "</td>";
				html += "</tr><tr>";
				html += "<td>Class Year: " + classYear + "</td>";
				// html += "<td>Date Submitted: " + massageDate(md[MD_SUBMISSIONDATE]) + "</td>";
				html += "<td>Date Submitted: " + formattedDate + "</td>";
			html += "</tr></table><p>";

		for (var i = 1 ; i <= 5 ; i++) {
			html += generateProjectHtml(md, i);
		}

		fs.writeFileSync(outputDir + "/" + netId + "_00.html", html);
		execSync("wkhtmltopdf -q '" + outputDir + "/" + netId + "_00.html" + "' '" + outputDir + "/" + netId + "_00.pdf" + "'");
		execSync("rm \"" + outputDir + "/" + netId + "_00.html\"");

		return true;
	} catch (e) {
		console.log(e);
		return false;
	}
	
};

module.exports = {
	generateCoversheet: generateCoversheet,
	generateBlankCoversheet: generateBlankCoversheet
};
