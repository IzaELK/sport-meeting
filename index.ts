import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import log4js from './middleware/log'

var log = log4js.getLogger("index");

import {logMiddleware} from './middleware/log_middleware'

/**
 * make a log directory, just in case it isn't there.
 */
try {
    require('fs').mkdirSync(path.join(process.cwd(), "_log"));
  } catch (e) {
    if (e.code != 'EEXIST') {
      log.error("Could not set up log directory, error was: ", e);
      process.exit(1);
    }
  }

export const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(logMiddleware);

import dotenv from 'dotenv';
dotenv.config();


var log = log4js.getLogger("index");
var neo4j = require('neo4j-driver');
const fetch = require('node-fetch');

var driver = neo4j.driver(process.env.DB_URL, neo4j.auth.basic(process.env.DB_USR, process.env.DB_PWD))

export interface HttpResponse<T> extends Response {
    parsedBody: T;
}

async function retrieve_data_neo4j(query: string) {
    const session = driver.session({database:process.env.DB_NAME})
    try {
        const result = await session.run(query)
        const records = result.records
        return records
    } 
    finally {
        await session.close()
    }
}

function getDistanceFromLatLonInKm(lat1: number,lon1: number,lat2: number,lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }
  
function deg2rad(deg: number) {
    return deg * (Math.PI/180)
}

app.get('/', (req, res) => res.send('Express + TypeScript Server'));

app.get('/near-me', async (req, res) => {
    let res_status_code: number = 0
    let res_status = ""
    let long_str = req.query.long 
    let long: number = 0.0
    let lat: number = 0.0
    if (long_str !== undefined) {
        long = +long_str
    }
    let lat_str = req.query.lat
    if (lat_str !== undefined) {
        lat = +lat_str
    }
    let sport_place_type = req.query.type;

    let url = "http://api.geonames.org/countryCodeJSON?lat=" + lat + "&lng=" + long + "&username=phamnuhu"

    const response: HttpResponse<string> = await fetch(url, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json"
        }
    })

    try {
        const body = await response.json()
        if (response.ok) {
            log.debug("Get current country response: " + JSON.stringify(response.status));
        }
        response.parsedBody = JSON.stringify(body);
    }
    catch(e) {
        log.error("Error from getting current country");    }
    if (!response.ok) {
        log.error("Get current country response: " + JSON.stringify(response.status) + " - " + response.statusText);
        res_status = response.statusText
        res_status_code = response.status
        res.status(res_status_code)
        res.send("Error from getting current country: " + res_status)
    }

    let data = JSON.parse(response.parsedBody);
    let country = data.countryCode;
    let query = "MATCH (Place_name:SportPlace) -[:LOCATE]-> (Adress_name:Adress), (Place_name) -[:HAVE]-> (Sport_name:Sport) "
    query += 'WHERE toUpper(Adress_name.country) = "' + country + '" '
    query += 'AND toLower(Place_name.type) = "' + sport_place_type + '" '
    query += "RETURN Adress_name.longtitude, Adress_name.latitude, "
    query += "Adress_name.adress, Place_name.type, Sport_name.name, Sport_name.nbPlayers;"

    let db_data = await retrieve_data_neo4j(query);
    console.log(db_data)
    let sport_places = []
    for (let i = 0; i < db_data.length; i++) {
        let lon: number = db_data[i].get("Adress_name.longtitude")
        let latitude: number = db_data[i].get("Adress_name.latitude")
        let distance = getDistanceFromLatLonInKm(lon, latitude, long, lat)
        if (distance <= 5) {
            let sport_place = {
                adress: db_data[i].get("Adress_name.adress"),
                type: db_data[i].get("Place_name.type"),
                sport: db_data[i].get("Sport_name.name"),
                nbPlayers: db_data[i].get("Sport_name.nbPlayers").low
            }
            sport_places.push(sport_place)
        }
    }
    res.json(sport_places)
})


app.listen(process.env.PORT, () => {
  log.info(`⚡️[server]: Server is running at http://localhost:${process.env.PORT}`);
});