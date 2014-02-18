gemodelsim
==========

### Google Earth Model Simulator ###


Simulate the movement of any model from point A to point B.

Pictures speak louder than words: http://i.imgur.com/LD8j4lM.jpg

* Path from A to B is drawn on Google Earth, traversed by the model at a rate the user specifies
* Models can be scaled down to microscopic size, or scaled up to terrifying proportions
* Directions are calculated using Google Maps (Driving or Public Transit)
* The most recent routes and models are saved to a database for re-retrevial upon page load. Routes and models can be marked as Built-in or Custom, and will appear in different Dropdown List optgroups based on their category.
* The system will only store the 5 most recent custom routes or models; whenever this limit is exceeded, the system will purge the database of excess entries
* The camera will periodically change every certain number of frames
* Error handling for all user inputs

GEModelSim is a generic implemenetation of a Model Simulator; ideally, someone else can take this code, built upon it, and create something more concrete:
* Simulate multiple cars in a solar car race.
* Attach carriages to trains and watch them move along the tracks!

GEModelSim should be treated as a framework. What cool things can **you** do with this?

### Installation ###

1. Set up a web server with PHP, MySQL, cURL (easiest solution is WAMP or XAMPP)
2. Upload all code to web server, create a new database __gemodelsimulator__, import Default Tables (__SQL\CreateTables.sql__) and optionally some default data (__SQL\InsertBuiltinData.sql__)
3. Modify __php\require\db.php__ to use your database login credentials (default: __root__, no password)
4. Navigate to web server from web browser; install Google Earth Browser Plugin as directed

Note: InsertBuiltinData.sql also adds the available Travel Methods to the database. If the default Travel Methods are not added, other database functionality may not work as desired without some slight system modifications.

Works best with Google Chrome on Windows. Other browsers or other Operating Systems may produce various graphical glitches, so use at your own risk.

Note: if you do not wish to save records to a database, no installation beyond installing the Google Earth Browser Plugin is necessary (simply launch index.html). A model to use can be found in __SQL\InsertBuiltinData.sql__

### Using Custom Models ###

Models to be displayed by Google Earth must be in COLLADA (*.dae) format. Models that are used do not need to be directly models however. Models can be:
* COLLADA models compressed in a ZIP archive, as seen in downloads from the [Google 3D Warehouse] (http://sketchup.google.com/3dwarehouse/)
* COLLADA models compressed in a KMZ archive, as seen in models exported from Google SketchUp
* Straight COLLADA *.dae files containing all model data and textures

In order for Google Earth to accept a model it _must be hosted on a web server_. For KMZ and ZIP archives it would appear that web server also be _web accessible_. google.earth.fetchKml will silently fail to load KMZ and ZIP archives (it will simply return NULL) if they are hosted on a local, non-web-accessible web server.

If you wish to host your own models and do not have your own web server Dropbox functions as a suitable alternative. After sharing your file, replace the start of the URL to the file from __https://www.dropbox.com__ to __https://dl.dropboxusercontent.com__ to get a direct link to the file.

Note: the vast majority of models on the internet are of a fairly low quality. Models are often misconfigured, such that the definition of "forwards" is in the wrong direction, and the direction of "center" is far off to the side. Misconfigured models (*.skp files) can be repositioned in Google SketchUp and then exported for use in GEModelSim.

### Known Issues ###

* For very large routes GEModelSim will lock up the web browser. Asynchronous looping mechanisms that have been investigated have hit browser's stack limits
* For very large routes the line along the earth will appear to stutter from certain angles. This appears to be a problem with Google Earth, not GEModelSim
* From certain angles the model may appear to be off the drawn path; upon next camera change however it can be seen the model is in fact going along its path
* On Google Chrome on OSX if the menu extends off the page the page will not resize to allow scrolling down to and thereby accessing the bottom of the menu. The form can still be submitted however from inside a Textbox by simply pressing **Enter**
