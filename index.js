const fs = require("fs");
var login = require("facebook-chat-api");
var toHex = require('colornames');
var request = require('request');
require('dotenv').config();
var credentials = {email: process.env.FB_EMAIL, password: process.env.FB_PASSWORD};
// Create simple echo bot
login(credentials, function callback (err, api) {
    if(err) return console.error(err);
	  api.setOptions({selfListen: true})
    api.listen(function callback(err, message) {
    if(message.type == 'message'){
			var body = message.body;
      console.log(api.threadColors);
			console.log(body);
			if(body.toLowerCase() == "help"){
				api.sendMessage("Try: help departments",message.threadID);
        return;
      }
			var words = body.split(" ");
			var colorHex;
			for(var i = 0; i < words.length; i++){
				if(toHex(words[i]) != undefined){
					colorHex = toHex(words[i]);
				}
			}
			if(colorHex != undefined){

				api.changeThreadColor(colorHex,message.threadID, function callback(err) {
	       				if(err) return console.error(err);
	    			});
			}
			var regex1 = /\w{4}\d{3}/
			var course;
			for(var i = 0; i < words.length; i++){
				if(words[i].match(regex1)){
					course = words[i];
				}
			}
			//Get department if it is the only thing sent in
			var regex2 = /^\w{4}$/
			var dpt; //department

			if(body.match(regex2)){
				dpt = body.match(regex2)[0];
				console.log(dpt);
			}

			if(course != undefined){
				console.log(course);
    		request('http://api.umd.io/v0/courses/' + course, function (error, response, body) {
      			if (!error && response.statusCode == 200) {
        				var jsonResponse = JSON.parse(body);
    				//console.log(jsonResponse.description);
    				//console.log(jsonResponse.course_id);
    				api.sendMessage(jsonResponse.description,message.threadID);
      			}
    		});
			}
			if(body.toLowerCase() == "help departments"){
				var returning = ""
				request('http://api.umd.io/v0/courses/departments', function (error, response, body) {
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
				let reqUrl = 'http://api.umd.io/v0/courses?dept_id=math' + dpt;
        request('http://api.umd.io/v0/courses?dept_id=math', function (error, response, body) {
		  		 if (!error && response.statusCode == 200) {
              // console.log(response);
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
