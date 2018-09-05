const fs = require("fs");
const language = require('@google-cloud/language');
const client = new language.LanguageServiceClient();
var login = require("facebook-chat-api");
var toHex = require('colornames');
var request = require('request');
require('dotenv').config();
var credentials = {email: process.env.FB_EMAIL, password: process.env.FB_PASSWORD};
//set GOOGLE_APPLICATION_CREDENTIALS=C:\Users\Marc\Downloads\facebook-chat-bot-credentials.json
login(credentials, function callback (err, api) {
    if(err) return console.error(err);
	  api.setOptions({selfListen: true});
    api.listen(function callback(err, message) {
    if(message.type == 'message'){
      var stopTyping = api.sendTypingIndicator(message.threadID);
			var body = message.body;
      //api.changeThreadColor("#0000ff", message.threadID);
			if(body.toLowerCase() == "help" || body.toLowerCase() == "?"){
				api.sendMessage("Try 'help departments' or 'birthdays?' or 'help threads'",
        message.threadID);
        stopTyping();
        return;
      }

      if(body.toLowerCase() == "birthdays?"){
        api.getFriendsList((err, data) => {
          console.log(data);
          if(err) return console.error(err);
          data = data.filter(person => {
            return person.isBirthday == true;
          });
          names = data.map(person => {
            return person.fullName;
          })
          var returning = "";
          if(names.length == 0)
            returning += "none of my friends";
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
          stopTyping();
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

      var regex3 = /^threads (\d+)/
      var threads;
      if(body.match(regex3)){
        threads =  parseInt(body.match(regex3)[1]);
			}

			if(course != undefined){
    		request('https://api.umd.io/v0/courses/' + course, function (error, response, body) {
      			if (!error && response.statusCode == 200) {
        				var jsonResponse = JSON.parse(body);
    				    api.sendMessage(jsonResponse.description,message.threadID);
                // api.setMessageReaction(":like:", message.threadID);
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
  							api.sendMessage(myClass.department +":\n" + returning+
                "Give me a class code for a description",message.threadID);
		  			  }
        });
			}

// https://cloud.google.com/natural-language/docs/analyzing-sentiment

      if(body.toLowerCase() == "help threads"){
        api.sendMessage("Try sending a message like 'threads 20' to "
        "check last 20(for example) people's last message " +
        " to or from me to analyze positivity in the text. -1 to -0.3 = very negative, " +
        "-0.3 - -0.1 = negative, -0.1 - 0.1 = neutral, 0.1 to 0.3 = positive, " +
        "0.3 - 1 = very positive. For more information about scoring, check out" +
        "https://cloud.google.com/natural-language/docs/basics#interpreting_sentiment_analysis_values"
        ,message.threadID);
      }

      if(threads != undefined){
        if(threads > 500){
          threads = 500;
        }
        api.sendMessage("checking last " + threads + " people's last message " +
        " to or from me to analyze positivity in the text. -1 to -0.3 = very negative, " +
        "-0.3 - -0.1 = negative, -0.1 - 0.1 = neutral, 0.1 to 0.3 = positive, " +
        "0.3 - 1 = very positive.", message.threadID);
        api.getThreadList(threads, null, [], (err, list)=>{
          var snippets = list.map(person => {
            return person.snippet;
          })
          snippets = snippets.filter(snip => {
            return snip.toLowerCase() !== "you are now connected on messenger." &&
            snip.length < 100;
          })
          var returning = "";
          for(snip in snippets){
            if(snip == snippets.length - 1)
              returning += snippets[snip];
            else returning += snippets[snip] + ". ";
          }
          const text = returning;

          // Prepares a document, representing the provided text
          const document = {
            content: text,
            type: 'PLAIN_TEXT',
          };

          // Detects the sentiment of the document
          client
            .analyzeSentiment({document: document})
            .then(results => {
              const sentiment = results[0].documentSentiment;
              api.sendMessage(`Sentiment score: ${sentiment.score}`, message.threadID);
              // const sentences = results[0].sentences;
              // sentences.forEach(sentence => {
              //   console.log(`Sentence: ${sentence.text.content}`);
              //   console.log(`  Score: ${sentence.sentiment.score}`);
              //   console.log(`  Magnitude: ${sentence.sentiment.magnitude}`);
              // });
            })
            .catch(err => {
              console.error('ERROR:', err);
            });
            stopTyping();
        });
      }
	  }
  });
});
