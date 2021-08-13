
var xmlhttp = new XMLHttpRequest();
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
var url;
var RoomName;
var RoomKey;
var AllRecipes = [];
var RoomURL;
var LastChange; 
var TheHeading;
var MySettings = {}
var MyContent="";
function UpdateNow() {
    TillRefresh = MySettings.Refresh;
    GetNeeoProject(Interpret_Project);
}
function HandleClick(MyIndex) 
{
  window.location.href='Device.html?roomname=' + RoomName + '&roomkey=' + RoomKey +   '&url=' + url + '&execute=' + AllRecipes[MyIndex].launch+ '&scenario=' + AllRecipes[MyIndex].Name 
}
function  HandleParams(){
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  url = urlParams.get('url')
  RoomName = urlParams.get('roomname')
  RoomKey = urlParams.get('roomkey')
  RoomURL =url+"/rooms/"+RoomKey+'/'
}

function Interpret_Project(MyProject)
{
  GetAllRecipes(MyProject);
  GetActScenario()
}

function GetAllRecipes(Project) {
  var i;
  var myrecp = JSONPath.JSONPath({path: "$.rooms."+RoomName+".recipes.*", json: Project});
  var MyRecipeKey  = "";
  var MyRecipeName = "";
  var MyRecipeType = "";
  var MyRecipeIcon = ""; 
  var MyRecipeHidden = ""; 
  var MyScenarioKey = ""; 
  var MyRecipeMainDevice = ""; 
  var EntryToWrite = -1;

  AllRecipes = [];  

  for (let j=0;j< myrecp.length;j++) {
    MyRecipeKey  = myrecp[j].key;
    MyRecipeName = myrecp[j].name;
    MyRecipeType = myrecp[j].type;
    MyRecipeIcon = myrecp[j].icon;
    MyRecipeWeight = myrecp[j].weight;
    MyScenarioKey = myrecp[j].scenarioKey;
    MyRecipeHidden = myrecp[j].isHiddenRecipe;
    MyRecipeMainDevice = myrecp[j].mainDeviceType;
    let RecipeIndex = AllRecipes.findIndex((myname)=> {return MyRecipeName == myname.Name});
    if (RecipeIndex<0) { //DeviceName is not yet in array
      if (MyRecipeHidden==false) {
        if (MyRecipeIcon =="default" )
            MyRecipeIcon="Icons/"+MyRecipeMainDevice+".jpg"
        else
            MyRecipeIcon="Icons/"+"Special.jpg"
        if (MyRecipeType=="launch")
            AllRecipes.push({"launch": MyRecipeKey, "Name": MyRecipeName,"Type": MyRecipeType,"Icon": MyRecipeIcon,"Scenario": MyScenarioKey,"Weight":MyRecipeWeight});
        else
            AllRecipes.push({"poweroff": MyRecipeKey, "Name": MyRecipeName,"Type": MyRecipeType,"Icon": MyRecipeIcon,"Scenario": MyScenarioKey});

            EntryToWrite = AllRecipes.length -1; 
      }
    }
    else {  // DeviceName is already in array
      if (MyRecipeType=="launch")
          AllRecipes[RecipeIndex].launch = MyRecipeKey;
      else
          AllRecipes[RecipeIndex].poweroff = MyRecipeKey;
    
      }        
    }
  AllRecipes.sort((firstEl, secondEl) => { return firstEl.weight > secondEl.weight} )
  var NrItems = 0;
  var DirEntryOut = "";
  DirEntryOut = '<div> <div class="LargeRow horizontal">' 

  for (var Entry=AllRecipes.length-1;Entry >=0;Entry--)  {
      if (NrItems >= MySettings.ItemsPerLine) {
          DirEntryOut += '</div><div class="LargeRow horizontal">'
          NrItems=0;
      }
    
      DirEntryOut+= '<div class="LargeRow vertical">' 
      DirEntryOut+= '<div class="LargeRow-item"> <img class="image1" height="120" width="120"  src="'+AllRecipes[Entry].Icon+'"  onclick="HandleClick('+  Entry +")" +'" ></div>'
      DirEntryOut+= '<div class="LargeRow-item">'+ AllRecipes[Entry].Name +'</div>'
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
  UpdateRefreshPanel();

}
function  Init() {
HandleParams();
LoadCookies("GetARoom");  // Get user setingfs for this page 

}
function MyMain() {
  if (window.performance.getEntriesByType('navigation').length &&window.performance.getEntriesByType("navigation")[0].type == "navigate") {
    Action = urlParams.get('execute')
    if (Action!=""&&Action!=null) {  // Do we need to start the scenario?
      let ExecURL=RoomURL+'recipes/'+ Action+'/execute';
      HTTPExec.open("GET",  ExecURL, true);
      HTTPExec.send();
    }
  }
  GetNeeoProject(Interpret_Project);    // This is the main engine: Get the latest project from NEEO and callback to Interpret_Project
}
Init();

MyMain();
let TheDate = new Date(LastChange);
document.getElementById("LastChange").innerHTML = "Last NEEO-change:"+ TheDate.toLocaleString();
TheHeading =  'NEEO - recipes for room '+ RoomName;
document.title = TheHeading;
document.getElementById("tod01").innerHTML = TheHeading + ' ' + new Date().toLocaleTimeString('en-US', { hour12: false});

