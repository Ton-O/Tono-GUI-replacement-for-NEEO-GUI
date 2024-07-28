function CheckForNEEOChanges()
{
/*    MyProject = localStorage.getItem("NEEO-Project");
    if (MyProject==null||MyProject=="undefined") {
        var ProjectURL = url;// +"/projects/home";
        ProjectHTTP.open("GET", ProjectURL, true);
        ProjectHTTP.send();
        }
    else {
        MyProject=JSON.parse(MyProject);
        LastChange = MyProject.lastchange;*/
        var LastChangeURL = url +"/lastchange";
        LastChangeHTTP.open("GET", LastChangeURL, false); // This call is synchronous, no need to do other things untill we know we are up-to-date
        LastChangeHTTP.send();
        if (LastChangeHTTP.readyState == 4 && LastChangeHTTP.status == 200) 
            return  LastChangeHTTP.responseText;
        else {
            document.getElementById("err01").innerHTML = "Error while getting latest status from NEEO";   //Clear error-line for now
            return 0;
        }
    }
//}