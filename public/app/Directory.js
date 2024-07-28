var url; 
var RoomKey; 
var DeviceKey;
var Directory; 
var RoomName; 
var Scenario;
var MyContent="";
var TheHeading="";
var SaveParms="";
function HandleParams() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
     url = urlParams.get('url')
     RoomKey = urlParams.get('roomkey')
     DeviceKey = urlParams.get('devicekey')
     Directory = urlParams.get('directory')
     RoomName = urlParams.get('roomname')
     Scenario= urlParams.get('scenario')
    

}

function UpdateNow() 
{  TillRefresh = MySettings.Refresh;
    LoadDirectory();
}
  function ShowDirectory() {
    var NrItems = MySettings.ItemsPerLine;

    var DirEntryOut = "";
    DirEntryOut = '<div>'  // '<div class="BodyRow horizontal">' 
    
    for (var Entry=0;Entry <MyContent.items.length;Entry++) {
        var DirEntry=MyContent.items[Entry];
        if (NrItems >= MySettings.ItemsPerLine) {
            DirEntryOut += '</div><div class="LargeRow horizontal">'
            NrItems=0;
        }
    
        DirEntryOut+= '<div class="LargeRow vertical">'   
        DirEntryOut+= '<div class="LargeRow-item"> <img class="image1" height="120" width="120"  src="'+DirEntry.thumbnailUri+'"  onclick="HandleSelect('+"'"+RoomKey+"','"+DeviceKey +"','"+Directory + "','"+DirEntry.title+"')" +'" ></div>'
       
    //    DirEntryOut+= '<div class="LargeRow-item"> <a> <img class="buttons"  src="Icons/'+DirEntry.Icon+'"' +'" onclick="HandleClick('+"'button','"+DirEntry.deviceRoomKey+"','"+DirEntry.deviceKey+"','"+ DirEntry.componentKey+"','"+ url+"'"+')"></a> </div>'
        DirEntryOut+= '<div class="LargeRow-item">'+ DirEntry.title +'</div>'
        DirEntryOut+= '</div>'
        NrItems++;
    }
    DirEntryOut+='</div>'
    document.getElementById("Body01").innerHTML = DirEntryOut;
 
    

}

function  Init() {
    HandleParams();
    LoadCookies("Directory");  // Get user setingfs for this page 
    TheHeading =  'NEEO - Directory '+MyContent.title+' room '+ RoomName+' ' +Scenario;
    document.title = TheHeading;
    document.getElementById("tod01").innerHTML = TheHeading + ' ' + new Date().toLocaleTimeString('en-US', { hour12: false});
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

}
function Main() { // RoomKey,DeviceKey,Directory,url) {
    
    var xmlHttp =  new XMLHttpRequest();
    var ResponseValue;
    xmlHttp.onreadystatechange = function() {
    if (this.readyState == 4 ) 
        if (this.status != 200) 
            ShowError("Directory-get failed:",this.responseURL,this.status)
        else {
            MyContent =  JSON.parse(this.response);
            ShowDirectory()
        }
    };
  
    RoomURL = url+"/rooms/"+RoomKey+'/'
    var DirectoryURL=RoomURL+'devices/'+DeviceKey+'/directories/'+ Directory+'/browse';
    xmlHttp.open("POST",  DirectoryURL, true);
    xmlHttp.send();  
  
  }


Init();
Main();


  

