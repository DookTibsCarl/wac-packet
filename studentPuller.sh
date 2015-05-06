#!/usr/local/bin/node

try {
	var argv = require('optimist')
		.describe('token', 'Moodle web services API token')
		.describe('courseId', 'Moodle course id')
		.demand(['token', 'courseId'])
		.argv;
	var execSync = require('exec-sync');
} catch (e) {
	console.log("Error loading dependencies; did you run 'npm install'?");
	return;
}

var cmd = "curl -s -X POST -F 'courseid=" + argv.courseId + "' -F 'options[0][name]=userfields' -F 'options[0][value]=department,email,fullname,id,username' 'https://moodle2014-15.carleton.edu/webservice/rest/server.php?wstoken=" + argv.token + "&wsfunction=core_enrol_get_enrolled_users&moodlewsrestformat=json'"
console.log("cmd is [" + cmd + "]");
var userDataRaw = execSync(cmd);

var userData = JSON.parse(userDataRaw);
console.log("found [" + userData.length + "] users");
if (userData.length > 0) {
	for (var i = 0; i < userData.length ; i++) {
		var currUser = userData[i];
		if (currUser.department == "") {
			console.log("[" + i + "] [" + currUser.fullname + "]/[" + currUser.username + "]");
		}
	}
} else {
	console.log("no users found!");
}
