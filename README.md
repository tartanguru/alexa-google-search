# alexa-google-search

A highly unofficial alexa skill for google search

# Version 1.5

This version fixes the following issues in the original code:-

1. Localisation and German support - the skill will now automatically detect which region it is running in and set the search and prompts into either US/UK English or German as appropriate. Make sure your skill and device are set to the SAME language
2. Better handling of results in a table.
3. Better handling of punctuation

### THIS SKILL IS FOR PERSONAL USE ONLY AND IS NOT ENDORSED BY GOOGLE OR AMAZON - DO NOT SUBMIT THIS TO AMAZON FOR CERTIFICATION AS IT WON'T PASS!

This skill is based upon the google search module created for the Adrian Smart assistant project here:-

https://github.com/TheAdrianProject/AdrianSmartAssistant/blob/master/Modules/Google/Google.js

Full credit to the Adrian team for working out the parsing routines for the google search results.

I have wrapped this module so that it can be utilised as an Alexa skill - if you host it on Lambda and call the skill "google" then you will be abe to ask Alexa queries that she does not natively know the answer to such as:-

"Alexa ask google how do I cook a chicken?"

Whilst the skill will return weather forecasts, these will default to either West virginia or Dublin, Ireland (based upon which lambda node you are hosting your skill on) unless you add a location to the search command.


###  Note - this skill works as a screen reader by parsing the google results page and looking for the google answers boxes at the top of the results page. This may be against the google terms of service so you use it at your own risk. 


#Installation Instructions.

These are supplied further down this page and these are always upto date. There are common fault finding steps.

## Video Guide to installation

ENGLISH
Paul Hibbert has produced a very good video guide demoing the skill and going through the setup process. If you follow his guide then you will need to ensure you select either N.Virginia or Europe(Ireland) lambda node, which isn't explicitly mentioned in his gude:-

https://www.youtube.com/watch?v=PR-LVPMU7F4&feature=youtu.be

DEUTSCHE.
Venix hat hier einen deutschen Video-Guide produziert: -

https://www.youtube.com/watch?v=MlNs23J4e8E

##  Pictorial Guide to installation

The Alexamods site has a pictorial guide for the basic installation, as well as for the process of upgrading to a newer version when they are available:-

http://alexamods.com/guide-install-ask-google-alexa-skill/



## Upgrading from a previous version

You can update to this version by uploading the new Archive.zip from github as per step 8 in the AWS Lambda setup instructions below (except hit "Save" rather than "Save and Test" once you have selected the Archive.zip file). You will get a message saying - "The deployment package of your Lambda function "google" is too large to enable inline code editing. However, you can still invoke your function right now.". This is normal and the skill is ready to use.

**If you get a "Cannot read property 'application' of undefined" error then you have hit the "Save and Test" file and you can either ignore this error or follow the steps in the Fault Finding section below**

NOTE - this is the same skill as that linked to by alexamods.com so you can over-write the older version if you followed the instructions there rather than on this page.







## Setup

To run the skill you need to do three things:-

1. download the file from github 
2. deploy the example code in lambda
2. configure the Alexa skill to use Lambda.

### Download code from github

1. Click on the green "Clone or download" button just under the yellow bar
2. Click download ZIP
3. Unzip the file to a known place on your hard-drive


### AWS Lambda Setup

1. Go to http://aws.amazon.com/lambda/ . You will need to set-up an AWS account (the basic one will do fine) if you don't have one already ** Make sure you use the same Amazon account that your Echo device is registered to** Note - you will need a credit or debit card to set up an AWS account - there is no way around this. If you are just using this skill then you are highly unlikely to be charged unless you are making at least a million requests a month!
2. Go to the AWS Console and click on the Lambda link. Go to the drop down "Location" menu and ensure you select US-East(N. Virginia) if you are based in the US or EU(Ireland) if you are based in the UK or Germany. This is important as only these two regions support Alexa. NOTE: the choice of either US or EU is important as it will affect the results that you get. The EU node will provide answers in metric and will be much more UK focused, whilst the US node will be imperial and more US focused.
3. Click on the Create a Lambda Function or Get Started Now button.
4. Skip the Select Blueprint Tab and just click on the "Configure Triggers" Option on the left hand side
5. On the Cofigure Triggers tab Click the dotted box and select "Alexa Skills Kit". Click Next  
6. Name the Lambda Function "google".
7. Select the default runtime node.js 6.10 **Note node.js 4.3 will still work but future version may rely on 6.10 features so best to use 6.10 to aid future updates. EDGE node.js 4.3 will not work**
9. Select Code entry type as "Upload a .ZIP file". Go to the folder where you unzipped the files you downloaded from Github. Open the src folder, Select Archive.zip and click open.  **Do not upload the zip file you downloaded from github - only the archive.zip contained within it**
10. Keep the Handler as index.handler (this refers to the main js file in the zip).
11. Create a basic execution role by slecting "Create new role from template(s)" in the Role box, then name the role "lambda_basic_execution” in the role name box and click create. (or Choose use an existing role if you have deployed skills previously and then select "lambda_basic_executuion" from the existing role dropdown ).
12. Under Advanced settings change the Timeout to 10 seconds
13. Click "Next" and review the settings then click "Create Function". This will upload the Archive.zip file to Lambda. **This may take a number of minutes depending on your connection speed**
14. Copy the ARN from the top right to be used later in the Alexa Skill Setup (it's the text after ARN - it won't be in bold and will look a bit like this arn:aws:lambda:eu-west-1:XXXXXXX:function:google). Hint - Paste it into notepad or similar

### Alexa Skill Setup

1. Go to the Alexa Console (https://developer.amazon.com/edw/home.html and select Alexa on the top menu)
2. Click "Get Started" under Alexa Skills Kit
3. Click the "Add a New Skill" yellow box.
4. You will now be on the "Skill Information" page. 
5. Set "Custom Interaction Model" as the Skill type
6. Select the language as English (US), English (UK), or German depending on your location
7. Set "google" as the skill name and "google" as the invocation name, this is what is used to activate your skill. For example you would say: "Alexa, Ask google who is the queen of england."
8. Leave the "Audio Player" setting to "No"
9. Click Next.
10. You will now be on the "Inovation Model" page. 
11. Copy the text below into the "Intent Schema" box.

    ```
    {
      "intents": [
        {
          "intent": "SearchIntent",
       "slots": [
         {
           "name": "search",
           "type": "SEARCH"
         }
       ]    


        },
        {
          "intent": "AMAZON.StopIntent"
        }
      ]
    }
    ```

12. Click on the "Add Slot Type" button.
13. Type "SEARCH" into the "Enter Type" field
14. Paste the text below into the "Enter Values" box

    ```
    who is the queen
    why is the sky blue
    how old become dogs
    where is hamburg
    what is christmas
    when is easter
    what are mice
    what does bleach do
    can you eat grass
    is there a god
    are bats black
    whats the biggest planet
    can dolphins swim
    did giraffes go extinct
    do porcupines sleep
    whats two plus two
    will bees be killed
    could a woodchuck chuck wood
    could flamingos fly
    are oceans wet
    are trees big
    does korea have nukes
    should you drink milk
    should trucks smoke
    capital of new york
    inventor of television
    what time does costco close
    how far away is the moon
    how many oceans are there
    who are the presidents children
    why do stars suddenly appear
    where are the nearest campsites
    ```

15. Copy the text below amd paste them into the Sample Uterances box.

    ```
    SearchIntent {search}
    ```
16. Click Next.
17. You will now be on the "Configuration" page.
18. Select "AWS Lambda ARN (Amazon Resource Name)" for the skill Endpoint Type.
19. Then pick the most appropriate geographical region (either US or EU as appropriate) and paste the ARN you copied in step 13 from the AWS Lambda setup. 
20. Select no for Account Linking
21. Click Next.
22. You can test the skill by typing a query into the Service Simulator field or on your actual Alexa device. There is no need to go anyfurther through the process i.e. submitting for certification.
23. **[optional - only do this step if you know what you are doing as it will cause more issues than it solves if you get it wrong]** Go back to the skill Information tab and copy the appId. Paste the appId into the index.js file for the variable APP_ID (IMPORTANT make sure it is in quotes).You will need to create a new zip file to upload. Open the src folder, delete Archive.zip and then select all the files in that folder (including the node_modules folder) and then create a new zip file called ARCHIVE.zip. **Make sure the zip file is not just the src directory itself**, otherwise Lambda function will not work.

The contents of the zip file should be as follows:

    ```
        index.js
        AlexaSkill.js
        node_modules ( the folder and its contents )
    ``` 
Then update the lambda source zip file with this change and upload to lambda again, this step makes sure the lambda function only serves request from authorized source.

**NOTE: if you get a lambda response saying : "The remote endpoint could not be called, or the response it returned was invalid." It is likely that you have zipped the src folder and not it's contents**

### Fault Finding  


1. It works in the simulator but not on my device.
Make sure that the Echo device and AWS/Developer accounts are setup on the **SAME** Amazon account. If you use multiple users accounts on your echo device then make sure it is not switched to someone else's profile. Also make sure that the language of the skill (EN-GB or EN-US) is the same as the setting on your device

2. I am getting this error message: "The remote endpoint could not be called, or the response it returned was invalid"
Sometimes AWS doesn't like the zip. Try uploading it again. If you are creating your own zip then make sure you follow the instructions in step 23


2. I am getting this error message:

    ```
    { "errorMessage": "Cannot read property 'application' of undefined", 
    "errorType": "TypeError", 
    "stackTrace": [ "AlexaSkill.execute (/var/task/AlexaSkill.js:86:62)", 
    "exports.handler (/var/task/index.js:303:26)" 
    ] }
    ```
You don't actually need to worry about this error - This because you are running the save and test option and haven't configured the test. If you want to make sure it isn't anything else then:-
Next to the "test and save" button there is a "Actions" button, press this and select select Configure Test Event. Click on the Sample event template dropdown menu, scroll down and select "Alexa Start Session", then click "Save and Test". **NOTE** If you have setup the Application ID as per above then you will also need to paste this into the test code. 

If it is successful then you should see this output:-

    ```
    {
      "version": "1.11",
      "response": {
        "outputSpeech": {
          "type": "PlainText",
          "text": "Welcome to Google Search. What are you searching for?"
        },
        "shouldEndSession": false
      },
      "sessionAttributes": {}
    }
    ```
This means that the basics of the skill are functioning.


3. I am getting this error message:-

    ```
    Task timed out after 3.00 seconds
    ```
You have missed one of the steps. To fix this, go to the Configuration Tab in the Lambda Console, click on Advanced settings and in the Timeout box, increase the time to 10 seconds. Then click on Save.

4. My upload to lambda takes ages and then I get a "signature expired".

Your PC/Mac's clock is wrong. Turn on the automatically set time option in your control panel


5. Other errors.
Try uploading the zip file again, and wait a minutes or so before testing in the simulator or on a real device. This sorts out most things.
If not drop me a line on this reddit thread https://www.reddit.com/r/amazonecho/comments/5md74z/a_highly_unofficial_alexa_skill_for_google_search/ or raise an issue here on github
