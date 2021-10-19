import express from 'express';
import path from 'path';
import log4js from './middleware/log'
import {SportPlaces} from './sport-places-request/sport-places'

import {logMiddleware} from './middleware/log_middleware'

/**
 * make a log directory, just in case it isn't there.
 */
try {
    require('fs').mkdirSync(path.join(process.cwd(), "_log"));
} 
catch (e: any) {
    if (e.code != 'EEXIST') {
      log.error("Could not set up log directory, error was: ", e);
      process.exit(1);
    }
}

export const app = express();
app.use(logMiddleware);

import dotenv from 'dotenv';
dotenv.config();

var log = log4js.getLogger("index");
var sport_places_request = new SportPlaces();


app.get('/', (req, res) => res.send('Express + TypeScript Server'));

app.get('/near-me', async (req, res) => {
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
    if (sport_place_type == undefined) {
        sport_place_type = ""
    }

    try {
        let sport_places = await sport_places_request.getSportPlacesNearMe(long, lat, sport_place_type.toString());   
        res.status(200);
        res.json(sport_places)
    }
    catch(e: any) {
        res.status(400);
        res.send("Bad request")
    }
})

app.get('/filter-by-sport-type', async (req, res) => {
    let sports = req.query.sport;
    let sport_types: string[] = [];
    if (sports == undefined) {
        res.send("Cannot find sport places without sport type. Try to find with football for ex");
    }
    else {
        if (typeof(sports) === 'string') {
            sport_types.push(sports);
        }
        else if (typeof(sports) === 'object'){
            sport_types = sports.toString().split(',');
        }
        try {
            let sport_places = await sport_places_request.getSportPlacesWithTypeSport(sport_types);
            res.status(200);
            res.json(sport_places);
        }
        catch(e: any) {
            res.status(400);
            res.send("Bad request")
        }
    }
    
})

app.get('/filter-by-type-and-id', async (req, res) => {
    let sport_type = req.query.type;
    let id = req.query.id;
    if (sport_type == undefined) {
        sport_type = ""
    }
    if (id == undefined) {
        id = ""
    }
    try {
        let sport_places = await sport_places_request.getSportPlaceWithID(sport_type.toString(), id.toString())
        res.status(200);
        res.json(sport_places)
    }
    catch(e: any) {
        res.status(400);
        res.send("Bad request")
    }
})

app.listen(process.env.PORT, () => {
  log.info(`⚡️[server]: Server is running at http://localhost:${process.env.PORT}`);
});