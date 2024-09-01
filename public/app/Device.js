'use strict';
const RefreshSensor = true;
const CreateFullObject = false;
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
var url;
var RoomKey; 
var RoomName;
var Scenario,LastScenario=null;
var RoomURL;
var srcVolumeDeviceKey;
var srcMainDevice;
var srcCapabilities;
var srcSlides;
var srcWeight,srcHidden;
var Sensors = [];
var Sensorsfound;
var TillRefresh;
var PerformInitials = true;
var TheHeading = "";
var FavoOut = "";
var ShortcutOut;
var Refreshing=false;
var NrItems = 0;
var Action;
var UsedScenario;
var MySettings;
var AllShortcuts = [];
var ShortcutSlideFound=false;
var MyFavorites = {}
var MySlides = [];
var SlidesMaintainedByUser=false; 
var MyDirectories = [];
var Indentation = "" 

var HTTPExec = new XMLHttpRequest();
var ActiveScenariosURL= url+'/activescenariokeys';  
var HTTPGetAllShortcuts = new XMLHttpRequest();

var MyProject = ""; 
var ProjectLastChange; 
var MySettings = {}
var Favorites = {}
var MyDevices = {};
var MyRooms = {};
  
function UpdateSlider(RoomKey,DeviceKey,ID,Type,value)
{ var xmlHttp =  new XMLHttpRequest();
  var Updateurl=url+"/rooms/"+RoomKey+"/devices/"+DeviceKey+"/"+Type+"/"+ID;
  var mimeType = "application/json";  
  xmlHttp.open('PUT', Updateurl, true);  // true : asynchrone false: synchrone
  xmlHttp.setRequestHeader('Content-Type', mimeType);  
  xmlHttp.send('{"value":'+value+'}'); 
}

function UpdateSwitch(RoomKey,DeviceKey,ID,Type,value)
{ var xmlHttp =  new XMLHttpRequest();
  var Updateurl=url+"/rooms/"+RoomKey+"/devices/"+DeviceKey+"/"+Type+"/"+ID+"/"+value;
  var mimeType = "application/json";  
  xmlHttp.open('PUT', Updateurl, true);  // true : asynchrone false: synchrone
  xmlHttp.setRequestHeader('Content-Type', mimeType);  
  xmlHttp.send(''); 
  var Done=false;
  var IDHTML = document.getElementById(ID).innerHTML;
  if (value == "on") {
    IDHTML = IDHTML.replace("switch-off.jpg","switch-on.jpg") //<===== Here I toggle the switch from off to on
    IDHTML = IDHTML.replace("'switches','on')","'switches','off')")
  }
  else {
    IDHTML = IDHTML.replace("switch-on.jpg","switch-off.jpg") //<===== Here I toggle the switch from off to on
    IDHTML = IDHTML.replace("'switches','off')","'switches','on')")
  }
  document.getElementById(ID).innerHTML = IDHTML;     // and activate the "changed HTML"
}

function HandleClick(type,RoomKey,DeviceKey,Action,url) 
{ var xmlHttp =  new XMLHttpRequest();
  RoomURL = url+"/rooms/"+RoomKey+'/'
  if (type=="button") {
    var ShortcutsURL=RoomURL+'devices/'+DeviceKey+'/macros/'+ Action+'/trigger';
    xmlHttp.open("GET",  ShortcutsURL, true);
    xmlHttp.send();  
  }
  else
    if (type=="poweroff") {
      let ExecURL=RoomURL+'scenarios/'+ Action +'/poweroff';
      xmlHttp.open("GET",  ExecURL, true);
      xmlHttp.send();
          }
UpdateNow();
}   

function HandleParams() 
{ var URLParts;
  url = urlParams.get('url')
  RoomKey = urlParams.get('roomkey')
  RoomName = urlParams.get('roomname')
  Scenario = urlParams.get('scenario')
  RoomURL =url+"/rooms/"+RoomKey+'/'
  URLParts = url.split(':3000')
  URLParts = URLParts[0].split('/') // ==> 
  BrainIP.value = URLParts[2];
}

function TransmitFavorite(channelNr, RoomKey,deviceKey, url) 
{  let bb=0;
//  HandleClick("button",RoomKey,deviceKey,GetKeyByNameFromProject("DIGIT "+ channelNr[0],MyRooms[RoomKey],MyDevices[deviceKey].name,deviceKey),url)
  if (channelNr.length/*>1*/)
     for (let ll=/*1*/0;ll<channelNr.length;ll++) 
           for (var j=0;j<=22000;j++)
            if (j==22000)
              HandleClick("button",RoomKey,deviceKey,GetKeyByNameFromProject("DIGIT "+ channelNr[ll],MyRooms[RoomKey],MyDevices[deviceKey].name,deviceKey),url)
             
  UpdateNow();
}

function UpdateNow() 
{ TillRefresh = MySettings.Refresh;
  if (TimeMsgPlaced)  {    //any outstanding message that we need to remove?? 
      TimeMsgPlaced-=MySettings.Refresh;
      if (TimeMsgPlaced <= 0) {
          ClearMessage();
          TimeMsgPlaced=0;
      }
    }

  GetNeeoProject(DecideOnRefreshOrUpdate);
}
 
function GetSensorValue(Entry) 
{ var myPath;
  var Shortcut = AllShortcuts[Entry];

  var myPath = "$.rooms."+Shortcut.deviceRoomName+".devices.['"+Shortcut.deviceName+"']."+Shortcut.NEEOType+".['"+Shortcut.componentName+"'].sensor.key";
  var mySensorKey = JSONPath.JSONPath({path: myPath, json: MyProject});

  var SensorURL = url+"/rooms/"+Shortcut.deviceRoomKey+"/devices/"+Shortcut.deviceKey+"/sensors/"+mySensorKey+"?bb=0&Entry="+Entry;
  var SensorHTTP = new XMLHttpRequest();
  var ResponseValue;
  SensorHTTP.onreadystatechange = function() {
    if (this.readyState == 4 ) 
        {const urlParams = new URLSearchParams(this.responseURL);
        const MyEntry = urlParams.get('Entry')
        try {
        AllShortcuts[MyEntry].Ready=true;  // though it may be failed, flag call as completed
        }
        catch (err) {console.log("error in storing result",err,urlParams)}
        if (this.status != 200) {
              ShowError("sensor-get failed: " + this.responseURL + " " + this.status)
            }
        else {
            ResponseValue = JSON.parse(this.responseText);
            AllShortcuts[MyEntry].SensorValue = ResponseValue.value;
            }
//        HandleNextSensor()   ### why do we call this in case of getvalue error?
        }   
  };
  SensorHTTP.open("GET", SensorURL, true);
  SensorHTTP.send();
}

function GetKeyByNameFromProject(Name,deviceRoomName,deviceName,deviceKey) 
{ if (Name.substring(0,1) == "<")
    return 0
  var myPath = "$.rooms.'"+deviceRoomName+"'.devices.[?(@.key == "+deviceKey+")].macros.'"+Name;
  var myKey = JSONPath.JSONPath({path: myPath, json: MyProject});
  // "key": "7012772422919127040",
  //$.project.rooms.'Living Room'.devices.[?(@.key == 7012772422919127040)].macros
  if (myKey == undefined || myKey[0] == undefined)
    return -1
  else
    return myKey[0].key
}

function GetDeviceNameAndKeys(Project) 
{ var myPath = "$.rooms.*.devices.*";
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
{ var myPath = "$.rooms.*";
  MyRooms = {};
  var TempRooms  = JSONPath.JSONPath({path: myPath, json: Project});
  for (var i=0;i<TempRooms.length;i++) 
    {
      var key = TempRooms[i].key;
      var name = TempRooms[i].name;
      MyRooms[key]=name;
    }
}

function GetFavorites(RoomName) 
{ var myPath;
  var myCapab;
  var myFavo;
  var myDevices;
    myPath = "$.rooms."+RoomName+".devices.*";
    myDevices = JSONPath.JSONPath({path: myPath, json: MyProject});
    for (var k=0;k<myDevices.length;k++)
        if (myDevices[k].key == srcMainDevice) { //Favorites are always obtained from main device.....
            myPath = "$.favorites.*";
            myFavo = JSONPath.JSONPath({path: myPath, json: myDevices[k]});
            if (myFavo != undefined)
                return myFavo
        }
    return  {}       
}

function FormatFavorites(RoomKey,Scenario) 
{ if (!MyFavorites.length)
      return;

  FavoOut = '<div>'  // '<div class="BodyRow horizontal">' 
  var NrFavosPerLine = 12; // NrFavosPerLine;
  var NrFavos = NrFavosPerLine
  for (var Entry = 0;Entry<MyFavorites.length;Entry++) {
      let TheFav = MyFavorites[Entry];

      if (NrFavos >= NrFavosPerLine) {
          FavoOut += '</div><div class="BodyRow horizontal">'
          NrFavos=0;
      }
    FavoOut+= '<div><div class="BodyRow vertical">'          
    FavoOut+= '<div class="BodyRow-item"> <a> <img class="buttons"  src="'+TheFav.channel.logoUrl+'" height="40" weight="40" onclick="TransmitFavorite('+ "'"+TheFav.channelNr+"','"+ Scenario.roomKey+"','"+Scenario.mainDeviceKey+"','"+ url+"'"+')"></a> </div>'
    FavoOut+= '<div class="BodyRow-item">'+ TheFav.channel.name +'</div>'
    FavoOut+= '</div></div>'
    NrFavos++;          
  }  
  return FavoOut;
}
  
function TranslateWidget(Name,Shortcut,Destination="Shortcut")
{ var Items = [];

  if (Name == "neeo.default.button-set.volume") 
      Items = ["VOLUME UP", "VOLUME DOWN","<br>","MUTE TOGGLE"];
  else
  if (Name == "neeo.default.button-set.controlpad") 
      Items = ["CURSOR LEFT","CURSOR UP","<br>","CURSOR RIGHT","CURSOR DOWN","<br>","CURSOR ENTER"];
  else
  if (Name == "neeo.default.button-set.numpad") 
      Items = ["DIGIT 1", "DIGIT 2", "DIGIT 3","<br>","DIGIT 4", "DIGIT 5", "DIGIT 6","<br>","DIGIT 7", "DIGIT 8", "DIGIT 9","<br>","DIGIT 0"]
  else
  if (Name == "neeo.default.button-set.transport")
      Items = ["PLAY","PAUSE","STOP"]
  else
  if (Name == "neeo.default.button-set.transport-no-stop")
      Items = ["PLAY","PAUSE"]
  else
  if (Name == "neeo.default.button-set.transport-toggle")
      Items = ["PLAY", "PAUSE TOGGLE", "STOP"]
  else
  if (Name == "neeo.default.button-set.language")
      Items = ["SUBTITLE", "LANGUAGE"]
  else 
  if (Name == "neeo.default.button-set.menu-and-back")
      Items = ["MENU", "BACK"]
  else 
  if (Name == "neeo.default.button-set.zapper")
      Items = ["CHANNEL UP", "<br>","CHANNEL DOWN"]
  else 
  if (Name == "neeo.default.button-set.zapper-presets")
      Items = ["PRESET UP", "<br>","PRESET DOWN"]
  else 
  if (Name == "neeo.default.button-set.guide-info")
      Items = ["GUIDE","INFO"]
  else 
  if (Name == "neeo.default.button-set.record")
      Items = ["MY RECORDINGS", "RECORD","LIVE"]
  else 
  if (Name == "neeo.default.button-set.transport-search")
      Items = ["REVERSE", "FORWARD"]
  else 
  if (Name == "neeo.default.button-set.transport-skip")
      Items = ["SKIP SECONDS BACKWARD", "SKIP SECONDS FORWARD"]
  else 
  if (Name == "neeo.default.button-set.transport-scan")
      Items = ["SKIP BACKWARD", "SKIP FORWARD"]
  else 
  if (Name == "neeo.default.button-set.colors")
      Items = ["FUNCTION RED","FUNCTION GREEN","FUNCTION YELLOW","FUNCTION BLUE"]
  else 
  if (Name == "neeo.default.button-set.grid.apps")
      Items = ["AMAZON","CRACKLE","HULU","HULU PLUS","INPUT SPOTIFY","NETFLIX","GOOGLE PLAY","VIMEO","VUDU","YOU TUBE"]
  else {
      ShowError("Unknown widget ignored (please report): "+ Name);
      console.log("Missing widgetinfo:",Name)
      return 
  }

  let bb =FillWidget(Name,Items,Shortcut,Destination)  ;
  return bb

}

function FillWidget(Widget,Items,Shortcut,Destination="Shortcut") 
{ 
  let DummyShortcut = JSON.parse(JSON.stringify(Shortcut));
  DummyShortcut.WidgetName = Widget;
  DummyShortcut.Blockname = [];
  DummyShortcut.BlockLabel = [];
  DummyShortcut.BlockIcon = [];
  DummyShortcut.BlockKey = [];
  DummyShortcut.BlockcomponentKey = [];
  for (let i = 0;i<Items.length;i++) {
      DummyShortcut.Blockname[i] = Items[i];
      DummyShortcut.BlockLabel[i] = Items[i];
      DummyShortcut.BlockIcon[i] = Items[i]+".jpg";
      DummyShortcut.BlockKey[i] = GetKeyByNameFromProject(Items[i],DummyShortcut.deviceRoomName,DummyShortcut.deviceName,DummyShortcut.deviceKey)
      DummyShortcut.BlockcomponentKey[i] = DummyShortcut.BlockKey[i] 
  }
if (Destination=="Shortcut") { 
  AllShortcuts.push(DummyShortcut);                //And add the reconstructed dummy to the list of shortcuts
  //AllShortcuts[MyIndex].Ready=true;
  }
else
    return DummyShortcut                            // Or just return the reconstructed dummy for slides
}

function GetMetaOnRecipe(RoomName,UsedScenario)
{ srcVolumeDeviceKey = JSONPath.JSONPath({path: "$.volumeDeviceKey", json: UsedScenario});
  srcMainDevice = JSONPath.JSONPath({path: "$.mainDeviceKey", json: UsedScenario});
  srcCapabilities = JSONPath.JSONPath({path: "$.capabilities", json: UsedScenario});
  srcSlides = JSONPath.JSONPath({path: "$.slides", json: UsedScenario});
  srcWeight = JSONPath.JSONPath({path: "$.slides.*.weight", json: UsedScenario});
  srcHidden = JSONPath.JSONPath({path: "$.slides.*.hidden", json: UsedScenario});


}

function CheckSlideContent(MyObject,Weight,TempShortcut,Destination) 
{                                          // This function determines the fields that belong to an object (capabilty or slide)
  var MySpecificObject;
  var AllParts = MyObject.split('.')
  MySpecificObject = AllParts[2];

  if (MySpecificObject == "favorites") // 11 +9
    MySlides.push({"Name":"Favorites","weight":Weight,"Widget":[]});
  else
  if (MySpecificObject == "numpad") {    //+ 6
    MySlides.push({"Name":"Numpad","weight":Weight,"Widget":[]});
    MySlides[MySlides.length-1].Widget[0] = TranslateWidget("neeo.default.button-set.numpad",TempShortcut,Destination);
  }
  else
  if (MySpecificObject =="transports" && AllParts[3] == "record") 
    {var myPart = 0;
    MySlides.push({"Name":"Transports","weight":Weight,"Widget":[]});
    MySlides[MySlides.length-1].Widget[myPart++] =  TranslateWidget("neeo.default.button-set.colors",TempShortcut,Destination)
    MySlides[MySlides.length-1].Widget[myPart++] =  TranslateWidget("neeo.default.button-set.language",TempShortcut,Destination)
    MySlides[MySlides.length-1].Widget[myPart++] =  TranslateWidget("neeo.default.button-set.transport",TempShortcut,Destination)
    //MySlides[MySlides.length-1].Widget[myPart++] =  TranslateWidget("neeo.default.button-set.transport-toggle",TempShortcut,Destination)
    //MySlides[MySlides.length-1].Widget[myPart++] =  TranslateWidget("neeo.default.button-set.transport-no-stop",TempShortcut,Destination)
    MySlides[MySlides.length-1].Widget[myPart++] =  TranslateWidget("neeo.default.button-set.transport-search",TempShortcut,Destination)
    MySlides[MySlides.length-1].Widget[myPart++] =  TranslateWidget("neeo.default.button-set.transport-skip",TempShortcut,Destination)    
    MySlides[MySlides.length-1].Widget[myPart++] =  TranslateWidget("neeo.default.button-set.record",TempShortcut,Destination)
//    MySlides[MySlides.length-1].Widget[myPart++] =  TranslateWidget("x",TempShortcut,Destination)
  }
  else
  if (MySpecificObject =="zapper") {   // +6
    MySlides.push({"Name":"Zapper","weight":Weight,"Widget":[]});
    MySlides[MySlides.length-1].Widget[0] =  TranslateWidget("neeo.default.button-set.zapper",TempShortcut,Destination)
  }
  else
  if (MySpecificObject =="controlpad" /*&& MySpecificObject == "generic"*/) { // + 10
    MySlides.push({"Name":"Controlpad","weight":Weight,"Widget":[]});
    MySlides[MySlides.length-1].Widget[0] =  TranslateWidget("neeo.default.button-set.controlpad",TempShortcut,Destination)
  }
  else
  if (MySpecificObject =="apps") { // + 10
    MySlides.push({"Name":"Apps","weight":Weight,"Widget":[]});
    MySlides[MySlides.length-1].Widget[0] =  TranslateWidget("neeo.default.button-set.grid.apps",TempShortcut,Destination)
  }
  else
  if (MySpecificObject == "shortcuts")
    MySlides.push({"Name":"Shortcuts","weight":Weight,"Widget":[]});
  else
    {console.log("Missing slide-layout",MyObject)
      return -1;
    }

}


function GetSlides(RoomName,UsedScenario) 
{
  var TempShortcut = {"key":srcMainDevice,"deviceRoomName":UsedScenario.roomName,"deviceRoomKey":UsedScenario.roomKey,"deviceKey":srcMainDevice,"deviceName":MyDevices[srcMainDevice]}
  var Destination = "Slide"

  if (srcVolumeDeviceKey.length&&srcVolumeDeviceKey!=null) {
    MySlides.push({"Name":"Volume","weight":-1,"Widget":[]});
    let VolShortcut = {"key":srcMainDevice,"deviceRoomName":UsedScenario.roomName,"deviceRoomKey":UsedScenario.roomKey,"deviceKey":srcVolumeDeviceKey,"deviceName":MyDevices[srcVolumeDeviceKey]}
    MySlides[0].Widget[0] = TranslateWidget("neeo.default.button-set.volume",VolShortcut,Destination);
  }
 
  // Check if we have slides manually configured... if not, use settings in slidepresets.json to derive slides from capabilities.
  if (!srcSlides.length || srcSlides.length == 1&&Object.keys(srcSlides[0]).length==0 ) 
    {                                                   // we've come here because user has not configured slides; in essence, the scenario does
                                                        // not give us any info on which slides are used; we will determine (guess) this our selves
                                                        // based on the capabilities defined in the scenario
    MySlides.push({"Name":"Shortcuts","weight":1,"Widget":[]}); // ALWAYS add shortcuts slide; regardsless if there are any shortcuts defined.
    var foundIt = false;
    for (var i =0;i<srcCapabilities.length;i++)                 // loop over ScenarioCapabilities and find the maindevice's capabilities
      {var DeviceKeypairs = Object.entries(srcCapabilities[i])
      for (var j =0;j<DeviceKeypairs.length;j++)
        {var devKey = DeviceKeypairs[j][0];
        if (devKey == srcMainDevice)                            // Is this the main device?
          {for (var k = 1;k<DeviceKeypairs[j].length;k++)       // then use these capabilities
            {for (var l = 0;l<DeviceKeypairs[j][k].length;l++)  
              {var Capa = DeviceKeypairs[j][k][l];                      
                if (Capa == "neeo.device.type.tv" || Capa == "neeo.device.type.dvb" || Capa == "neeo.device.type.tuner" )
                  {CheckSlideContent("neeo.slide.favorites",TempShortcut,Destination)
                    CheckSlideContent("neeo.slide.zapper.generic",7,TempShortcut,Destination)
                    CheckSlideContent("neeo.slide.controlpad.generic",8,TempShortcut,Destination)
                    if (Capa != "neeo.device.type.tuner" ) // Only TV or DVB
                      {//CheckSlideContent("neeo.slide.apps.generic",4,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.numpad.tv",5,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.transports.record",6,TempShortcut,Destination)
                      }
                }
                else
                if (Capa == "neeo.device.type.dvd")
                  {CheckSlideContent("neeo.slide.controlpad.disc",1,TempShortcut,Destination)
                  CheckSlideContent("neeo.slide.numpad.disc",2,TempShortcut,Destination)
                  CheckSlideContent("neeo.slide.transports.scanandsearch",3,TempShortcut,Destination)
                  CheckSlideContent("neeo.slide.transports.scan",4,TempShortcut,Destination)
                  CheckSlideContent("neeo.slide.transports.scan-mini",5,TempShortcut,Destination)
                  CheckSlideContent("neeo.slide.transports.search",6,TempShortcut,Destination)
                  }
                else
                if (Capa == "neeo.device.type.mediaplayer")
                  {//CheckSlideContent("neeo.slide.apps.generic",1,TempShortcut,Destination)
                    CheckSlideContent("neeo.slide.controlpad.generic",2,TempShortcut,Destination)
                    CheckSlideContent("neeo.slide.controlpad.generic.mini",3,TempShortcut,Destination)
                    CheckSlideContent("neeo.slide.controlpad.generic.nocontrolpad",4,TempShortcut,Destination)
                    CheckSlideContent("neeo.slide.transports.scanandsearch",5,TempShortcut,Destination)
                    CheckSlideContent("neeo.slide.transports.scan",6,TempShortcut,Destination)
                    CheckSlideContent("neeo.slide.transports.scan-mini",7,TempShortcut,Destination)
                    CheckSlideContent("neeo.slide.transports.scanandsearch",8,TempShortcut,Destination)
                  }
                  else
                  if (Capa == "neeo.device.type.vod")
                      {//CheckSlideContent("neeo.slide.apps.generic",1,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.controlpad.vod",2,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.transports.scanandsearch",3,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.transports.scan",4,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.transports.scan-mini",5,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.transports.search",6,TempShortcut,Destination)
                  }
                  else
                  if (Capa == "neeo.device.type.projector")
                      {CheckSlideContent("neeo.slide.hub.inputs",1,TempShortcut,Destination)
                      //CheckSlideContent("neeo.slide.apps.generic",2,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.controlpad.generic",3,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.controlpad.generic.mini",4,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.controlpad.generic.nocontrolpad",5,TempShortcut,Destination)
                    }
                    else
                  if (Capa == "neeo.device.type.gameconsole")
                      {CheckSlideContent("neeo.slide.controlpad.generic",1,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.controlpad.generic.mini",2,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.controlpad.generic.nocontrolpad",3,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.transports.scanandsearch",4,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.transports.scan",5,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.transports.scan-mini",6,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.transports.search",7,TempShortcut,Destination)
                    }
                    else
                    if (Capa == "neeo.device.type.hvac")
                      {CheckSlideContent("neeo.slide.hvac.temperature",1,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.hvac.fan",2,TempShortcut,Destination)
                      CheckSlideContent("neeo.slide.hvac.control",3,TempShortcut,Destination)
                    }
                    else
                    if (Capa == "neeo.device.type.light")
                      {CheckSlideContent("neeo.slide.light",1,TempShortcut,Destination)
                  }
                  }
            }
          foundIt=true;
          break;
          }
        if (foundIt)
          break;
        }      
      if (foundIt)
        break; 
      }
  }
  else
    {var SlideNames = Object.keys(UsedScenario.slides)  
    for (var i =0;i<SlideNames.length;i++) {
        {if (srcHidden[i]==false)           // CheckSlideContent does the determination (guess work)                                  
          if (CheckSlideContent(SlideNames[i],srcWeight[i],TempShortcut,Destination)==-1)
                ShowError("Unknown slide: " + SlideNames[i])
        }
    }
  }
  return MySlides
}

function ProcessContent(Project) 
{ // Main loop to present information from NEEO.
  // Loop over all slides that were found and buildm output based on the expected content of the slide
  // Finally, finish the display
  for (var SlideIndex = 0;SlideIndex<MySlides.length;SlideIndex++) 
    {document.getElementById("BodyTitle1"+SlideIndex).innerHTML = "Slide "+ MySlides[SlideIndex].Name
      if (MySlides[SlideIndex].Name == "Favorites") 
          document.getElementById("Body1"+SlideIndex).innerHTML =  FavoOut;  
      else
      if (MySlides[SlideIndex].Name == "Shortcuts") {
          ProcessAllShortcuts(Project);
          document.getElementById("Body1"+SlideIndex).innerHTML =  ShortcutOut;
      }
  }
  if (!MySlides.length||(MySlides.length==1&&MySlides[0].Name == "Volume"))
    {ProcessAllShortcuts(Project);
    document.getElementById("Body1"+SlideIndex).innerHTML =  ShortcutOut;
    }

  let TheDate = new Date(ProjectLastChange);
  document.getElementById("LastChange").innerHTML = "Last NEEO-change:"+ TheDate.toLocaleString();
}
  
function GetContent(Project) 
{ // Main loop to gather information from NEEO.
  // First, determine which scenario will be shown as scenario is the main portal to view
  // Then get the slides that will be shown, they also determine the order in which we will display items
  // Depending on the slides, we collect information from these sources:
  // Favorites
  // Shortcuts
  //
  if (Scenario != LastScenario)
    {LastScenario = Scenario;
    var UsedScenarios = JSONPath.JSONPath({path: "$.rooms."+RoomName+".scenarios.*", json: Project});
    if (UsedScenarios.length == 0) {
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

    var MyScenIndex = UsedScenarios.findIndex((myname)=> {return Scenario == myname.name});
    // if the "scenario name" passed to us isn't found as scenario, try getting the scenario content through the recipe
    if (MyScenIndex==-1)
      {var UsedRecipes = JSONPath.JSONPath({path: "$.rooms."+RoomName+".recipes.*", json: Project});
      var MyRecpIndex = UsedRecipes.findIndex((myname)=> {return Scenario.trim() == myname.name.trim()});
      // now loop over the steps to find the "Control step"(the step in the recipe where you tell it to show what controls)
      var Steps = UsedRecipes[MyRecpIndex].steps;
      var MyStepIndex = Steps.findIndex((step)=> {return "controls"  == step.type});
      if (MyStepIndex!=-1)
        { var MyScenarioKey=Steps[MyStepIndex].scenarioKey;
          MyScenIndex = UsedScenarios.findIndex((ThisScenario)=> {return MyScenarioKey == ThisScenario.key});
        }
      }
    UsedScenario = UsedScenarios[MyScenIndex];
    }


  if (MyProject.ChangeDetected||PerformInitials) { 
    GetRoomNameAndKeys(MyProject);
    GetDeviceNameAndKeys(MyProject);             // Get ALL the devices (for all rooms) and put them in MyDevices array (cacheing)
    MyDirectories=[];                            // Will be filled when scanning shortcuts
    GetMetaOnRecipe(RoomName,UsedScenario);      // Get the meta-data of this scenario
    MySlides = GetSlides(RoomName,UsedScenario); // This info will not be refreshed by default, only when project changes
    MyFavorites=GetFavorites(RoomName,UsedScenario);
    PerformInitials=false;
    FillSlides(); // (Scenario,MySlides[SlideIndex],"",SlideIndex);

    let MyIndex = MySlides.findIndex((myname)=> {return "Shortcuts" == myname.Name});
    if (MyIndex>-1||!MySlides.length||(MySlides.length==1&&MySlides[0].Name == "Volume")) 
      GetAllShortcuts(RoomName,UsedScenario);           // Do this one as last, it will automatically call ProcessAllShortcuts
    }
    return true;
}
 
function FillSlides() 
{
  for (var SlideIndex = 0;SlideIndex<MySlides.length;SlideIndex++) 
    {var Slide = MySlides[SlideIndex];
    document.getElementById("BodyTitle1"+SlideIndex).innerHTML = "Slide "+ Slide.Name
    if (Slide.Name == "Favorites") 
            document.getElementById("Body1"+SlideIndex).innerHTML =  FormatFavorites(RoomKey,UsedScenario);  
    else 
      if (Slide.Name != "Shortcuts")  // will be filled by call to GetAllShortcuts
        if (Slide.Widget.length) 
          {var   MyShortcutOut = '<div class="BodyRow vertical">'; //= '<div class="BodyRow vertical"><div class="BodyRow-item"> '

            for (let j=0;j<Slide.Widget.length;j++)
            {var Shortcut = Slide.Widget[j];
              MyShortcutOut+= '<div class="BodyRow-item"> '
              var FlexHeight=0;
              for (var i =0;i<Shortcut.BlockcomponentKey.length;i++) {
                  if (Shortcut.Blockname[i].substring(0,1) == "<") {
                      if (Shortcut.Blockname[i] == "<br>")
                          FlexHeight++;
                      MyShortcutOut+= Shortcut.Blockname[i]
                      }
                  else    
                      MyShortcutOut+=  '<img class="buttons"  src="Icons/'+Shortcut.BlockIcon[i]+'"' +'" onclick="HandleClick('+"'button','"+Shortcut.deviceRoomKey+"','"+Shortcut.deviceKey+"','"+ Shortcut.BlockcomponentKey[i]+"','"+ url+"'"+')">' 
              }
              MyShortcutOut += '</div>'
              if (FlexHeight>2)
                  {FlexHeight = FlexHeight /3;
                  for (let NewLines=0;NewLines<FlexHeight;NewLines++)
                      MyShortcutOut += '<div class="BodyRow horizontal">'
                }
              MyShortcutOut+= '</div>'
            }
            MyShortcutOut+= '</div>'  
            document.getElementById("Body1"+SlideIndex).innerHTML += MyShortcutOut;
          }
        }
  return 0; 
}
function DecideOnRefreshOrUpdate(Project) 
{ if (Project.ChangeDetected) 
    Interpret_Project(Project)
  else  
    RefreshShortcuts()
  GetActScenario(); 
}

function RefreshShortcuts(Project,UsedScenario) 
{
  for (let j=0;j< AllShortcuts.length;j++) 
    AllShortcuts[j].Ready=false;

  for ( let j=0;j<AllShortcuts.length;j++) 
      if (AllShortcuts[j].Ready==false&&AllShortcuts[j].HasSensor)
            {GetSensorValue(j);
            return;
            }
    ProcessContent(Project)
}

function SetSensorInfo(MyIndex,MyType,MyFunc) 
{ AllShortcuts[MyIndex].HasSensor=true;
  AllShortcuts[MyIndex].Ready=false;
  AllShortcuts[MyIndex].NEEOType = MyType;

  var myPath = "$.rooms."+AllShortcuts[MyIndex].deviceRoomName+".devices.['"+AllShortcuts[MyIndex].deviceName+"']."+AllShortcuts[MyIndex].NEEOType+".['"+AllShortcuts[MyIndex].componentName+"'].sensor.key";
  AllShortcuts[MyIndex].SensorKey = JSONPath.JSONPath({path: myPath, json: MyProject});
  AllShortcuts[MyIndex].SensorURL = url+"/rooms/"+AllShortcuts[MyIndex].deviceRoomKey+"/devices/"+AllShortcuts[MyIndex].deviceKey+"/sensors/"+AllShortcuts[MyIndex].SensorKey+"?bb=0&Entry="+MyIndex;
  AllShortcuts[MyIndex].BuildOutput = MyFunc; 
  
  Sensorsfound++;
  return 1
}

function GetAllShortcuts(Project,UsedScenario) 
{                         // Here we will identify & reggister all shortcuts used and see if it's content relies on a sensor
                          // If it does, the shortuct is earmarked as "requires Snesor value". That value is filled on each refresh 
  var Shortcuts = JSONPath.JSONPath({path: "$.shortcuts.*", json: UsedScenario});
  Sensorsfound=0;
  var FoundAtLeastOneSensor=0;
  var MyType = "";
  
  for (let j=0;j< Shortcuts.length;j++) {
    let Shortcut = Shortcuts[j]
    Shortcut.HasSensor = false;
    Shortcut.Ready = true;
    MyType = Shortcut.componentType;
    if (MyType =="widget") { 
        TranslateWidget(Shortcut.componentName,Shortcut) // Will push anentire shortcut to the stack itself./
        AllShortcuts[AllShortcuts.length-1].BuildOutput = OutputAWidget;  
      }
    else {
      AllShortcuts.push(Shortcut);                       // Need to push the entry to the stack here
      let MyIndex = AllShortcuts.length-1;
      AllShortcuts[MyIndex].Icon= Shortcut.componentType+'.jpg"' 
      if (Shortcut.componentType=="textlabel")  { 
        FoundAtLeastOneSensor=SetSensorInfo(MyIndex,"textlabels",OutputATextlabel);
      }
      else if (Shortcut.componentType=="slider") { 
        FoundAtLeastOneSensor=SetSensorInfo(MyIndex,"sliders",OutputASlider)
      }
      else if (Shortcut.componentType=="switch") {
        FoundAtLeastOneSensor=SetSensorInfo(MyIndex,"switches",OutputASwitch)
      }
      else if (Shortcut.componentType=="directory") {  
        AllShortcuts[MyIndex].BuildOutput = OutputADirectory; 
      } 
      else if  (MyType =="button")  {
        AllShortcuts[MyIndex].BuildOutput = OutputAButton; 
      }
      else if  (MyType == "Spacer")
        {}       
      else 
          {console.log("Unhandled type:",Shortcut.componentType);
          return;
          }
    }
  }

  if (FoundAtLeastOneSensor)    // If we have no sensors, no need to wait till ProcessAllShortcuts is triggered is from there
    HandleNextSensor()                 // Get value for each sensor registered
  ProcessContent(Project)       // Format HTML with all content gathered
}
  
function HandleNextSensor() 
{ // this function is called when a call to NEEO is completed (to reduce load on NEEO) 
    var j;
    for ( j=0;j<AllShortcuts.length;j++) 
        if (AllShortcuts[j].Ready==false&&AllShortcuts[j].HasSensor)
            {GetSensorValue(j);
            return;
            }
    ProcessContent(MyProject)

}
  
function OutputAButton(Shortcut,UpdateSensor=false) 
{ if (!UpdateSensor) {
      ShortcutOut+= '<div><div class="BodyRow vertical">'          
      ShortcutOut+= '<div class="BodyRow-item"> <a> <img class="buttons"  src="Icons/'+Shortcut.Icon+'"' +'" onclick="HandleClick('+"'button','"+Shortcut.deviceRoomKey+"','"+Shortcut.deviceKey+"','"+ Shortcut.componentKey+"','"+ url+"'"+')"></a> </div>'

      ShortcutOut+= '<div class="vertical-buttontext">'+ Shortcut.componentLabel +' <br> ' + Shortcut.deviceName+'</div>'
      ShortcutOut+= '</div></div>'
      }
  NrItems ++;
}

function OutputASwitch(Shortcut,UpdateSensor=false) 
{ if (!UpdateSensor) {
        ShortcutOut+= '<div class="BodyRow vertical">' 
  }
  if (Shortcut.SensorValue) 
        ShortcutOut+= '<div  id="'+Shortcut.componentKey+ '" class="BodyRow-item"> <img class="image1" height="40" width="40"  src="Icons/switch-on.jpg"  onclick="UpdateSwitch('+"'"+Shortcut.deviceRoomKey+"','"+Shortcut.deviceKey  +"','"+Shortcut.componentKey + "','switches','off')" +'" ></div>'
  else
      ShortcutOut+= '<div  id="'+Shortcut.componentKey+ '" class="BodyRow-item"> <img class="image1" height="40" width="40"  src="Icons/switch-off.jpg"  onclick="UpdateSwitch('+"'"+Shortcut.deviceRoomKey+"','"+Shortcut.deviceKey  +"','"+Shortcut.componentKey + "','switches','on')" +'" ></div>'   
  if (!UpdateSensor) {
        ShortcutOut+= '<div class="BodyRow-item"><a href=""></a> '+Shortcut.componentLabel +'</div>'
        ShortcutOut+= '</div>'
        }
  NrItems++;
}
function OutputASlider(Shortcut,UpdateSensor=false) 
{ if (!UpdateSensor) {  
    ShortcutOut+= '<div class="BodyRow vertical">' 
  }
  ShortcutOut+= '<div  id="'+Shortcut.componentKey+ '" class="BodyRow-item"> <input type="range" min="1" max="100" value="'+  Shortcut.SensorValue   +'" class="slider"  onchange="UpdateSlider('+"'"+Shortcut.deviceRoomKey+"','"+Shortcut.deviceKey  +"','"+Shortcut.componentKey + "','sliders',this.value)" +'";></input></div>'   
  if (!UpdateSensor) 
    {ShortcutOut+= '<div class="BodyRow-item"><a href=""></a> '+Shortcut.componentLabel +'</div>'
    ShortcutOut+= '</div>'
    }
  NrItems +=2;
  }

function OutputADirectory(Shortcut,UpdateSensor=false) 
{ if (!UpdateSensor) 
    {ShortcutOut+= '<div class="BodyRow vertical">'     
    ShortcutOut+= '<div class="BodyRow-item"> <p> <a href="Directory.html?roomkey=' + RoomKey +  '&devicekey=' + Shortcut.deviceKey + '&directory=' + Shortcut.componentKey +  '&roomname=' + RoomName + '&scenario=' + Scenario +   '&url=' + url  +'"> <img class="image1" height="40" width="40"  src="Icons/directory.jpg"> </a>  </p></div>'
    ShortcutOut+= '<div class="BodyRow-item">'+ Shortcut.componentLabel +'</div>'
    ShortcutOut+= '</div>'
  }
  NrItems++;
}

function OutputATextlabel(Shortcut,UpdateSensor=false) 
{ let MySensorValue='missing';
  if (Shortcut.SensorValue != undefined)
    {MySensorValue = Shortcut.SensorValue;
    if (typeof MySensorValue == "number")
      MySensorValue = MySensorValue.toString(2);
  }
  let ToOccupy = Math.round(MySensorValue.length+5/10)%5;

  if (!UpdateSensor) {
    if (ToOccupy > MySettings.ItemsPerLine - NrItems ) { // too large to fit on the rest of the line?
        ShortcutOut += '</div><div class="BodyRow horizontal">'// start on a new line
        NrItems = 0;
    }
    ShortcutOut+= '<div class="BodyRow vertical-textlabel">' 
    ShortcutOut+= '<div class="BodyRow-item"><a href=""></a>'+Shortcut.name   +'</div>'
    }
  ShortcutOut+= '<div  id="'+Shortcut.componentKey+ '"  class="BodyRow-item">'+MySensorValue +'</div>';
  if (!UpdateSensor) {
    ShortcutOut+= '</div>'
  }
  NrItems+=ToOccupy;
}

function OutputAWidget(Shortcut,UpdateSensor=false) 
{ ShortcutOut+= CreateWidget(Shortcut);
  NrItems++;
}

function ProcessAllShortcuts(Project) 
{ ShortcutOut = '<div>'  // '<div class="BodyRow horizontal">' 
  NrItems = MySettings.ItemsPerLine;
  AllShortcuts.sort((firstEl, secondEl) => { return firstEl.Weight > secondEl.Weight} ) //now sort them according to user-settings
  for (var Entry=0;Entry <AllShortcuts.length;Entry++) {
    var Shortcut=AllShortcuts[Entry];
    if (NrItems >= MySettings.ItemsPerLine) {
        ShortcutOut += '</div><div class="BodyRow horizontal">'
        NrItems=0;
    }
    if (Shortcut.BuildOutput!=undefined)
    Shortcut.BuildOutput(Shortcut,CreateFullObject)
  }
  ShortcutOut+='</div>'
}


function CreateWidget(Shortcut) 
{var   MyShortcutOut = '<div class="BodyRow vertical"><div class="BodyRow-item"> '
    var FlexHeight=0;
    for (var i =0;i<Shortcut.BlockcomponentKey.length;i++) {
        if (Shortcut.Blockname[i].substring(0,1) == "<") {
            if (Shortcut.Blockname[i] == "<br>")
                FlexHeight++;
            MyShortcutOut+= Shortcut.Blockname[i]
            }
        else    
            MyShortcutOut+=  '<img class="buttons"  src="Icons/'+Shortcut.BlockIcon[i]+'"' +'" onclick="HandleClick('+"'button','"+Shortcut.deviceRoomKey+"','"+Shortcut.deviceKey+"','"+ Shortcut.BlockcomponentKey[i]+"','"+ url+"'"+')">' 
    }
    if (FlexHeight>2)
        MyShortcutOut += '</div><div class="BodyRow horizontal">'
    MyShortcutOut+= '</div></div>  '
    return MyShortcutOut;
}

function ReInit()
{ AllShortcuts=[];  
  SlidesMaintainedByUser=false;
  ShortcutSlideFound=false;
}

function Interpret_Project(Project)
{ MyProject = Project;
  ReInit();
  if (GetContent(MyProject)) {  // Load NEEO-project and search current scenario in it.
      GetActScenario();         // Skip if load or search went wrong
  }
Finit()
}

function LoadCookies(Device) 
{ MySettings = GetBrowserSettings(Device) // load cookies

  if (MySettings.Refresh==undefined || isNaN(MySettings.Refresh))
      MySettings.Refresh=5;
  if (MySettings.ShowActScen==undefined)
      MySettings.ShowActScen=true;
  if (MySettings.ItemsPerLine==undefined || isNaN(MySettings.ItemsPerLine))
      MySettings.ItemsPerLine=10;

  TillRefresh = MySettings.Refresh;
  Refresh.value = MySettings.Refresh;
  Items.value = MySettings.ItemsPerLine;
  UpdateRefreshPanel();

}

function  Init() 
{ HandleParams();
  LoadCookies("Device");  // Get user setingfs for this page 
  TheHeading =  'NEEO - device ';
  }

function Finit() 
{ let TheDate = new Date(ProjectLastChange);
  document.getElementById("LastChange").innerHTML = "Last NEEO-change:"+ TheDate.toLocaleString();
  TheHeading =  'NEEO - device "'+ Scenario + '" room '+ RoomName;
  document.title = TheHeading;
  document.getElementById("tod01").innerHTML = TheHeading + ' ' + new Date().toLocaleTimeString('en-US', { hour12: false});

  }

function MyMain() 
{ if (window.performance.getEntriesByType("navigation")[0].type == "navigate") {
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
