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
                type_sport_place: "sport_complex",
                id: "2"
            };
            var return_value = await sport_place.getSportPlaceWithID(params.type_sport_place, params.id);
            log.info("Response returned: " + return_value);
            let tool = [
                {
                    "adress":"7 Bd Gaspard Monge, 91120 Palaiseau",
                    "type":"sport_complex",
                    "openHours":["Mercredi: from 10h to 17h","Mardi: from 11h to 20h"],
                    "sports":["Basketball: 20","Volleyball: 30"]
                }
            ];
            expect(return_value == tool);
            done();
        });

        it('Add new sport place', async done => {
            log.info("======================= Add new sport place =========================");
            var params = {
                adress: "26 Grand Rue, 13115 Saint-Paul-lez-Durance",
                type: "field",
                country: "FR",
                day: ["Lundi","Samedi"],
                from: ["9h","10h"],
                to: ["18h","17h"],
                type_sport: ["Natation"]
            };
            var return_value = await sport_place.addNewSportPlace(params.adress, params.type, params.country, 
                params.day, params.from, params.to, params.type_sport);
            log.info("Response returned: " + return_value);
            let tool = "Adding new sport place sucessfully";
            
            expect(return_value == tool);
            done();
        });
    })