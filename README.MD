This GUI was made because NEEO no longer has an APP in the Apple-store.
The NEEO-APP is still available in the Google PlayStore, but if your "an Apple-guy", there's no APP anymore for you.
The only alternative for them is the native NEEO-GUI.

But, as far as I know, controlling of your devices is only possible for a small set of controlls: sliders and switches; buttons don't work.

Thats where this alterative GUI comes into play. It allows the use of all controls(including buttons).
It does NOT contain any p[ossibility to change NEEO-settings as the native NEEO-GUI does a perfect job there (and recreating that is useless and very complex).
Use at your own risk, but this solution has proven to be handy... for me.

Installation is rather simple and can be done in (at least) two ways:
1) Local on you PC/laptop
2) On your Brain

1) Is simple: copy all files (or download the repository as zip-fle and expand it) to the preferred location on your PC/laptop. 
	Navigate to the location, go into the public directory and open Index.html into your favorite browser. Thats it!
2) Takes more work but gives a bit more the  feel of an actual GUI that comes from NEEO. Download all files to a location on your Brain; if you don;t know how, please use the previous solution.
   Navigate to the directory on your Brain (the top-level, where StartServer.js resides) and run node StartServer.js. 
   Now open your browser and navigate to the IP-address of your brain and connect over port 3000, opening Index.html like this: <IP-address Brain>:3000/Index.html.
   Thats it.
	
This module needs the address of your Brain to work. Please start the dialog like thios:
	http://<URL where you stored GUI>:5000/Index.html?url=<brain url>

NOTE: I am NOT an HTML-guy, so be happy with this release or make it better yourself.. .THEN SHARE!
