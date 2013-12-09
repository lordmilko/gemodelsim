INSERT INTO methodoftravel (Description) VALUES
('Driving'),
('Public Transit');

/* Built-in Models */

INSERT INTO model (url, name, description, type, methodID) VALUES
('http://earth-api-samples.googlecode.com/svn/trunk/demos/drive-simulator/smart.kmz', 'White Car', 'A small white car, used in the Google Earth Driving Simulator Demo', 'Builtin', 1);


/* Built-in Routes */

INSERT INTO MapLocation (name) VALUES
('Redfern Station'),
('Granville Station'),
('UWS Parramatta'),
('UWS Penrith');

INSERT INTO Journey (modelID, desiredmethodID, Type) VALUES
(1, null, 'Builtin'),
(1, null, 'Builtin');

INSERT INTO JourneyMapLocations (journeyID, maplocationID) VALUES
(1, 1), /* Redfern Station */
(1, 2), /* Granville Station */
(2, 3), /* UWS Parramata */
(2, 4); /* UWS Penrith */

/* New Route - Empty Template */

/* Note: the easiest way to add a new Built-in Route is to add the route as a custom one via the end user application, and then simply change its Type attribute in table Journey to "Builtin" */

/*

INSERT INTO Journey (modelID, desiredmethodID, Type) VALUES
(, , '')

INSERT INTO MapLocation (name) VALUES
(''),
('')

INSERT INTO JourneyMapLocations (journeyID, maplocationID) VALUES
(, ),
(, );

*/