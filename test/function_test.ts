import log4js from "../middleware/log";
import chai from "chai";
import { SportPlaces } from "../sport-places-request/sport-places";


const log = log4js.getLogger("test");
const { expect } = chai;
let sport_place = new SportPlaces();


describe("TEST ALL QUERIES", function () {
        it('Get sport place near by', async done => {
            log.info("======================= Get sport place near by =========================");
            var params = {
                long: 2.2647006924737094,
                lat: 48.73207053263509,
                sport_place_type: "sport_complex",
                sport_type: ["football"]
            };
            var return_value = await sport_place.getSportPlacesNearMe(params.long, params.lat, params.sport_place_type, params.sport_type);
            log.info("Response returned: " + return_value);
            let tool = [{
                "id": 1,
                "adress": "2 Résidence de la Bergerie, 91300 Massy",
                "type": "sport_complex",
                "sports": [{ "name": "Football", "nbPlayers": 50 }]
            }];
            expect(return_value == tool);
            done();
        });

        it('Get sport places with type sport', async done => {
            log.info("======================= Get sport places with type sport =========================");
            var params = {
                type_sport: ["basketball", "football"]
            };
            var return_value = await sport_place.getSportPlacesWithTypeSport(params.type_sport);
            log.info("Response returned: " + return_value);
            let tool = [
                {  
                    "id":1,
                    "adress":"2 Résidence de la Bergerie, 91300 Massy",
                    "type":"sport_complex",
                    "sports":[{"name":"Football","nbPlayers":50}]
                },
                {
                    "id":2,
                    "adress":"7 Bd Gaspard Monge, 91120 Palaiseau",
                    "type":"sport_complex",
                    "sports":[{"name":"Basketball","nbPlayers":20}]
                },
                {
                    "id":3,
                    "adress":"Rte de Saclay, 91120 Palaiseau",
                    "type":"field",
                    "sports":[{"name":"Basketball","nbPlayers":60}]
                }
            ];
            expect(return_value == tool);
            done();
        });

        it('Get sport places with id', async done => {
            log.info("======================= Get sport places with id =========================");
            var params = {
                type_sport: ["basketball", "football"]
            };
            var return_value = await sport_place.getSportPlacesWithTypeSport(params.type_sport);
            log.info("Response returned: " + return_value);
            let tool = [
                {  
                    "id":1,
                    "adress":"2 Résidence de la Bergerie, 91300 Massy",
                    "type":"sport_complex",
                    "sports":[{"name":"Football","nbPlayers":50}]
                },
                {
                    "id":2,
                    "adress":"7 Bd Gaspard Monge, 91120 Palaiseau",
                    "type":"sport_complex",
                    "sports":[{"name":"Basketball","nbPlayers":20}]
                },
                {
                    "id":3,
                    "adress":"Rte de Saclay, 91120 Palaiseau",
                    "type":"field",
                    "sports":[{"name":"Basketball","nbPlayers":60}]
                }
            ];
            expect(return_value == tool);
            done();
        });
    })