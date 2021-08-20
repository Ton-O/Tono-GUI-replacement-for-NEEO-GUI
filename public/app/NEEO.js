
const queryString = window.location.search;
var URLParts;
const urlParams = new URLSearchParams(queryString);
var url = urlParams.get('url')
var MyJSON=""; 
var MyProject = ""; 
var LastChange; 
var TheHeading;
var MySettings = {}

function UpdateNow() {
  TillRefresh = MySettings.Refresh;
  GetNeeoProject(Interpret_Project);
}

function HandleClick(RoomKey,RoomName) 
{
  window.location.href='GetARoom.html?roomname='+RoomName+'&roomkey='+RoomKey+'&url='+url
}

function Interpret_Project(Project) {

  GetActScenario()
  GetAllRooms()
}

function  GetAllRooms() {
  var Rooms = JSONPath.JSONPath({path: "$.rooms.*", json: MyProject});
  var NrItems = MySettings.ItemsPerLine;
  var Out =  '<div>';
//  Out += '</div><div class="LargeRow horizontal">'

  for(var i = 0; i < Rooms.length; i++) {
    if (NrItems >= MySettings.ItemsPerLine) {
        Out += '</div><div class="LargeRow horizontal">'
        NrItems=0;
    }
    Out+= '<div class="LargeRow vertical">'   
    Out+= '<div class="LargeRow-item"> <img class="image1" height="120" width="120"  src="Icons/'+Rooms[i].name+".png"+'"  onclick="HandleClick('+"'"+Rooms[i].key+"','"+Rooms[i].name+"')" +'" ></div>'
    Out+= '<div class="LargeRow-item">'+ Rooms[i].name +'</div>'
    Out+= '</div>'
    NrItems++;
}
    Out+='</div>'

  document.getElementById("Body01").innerHTML = Out;
  let TheDate = new Date(LastChange);
  document.getElementById("LastChange").innerHTML = "Last NEEO-change:"+ TheDate.toLocaleString();
}

function LoadCookies(Device) 
{
  MySettings = GetBrowserSettings(Device) // load cookies

  if (MySettings.Refresh==undefined || isNaN(MySettings.Refresh))
      MySettings.Refresh=0;
  if (MySettings.ShowActScen==undefined)
      MySettings.ShowActScen=false;
  if (MySettings.ItemsPerLine==undefined || isNaN(MySettings.ItemsPerLine))
      MySettings.ItemsPerLine=10;

  TillRefresh = MySettings.Refresh;
  Refresh.value = MySettings.Refresh;
  Items.value = MySettings.ItemsPerLine;
  UpdateRefreshPanel();
}

function  HandleParams(){
  if (url==''||url==null)
    if (window.location.hostname != "")
      url = "http://"+ window.location.hostname + ":3000/v1/projects/home";
    else {
      url='http://192.168.0.150:3000/v1/projects/home'
      ShowError("Please add ?url=xxx.xx.xx.xxx to the url to specify your brain, default 192.168.0.150 assumed");
    }

  else
    if (!url.includes('/')&&url.substring(0,4).toUpperCase()!="HTTP")
      url='http://'+url+":3000/v1/projects/home"
  URLParts = url.split(':3000')
  URLParts = URLParts[0].split('/') // ==>  


}
function MyMain() {

  GetNeeoProject(Interpret_Project);
}
HandleParams();
LoadCookies("NEEO")

MyMain();

var TheHeading =  'NEEO - Rooms '+ URLParts[2] + ' (' +MyProject.label+')' 
  document.title = TheHeading;
  document.getElementById("tod01").innerHTML = TheHeading + ' ' + new Date().toLocaleTimeString('en-US', { hour12: false});



