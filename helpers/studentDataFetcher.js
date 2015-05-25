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
	getCompletedStudentData: function(dataFile, aliases, getEvenIncompleteStudents) {
		// var cmd = "awk -f helpers/getCompletedStudentsData.awk " + dataFile;
		var cmd = "cat " + dataFile + " | awk -f helpers/get" + (getEvenIncompleteStudents ? "All" : "Completed") + "StudentsData.awk";

		var userDataRaw = execSync(cmd);
		var userDataChunks = userDataRaw.split("\n");

		var userData = [];
		for (var i = 0 ; i < userDataChunks.length ; i++) {
			var singleLineChunks = (userDataChunks[i]).split("|");

			// when downloading from Moodle, it names files based on student name, NOT username. So sometimes there
			// are conflicts. In 2015 for instance there were two students with same name but different usernames. 
			// This is a real PITA. We need to manually inspect the files on the filesystem and name them appropriately,
			// and then add an entry in config.js indicating the filesystem name that correponds to the username.
			//
			// FOR EXAMPLE - say we have Joe Smith / smithj1 / "Joe Smith Essay.pdf", and
			// Joe Smith / smithj2 / "Joe Smith Statement.doc". On the filesystem we'd rename to "Joe SmithOne Essay.pdf" and
			// "Joe SmithTwo Statement.doc", and then add aliases in config.js like .........FINISH ME
			var fsName = singleLineChunks[1];
			fsName = fsName.replace(/'/g, "");
			if (aliases[singleLineChunks[0]] != undefined) {
				fsName = aliases[singleLineChunks[0]];
			}

			userData.push({ username: singleLineChunks[0], fsKey: fsName, name: singleLineChunks[1], submissionDate: singleLineChunks[2] });
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

		var studentUsernameToData = {};

		for (var i = 0 ; i < userData.length ; i++) {
			var loopData = userData[i];

			var storageKey = loopData.username;
			studentUsernameToData[storageKey] = loopData;
		}
		return { count: userData.length, data: studentUsernameToData };
	}
	
	/*
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
	*/
}
