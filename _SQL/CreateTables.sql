CREATE TABLE MethodofTravel
(
MethodID int NOT NULL AUTO_INCREMENT,
Description varchar(255) ,
PRIMARY KEY (MethodID)
);

CREATE TABLE Model
(
ModelID int NOT NULL AUTO_INCREMENT,
URL varchar(255),
Name varchar(255),
Description varchar(255),
Type varchar(255),
MethodID int,
PRIMARY KEY (ModelID),
FOREIGN KEY (MethodID) REFERENCES MethodofTravel(MethodID)
);

CREATE TABLE Journey
(
JourneyID int NOT NULL AUTO_INCREMENT,
ModelID int,
DesiredMethodID int,
Type varchar(255),
PRIMARY KEY (JourneyID),
FOREIGN KEY (ModelID) REFERENCES Model(ModelID),
FOREIGN KEY (DesiredMethodID) REFERENCES MethodofTravel(MethodID)
);

CREATE TABLE MapLocation
(
MapLocationID int NOT NULL AUTO_INCREMENT,
Coordinates varchar(255),
Name varchar(255) ,
PRIMARY KEY (MapLocationID)
);

CREATE TABLE JourneyMapLocations 
(
JourneyMapLocationsID  int NOT NULL AUTO_INCREMENT ,
JourneyID int,
MapLocationID int,
PRIMARY KEY (JourneyMapLocationsID),
FOREIGN KEY (JourneyID) REFERENCES Journey(JourneyID),
FOREIGN KEY (MapLocationID) REFERENCES MapLocation(MapLocationID)
);
