
var xmlhttp = new XMLHttpRequest();
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
var url;
var RoomName;
var RoomKey;
var AllDevices = [];
var RoomURL;
var ProjectLastChange; 
var TheHeading;
var MySettings = {}
var MyContent="";

function UpdateNow() 
{
    TillRefresh = MySettings.Refresh;
    GetNeeoProject(Interpret_Project);
}

function HandleClick(MyIndex) 
{
  window.location.href='ShowDevice.html?roomname=' + AllDevices[MyIndex].RoomName + '&devicename=' + AllDevices[MyIndex].deviceName +   '&url=' + url 
}

function  HandleParams()
{
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  url = urlParams.get('url')
  URLParts = url.split(':3000')
  URLParts = URLParts[0].split('/') // ==> 
  BrainIP.value = URLParts[2];
}

function Interpret_Project(MyProject)
{
  GetAllDevices(MyProject);
  GetActScenario()
  let TheDate = new Date(ProjectLastChange);
  document.getElementById("LastChange").innerHTML = "Last NEEO-change:"+ TheDate.toLocaleString();
}

function GetAllDevices(Project) 
{
  var i;
  var mydevices = JSONPath.JSONPath({path: "$.rooms.'*'.devices.*", json: Project});
  var MyDeviceKey  = "";
  var MydeviceName = "";
  var MyDeviceType = "";
  var MyDeviceIcon = ""; 
  var MyDeviceHidden = ""; 
  var MyDeviceMainDevice = ""; 
  var EntryToWrite = -1;

  AllDevices = [];  

  for (let j=0;j< mydevices.length;j++) {
    MyDeviceKey  = mydevices[j].key;
    MyDeviceName = mydevices[j].name;
    MyDeviceRoomName = mydevices[j].roomName;
    MyDeviceRoomKey = mydevices[j].roomKey;
    MyDeviceIcon = mydevices[j].details.icon;
    MyDeviceWeight = mydevices[j].weight;
    MyScenarioKey = mydevices[j].scenarioKey;
    let DeviceIndex = AllDevices.findIndex((myname)=> {return MydeviceName == myname.Name});
    if (DeviceIndex<0) { //deviceName is not yet in array
        AllDevices.push({"poweroff": MyDeviceKey, 
                         "deviceName": MyDeviceName,
                         "RoomName": MyDeviceRoomName,
                         "RoomKey": MyDeviceRoomKey,
                         "Type": MyDeviceType,
                         "Icon": MyDeviceIcon,
                         "Weight": MyDeviceWeight,
                         "Scenario": MyScenarioKey});

          EntryToWrite = AllDevices.length -1; 
    }
    
  }
  AllDevices.sort((firstEl, secondEl) => { 
    if ( firstEl.RoomName < secondEl.RoomName )
      return 1;
    else
      if ( firstEl.RoomName == secondEl.RoomName )
        if ( firstEl.deviceName < secondEl.deviceName )
          return  1;
        else
          if ( firstEl.deviceName == secondEl.deviceName )
            return 0;
          else
            return -1;
      else
        return -1;
    }
  );
    
  var NrItems = 0;
  var DirEntryOut = "";
  DirEntryOut = '<div> <div class="LargeRow horizontal">' 

  for (var Entry=AllDevices.length-1;Entry >=0;Entry--)  {
      if (NrItems >= MySettings.ItemsPerLine) {
          DirEntryOut += '</div><div class="LargeRow horizontal">'
          NrItems=0;
      }
    
      DirEntryOut+= '<div class="LargeRow vertical">' 
      DirEntryOut+= '<div class="LargeRow-item"> <img class="image1" height="120" width="120"  src=Icons/'+AllDevices[Entry].Icon.toUpperCase()+'.jpg onclick="HandleClick('+  Entry +")" +'" ></div>'
      DirEntryOut+= '<div class="LargeRow-item">'+ AllDevices[Entry].deviceName +'</div>'
      DirEntryOut+= '<div class="LargeRow-item">'+ AllDevices[Entry].RoomName +'</div>'
      DirEntryOut+= '</div>'
      NrItems++;
  }
  document.getElementById("Body01").innerHTML = DirEntryOut;

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
  UpdateActSceneSwitch();

}

function  Init() 
{
HandleParams();
LoadCookies("GetARoom");  // Get user setingfs for this page 

}
function MyMain() 
{
  if (window.performance.getEntriesByType('navigation').length &&window.performance.getEntriesByType("navigation")[0].type == "navigate") {
    Action = urlParams.get('execute')
    if (Action!=""&&Action!=null) {  // Do we need to start the scenario?
      let ExecURL=RoomURL+'Devices/'+ Action+'/execute';
      HTTPExec.open("GET",  ExecURL, true);
      HTTPExec.send();
    }
  }
  GetNeeoProject(Interpret_Project);    // This is the main engine: Get the latest project from NEEO and callback to Interpret_Project
}

Init();
MyMain();
let TheDate = new Date(ProjectLastChange);
document.getElementById("LastChange").innerHTML = "Last NEEO-change:"+ TheDate.toLocaleString();
TheHeading =  'NEEO - All devices / rooms';
document.title = TheHeading;
document.getElementById("tod01").innerHTML = TheHeading + ' ' + new Date().toLocaleTimeString('en-US', { hour12: false});

