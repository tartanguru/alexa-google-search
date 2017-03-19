// This skill reuses elements from the Adrian Smart Assistant project
// https://github.com/TheAdrianProject/AdrianSmartAssistant/blob/master/Modules/Google/Google.js

'use strict';

var AlexaSkill = require('./AlexaSkill');
var rp = require('request-promise');
var $ = require('cheerio');
var Entities = require('html-entities').XmlEntities;
var entities = new Entities();
var striptags = require('striptags');
var xray = require('x-ray')();
var cheerioTableparser = require('cheerio-tableparser');
var cheerio = require('cheerio');
var summary = require('node-tldr');

var localeResponseEN = [
    'Welcome to Google Search. What are you searching for?',
    'Google Search Result for: ',
    'Error',
    'I found a table of Results.',
    'dot',
    ' and ',
    ' less than ',
    "I’m sorry, I wasn't able to find an answer.",
    'There was an error processing your search.',
    'I could not find an exact answer. Here is my best guess: ',
    ' in the ',
    " at ",
    "The current Score is:  ",
    "The Final Score, ",
    " was: ",
    "The next game is ",
    "According to Wikipedia, "
    
     
];

var localeResponseDE = [
    'Willkommen zur Google Suche. Wonach soll ich suchen?',
    'Google Suche nach: ',
    'Fehler',
    'Ich fand eine Tabelle der Ergebnisse.',
    'punkt',
    ' und ',
    ' weniger als ',
    "Es tut mir leid, ich konnte keine Antwort finden.",
    'Bei der Suche ist leider ein Fehler aufgetreten.',
    'Ich konnte keine genaue Antwort finden. Hier ist meine beste Vermutung: ',
    " in dem ",
    " ein ",
    "Der aktuelle Live Score ist:",
    "Das Finale Ergebnis, ",
    " war: ",
    "Das nächste Spiel ist ",
    "Laut Wikipedia, "
     
];

// Create google search URL - this made up of the main search URL plus a languange modifier (currently only needed for German)

var localeGoogleENGB = ["http://www.google.co.uk/search?q=", "&hl=en-GB"];
var localeGoogleDE = ["http://www.google.com/search?q=", "&hl=de"];
var localeGoogleENUS = ["http://www.google.com/search?q=", ""];

var sessionLocale = '';

var localeResponse = localeResponseEN;
var localeGoogle = localeGoogleENUS;


var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]'; NOTE THIS IS A COMPLETELY OPTIONAL STEP WHICH MAY CAUSE MORE ISSUES THAN IT SOLVES IF YOU DON'T KNOW WHAT YOU ARE DOING

var AlexaGoogleSearch = function () {
	AlexaSkill.call(this, APP_ID);
};

AlexaGoogleSearch.prototype = Object.create(AlexaSkill.prototype);
AlexaGoogleSearch.prototype.constructor = AlexaGoogleSearch;

AlexaGoogleSearch.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
	console.log("AlexaGoogleSearch onLaunch requestId" + launchRequest.requestId + ", sessionId: " + session.sessionId);
    
    
    

           
    
	var speechOutput = localeResponse[0], repromptText = localeResponse[0];
	response.ask(speechOutput, repromptText);
};

AlexaGoogleSearch.prototype.intentHandlers = {
	"SearchIntent": function (intent, session, response) {
        
		var query = intent.slots.search.value;
		
		// Title for Alexa app card
		var cardTitle = (localeResponse[1] + query);
		
		// Remove spaces and replace with +
		query = query.replace(" ", "+");
		
		// Remove _ and replace with +
		query = query.replace(/ /g, "+");
		
		var speechOutput = localeResponse[2];
        
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
        //                                                TEXT CLEANUP
        
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
        function speakResults(speechText) {
            
            // strip out html tags to leave just text
			var speechOutputTemp = entities.decode(striptags(speechText)); // Remove html tags
            
                        // Remove whitespace
            
            speechOutputTemp = speechOutputTemp.replace(/    /g, ' '); // replace quad spaces 
            speechOutputTemp = speechOutputTemp.replace(/   /g, ' '); // replace triple spaces 
            speechOutputTemp = speechOutputTemp.replace(/  /g, ' '); // replace double spaces 
            
            // Deal with stray Wikipedia at end of answers
            if (speechOutputTemp.endsWith("Wikipedia") == true ){
                console.log("Wikipedia found")
                var n = speechOutputTemp.lastIndexOf("Wikipedia");
                speechOutputTemp = localeResponse[16] + speechOutputTemp.substring(0,n);
            }

            
            // Create card text
			var cardOutputText = speechOutputTemp;
            cardOutputText = cardOutputText.replace(/SHORTALEXAPAUSERTN/g, '\n'); // remove pauses from card text and add carriage return
            cardOutputText = cardOutputText.replace(/SHORTALEXAPAUSE/g, ''); // remove pauses from card text
            cardOutputText = cardOutputText.replace(/ALEXAPAUSE/g, '\r\n'); // remove pauses from card text and add carriage return

            
			// make sure all full stops have space after them otherwise alexa says the word dot 
            
            // Deal with URL's and time of day
            speechOutputTemp = speechOutputTemp.replace(/\.com/g, (" " + localeResponse[4] + " com ")); // deal with dot com
            speechOutputTemp = speechOutputTemp.replace(/\.co\.uk/g, (" " + localeResponse[4] + " co " + localeResponse[3] + " uk ")); // deal with .co.uk
            speechOutputTemp = speechOutputTemp.replace(/\.net/g, (" " + localeResponse[4] + " net ")); // deal with .net
            speechOutputTemp = speechOutputTemp.replace(/\.org/g, (" " + localeResponse[4] + " org ")); // deal with .org
            speechOutputTemp = speechOutputTemp.replace(/\.org/g, (" " + localeResponse[4] + " de ")); // deal with .de
            speechOutputTemp = speechOutputTemp.replace(/\a\.m/g, "am"); // deal with a.m
            speechOutputTemp = speechOutputTemp.replace(/\p\.m/g, "pm"); // deal with p.m
            speechOutputTemp = speechOutputTemp.replace(/\U\.S/g, "US"); // deal with US
            

              // deal with decimal places
            speechOutputTemp = speechOutputTemp.replace(/\d[\.]{1,}/g, '\$&DECIMALPOINT'); // search for decimal points following a digit and add DECIMALPOINT TEXT
            speechOutputTemp = speechOutputTemp.replace(/\.DECIMALPOINT/g, 'DECIMALPOINT'); // remove decimal point

              // deal with characters that are illegal in SSML
            speechOutputTemp = speechOutputTemp.replace(/&/g, localeResponse[5]); // replace ampersands 
            speechOutputTemp = speechOutputTemp.replace(/</g, localeResponse[6]); // replace < symbol 
            speechOutputTemp = speechOutputTemp.replace(/""/g, ''); // replace double quotes 

            
            
            // Add in SSML pauses
            speechOutputTemp = speechOutputTemp.replace(/SHORTALEXAPAUSERTN/g, '<break time=\"250ms\"/>'); // add in SSML pauses at table ends 
            speechOutputTemp = speechOutputTemp.replace(/SHORTALEXAPAUSE/g, '<break time=\"250ms\"/>'); // add in SSML pauses at table ends
            speechOutputTemp = speechOutputTemp.replace(/ALEXAPAUSE/g, '<break time=\"500ms\"/>'); // add in SSML pauses at table ends 
			speechOutputTemp = speechOutputTemp.replace(/\./g, ". "); // Assume any remaining dot are concatonated sentances so turn them into full stops with a pause afterwards
			var speechOutput = speechOutputTemp.replace(/DECIMALPOINT/g, '.'); //Put back decimal points
            
            // Get rid of Wikipedia statement at end of answer as it sounds odd
            

            
						
			if (speechOutput === "") {
                speechOutput = localeResponse[7]; // Return an answer can't be found message  
            }
            
            // Covert speechOutput into SSML so that pauses can be processed
            var SSMLspeechOutput = {
                speech: '<speak>' + speechOutput + '</speak>',
                type: 'SSML'
            };

            
			response.tellWithCard(SSMLspeechOutput, cardTitle, cardOutputText); // pruduce voice response and card in Alexa app
            
 
            
        }
        
        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
        //                                                    MAIN PARSER
        
        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
		// Parsing routine heavily modified from 
		// https://github.com/TheAdrianProject/AdrianSmartAssistant/blob/master/Modules/Google/Google.js        

		
        
        // create userAgent string from a number of selections
        
        var userAgent = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
            'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/602.2.14 (KHTML, like Gecko) Version/10.0.1 Safari/602.2.14',
            'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:50.0) Gecko/20100101 Firefox/50.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
        ];
        
        var sel = Math.floor((Math.random() * 5));
		var userAgentRandom = userAgent[sel]; // Select a random user agent - this MIGHT help against google thinking we are a bot
        
        console.log("User Agent: - " + userAgentRandom);
        
		// Create search sring
		var queryString = localeGoogle[0] + query + '&oe=utf8' + localeGoogle[1];
        
       
        // set request-promise options
        var options = {
            uri: queryString,
            'User-Agent': userAgentRandom
        };
		
		rp(options)
			.then(function(body) {
				console.log("Running parsing");
				console.log("Search string is:" + queryString);
				console.log("HTML is:" + $('#ires', body).html()); // Commented out in released builds for performance but recommended eneabling for testing
								
			// result variable init
                var found = 0;


                //how many 2
                if (!found && $('._m3b', body).length > 0) {
                    //how many
                    var items = $('._m3b', body).get().length; // find how many lines there are in answer table

                    if (items) {
                        console.log(items + " how many 2 answer found");
                        found = $('._eGc', body).html() + ", ";
                        for (var count = 0; count < items; count++) {	
                            found = found + $('._m3b',body).eq(count).html() + ", ";
                        }
                    }
                    found = found.replace(/<\/span>/g, 'ALEXAPAUSE'); // Find end of lines

                    speakResults(found);
                }
            
                //name list
                if (!found && $('#_vBb',body).length>0){
                    console.log("Found name list");
                    found = $('._H0d',body).html() + "ALEXAPAUSE"; // Get subject of list
                    
                    var items = $('._G0d',body).get().length; // find how many lines there are in name list

                    if (items) {
                        console.log( items + " names found");

                        for (var count = 0; count < items; count++) {	

                            found = found + $('._G0d',body).eq(count).text() + 'SHORTALEXAPAUSERTN';
                        }
                    }
                    found = found.replace(/SHORTALEXAPAUSERTN,/g, ', SHORTALEXAPAUSERTN'); // Deal with commas at end of lines
                    
                    speakResults(found);
                }

                //facts 2
                if (!found && $('._sPg',body).length>0){

                    found = " "+$('._sPg',body).html();
                    console.log("Found facts 2");
                    speakResults(found);
                }

                //facts 1
                if (!found && $('._tXc>span',body).length>0){

                    found = $('._tXc>span',body).html();
                    console.log("Found facts 1");
                    found = found.replace(/<\/span>/g, 'ALEXAPAUSE'); // Find end of lines             
                    speakResults(found);
                }




                // sports matches
                if (!found && $('._Fc',body).length>0){
                    console.log("Found sports matches");

                    // Deal with score
                    var result = $('._Fc>._Hg._tZc',body).html(); // find match and score element
                    result = result.split('</td>').join(' '); // find end of table element tags and replace with spaces 
                    result = result.split('</div>').join(' '); // find end of div element tags and replace with spaces 
                    result = entities.decode(striptags(result)); // get text from remain elements
                    result = result.split(/\@/g).join(' vs. '); // replace @ with vs.
                    
                    console.log ("Result is " + result);

                    var eventTime = $('._Fc>._hg',body).eq(1).text()+'';
                    console.log("Event Time is " + eventTime)
                    
                    var isItFinal = (result.includes( "Final ") || result.includes( "Finale ")) ;  // Check whether this is the final result in English or German               
                    var isItLive = result.includes("Live "); // Check whether this is a live event

                    var eventParamsNum = $('._Fc>._hg',body).length; // check for number of _hg elements that contain information aboutthe game
                    console.log("Number of elements is " +eventParamsNum);
                    var eventLeague = '';
                    var eventTime = '';
                    var eventVenue = '';

                    // Required form of response is 'The next match is Derby vs Leicester in the FA Cup Fourth Round, on Friday 27th Jan' 

                    if (eventParamsNum == 3) {
                        //console.log("3 parameters found");
                        eventLeague = localeResponse[10] + $('._Fc>._hg',body).eq(0).text()+''; // Get league
                        console.log("League is " + eventLeague);
                        eventTime = $('._Fc>._hg',body).eq(1).text()+''; // Get Time
                        console.log("Time is " + eventTime);
                        eventVenue = localeResponse[11] + $('._Fc>._hg',body).eq(2).text()+'';  // Get venue
                        console.log("Venue is " + eventVenue);
                    }

                    if (eventParamsNum == 2) {
                        console.log("2 parameters found");
                        eventLeague = '';
                        console.log(localeResponse[10] + eventLeague);
                        eventTime = $('._Fc>._hg',body).eq(0).text()+''; //Get Time
                        console.log("Time is " + eventTime);
                        eventVenue = localeResponse[11] + $('._Fc>._hg',body).eq(1).text()+''; //Get venue
                        console.log("Venue is " + eventVenue);
                    }
                    
                    if (result.includes( "vs.")) {

                        // this rule looks for a cricket match
                        
                        if (isItLive === true) { //likely to be a cricket match
                            
                        found = "Cricket Match :" + result + eventLeague + " : " + eventTime + eventVenue ;
                        // more handling to be added for cricket
                        
                        } else { 
                            
                        // for football and most other sports assume this is a future match
                        found = localeResponse[15] + result + eventLeague + " : " + eventTime + eventVenue ; 
                        }
                        

                        
                    } else {

                        // Process temas and score
                        var scoreTotal = $('._VMb>._UMb',body).text(); // Find score element
                        var status = $('._VMb>._UMb>._hg>span',body).text(); // Get the games status e.g. final or live
						scoreTotal = scoreTotal.replace(status, ""); // Remove status so we just have the score
						scoreTotal = scoreTotal.replace(/ - /g, '*DASH*') // Replace the dash to make processing easier
                        var scoreBreakdown = scoreTotal.split('*DASH*'); // split score into two halves
                        var scoreFirst = scoreBreakdown[0]; // Take first half as team 1's score
                        var scoreSecond = scoreBreakdown[1]; // Take second half as team 2's score
                        var teamFirst = $('._wS',body).eq(0).text(); // Find first team
                        var teamSecond = $('._wS',body).eq(1).text(); // Find the second team
                        

                        if (isItFinal == true ){
                            
                            found = localeResponse[13] + eventTime + localeResponse[14] + teamFirst + " " +scoreFirst +", " + teamSecond + " "+ scoreSecond ;

                        } else {  
                            
                            found = localeResponse[12] + teamFirst + " " +scoreFirst +", " + teamSecond + " "+ scoreSecond ; 
                        }                
                    }


                    speakResults(found);

                }

                //instant + description 1
                if (!found && $('._Oqb',body).length>0){

                    found = $('._Oqb',body).html();
                    console.log("Found instant and desc 1");

                //how many 1
                    if ( $('._Mqb',body).length>0){

                        found+= " "+$('._Mqb',body).html();
                        console.log("Found Found instant and desc 1 - how many");
                    }

                    speakResults(found);
                }
                //instant + description 2
                if (!found && $('._o0d',body).length>0){

                    console.log("Found Found instant and desc 2")

                    
                    if ($('._cmh',body).length>0) { // check for a table
                        
                        var tablehtml = $('._o0d',body).html()

                        xray(tablehtml, ['table@html'])(function (conversionError, tableHtmlList) {

                        if (tableHtmlList){

                            // xray returns the html inside each table tag, and cherriotableparser
                            // expects needs a valid html table so we need to add table tags
                            var $table2 = cheerio.load('<table>' + tableHtmlList[0]+ '</table>');

                            cheerioTableparser($table2);
                            var headerStart = 0;
                            var data2 = $table2("table").parsetable(false, false, true);

                            var tableWidth = data2.length;
                            var tableHeight = data2[0].length;
                            console.log("Height " + tableHeight);
                            console.log("Width " + tableWidth);

                            var blankFound = 0;
                            var headerText ='';

                            for (var l = 0; l < tableWidth; l++) { 
                            console.log('Table Data @@@@@' + data2[l]+ '@@@@');
                            }

                            // Look to see whether header row has blank cells in it. 
                            // If it does then the headers are titles can't be used so we use first row of table as headers instead

                            for (var i = 0; i < tableWidth; i++) { 
                                console.log(data2[i][0]);

                                    if (data2[i][0] == "") {
                                        blankFound++;
                                    } else {
                                        headerText += (data2[i][0]) + '. SHORTALEXAPAUSE';
                                    }
                            }
                            console.log ("Number of blank cells : " + blankFound)
                            found = localeResponse[3] + ' ALEXAPAUSE ';
                            if (blankFound != 0){
                                headerStart = 1;
                                //found += headerText +' ALEXAPAUSE ';
                            }

                            // Parse table from header row onwards
                            for (var x = headerStart ; x < tableHeight; x++) { 

                                for (var y = 0; y < tableWidth; y++) { 
                                found += ( data2[y][x] +', SHORTALEXAPAUSE');
                                }

                                found += ('ALEXAPAUSE');
                                found = found.replace(/, SHORTALEXAPAUSEALEXAPAUSE/g, '. ALEXAPAUSE') //Tidy up ends of table rows
                            }

                            console.log('Found :' + found)
                        }

                        if (conversionError){
                            console.log("There was a conversion error: " + conversionError); // This will cause fallback to be used
                            found = tablehtml // fallback in case a table isn't found
                        }



                      });
                    } else {
                        
                        found = $('._o0d',body).html();
                        found = found.replace(/<\/li>/g, 'ALEXAPAUSE'); // Find end of lines
   
                    }

                    speakResults(found);

                }



                //simple answer
                if (!found && $('.obcontainer',body).length>0){
                    found = $('.obcontainer',body).html();
                    console.log("Found Simple answer");
                    speakResults(found);

                }

                //Definition
                if (!found && $('.r>div>span',body).first().length>0){
                    found = $('.r>div>span',body).first().html() +" definition. ";
                    console.log("Found definition");
                    //how many
                    var items = $('.g>div>table>tr>td>ol>li',body).get().length; // find how many lines there are in answer table

                    if (items) {
                        console.log( items + " Type 4 answer sections result");

                        for (var count = 0; count < items; count++) {	

                            found = found + $('.g>div>table>tr>td>ol>li',body).eq(count).html() + ", ";
                        }
                    }

                    speakResults(found);
                }
                //TV show
                if (!found && $('._B5d',body).length>0){	
                    found = $('._B5d',body).html();
                    console.log("Found tv show");
                    //how many
                    if ( $('._Pxg',body).length>0){
                        found+= ". "+$('._Pxg',body).html();
                    }
                    //how many
                    if ( $('._tXc',body).length>0){

                        found+= ". "+$('._tXc',body).html();
                    }

                    speakResults(found);
                }

                //Weather
                if (!found && $('.g>.e>h3',body).length>0){

                    found = $('.g>.e>h3',body).html();
                    console.log("Found weather");

                    //how many
                    if ( $('.wob_t',body).first().length>0){

                        found+= " "+ $('.wob_t',body).first().html();
                        console.log("Found weather");
                    }

                    //how many
                    if ( $('._Lbd',body).length>0){

                        found+= " "+ $('._Lbd',body).html();
                        console.log("Found how many");
                    }

                    speakResults(found);
                }

                //Currency (and others maybe?) -- thanks to Mark Riley for this snippet

                if (!found && $('.std._tLi',body).length>0){
                    // data is within a table but we can just take the cheerio text rather than parse it to save processing overhead
                    console.log("Found currency");
                    found = $('.std._tLi',body).text();

                    speakResults(found);
                }
            

            
                //Time, Date
                if (!found && $('._rkc._Peb',body).length>0){

                    found = $('._rkc._Peb',body).html();
                    console.log("Found date and Time");
                    speakResults(found);

                }
                //Maths	
                if (!found && $('.nobr>.r',body).length>0){
                    found = $('.nobr>.r',body).html();
                    console.log("Found maths");
                    speakResults(found);
                }


                // Pass results to text clean up function or say that a result can't be found

                // Say that an answer couldn't be found
                speakResults(localeResponse[7]); 


                //   Deal with any errors
                }).catch(function(err) {
                console.log("ERROR " + err);
                speechOutput = localeResponse[8];
                response.tell(speechOutput);
            })
    },

    "AMAZON.StopIntent": function(intent, session, response) {
        var speechOutput = "";
        response.tell(speechOutput);
    }
}

exports.handler = function(event, context) {
	var AlexaGoogleSearchHelper = new AlexaGoogleSearch();
    sessionLocale = event.request.locale;
    console.log("handler locale is: "+ sessionLocale);
    
    if (sessionLocale == 'de-DE') {
        localeResponse = localeResponseDE;
        localeGoogle = localeGoogleDE;
        console.log("Setting locale to de-DE");
    }   
    if (sessionLocale == 'en-GB') {
        localeResponse = localeResponseEN;
        localeGoogle = localeGoogleENGB; 
        console.log("Setting locale to en-GB");
    }
        if (sessionLocale == 'en-US') {
        localeResponse = localeResponseEN;
        localeGoogle = localeGoogleENUS; 
        console.log("Setting locale to en-US");
    } 
    
	AlexaGoogleSearchHelper.execute(event, context);
}