var jsonData;
var simpleJson = [];
var files = [];


function setUp()
{
	document.getElementById('fileinput').addEventListener('change', readFile, false);
    document.getElementById('jsonBtn').onclick = downloadJson;
    document.getElementById('txtBtn').onclick = toTxt;
    document.getElementById('csvBtn').onclick = toCsv;
    document.getElementById('htmlBtn').onclick = toHtml;
}

function readFile(evt) {
    //Retrieve all the files from the FileList object
	var files = evt.target.files; 
	document.getElementById("fileNameTextBox").value = files[0].name;
	if (files) 
	{
		var reader = new FileReader();
		reader.readAsText(files[0]);
		
		reader.onload = function() 
		{
			jsonData = JSON.parse(reader.result);
            //console.log("Name: "+files[0].name);
			//console.log("Size: "+files[0].size+" Bytes");
			parseData();
		}
	}
	else 
    {
	      console.error("Failed to load files"); 
    }
}

function parseData()
{
    for (var i=0; i < jsonData.conversation_state.length; i++)
    {
        var conversation = {};
        conversation.participants = getParticipants(i);
        conversation.messages = [];
        
        for(var j=0; j < jsonData.conversation_state[i].conversation_state.event.length; j++)
        {
            var message = {};
            message.sender = getName(jsonData.conversation_state[i].conversation_state.event[j].sender_id.gaia_id, conversation.participants);
            message.unixtime = Math.floor(jsonData.conversation_state[i].conversation_state.event[j].timestamp/1000000);
            if(jsonData.conversation_state[i].conversation_state.event[j].chat_message !== undefined)
            {//if it's a message (normal hangouts, image...)
                if (jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment !== undefined)
                {//if it's a normal hangouts message
                    
                    var content ="";
                    for (var k = 0; k < jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment.length; k++)
                    {
                        //console.log("Message: "+jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment[k].text);
                        content += jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.segment[k].text;
                    }
                    message.content = content;
                }
                
                else if (jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment !== undefined)
                {//if it's an image
                    
                    for (var k = 0; k < jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment.length; k++)
                    {
                        message.content = jsonData.conversation_state[i].conversation_state.event[j].chat_message.message_content.attachment[k].embed_item["embeds.PlusPhoto.plus_photo"].url
                    }
                }
                
                else
                {//if we don't recognise the format of the message
                    console.warn("%c Unknown format for conversation "+i+" message "+j+"", "background: #FF0000")
                    console.dir(jsonData.conversation_state[i].conversation_state.event[j]);
                    message.content = "Unknown format, unable to parse message "+j+" in conversation "+i;
                }
            }
            else if (jsonData.conversation_state[i].conversation_state.event[j].conversation_rename)
            {//else if it's renaming the group
                message.content = "Changed group chat name to "+jsonData.conversation_state[i].conversation_state.event[j].conversation_rename.new_name;
            }
            else 
            {//if it's not a message or renaming the group
               console.warn("%c Unknown format for conversation "+i+" message "+j+"", "background: #FF0000");
               console.dir(jsonData.conversation_state[i].conversation_state.event[j]);
               message.content = "Unknown format, unable to parse message "+j+" in conversation "+i; 
            }
            
            conversation.messages.push(message);
        }
        conversation.messages.sort(function(a, b) 
        {
            return parseFloat(a.unixtime) - parseFloat(b.unixtime);
        });
        simpleJson.push(conversation);
    }
    //console.dir(simpleJson);
    document.getElementById("jsonBtn").className = "btn btn-default colouredButton";
    document.getElementById("txtBtn").className = "btn btn-default colouredButton";
    document.getElementById("csvBtn").className = "btn btn-default colouredButton";
    document.getElementById("htmlBtn").className = "btn btn-default colouredButton";
}

function getParticipants(index)
{
    var participants = [];
    for (var i = 0; i < jsonData.conversation_state[index].conversation_state.conversation.participant_data.length; i++)
    {
        var person = {};
        person.id = jsonData.conversation_state[index].conversation_state.conversation.participant_data[i].id.gaia_id;
        if (jsonData.conversation_state[index].conversation_state.conversation.participant_data[i].fallback_name !== undefined)
        {
            person.name = jsonData.conversation_state[index].conversation_state.conversation.participant_data[i].fallback_name;
        }
        else 
        {
            person.name = jsonData.conversation_state[index].conversation_state.conversation.participant_data[i].id.gaia_id;
        }
        participants.push(person);
    }
    return participants;
}

function getName(id, participants)
{
    for (var i = 0; i < participants.length; i++)
    {
        if(id === participants[i].id)
        {
            return participants[i].name;
        }
    }
    console.warn("Name not found for "+id+" in");
    //console.dir(participants);
    return id;
}

function toTxt()
{
    files = [];
    for (var i=0; i < simpleJson.length; i++)
    {
        var conversation = {};
        conversation.type = ".txt";
        conversation.name = nameFile(i);
        conversation.messages = "";
        for (var j=0;j< simpleJson[i].messages.length; j++)
        {
            conversation.messages += simpleJson[i].messages[j].sender +" at "+unixToReadable(simpleJson[i].messages[j].unixtime)+
            " sent: "+simpleJson[i].messages[j].content+"\r\n";
        }
        files.push(conversation);
       
    }
    //console.dir(files);
    angular.element(document.getElementById('body')).scope().showFiles();
}

function toCsv()
{
    files = [];
    for (var i=0; i < simpleJson.length; i++)
    {
        var conversation = {};
        conversation.type = ".csv";
        conversation.name = nameFile(i);
        conversation.messages = "";
        for (var j=0;j< simpleJson[i].messages.length; j++)
        {
            conversation.messages += simpleJson[i].messages[j].sender +","+unixToReadable(simpleJson[i].messages[j].unixtime)+
            ","+simpleJson[i].messages[j].content+"\r\n";
        }
        files.push(conversation);
       
    }
    //console.dir(files);
    angular.element(document.getElementById('body')).scope().showFiles();
}

function toHtml()
{
    files = [];
    for (var i=0; i < simpleJson.length; i++)
    {
        var conversation = {};
        conversation.type = ".html";
        conversation.name = nameFile(i);
        conversation.messages = "<!DOCTYPE html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>"+
        "<title>Hangons Backup</title><link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>"+
        "<style>body{background-color: #ECEFF1;font-family: 'Roboto', sans-serif;}"+"\r\n"+
        ".m{padding: 10px;margin: 2px;display: inline-block;border-radius:10px;max-width: 77vw;}"+"\r\n"+
        ".s{border-top-right-radius: 0px;float:right;background-color: #CFD8DC;}"+"\r\n"+
        ".r{border-top-left-radius: 0px;float:left;background-color: #ffffff;}"+"\r\n"+
        ".d{font-size: x-small;}"+"\r\n"+
        ".c{float:left;border-radius: 50%;width: 20px;height: 20px;background-color: #1AA260;color: white;text-align: center;}"+"\r\n"+
        ".nl{clear: both;float: left;display: block;position: relative;}"+"\r\n"+
        "</style></head><body id='body'>";
        for (var j=0;j< simpleJson[i].messages.length; j++)
        {
            conversation.messages += getLetterCircle(i,simpleJson[i].messages[j].sender) +"<div class='m "
            +getMessageClass(i,simpleJson[i].messages[j].sender)+"'>"+
            simpleJson[i].messages[j].content+"<div class='d'>"+simpleJson[i].messages[j].sender +", "
            +unixToReadable(simpleJson[i].messages[j].unixtime)+"</div></div>"+"\r\n <div class='nl'></div>";
        }
        conversation.messages+="</body></html>";
        files.push(conversation);
       
    }
    //console.dir(files);
    angular.element(document.getElementById('body')).scope().showFiles();
}

function getLetterCircle(i, sender)
{
    if (sender === simpleJson[i].participants[0].name)
    {
        return "";
    }
    return "<div class='c'>"+sender.charAt(0)+"</div>";
}

function getMessageClass(i, sender)
{
    //console.dir(sender)
    //console.dir(simpleJson[i].participants[0]);
    if (sender === simpleJson[i].participants[0].name)
    {
        return "s";
    }
    return "r";
}

function unixToReadable(unix)
{
    var d = new Date(0); //0 means it sets the date to the epoch
    d.setUTCSeconds(unix);
    return(d.toLocaleTimeString() +", "+ d.toDateString());
}

function nameFile(i)
{
    //console.dir(file);
    //console.dir(jsonData.conversation_state[i].conversation_state.conversation.id);
    if ((jsonData.conversation_state[i].conversation_state.conversation.name !== undefined)&&
        (jsonData.conversation_state[i].conversation_state.conversation.name != ""))
    {
        //console.log("name= "+jsonData.conversation_state[i].conversation_state.conversation.name);
        return jsonData.conversation_state[i].conversation_state.conversation.name;
    }
    var participants = [];
    for (var k=0; k < simpleJson[i].participants.length; k++)
    {
        participants[k] = simpleJson[i].participants[k].name;
    }
    var part1 = participants.shift();//takes out first entry in array, the person's name
    var name = participants.toString();
    participants.unshift(part1);//Puts back the person's name as the first entry
    //console.log("name= "+name);
    return name;
}

function downloadJson()
{
    download("hangons.json", JSON.stringify(simpleJson, null, "\t"));
}

function download(filename, text) {
    var ele = document.createElement('a');
    ele.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    ele.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        ele.dispatchEvent(event);
    }
    else {
        ele.click();
    }
}

var hangons = angular.module('hangons', []);
hangons.controller('mainController', function ($scope)
{
    $scope.showFiles=function()
    {
        $scope.angFiles = files;
        $scope.$apply();
    };
    
    $scope.angDownload=function(fileName, fileValue)
    {
        download(fileName, fileValue);
    }
    
    $scope.testAngular=function()
    {
        alert("test Passed");
    }
});

window.onload = setUp;