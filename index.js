const fs = require("fs");
var login = require("facebook-chat-api");
var toHex = require('colornames');
var request = require('request');
require('dotenv').config();
var credentials = {email: process.env.FB_EMAIL, password: process.env.FB_PASSWORD};

login(credentials, function callback (err, api) {
    if(err) return console.error(err);
	  api.setOptions({selfListen: true})
    api.listen(function callback(err, message) {
    if(message.type == 'message'){
			var body = message.body;
      //api.changeThreadColor("#0000ff", message.threadID);
			if(body.toLowerCase() == "help"){
				api.sendMessage("Try 'help departments' or 'birthdays?'",message.threadID);
        return;
      }

      if(body.toLowerCase() == "birthdays?"){
        api.getFriendsList((err, data) => {
          if(err) return console.error(err);
          data = data.filter(person => {
            return person.isBirthday == true;
          });
          names = data.map(person => {
            return person.fullName;
          })
          var returning = "";
          if(names.length == 0)
            returning += "none of your friends";
          //featuring grammatically correct commas and "and"
          for(name in names){
            if(name == names.length - 2)
              returning += names[name] + ", and ";
            else if(name == names.length - 1)
              returning += names[name];
            else returning += names[name] + ", ";
          }
          returning += " have birthdays today";
          api.sendMessage(returning, message.threadID);
        });
      }

			var words = body.split(" ");
      //Get course if it is only thing sent in
      var regex1 = /\w{4}\d{3}/
			var course;
			for(var i = 0; i < words.length; i++){
				if(words[i].match(regex1)){
					course = words[i];
				}
			}
			//Get department if it is the only thing sent in
			var regex2 = /^\w{4}$/
			var dpt;
			if(body.match(regex2)){
				dpt = body.match(regex2)[0];
			}

			if(course != undefined){
    		request('https://api.umd.io/v0/courses/' + course, function (error, response, body) {
      			if (!error && response.statusCode == 200) {
        				var jsonResponse = JSON.parse(body);
    				    api.sendMessage(jsonResponse.description,message.threadID);
                api.setMessageReaction(":like:", message.threadID);
      			}
            //below causes spamming of feed, for now trying a course that doesnt
            //exist will just return blank
            // else {
            //    api.sendMessage("We could not access information on course " + course
            //    + " at this time. Sorry!" ,message.threadID);
            //    course = null;
            //    api.setMessageReaction(":sad:", message.threadID);
            // }
    		});
			}

			if(body.toLowerCase() == "help departments"){
				var returning = ""
				request('https://api.umd.io/v0/courses/departments', function (error, response, body) {
	  			if (!error && response.statusCode == 200) {
  					var jsonResponse = JSON.parse(body);
  					for(var i = 0; i < jsonResponse.length; i++){
  						var myClass = jsonResponse[i];
  						returning += (myClass.dept_id + "\n");
  					}
  					api.sendMessage(returning+"Try a department code",message.threadID);
	  			}
			  });
			}

			if(dpt != undefined){
        var returning = "";
        request('https://api.umd.io/v0/courses?dept_id=' + dpt, function (error, response, body) {
		  		 if (!error && response.statusCode == 200) {
              console.log(body);
		    			var jsonResponse = JSON.parse(body);
  						console.log(jsonResponse);
  						for(var i = 0; i < jsonResponse.length; i++){
  							var myClass = jsonResponse[i];
  							returning += (myClass.course_id + "\n" +  myClass.name+"\n\n");
  						}
  						if(returning.length > 0)
  							api.sendMessage(myClass.department +":\n" + returning+"Give me a class code for a description",message.threadID);
		  			  }
        });
			}
	  }
  });
});
