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
    'I could not find an exact answer. Here is my best guess: '
     
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
    'Ich konnte keine genaue Antwort finden. Hier ist meine beste Vermutung: '
     
];

// Create google search URL - this made up of the main search URL plus a languange modifier (currently only needed for German)

var localeGoogleENGB = ["http://www.google.co.uk/search?q=","&hl=en-GB"];
var localeGoogleDE = ["http://www.google.com/search?q=","&hl=de"];
var localeGoogleENUS = ["http://www.google.com/search?q=",""];
var localeGoogleENCA = ["http://www.google.ca/search?q=",""];
var localeGoogleENIN = ["http://www.google.co.in/search?q=",""];

var sessionLocale = '';

var localeResponse = localeResponseEN;
var localeGoogle = localeGoogleENUS;


var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var AlexaGoogleSearch = function() {
	AlexaSkill.call(this, APP_ID);
}

AlexaGoogleSearch.prototype = Object.create(AlexaSkill.prototype);
AlexaGoogleSearch.prototype.constructor = AlexaGoogleSearch;

AlexaGoogleSearch.prototype.eventHandlers.onLaunch = function(launchRequest, session, response) {
	console.log("AlexaGoogleSearch onLaunch requestId" + launchRequest.requestId + ", sessionId: " + session.sessionId);
    
    
    

           
    
	var speechOutput = localeResponse[0];
	var repromptText = localeResponse[0];
	response.ask(speechOutput, repromptText);
}

AlexaGoogleSearch.prototype.intentHandlers = {
	"SearchIntent": function(intent, session, response) {
        
		var query = intent.slots.search.value;
		
		// Title for Alexa app card
		var cardTitle = (localeResponse[1] + query);
		
		// Remove spaces and replace with +
		query = query.replace(" ","+");
		
		// Remove _ and replace with +
		query = query.replace(/ /g ,"+");
		
		var speechOutput = localeResponse[2];
        
    function speakResults (speechText) {
            
            // strip out html tags to leave just text
			var speechOutputTemp = entities.decode(striptags(speechText));
			var cardOutputText = speechOutputTemp;
			// make sure all full stops have space after them otherwise alexa says the word dot 

            speechOutputTemp = speechOutputTemp.split('.com').join(" "+ localeResponse[4] + " com ") // deal with dot com
            speechOutputTemp = speechOutputTemp.split('.co.uk').join(" "+ localeResponse[4] + " co "+ localeResponse[3] + " uk ") // deal with .co.uk
            speechOutputTemp = speechOutputTemp.split('.net').join(" "+ localeResponse[4] + " net ") // deal with .net
            speechOutputTemp = speechOutputTemp.split('.org').join(" "+ localeResponse[4] + " org ") // deal with .org
            speechOutputTemp = speechOutputTemp.split('.org').join(" "+ localeResponse[4] + " de ") // deal with .de
            speechOutputTemp = speechOutputTemp.split('a.m').join("am") // deal with a.m
            speechOutputTemp = speechOutputTemp.split('p.m').join("pm") // deal with a.m


              // deal with decimal places
              speechOutputTemp = speechOutputTemp.replace(/\d[\.]{1,}/g,'\$&DECIMALPOINT')// search for decimal points following a digit and add DECIMALPOINT TEXT
              speechOutputTemp = speechOutputTemp.replace(/.DECIMALPOINT/g,'DECIMALPOINT')// remove decimal point

              // deal with characters that are illegal in SSML

              speechOutputTemp = speechOutputTemp.replace(/&/g,localeResponse[5]) // replace ampersands 
              speechOutputTemp = speechOutputTemp.replace(/</g,localeResponse[6]) // replace < symbol 
              speechOutputTemp = speechOutputTemp.replace(/""/g,'') // replace double quotes 

              speechOutputTemp = speechOutputTemp.split('SHORTALEXAPAUSE').join('<break time=\"250ms\"/>') // add in SSML pauses at table ends      
              speechOutputTemp = speechOutputTemp.split('ALEXAPAUSE').join('<break time=\"500ms\"/>') // add in SSML pauses at table ends 
              cardOutputText = cardOutputText.split('SHORTALEXAPAUSE').join('') // remove pauses from card text
              cardOutputText = cardOutputText.split('ALEXAPAUSE').join('\r\n') // remove pauses from card text

			speechOutputTemp = speechOutputTemp.split('.').join(". ") // Assume any remaining dot are concatonated sentances so turn them into full stops with a pause afterwards
			var speechOutput = speechOutputTemp.replace(/DECIMALPOINT/g,'.') // Put back decimal points
            
						
			if (speechOutput=="") {
                speechOutput = localeResponse[7]
                
                
                
            }
            
            // Covert speechOutput into SSML so that pauses can be processed
            var SSMLspeechOutput = {
                speech: '<speak>' + speechOutput + '</speak>',
                type: 'SSML'
            };

            
			response.tellWithCard(SSMLspeechOutput, cardTitle, cardOutputText);
            
 
            
        };
        
    function parsePage (url,backUpText) {
        console.log("Summarising first link");
        summary.summarize(url, function(result, failure) {
            backUpText = localeResponse[9] + backUpText
            
        if (failure) {
            console.log("An error occured! " + result.error);
            speakResults(localeResponse[8]);
        }
        
        if (result) {    
        console.log(result.title);
        console.log(result.summary.join("\n"));
        var summarisedText = localeResponse[9] + result.title + "ALEXAPAUSE" + result.summary.join("\n");
            
        if(backUpText.length >= summarisedText.length ) {
            
            summarisedText = backUpText;
        }
        
         speakResults(summarisedText);
        }
            
            
        });
    
        
    };
		
		// Parsing routine modified from 
		// https://github.com/TheAdrianProject/AdrianSmartAssistant/blob/master/Modules/Google/Google.js        

		//parse queries
        
        // create userAgent string from a number of selections
        
        var userAgent = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
            'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/602.2.14 (KHTML, like Gecko) Version/10.0.1 Safari/602.2.14',
            'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:50.0) Gecko/20100101 Firefox/50.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
            ];
        
        var sel = Math.floor((Math.random() * 5) );
		var userAgentRandom = userAgent[sel];
        
        console.log("User Agent: - " + userAgentRandom);
        
		// Create search sring
		var queryString = localeGoogle[0] + query + '&oe=utf8' + localeGoogle[1];
        
       
        
        var options = {
            uri: queryString,
            'User-Agent': userAgentRandom
        }
		
		rp(options)
			.then(function(body) {
				console.log("Running parsing");
				console.log("Search string is:" + queryString);
				console.log("HTML is:" + $('#ires',body).html());
								
			// result variable init
			var found = 0;
		
//			if (!found && $('._m3b',body).length>0){
//                console.log("Don't know")
//				found = $('._m3b',body).html()
						
//			}
			//how many 2
			if (!found ){
				//how many
				var items = $('._m3b',body).get().length; // find how many lines there are in answer table
		
				if (items) {
					console.log( items + " how many 2 answer found");
					found = $('._eGc',body).html() + ", ";


					for (var count = 0; count < items; count++) {	
						found = found + $('._m3b',body).eq(count).html() + ", ";
					}
				}
            }

                        			//name list
			if (!found && $('#_vBb',body).length>0){

				found = $('#_vBb',body).html();
				console.log("Found name list");
			}

			//facts 1
			if (!found && $('._tXc>span',body).length>0){

				found = $('._tXc>span',body).html();
				console.log("Found facts 1");
			}

			//facts 2
			if (!found && $('._sPg',body).length>0){

				found = " "+$('._sPg',body).html();
				console.log("Found facts 2");			
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
			}
			//instant + description 2
			if (!found && $('._o0d',body).length>0){
                
                console.log("Found Found instant and desc 2")
				var tablehtml = $('._o0d',body).html()
                
                found = tablehtml // fallback in case a table isn't found
                
                xray(tablehtml, ['table@html'])(function (conversionError, tableHtmlList) {

                if (tableHtmlList){

                                  // xray returns the html inside each table tag, and tabletojson
                                  // expects a valid html table, so we need to re-wrap the table.
                                 // var table1 = tabletojson.convert('<table>' + tableHtmlList[0]+ '</table>');
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
                                    }

                                    console.log('Found :' + found)
                                }

                if (conversionError){
                    console.log("There was a conversion error: " + conversionError);
                }

 
                
              });
			}

			//Time, Date
			if (!found && $('._rkc._Peb',body).length>0){

				found = $('._rkc._Peb',body).html();
				console.log("Found date and Time");
								
			}
			//Maths	
			if (!found && $('.nobr>.r',body).length>0){
				found = $('.nobr>.r',body).html();
				console.log("Found maths");					
			}

			//simple answer
			if (!found && $('.obcontainer',body).length>0){
				found = $('.obcontainer',body).html();
				console.log("Found Simple answer");
								
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
            }
            
            if (found) {
                speakResults(found);

                } else {


                    speakResults(localeResponse[7]);

                }
			
            

            //    response.tell(speechOutput)
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
    else if (sessionLocale == 'en-GB') {
        localeResponse = localeResponseEN;
        localeGoogle = localeGoogleENGB; 
        console.log("Setting locale to en-GB");
    }
    else if (sessionLocale == 'en-US') {
        localeResponse = localeResponseEN;
        localeGoogle = localeGoogleENUS; 
        console.log("Setting locale to en-US");
    } 
    
    else if (sessionLocale == 'en-CA') {
        localeResponse = localeResponseEN;
        localeGoogle = localeGoogleENCA; 
        console.log("Canada - Setting locale to en-CA");
    } 
    
    else if (sessionLocale == 'en-IN') {
        localeResponse = localeResponseEN;
        localeGoogle = localeGoogleENIN; 
        console.log("Canada - Setting locale to en-IN");
    } 
    else {
        localeResponse = localeResponseEN;
        localeGoogle = localeGoogleENUS; 
        console.log("Unknown locale - Setting locale to en-US");
    }
    
    
    
	AlexaGoogleSearchHelper.execute(event, context);
}
