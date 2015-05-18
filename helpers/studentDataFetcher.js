var execSync = require('exec-sync');
// var mysql = require('mysql');

var getLdapData = function(netId) {
	console.log("getting ldap data for [" + netId + "]");
	var cmd = "mysql --defaults-extra-file=./helpers/mysqlConfig.cnf campus_directory -N -s -e '";
	cmd += "SELECT CONCAT(carlColleagueId, \",\", carlCohortYear) FROM single_value_attrs WHERE carlNetID = \"" + netId + "\"";
	cmd += "'";

	console.log("cmd [" + cmd + "]");
	var sqlData = execSync(cmd);
	console.log("data [" + sqlData + "]");
	var chunks = sqlData.split(",");
	return {
		carlColleagueId: chunks[0],
		carlCohortYear: chunks[1]
	};
};

module.exports = {
	getLdapData: getLdapData,

	// take two - instead of hitting Moodle API, let's just parse a local file to get
	// student names and their completion times
	getCompletedStudentData: function(dataFile, getEvenIncompleteStudents) {
		// var cmd = "awk -f helpers/getCompletedStudentsData.awk " + dataFile;
		var cmd = "cat " + dataFile + " | awk -f helpers/get" + (getEvenIncompleteStudents ? "All" : "Completed") + "StudentsData.awk";

		var userDataRaw = execSync(cmd);
		var userDataChunks = userDataRaw.split("\n");

		var userData = [];
		for (var i = 0 ; i < userDataChunks.length ; i++) {
			var singleLineChunks = (userDataChunks[i]).split("|");
			userData.push({ username: singleLineChunks[0], name: singleLineChunks[1], submissionDate: singleLineChunks[2] });
		}


		if (userData.length > 0) {
			userData.sort(function(a, b) {
				var aFirstInitial = a.username.substring(a.username.length-1)
				var bFirstInitial = b.username.substring(b.username.length-1)
				var aLastName = a.username.substring(0, a.username.length - 1);
				var bLastName = b.username.substring(0, b.username.length - 1);

				if (aLastName < bLastName) { return -1; }
				if (aLastName > bLastName) { return 1; }
				if (aFirstInitial < bFirstInitial) { return -1; }
				if (aFirstInitial > bFirstInitial) { return 1; }
				return 0;
			});
		}

		var studentFullNameToData = {};

		for (var i = 0 ; i < userData.length ; i++) {
			var loopData = userData[i];

			var storageKey = loopData.name;
			while (studentFullNameToData[storageKey] != undefined) {
				console.log("!!! WARNING - DUPLICATE STUDENT NAME [" + loopData.name + "]!!!");
				storageKey += "x";
			}
			studentFullNameToData[storageKey] = loopData;
		}
		return { count: userData.length, data: studentFullNameToData };
	},
	
	getStudentData: function(courseId, token) {
		var cmd = "curl -s -X POST -F 'courseid=" + courseId + "' -F 'options[0][name]=userfields' -F 'options[0][value]=department,email,fullname,id,username,lastname,firstname' 'https://moodle2014-15.carleton.edu/webservice/rest/server.php?wstoken=" + token + "&wsfunction=core_enrol_get_enrolled_users&moodlewsrestformat=json'"
		var userDataRaw = execSync(cmd);
		var userData = JSON.parse(userDataRaw);

		var studentFullNameToData = {};
		var studentsFound = 0;
		if (userData.length > 0) {
			userData.sort(function(a, b) {
				if (a.lastname < b.lastname) { return -1; }
				if (a.lastname > b.lastname) { return 1; }
				if (a.firstname < b.firstname) { return -1; }
				if (a.firstname > b.firstname) { return 1; }
				return 0;
			});

			for (var i = 0; i < userData.length ; i++) {
				var currUser = userData[i];
				if (currUser.department == "") {
					studentFullNameToData[currUser.fullname] = currUser;
					studentsFound++;
				}
			}
		}

		return { count: studentsFound, data: studentFullNameToData };
	}
}
