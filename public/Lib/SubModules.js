var ActiveMessage = [];
var MsgTimeout = 0;
var MyLoop = 0;
const MaxMessages=10;
function ShowError(MyError,Duration=10000) {
    var TheMessage = MyError;
    if (ActiveMessage.length)   {       // Already showing a message, add it and clear timer
        for ( MyLoop=0;MyLoop<ActiveMessage.length;MyLoop++) {
            if (ActiveMessage[MyLoop].message==MyError) {
                ActiveMessage[MyLoop].count++;
                clearTimeout(ActiveMessage[MyLoop].MsgTimeout);                       // clear counter that will clear the message
                ActiveMessage[MyLoop].MsgTimeout = setTimeout(function(MyMsg) {
                    MyLoop = ActiveMessage.findIndex((myname)=> {return MyMsg == myname.message});
                    ActiveMessage.splice(MyLoop,1);              //and remove the old entry;
                    SHowMessages()
                },Duration,MyError);// and set it to start again.
                break;
            }
        }
    }
    if (MyLoop >= ActiveMessage.length)
        {ActiveMessage.push({count:1,message:MyError,TimeOut:Duration})          
        MyLoop=ActiveMessage.length-1;
        ActiveMessage[MyLoop].MsgTimeout = setTimeout(function(MyMsg) {
            MyLoop = ActiveMessage.findIndex((myname)=> {return MyMsg == myname.message});
            ActiveMessage.splice(MyLoop,1);              //and remove the old entry;
            SHowMessages()
        },Duration,MyError);// and set it to start again.
    }
    
    SHowMessages();
}

function SHowMessages(){
    var CurrMessage = '<span class="blinking">' 
    for ( var MyLoop=0;MyLoop<ActiveMessage.length;MyLoop++) {
        if (ActiveMessage[MyLoop].count==1)
            CurrMessage += ActiveMessage[MyLoop].message + "<br>"
        else
            CurrMessage += ActiveMessage[MyLoop].message + " ("+ ActiveMessage[MyLoop].count+")<br>"
    }
    CurrMessage += '</span> <br>';
    document.getElementById("err01").innerHTML =  CurrMessage

}

function MakeSureWeHaveTheLatestProject(MyFunc)
{
    var LastChangeHTTP = new XMLHttpRequest();
    LastChangeHTTP.onreadystatechange = function() {
        if (this.readyState == 4)
            if (this.status == 200) 
                if (this.responseText!=MyProject.lastchange)    {    // Test here if LastChange has changed
                    console.log("Change in LastChange detected")
                    LoadProject(MyFunc,true)                  // Yes, reload project-file, then interpret the project
                }
                else {
                    LastChange = MyProject.lastchange;            // No, we can directly interpret the project
                    MyProject.ChangeDetected = false;
                    MyFunc(MyProject);                                 
                }
            else {
                ShowError("Error while getting latest status from NEEO");
                return 0;
            };
    }

    var LastChangeURL = url +"/lastchange";
    LastChangeHTTP.open("GET", LastChangeURL, true); 
    LastChangeHTTP.send();
}

function LoadProject(MyFunc,ChangeDetected) {
    var ProjectHTTP = new XMLHttpRequest();
    var ProjectURL = url;          
    ProjectHTTP.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            MyJSON = JSON.parse(this.responseText);
            MyProject=this.responseText;
            sessionStorage.setItem("NEEO-Project",this.responseText);
            MyJSON.ChangeDetected = ChangeDetected;
            LastChange = MyJSON.lastchange;
            MyFunc(MyJSON);
        }
    };
    ProjectHTTP.open("GET", ProjectURL, true);
    ProjectHTTP.send();
}

function GetActScenario()
{
  if (!MySettings.ShowActScen) {
    document.getElementById("ActFlex").innerHTML = ""; 
    return
}

  var HTTPGetActScenario = new XMLHttpRequest();

  HTTPGetActScenario.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {   // Did we get the active scenario-keys?
      var MyProject = sessionStorage.getItem("NEEO-Project"); // Yes, getc the details of these scenarios from sessionStorage
      var myArr = JSON.parse(this.responseText);
      ParseScenario(myArr,url,MyProject);
    }
  }; 
  
  HTTPGetActScenario.open("GET", url+'/activescenariokeys', true);
     HTTPGetActScenario.send();
}  
function ParseScenario(ActiveRCP,url,Project)
  {
  var ActiveTable=  '<table border = "1">';  

  Project = JSON.parse(Project);

  var Scenarios = JSONPath.JSONPath({path: "$.rooms.*.scenarios.*", json: Project});
  var Found = 0;
  var FlexOut="";
  for (let SCN=0;SCN < Scenarios.length;SCN++) {
        for (let RCP=0;RCP < ActiveRCP.length;RCP++) {
         if (Scenarios[SCN].key == ActiveRCP[RCP])
             {if (!Found)
                FlexOut = "Active Scenarios<br>" 
            Found++;
            FlexOut+= '<div class="ACTScenario">' 
            FlexOut+= '<article class="ACTScen-deviceIcon"> <a href="Device.html?roomname=' + Scenarios[SCN].roomName +  '&roomkey=' + Scenarios[SCN].roomKey + '&url=' + url+'&scenario=' + Scenarios[SCN].name +'"><img class="image1" height="40" width="40" src="Icons/'+ Scenarios[SCN].icon+'.jpg"    width="40" height="40"></a></article>'
            FlexOut+= '<article class="ACTScen-ScenName">   <a href="Device.html?roomname=' + Scenarios[SCN].roomName +  '&roomkey=' + Scenarios[SCN].roomKey + '&url=' + url+'&scenario=' + Scenarios[SCN].name +'">' + Scenarios[SCN].name  +'</a></article>'   
            FlexOut+= '<aside class="ACTScen-RoomName">'+ Scenarios[SCN].roomName  +'</aside>'
            FlexOut+= '<article class="ACTScen-PowerOff"> <a onclick="HandleACTClick('+"'poweroff'"+ ",'" +   Scenarios[SCN].roomKey + "','','" +  Scenarios[SCN].key +"','"  + url+"')"+ '"><img class="image1" height="40" width="40"   src="Icons/POWEROFF.jpg"   width="40" height="40"></a></article>'
        }
        if (Found == ActiveRCP.length)
            break;
        }
    }
       
    document.getElementById("ActFlex").innerHTML = FlexOut;  
  }

function GetNeeoProject(MyFunc) {
    MyProject = sessionStorage.getItem("NEEO-Project");   // Try to get a locally stored NEEO-project 
    if (MyProject==null)                                // Do we have an image locally cached?
        LoadProject(MyFunc,true)                        // No, ask NEEO for the latest project-file, then interpret that
    else {
        MyProject = JSON.parse(MyProject);
        MakeSureWeHaveTheLatestProject(MyFunc);         // Callback. Call the defined procerssor 
    }
}

function GetBrowserSettings(MyPage) {
    let MySettings = localStorage.getItem(MyPage);   // Try to get a locally stored NEEO-project 
    if (MySettings==null)                                // Do we have an image locally cached?
        return {}
    else try {
        return JSON.parse(MySettings);
    }
    catch(err) {return {}}
}
function PutBrowserSettings(CurrPage,MySettings) {
    localStorage.setItem(CurrPage,MySettings);
}

function ShowActHandler(CurrPage) {
    MySettings.ShowActScen=!MySettings.ShowActScen;
    UpdateRefreshPanel();
    UpdateNow();
    PutBrowserSettings(CurrPage,JSON.stringify(MySettings))
}

function UpdateRefreshPanel() {
    document.getElementById("act99").innerHTML = (MySettings.ShowActScen)?"Do not show active scenarios":"Show active scenarios";
}
function NavigateUp(CurrPage,) {


    if (CurrPage == "Device") 
        window.location.href='GetARoom.html?roomname='+RoomName+'&roomkey='+RoomKey+'&url='+url
    else
    if (CurrPage == "GetARoom") 
        window.location.href='index.html?'+'&url='+url
    else
    if (CurrPage == "Directory")  {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const url = urlParams.get('url')
        const RoomKey = urlParams.get('roomkey')
        const DeviceKey = urlParams.get('devicekey')
        const Directory = urlParams.get('directory')
        const RoomName = urlParams.get('roomname')
        const Scenario= urlParams.get('scenario')
    
        window.location.href='Device.html?roomname='+RoomName+'&roomkey='+RoomKey+'&scenario='+Scenario+'&url='+url
    }
        

}

function HandleACTClick(type,RoomKey,DeviceKey,Action,url) 
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
      UpdateNow();
    }

} 
function ItemsHandler(CurrPage) {
    if (isNaN(Items.value)||Items.value<1) 
        Items.value=10;
    MySettings.ItemsPerLine = Items.value;
    UpdateNow();
    PutBrowserSettings(CurrPage,JSON.stringify(MySettings))
}

function RefreshHandler(CurrPage) {
    MySettings.Refresh = Refresh.value;
    UpdateNow();
    PutBrowserSettings(CurrPage,JSON.stringify(MySettings))
}

window.onload=function() {
window.setInterval(function() {
    document.getElementById("tod01").innerHTML = TheHeading + ' ' + new Date().toLocaleTimeString('en-US', { hour12: false});
    if (MySettings.Refresh&&!--TillRefresh) { // page-interval is se to every second, wait till x seconds have passed
        TillRefresh=MySettings.Refresh;
        UpdateNow();
    }
    },1000)
}
 