function ShowError(MyError) {
    document.getElementById("err01").innerHTML =  '<span class="blinking"> '+  MyError + '</span> <br>';
}

function MakeSureWeHaveTheLatestProject(MyFunc)
{
    var LastChangeHTTP = new XMLHttpRequest();
    LastChangeHTTP.onreadystatechange = function() {
        if (this.readyState == 4)
            if (this.status == 200) 
                if (this.responseText!=MyProject.lastchange)    {    // Test here if LastChange has changed
                    console.log("Change in LastChange detected")
                    LoadProject(MyFunc,false)                  // Yes, reload project-file, then interpret the project
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
            localStorage.setItem("NEEO-Project",this.responseText);
            MyProject.ChangeDetected = ChangeDetected;
            LastChange = MyJSON.lastchange;
            MyFunc(MyJSON);
        }
    };
    ProjectHTTP.open("GET", ProjectURL, true);
    ProjectHTTP.send();
}

function GetActScenario()
{
  var HTTPGetActScenario = new XMLHttpRequest();

  HTTPGetActScenario.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {   // Did we get the active scenario-keys?
      var MyProject = localStorage.getItem("NEEO-Project"); // Yes, getc the details of these scenarios from localstorage
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
   for (let SCN=0;SCN < Scenarios.length;SCN++) {
     for (let RCP=0;RCP < ActiveRCP.length;RCP++) {
      if (Scenarios[SCN].key == ActiveRCP[RCP])
          {Found++;
            ActiveTable += '<tr>  <td><img src=Icons/'+Scenarios[SCN].icon+'.jpg  width="40" height="40"' + '  /></td>' + 
         '<td><a href="' + 'Device.html?roomname=' + Scenarios[SCN].roomName +  '&roomkey=' + Scenarios[SCN].roomKey + '&url=' + url+'&scenario=' + Scenarios[SCN].name +'">' +  Scenarios[SCN].name + '</a><br>'+"</td> " +
         '<td><a> '+ Scenarios[SCN].roomName + '</a><br>'+"</td> " +
         '<td><a href="' + 'Execute.html?poweroff=true&roomkey=' + Scenarios[SCN].roomKey +  '&roomname=' + Scenarios[SCN].roomName + '&scenario=' + Scenarios[SCN].key  + '&poweroff=true' + '&url=' + url+'">' + ' <img src="Icons/poweroff.jpg"   width="40" height="40"> </a><br>'+"</td> " + 
         " </tr>" 
          } 
      }
      if (Found == ActiveRCP.length)
        break;
     }


   ActiveTable += "</table>"; 
   document.getElementById("act01").innerHTML = ActiveTable;
  }

function GetNeeoProject(MyFunc) {
    MyProject = localStorage.getItem("NEEO-Project");   // Try to get a locally stored NEEO-project 
    if (MyProject==null)                                // Do we have an image locally cached?
        LoadProject(MyFunc,true)                        // No, ask NEEO for the latest project-file, then interpret that
    else {
        MyProject = JSON.parse(MyProject);
        MakeSureWeHaveTheLatestProject(MyFunc);         // Callback. Call the defined procerssor 
    }
}
