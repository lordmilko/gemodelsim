gemodelsim
==========

### Google Earth Model Simulator ###


Simulate the movement of any model from point A to point B.

* Path from A to B is drawn on Google Earth, traversed by the model at a rate the user specifies
* Models can be scaled down to microscopic size, or scaled up to terrifying proportions
* Directions are calculated using Google Maps(Driving or Public Transit)
* The most recent routes and models are saved to a database for re-retrevial upon page load. Routes and models can be marked as Built-in or Custom, and will appear in different Dropdown List optgroups based on their category.
* The system will only store the 5 most recent custom routes or models; whenever this limit is exceeded, the system will purge the database of excess entries

GEModelSim is a generic implemenetation of a Model Simulator; ideally, someone else can take this code, built upon it, and create something more concrete:
* Simulate multiple cars in a solar car race.
* Attach carriages to trains and watch them move along the tracks!

GEModelSim should be treated as a framework. What cool things can you do with this?

### Installation ###

1. Set up a web server with PHP, MySQL, cURL (easiest solution is WAMP or XAMPP)
2. Upload all code to web server, create a new database __gemodelsimulator__, import Default Tables (__SQL\CreateTables.sql__) and optionally some default data (__SQL\InsertBuiltinData.sql__)
3. Modify __php\require\db.php__ to use your database login credentials (default: __root__, no password)
4. Navigate to web server from web browser; install Google Earth Browser Plugin as directed

Works best with Google Chrome on Windows. Other browsers or other Operating Systems may produce various graphical glitches, so use at your own risk.

Note: if you do not wish to save records to a database, no installation beyond installing the Google Earth Browser Plugin is necessary (simply launch index.html)

### Known Issues ###

* When deleting a route, the Journey record is removed however JourneyMapLocations and MapLocations records are not
* On Google Chrome on OSX if the menu extends off the page the page will not resize to allow scrolling down to the bottom of the menu
