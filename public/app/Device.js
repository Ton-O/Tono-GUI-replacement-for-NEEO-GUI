'use strict';

const RefreshSensor = true;
const CreateFullObject = false;
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
var url;
var RoomKey; 
var RoomName;
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
var NrItems;


var Action;
var UsedScenario;
var MySettings;
var AllShortcuts = [];
var ShortcutSlideFound=false;
var MyFavorites = {}
var MySlides = [];
var SlidesMaintainedByUser=false; 
var AllShortcuts = [];
var MyDirectories = [];

var HTTPExec = new XMLHttpRequest();
var ActiveScenariosURL= url+'/activescenariokeys';  
var HTTPGetAllShortcuts = new XMLHttpRequest();

var MyProject = ""; 
var LastChange; 
var MySettings = {}
var Favorites = {}
var MyDevices = {};
var MyRooms = {};
  
function UpdateSlider(RoomKey,DeviceKey,ID,Type,value)
{
  var xmlHttp =  new XMLHttpRequest();
  var Updateurl=url+"/rooms/"+RoomKey+"/devices/"+DeviceKey+"/"+Type+"/"+ID;
  var mimeType = "application/json";  
  xmlHttp.open('PUT', Updateurl, true);  // true : asynchrone false: synchrone
  xmlHttp.setRequestHeader('Content-Type', mimeType);  
  xmlHttp.send('{"value":'+value+'}'); 
}

function UpdateSwitch(RoomKey,DeviceKey,ID,Type,value)
{
  var xmlHttp =  new XMLHttpRequest();
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
{
  var xmlHttp =  new XMLHttpRequest();

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

function HandleParams() {

url = urlParams.get('url')
RoomKey = urlParams.get('roomkey')
RoomName = urlParams.get('roomname')
Scenario = urlParams.get('scenario')
RoomURL =url+"/rooms/"+RoomKey+'/'
}

function TransmitFavorite(channelNr, RoomKey,deviceKey, url) 
{
  HandleClick("button",RoomKey,deviceKey,GetKeyByNameFromProject("DIGIT "+ channelNr[0],MyRooms[RoomKey],MyDevices[deviceKey]),url)
  if (channelNr.length>1)
     for (let ll=1;ll<channelNr.length;ll++) {
          for (var k = 0;k<12001;k++)     // an arbitrary delay, sorry for cpu-looping here
           for (var j=0;j<100;j++)
             if (k==12000) {
                HandleClick("button",RoomKey,deviceKey,GetKeyByNameFromProject("DIGIT "+ channelNr[ll],MyRooms[RoomKey],MyDevices[deviceKey]),url)
              }
             }
  UpdateNow();
}
function UpdateNow() 
{
  TillRefresh = MySettings.Refresh;
  //RefreshShortcuts()
  GetNeeoProject(DecideOnRefreshOrUpdate);
}

function GetSensorValues(MyCB) {
  var myPath;
  var SensorHTTP = new XMLHttpRequest();
  var ResponseValue;
  var UseThisUrl;
  SensorHTTP.onreadystatechange = function() {
    if (this.readyState == 4 ) 
      {const urlParams = new URLSearchParams(this.responseURL);
      const MyEntry = urlParams.get('Entry')
      try {
      AllShortcuts[MyEntry].Ready=true;  // though it may be failed, flag call as completed
      }
      catch (err) {console.log("error in storing result",err,urlParams)}
      if (this.status != 200) {
            ShowError("sensor-get failed:",this.responseURL,this.status)
          }
      else {
          ResponseValue = JSON.parse(this.responseText);
          AllShortcuts[MyEntry].SensorValue = ResponseValue.value;
          }
      for (var Entry=0;Entry<AllShortcuts.length;Entry++) {
        if (AllShortcuts[Entry].HasSensor&&AllShortcuts[Entry].Ready==false) {
          UseThisUrl=AllShortcuts[Entry].SensorURL+"?bb=0&Entry="+Entry
          SensorHTTP.open("GET", UseThisUrl, true);
          SensorHTTP.send();
          return;
        }
      }
      MyCB()
    }   
  };
  for (var Entry=0;Entry<AllShortcuts.length;Entry++) {
    if (AllShortcuts[Entry].HasSensor&&AllShortcuts[Entry].Ready==false)
      {UseThisUrl=AllShortcuts[Entry].SensorURL+"?bb=0&Entry="+Entry
      SensorHTTP.open("GET", UseThisUrl, true);
      SensorHTTP.send();
      return;
    }
  }
}
 


function GetSensorValue(Entry) {
  var myPath;
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
              ShowError("sensor-get failed:",this.responseURL,this.status)
            }
        else {
            ResponseValue = JSON.parse(this.responseText);
            AllShortcuts[MyEntry].SensorValue = ResponseValue.value;
            }
        HandleNextSensor()
        }   
  };
  SensorHTTP.open("GET", SensorURL, true);
  SensorHTTP.send();
}

function GetKeyByNameFromProject(Name,deviceRoomName,deviceName) {
if (Name.substring(0,1) == "<")
    return 0
  var myPath = "$.rooms.'"+deviceRoomName+"'.devices.['"+deviceName+"'].macros.['"+Name+"'].key";
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

function GetFavorites(RoomName,Scenario) {
var myPath;
var myCapab;
var myFavo;
var myDevices;
for (var i=0;i<Scenario.devices.length;i++) {
      myPath = "$.capabilities.["+Scenario.devices[i]+'].*' //+Scenario.key+".capabilities.*"; //  .['neeo.feature.favorites']";
      myCapab = JSONPath.JSONPath({path: myPath, json: Scenario});
      for (var j=0;j<myCapab.length;j++)
        if (myCapab[j] == 'neeo.feature.favorites') { //<== this will give us a device key, but we need device name.....
            myPath = "$.rooms."+RoomName+".devices.*";
            myDevices = JSONPath.JSONPath({path: myPath, json: MyProject});
            for (var k=0;k<myDevices.length;k++)
                if (myDevices[k].key == Scenario.devices[i]) { //<== this will give us a device key, but we need device name.....
                    myPath = "$.favorites.*";
                    myFavo = JSONPath.JSONPath({path: myPath, json: myDevices[j]});
                    if (myFavo != undefined)
                        return myFavo
                }
        } 
    }  
return  {}       
}

function FormatFavorites(RoomKey,Scenario) {
//    MyFavorites = TestFavorites(RoomName,Scenario) ;
    if (!MyFavorites.length)
        return;

    FavoOut = '<div>'  // '<div class="BodyRow horizontal">' 
    var NrFavosPerLine = 12; // NrFavosPerLine;
    var NrFavos = NrFavosPerLine

    for (var Entry = 0;Entry<MyFavorites.length;Entry++) {
        let TheFav = MyFavorites[Entry];
//        console.log(TheFav.channelNr," channel ",TheFav.channel.name)

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
  
function TranslateWidget(Name,Shortcut,Destination="Shortcut"){
  var Items = [];
  if (Name == "neeo.default.button-set.volume") 
      Items = ["VOLUME DOWN", "VOLUME UP","<br>","MUTE TOGGLE"];
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
  if (Name == "neeo.default.button-set.transport-scan")
      Items = ["SKIP BACKWARD", "SKIP FORWARD"]
  else {
      ShowError("Unknown widget ignored (please report): "+ Name);
      return 
  }
  return FillWidget(Items,Shortcut,Destination)
  
}

function FillWidget(Items,Shortcut,Destination="Shortcut") {
    let DummyShortcut = JSON.parse(JSON.stringify(Shortcut));
    DummyShortcut.Blockname = [];
    DummyShortcut.BlockLabel = [];
    DummyShortcut.BlockIcon = [];
    DummyShortcut.BlockKey = [];
    DummyShortcut.BlockcomponentKey = [];
    for (let i = 0;i<Items.length;i++) {
        DummyShortcut.Blockname[i] = Items[i];
        DummyShortcut.BlockLabel[i] = Items[i];
        DummyShortcut.BlockIcon[i] = Items[i]+".jpg";
        DummyShortcut.BlockKey[i] = GetKeyByNameFromProject(Items[i],DummyShortcut.deviceRoomName,DummyShortcut.deviceName)
        DummyShortcut.BlockcomponentKey[i] = DummyShortcut.BlockKey[i] 
    }
  if (Destination=="Shortcut") { 
    AllShortcuts.push(DummyShortcut);                //And add the reconstructed dummy to the list of shortcuts
    //AllShortcuts[MyIndex].Ready=true;
    }
  else
    return DummyShortcut                            // Or just return the reconstructed dummy for slides


}
function GetSlides(RoomName,UsedScenario) { volumeDeviceKey
  MySlides = [];
  var volumeDeviceKey = JSONPath.JSONPath({path: "$.volumeDeviceKey", json: UsedScenario});
  var MainDevice = JSONPath.JSONPath({path: "$.mainDeviceKey", json: UsedScenario});
  var MyCapabilities = JSONPath.JSONPath({path: "$.capabilities", json: UsedScenario});
  var CapabKey = Object.keys(MyCapabilities[0])
  MyCapabilities = JSONPath.JSONPath({path: "$.capabilities.*", json: UsedScenario});

  var Slides = JSONPath.JSONPath({path: "$.slides", json: UsedScenario});
  var Weight = JSONPath.JSONPath({path: "$.slides.*.weight", json: UsedScenario});
  var Hidden = JSONPath.JSONPath({path: "$.slides.*.hidden", json: UsedScenario});
  var TempShortcut = {"key":MainDevice,"deviceRoomName":UsedScenario.roomName,"deviceRoomKey":UsedScenario.roomKey,"deviceKey":MainDevice,"deviceName":MyDevices[MainDevice]}
  var SlideNames = Object.keys(UsedScenario.slides) //.forEach(function(key) {
  var Destination = "Slide"
  var MeAdded = 0;
  if (volumeDeviceKey!=undefined&&volumeDeviceKey!=null) {
    MySlides.push({"Name":"Volume","Weight":-1,"Widget":[]});
    MeAdded++;
    let VolShortcut = {"key":MainDevice,"deviceRoomName":UsedScenario.roomName,"deviceRoomKey":UsedScenario.roomKey,"deviceKey":volumeDeviceKey,"deviceName":MyDevices[volumeDeviceKey]}

    MySlides[0].Widget[0] = TranslateWidget("neeo.default.button-set.volume",VolShortcut,Destination);
}

  
  for (var i =0;i<SlideNames.length;i++) {
      {if (Hidden[i]==false)                                         // neeo.slide. = 11
          if (SlideNames[i].substring(0,20)=="neeo.slide.favorites") // 11 +9
            MySlides.push({"Name":"Favorites","Weight":Weight[i],"Widget":[]});
          else
          if (SlideNames[i].substring(0,17)=="neeo.slide.numpad") {    //+ 6
            MySlides.push({"Name":"Numpad","Weight":Weight[i],"Widget":[]});
            MySlides[MySlides.length-1].Widget[0] = TranslateWidget("neeo.default.button-set.numpad",TempShortcut,Destination);
          }
          else
          if (SlideNames[i].substring(0,20)=="neeo.slide.transport") { // + 9
            MySlides.push({"Name":"Transports","Weight":Weight[i],"Widget":[]});
            MySlides[MySlides.length-1].Widget[0] =  TranslateWidget("neeo.default.button-set.transport",TempShortcut,Destination)
          }
          else
          if (SlideNames[i].substring(0,17)=="neeo.slide.zapper") {   // +6
            MySlides.push({"Name":"Zapper","Weight":Weight[i],"Widget":[]});
            MySlides[MySlides.length-1].Widget[0] =  TranslateWidget("neeo.default.button-set.zapper",TempShortcut,Destination)
          }
          else
          if (SlideNames[i].substring(0,21)=="neeo.slide.controlpad") { // + 10
            MySlides.push({"Name":"Controlpad","Weight":Weight[i],"Widget":[]});
            MySlides[MySlides.length-1].Widget[0] =  TranslateWidget("neeo.default.button-set.controlpad",TempShortcut,Destination)
          }
          else
          if (SlideNames[i]=="neeo.slide.shortcuts") {
            ShortcutSlideFound=true;
            MySlides.push({"Name":"Shortcuts","Weight":Weight[i],"Widget":[]});
          }
          else
              ShowError("Unknown slide: " + SlideNames[i])

      }
  }

  if (SlideNames.length!=0&&MySlides.length==MeAdded)         // User has manually suppressed slides, don't guess, just follow what he defined
    SlidesMaintainedByUser=true; 

  return MySlides
}

function ProcessContent(Project) {
var SlideLine = 0;
  // Main loop to present information from NEEO.
  // Loop over all slides that were found and buildm output based on the expected content of the slide
  // Finally, finish the display
  for (var i = 0;i<7;i++)
    {document.getElementById("BodyTitle1"+i).innerHTML = ""
    document.getElementById("Body1"+i).innerHTML =  "";
    }  

    if (!ShortcutSlideFound&&!SlidesMaintainedByUser) {
    MySlides.push({"Name":"Shortcuts","Weight":0,"Widget":[]});  // Make sure we show shortcuts; still unclear why there's not always a slide for them.
    ShortcutSlideFound=true;
    }

  for (var SlideIndex = 0;SlideIndex<MySlides.length;SlideIndex++) 
    FillSlides(Scenario,MySlides[SlideIndex],"",SlideIndex);

  let TheDate = new Date(LastChange);
  document.getElementById("LastChange").innerHTML = "Last NEEO-change:"+ TheDate.toLocaleString();

}
function FillSlides(Scenario,Slide,deviceType,SlideIndex) {
  document.getElementById("BodyTitle1"+SlideIndex).innerHTML = "Slide "+ MySlides[SlideIndex].Name
  if (Slide.Name == "Favorites") {
          document.getElementById("Body1"+SlideIndex).innerHTML =  FormatFavorites(RoomKey,UsedScenario);  
        }
  else 
  if (Slide.Name == "Shortcuts")  // will be filled by call to GetAllShortcuts
    {ProcessAllShortcuts(MyProject);
    document.getElementById("Body1"+SlideIndex++).innerHTML =  ShortcutOut;
  }
  else 
    document.getElementById("Body1"+SlideIndex).innerHTML =  CreateWidget(Slide.Widget[0]);  

    return 0; 
}
 

function GetContent(MyProject) {
  // Main loop to gather information from NEEO.
  // First, determine which scenario will be shown as scenario is the main portal to view
  // Then get the slides that will be shown, they also determine the order in which we will display items
  // Depending ion the slides, we collect information from these sources:
  // Favorites
  // Shortcuts
  //

  var myPath = "$.rooms."+RoomName+".scenarios."+Scenario+".*"; //$.rooms.Living Room.scenarios.Radio eyetv.*
  var UsedScenarios = JSONPath.JSONPath({path: "$.rooms."+RoomName+".scenarios.*", json: MyProject});
  if (UsedScenarios.length == 0) {
    console.log("Oops, room/scenario not found....., did we have a change?")
    if (MyProject.ChangeDetected)
      {ShowError("Scenario cannot be found.... perhaps deleted within NEEO-GUI?")
      return false;
      }
    else
      {ShowError("Scenario cannot be found.... cannot continue, please return to index of rooms and retry")
      return false;
    }
  }
  var MyScenIndex = UsedScenarios.findIndex((myname)=> {return Scenario == myname.name});
  UsedScenario = UsedScenarios[MyScenIndex];
  if (MyProject.ChangeDetected||PerformInitials) { 
    GetRoomNameAndKeys(MyProject);
    GetDeviceNameAndKeys(MyProject);
    MyDirectories=[];                            // Will be filled when scanning shortcuts
    MySlides = GetSlides(RoomName,UsedScenario); // This info will not be refreshed by default, only when project changes
    MyFavorites=GetFavorites(RoomName,UsedScenario);
    PerformInitials=false;
  }

  GetAllShortcuts(RoomName,UsedScenario);           // Do this one as last, it will automatically call ProcessAllShortcuts
  return true
}
  
function DecideOnRefreshOrUpdate(Project) {
if (Project.ChangeDetected) 
  Interpret_Project(Project)
else  
  RefreshShortcuts()

}
function RefreshShortcuts() {

  for (let j=0;j< AllShortcuts.length;j++) 
    AllShortcuts[j].Ready=false;

  GetSensorValues(ProcessSensors);
}

function ProcessSensors(MyProject){
  for (let j=0;j< AllShortcuts.length;j++) 
    if (AllShortcuts[j].HasSensor)
      {ShortcutOut="";
        AllShortcuts[j].BuildOutput(AllShortcuts[j],RefreshSensor)
        document.getElementById(AllShortcuts[j].componentKey).innerHTML = ShortcutOut;
      }

}
function SetSensorInfo(MyIndex,MyType) {
  AllShortcuts[MyIndex].HasSensor=true;
  AllShortcuts[MyIndex].Ready=false;
  AllShortcuts[MyIndex].NEEOType = MyType;

  var myPath = "$.rooms."+AllShortcuts[MyIndex].deviceRoomName+".devices.['"+AllShortcuts[MyIndex].deviceName+"']."+AllShortcuts[MyIndex].NEEOType+".['"+AllShortcuts[MyIndex].componentName+"'].sensor.key";
  AllShortcuts[MyIndex].SensorKey = JSONPath.JSONPath({path: myPath, json: MyProject});
  AllShortcuts[MyIndex].SensorURL = url+"/rooms/"+AllShortcuts[MyIndex].deviceRoomKey+"/devices/"+AllShortcuts[MyIndex].deviceKey+"/sensors/"+AllShortcuts[MyIndex].SensorKey;
  
  Sensorsfound++;
  return 1
}
function GetAllShortcuts(Project,UsedScenario) {

//  ShowError("");

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
        FoundAtLeastOneSensor=SetSensorInfo(MyIndex,"textlabels");
        Shortcut.BuildOutput = OutputATextlabel; 
      }
      else if (Shortcut.componentType=="slider") { 
        FoundAtLeastOneSensor=SetSensorInfo(MyIndex,"sliders")
        Shortcut.BuildOutput = OutputASlider; 
      }
      else if (Shortcut.componentType=="switch") { 
        FoundAtLeastOneSensor=SetSensorInfo(MyIndex,"switches")
        Shortcut.BuildOutput = OutputASwitch; 
      }
      else if (Shortcut.componentType=="directory") {  
        Shortcut.BuildOutput = OutputADirectory; 
      }
      else if  (MyType =="button")  {
        Shortcut.BuildOutput = OutputAButton; 
      }
      else
          {console.log("Unhandled type:",Shortcut.componentType);
          return;
          }
    }
  }

  

  if (FoundAtLeastOneSensor==false)    // If we have no sensors, no need to wait till ProcessAllShortcuts is triggered is from there
    ProcessContent(Project) // 
  else
    HandleNextSensor()

  return true;  
}
  
function HandleNextSensor() { // this function is called when a call to NEEO is completed (to reduce load on NEEO) 
    var j;
    for ( j=0;j<AllShortcuts.length;j++) 
        if (AllShortcuts[j].Ready==false&&AllShortcuts[j].HasSensor)
            {GetSensorValue(j);
            return;
            }
    ProcessContent(MyProject)

}
 
function OutputAButton(Shortcut,UpdateSensor=false) {

  if (!UpdateSensor) {
    ShortcutOut+= '<div><div class="BodyRow vertical">'          
    ShortcutOut+= '<div class="BodyRow-item"> <a> <img class="buttons"  src="Icons/'+Shortcut.Icon+'"' +'" onclick="HandleClick('+"'button','"+Shortcut.deviceRoomKey+"','"+Shortcut.deviceKey+"','"+ Shortcut.componentKey+"','"+ url+"'"+')"></a> </div>'
    ShortcutOut+= '<div class="BodyRow-item">'+ Shortcut.componentLabel +'</div>'
    ShortcutOut+= '</div></div>'
  }
  NrItems ++;
}

function OutputASwitch(Shortcut,UpdateSensor=false) {
  if (!UpdateSensor) {
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

function OutputASlider(Shortcut,UpdateSensor=false) { 
  if (!UpdateSensor) {  
    ShortcutOut+= '<div class="BodyRow vertical">' 
  }
  ShortcutOut+= '<div  id="'+Shortcut.componentKey+ '" class="BodyRow-item"> <input type="range" min="1" max="100" value="'+  Shortcut.SensorValue   +'" class="slider"  onchange="UpdateSlider('+"'"+Shortcut.deviceRoomKey+"','"+Shortcut.deviceKey  +"','"+Shortcut.componentKey + "','sliders',this.value)" +'";></input></div>'   
  if (!UpdateSensor) {
    ShortcutOut+= '<div class="BodyRow-item"><a href=""></a> '+Shortcut.componentLabel +'</div>'
    ShortcutOut+= '</div>'
  }
  NrItems +=2;
}

function OutputADirectory(Shortcut,UpdateSensor=false) { 
  if (!UpdateSensor) {  
    ShortcutOut+= '<div class="BodyRow vertical">'     
    ShortcutOut+= '<div class="BodyRow-item"> <p> <a href="Directory.html?roomkey=' + RoomKey +  '&devicekey=' + Shortcut.deviceKey + '&directory=' + Shortcut.componentKey +  '&roomname=' + RoomName + '&scenario=' + Scenario +   '&url=' + url  +'"> <img class="image1" height="40" width="40"  src="Icons/directory.jpg"> </a>  </p></div>'
    ShortcutOut+= '<div class="BodyRow-item">'+ Shortcut.componentLabel +'</div>'
    ShortcutOut+= '</div>'
  }
  
//          ShortcutOut+= '<div class="BodyRow-item"> <span><a> <img class="buttons"  src="Icons/'+Shortcut.Icon+'" "href="' + 'Directory.html?roomkey=' + Shortcut.deviceRoomKey + '&devicekey=' + Shortcut.deviceKey + '&directory=' + Shortcut.deviceRoomKey +    '&url=' + url +'></a></span> </div>'
//          ShortcutOut+= '<div class="BodyRow-item"><a href="' + 'Directory.html?roomkey=' + Shortcut.deviceRoomKey + '&devicekey=' + Shortcut.deviceKey + '&directory=' + Shortcut.deviceRoomKey + '&roomname=' + Shortcut.roomName +   '&url=' + url +'</a>'+ Shortcut.componentLabel +'</div>'
//          ShortcutOut+= '</div>'
  NrItems++;
}
  
function OutputATextlabel(Shortcut,UpdateSensor=false) {  
  let ToOccupy = Math.round(Shortcut.SensorValue.length+5/10)%5;

  if (!UpdateSensor) {
    if (ToOccupy > MySettings.ItemsPerLine - NrItems ) { // too large to fit omn the rest of the line?
        ShortcutOut += '</div><div class="BodyRow horizontal">'// start on a new line
            NrItems = 0;
        }
    ShortcutOut+= '<div class="BodyRow vertical-textlabel">' 
    ShortcutOut+= '<div class="BodyRow-item"><a href=""></a>'+Shortcut.name   +'</div>'
  }
  ShortcutOut+= '<div  id="'+Shortcut.componentKey+ '"  class="BodyRow-item">'+Shortcut.SensorValue +'</div>';
  if (!UpdateSensor) {
    ShortcutOut+= '</div>'
  }
  NrItems+=ToOccupy;
}

function OutputAWidget(Shortcut,UpdateSensor=false) { 
//  if (!UpdateSensor) {
    ShortcutOut+= CreateWidget(Shortcut);
//  }
  NrItems++;
}

function ProcessAllShortcuts(Project) 
{  
  ShortcutOut = '<div>'  // '<div class="BodyRow horizontal">' 
  NrItems = MySettings.ItemsPerLine;

  AllShortcuts.sort((firstEl, secondEl) => { return firstEl.Weight > secondEl.Weight} ) //now sort them according to user-settings
  for (var Entry=0;Entry <AllShortcuts.length;Entry++) {
    var Shortcut=AllShortcuts[Entry];
    if (NrItems >= MySettings.ItemsPerLine) {
        ShortcutOut += '</div><div class="BodyRow horizontal">'
        NrItems=0;
    }
    Shortcut.BuildOutput(Shortcut,CreateFullObject)
  }
  ShortcutOut+='</div>'
}
function CreateWidget(Shortcut) {
  var   MyShortcutOut = '<div class="BodyRow vertical"><div class="BodyRow-item"> '
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
    MyShortcutOut+= '</div></div>'
    return MyShortcutOut;
}

function ReInit(){ 
  AllShortcuts=[];  
  SlidesMaintainedByUser=false;
  ShortcutSlideFound=false;
}

function Interpret_Project(Project)
{MyProject = Project;
  ReInit();
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
  LoadCookies("Device");  // Get user setingfs for this page 
  TheHeading =  'NEEO - device ';
  }

  function Finit() {
    let TheDate = new Date(LastChange);
    document.getElementById("LastChange").innerHTML = "Last NEEO-change:"+ TheDate.toLocaleString();
    TheHeading =  'NEEO - device "'+ Scenario + '" room '+ RoomName;
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
