var execSync = require('exec-sync');

module.exports = {
	getStudentData: function(courseId, token) {
		var cmd = "curl -s -X POST -F 'courseid=" + courseId + "' -F 'options[0][name]=userfields' -F 'options[0][value]=department,email,fullname,id,username,lastname,firstname' 'https://moodle2014-15.carleton.edu/webservice/rest/server.php?wstoken=" + token + "&wsfunction=core_enrol_get_enrolled_users&moodlewsrestformat=json'"
		var userDataRaw = execSync(cmd);
		var userData = JSON.parse(userDataRaw);

		var studentFullNameToData = {};
		var studentsFound = 0;
		if (userData.length > 0) {
			/*
			userData.sort(function(a, b) {
				if (a.lastname < b.lastname) { return -1; }
				if (a.lastname > b.lastname) { return 1; }
				if (a.firstname < b.firstname) { return -1; }
				if (a.firstname > b.firstname) { return 1; }
				return 0;
			});
			*/

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
