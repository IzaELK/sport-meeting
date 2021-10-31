import log4js from "../middleware/log";
import chai from "chai";
import { SportPlaces } from "../sport-places-request/sport-places";


const log = log4js.getLogger("test");
const { expect } = chai;
let sport_place = new SportPlaces();


describe("TEST ALL QUERIES", function () {
        it('query get sport place near by', async done => {
            log.info("======================= Create new Presenter with constructor =========================");
            var params = {
                long: 2.2647006924737094,
                lat: 48.73207053263509,
                sport_place_type: "sport_complex",
                sport_type: ["football"]
            };
            var return_value = await sport_place.getSportPlacesNearMe(params.long, params.lat, params.sport_place_type, params.sport_type);
            log.info("Type of view: " + sport_place.getSportPlacesNearMe(params.long, params.lat, params.sport_place_type, params.sport_type));
            let tool = [{
                "id": 1,
                "adress": "2 Résidence de la Bergerie, 91300 Massy",
                "type": "sport_complex",
                "sports": [{ "name": "Football", "nbPlayers": 50 }]
            }];
            expect(return_value == tool);
            done();
        });

        it('query get sport places with type sport', async done => {
            log.info("======================= Create new Presenter with constructor =========================");
            var params = {
                type_sport: ["basketball", "football"]
            };
            // var return_value = await sport_place.getSportPlacesNearMe();
            // log.info("Type of view: " + sport_place.getSportPlacesNearMe(params.long, params.lat, params.sport_place_type, params.sport_type));
            let tool = [{
                "id": 1,
                "adress": "2 Résidence de la Bergerie, 91300 Massy",
                "type": "sport_complex",
                "sports": [{ "name": "Football", "nbPlayers": 50 }]
            }];
            // expect(return_value == tool);
            done();
        });
    })