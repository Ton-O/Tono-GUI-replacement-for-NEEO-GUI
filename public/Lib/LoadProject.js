function LoadProject(MyFunc) {
    var ProjectURL = url;          
    ProjectHTTP.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
        MyJSON = JSON.parse(this.responseText);
        MyProject=this.responseText;
        localStorage.setItem("NEEO-Project",this.responseText);
        LastChange = MyJSON.lastchange;
        MyFunc(MyJSON);
        }
    };
    ProjectHTTP.open("GET", ProjectURL, true);
    ProjectHTTP.send();
}
