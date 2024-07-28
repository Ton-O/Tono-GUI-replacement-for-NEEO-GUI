'use strict';

//const { findLimit } = require("async");
//const subs = require('Lib/SubModules.js')
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
var url;
var RoomKey; 
var RoomName;
var deviceName;
var Scenario;
var RoomURL;
var Sensors = [];
var Sensorsfound;
var TillRefresh;
var PerformInitials = true;
var TheHeading = "";
var FavoOut = "";
var ShortcutOut;
var Refreshing=false;


var Action;
var UsedScenario;
var MySettings;
var AllShortcuts = [];
var MyFavorites = {}
var MySlides = [];
var AllShortcuts = [];
var MyDirectories = [];
var MyMacros = [];

var HTTPExec = new XMLHttpRequest();
var ActiveScenariosURL= url+'/activescenariokeys';  
var HTTPGetAllShortcuts = new XMLHttpRequest();

var MyProject = ""; 
var LastChange; 
var MySettings = {}
var Favorites = {}
var MyDevices = {};
var MyRooms = {};
  

function HandleClick(Index) 
{
  var xmlHttp =  new XMLHttpRequest();
  RoomURL = url+"/rooms/"+MyMacros[Index].roomKey+'/'
  if (MyMacros[Index].componentType=="button") {
    var MacroURL=RoomURL+'devices/'+MyMacros[Index].deviceKey+'/macros/'+ MyMacros[Index].key+'/trigger';
    xmlHttp.open("GET",  MacroURL, true);
    xmlHttp.send();  
  }
  else
    if (type=="poweroff") {
      let ExecURL=RoomURL+'scenarios/'+ Action +'/poweroff';
      xmlHttp.open("GET",  ExecURL, true);
      xmlHttp.send();
      UpdateNow();
    }

}   

function HandleParams() {

url = urlParams.get('url')
RoomKey = urlParams.get('roomkey')
RoomName = urlParams.get('roomname')
deviceName = urlParams.get('devicename')
RoomURL =url+"/rooms/"+RoomKey+'/'
}

function UpdateNow() 
{
  TillRefresh = MySettings.Refresh;
  GetNeeoProject(Interpret_Project);
}


function GetKeyByNameFromProject(Name,RoomName,deviceName) {
if (Name.substring(0,1) == "<")
    return 0
  var myPath = "$.rooms.'"+deviceRoomName+"'.devices.['"+deviceName+"'].macros";
  var myKey = JSONPath.JSONPath({path: myPath, json: MyProject});
  return myKey[0]
}

function GetDeviceNameAndKeys(Project) 
{var myPath = "$.rooms.*.devices.*";
MyDevices = {};
var TempDevices  = JSONPath.JSONPath({path: myPath, json: Project});
for (var i=0;i<TempDevices.length;i++) 
  {
    var key = TempDevices[i].key;
    var name = TempDevices[i].name;
    MyDevices[key]=name;
  }
}

function GetRoomNameAndKeys(Project) 
{var myPath = "$.rooms.*";
MyRooms = {};
var TempRooms  = JSONPath.JSONPath({path: myPath, json: Project});
for (var i=0;i<TempRooms.length;i++) 
  {
    var key = TempRooms[i].key;
    var name = TempRooms[i].name;
    MyRooms[key]=name;
  }
}
  
function GetContent(Project) {
  // Main loop to gather information from NEEO.
  // First, determine which scenario will be shown as scenario is the main portal to view
  // Then get the slides that will be shown, they also determine the order in which we will display items
  // Depending ion the slides, we collect information from these sources:
  // Favorites
  // Shortcuts
  //
  var myPath = "$.rooms.'"+RoomName+"'.devices.['"+deviceName+"'].macros.*";
  MyMacros = JSONPath.JSONPath({path: myPath, json: Project});
  if (MyMacros.length == 0) {
    console.log("Oops, room/scenario not found....., did we have a change?")
    if (Project.ChangeDetected)
      {ShowError("Scenario cannot be found.... perhaps deleted within NEEO-GUI?")
      return false;
      }
    else
      {ShowError("Scenario cannot be found.... cannot continue, please return to index of rooms and retry")
      return false;
    }
  }
  MyMacros.sort((firstEl, secondEl) => { 
    if ( firstEl.label > secondEl.label )
      return 1;
    else
      if ( firstEl.label == secondEl.label )
        return 0;
      else
        return -1;
  });

  var NrItems = 0;
  var MacroOut = "";
  MacroOut = '<div> <div class="LargeRow horizontal">' 

  for (var Entry=0;Entry<MyMacros.length;Entry++)  {
      if (NrItems >= MySettings.ItemsPerLine) {
          MacroOut += '</div><div class="LargeRow horizontal">'
          NrItems=0;
      }
      if (MyMacros[Entry].componentType="button") {
        MacroOut+= '<div class="LargeRow vertical">' 
        MacroOut+= '<div class="LargeRow-item"> <img class="image1" height="120" width="120"  src=Icons/button.jpg onclick="HandleClick('+  Entry +")" +'" ></div>'
        MacroOut+= '<div class="LargeRow-item">'+ MyMacros[Entry].label +'</div>'
        MacroOut+= '</div>'
        NrItems++;
      }
    }
    document.getElementById("Body01").innerHTML = MacroOut;

return true
}

function Interpret_Project(MyProject)
{
  AllShortcuts=[];  
  if (GetContent(MyProject)) {  // Load NEEO-project and search current scenario in it.
      GetActScenario();         // Skip if load or search went wrong
  }
}

function LoadCookies(Device) 
{
  MySettings = GetBrowserSettings(Device) // load cookies

  if (MySettings.Refresh==undefined || isNaN(MySettings.Refresh))
      MySettings.Refresh=5;
  if (MySettings.ShowActScen==undefined)
      MySettings.ShowActScen=false;
  if (MySettings.ItemsPerLine==undefined || isNaN(MySettings.ItemsPerLine))
      MySettings.ItemsPerLine=10;

  TillRefresh = MySettings.Refresh;
  Refresh.value = MySettings.Refresh;
  Items.value = MySettings.ItemsPerLine;

}

function  Init() {
  HandleParams();
  LoadCookies("ShowDevice");  // Get user setingfs for this page 
  TheHeading =  'NEEO - Show full device ';
  }

  function Finit() {
    let TheDate = new Date(LastChange);
    document.getElementById("LastChange").innerHTML = "Last NEEO-change:"+ TheDate.toLocaleString();
    TheHeading =  'NEEO - device "'+ deviceName + '" room '+ RoomName;
    document.title = TheHeading;
    document.getElementById("tod01").innerHTML = TheHeading + ' ' + new Date().toLocaleTimeString('en-US', { hour12: false});
  
  }

function MyMain() {
  if (window.performance.getEntriesByType("navigation")[0].type == "navigate") {
    Action = urlParams.get('execute')
    if (Action!=""&&Action!=null) {  // Do we need to start the scenario?
      let ExecURL=RoomURL+'recipes/'+ Action+'/execute';
      HTTPExec.open("GET",  ExecURL, true);
      HTTPExec.send();
    }
  }

  GetNeeoProject(Interpret_Project);    // This is the main engine: Get the latest project from NEEO and callback to Interpret_Project

} // main
Init();

MyMain();
Finit()