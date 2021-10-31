import log4js from '../middleware/log'

var log = log4js.getLogger("sport-places");
var neo4j = require('neo4j-driver');
var fetch = require('node-fetch');

export interface HttpResponse<T> extends Response {
    parsedBody: T;
}

export class SportPlaces {
    private driver: any;

    constructor() {
        this.driver = neo4j.driver(process.env.DB_URL, neo4j.auth.basic(process.env.DB_USR, process.env.DB_PWD))
    }

    private async retrieve_data_neo4j(query: string): Promise<any> {
        const session = this.driver.session({database:process.env.DB_NAME})
        try {
            const result = await session.run(query)
            const records = result.records
            return records
        } 
        catch (e: any) {
            log.error("Error from retrieving Neo4J data: " + e); 
        }
        finally {
            await session.close()
        }
    }
    
    private getDistanceFromLatLonInKm(lat1: number,lon1: number,lat2: number,lon2: number): number {
        var R = 6371; // Radius of the earth in km
        var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
        var dLon = this.deg2rad(lon2-lon1); 
        var a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
          ; 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        return d;
    }
      
    private deg2rad(deg: number): number {
        return deg * (Math.PI/180)
    }

    public async getSportPlacesNearMe(long: number, lat: number, sport_place_type: string, sport_type: string[]): Promise<any> {
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
            log.error("Error from getting current country: " + e);    
        }
        if (!response.ok) {
            log.error("Get current country response: " + JSON.stringify(response.status) + " - " + response.statusText);
            return Promise.reject(response.status + " - " + response.statusText);
        }

        let data = JSON.parse(response.parsedBody);
        let country = data.countryCode;
        let query = "MATCH (Place_name:SportPlace) -[:LOCATE]-> (Adress_name:Adress), (Place_name) -[:HAVE]-> (Sport_name:Sport) "
        query += 'WHERE toUpper(Adress_name.country) = "' + country + '" '
        if (sport_place_type != "") {
            query += 'AND toLower(Place_name.type) = "' + sport_place_type + '" '
        }
        if (sport_type.length != 0) {
            let sport = "[" + sport_type.map(x => "\"" + x + "\"").join(", ") + "]"
            query += 'AND toLower(Sport_name.name) IN ' + sport + ' '
        }
        query += "RETURN Adress_name.longtitude, Adress_name.latitude, "
        query += "Place_name.id, Adress_name.adress, Place_name.type, Sport_name.name, Sport_name.nbPlayers;"
        try {
            let db_data = await this.retrieve_data_neo4j(query);
            let sport_places = []
            for (let i = 0; i < db_data.length; i++) {
                let lon: number = db_data[i].get("Adress_name.longtitude")
                let latitude: number = db_data[i].get("Adress_name.latitude")
                let distance = this.getDistanceFromLatLonInKm(lon, latitude, long, lat)
                if (distance <= 5) {
                    let sport_place = {
                        id: db_data[i].get("Place_name.id").low,
                        adress: db_data[i].get("Adress_name.adress"),
                        type: db_data[i].get("Place_name.type"),
                        sports: [
                            {
                                name: db_data[i].get("Sport_name.name"),
                                nbPlayers: db_data[i].get("Sport_name.nbPlayers").low
                            }         
                        ]           
                    }
                    let place = sport_places.find(({id}) => id == sport_place.id);
                    if (place != undefined) {
                        place.sports.push({
                            name: sport_place.sports[0].name,
                            nbPlayers: sport_place.sports[0].nbPlayers
                        });
                    }
                    else {
                        sport_places.push(sport_place)
                    }
                }
            }
            return sport_places
        }
        catch (e: any) {
            return Promise.reject("Error in getting sport places near me: " + e);
        }
    }

    public async getSportPlacesWithTypeSport(type_sport: string[]): Promise<any> {
        let sport = "[" + type_sport.map(x => "\"" + x + "\"").join(", ") + "]"
        let query = "MATCH (Place_name:SportPlace) -[:LOCATE]-> (Adress_name:Adress), (Place_name) -[:HAVE]-> (Sport_name:Sport) ";
        query += "WHERE toLower(Sport_name.name) IN " + sport;
        query += " RETURN Place_name.id, Adress_name.adress, Sport_name.name, Place_name.type, Sport_name.nbPlayers;"

        try {
            let db_data = await this.retrieve_data_neo4j(query);
            let sport_places = []
            for (let i = 0; i < db_data.length; i++) {
                let sport_place = {
                    id: db_data[i].get("Place_name.id").low,
                    adress: db_data[i].get("Adress_name.adress"),
                    type: db_data[i].get("Place_name.type"),
                    sports: [
                        {
                            name: db_data[i].get("Sport_name.name"),
                            nbPlayers: db_data[i].get("Sport_name.nbPlayers").low
                        }         
                    ]           
                }
                const place = sport_places.find(({id}) => id == sport_place.id);
                if (place != undefined) {
                    place.sports.push({
                        name: sport_place.sports[0].name,
                        nbPlayers: sport_place.sports[0].nbPlayers
                    });
                }
                else {
                    sport_places.push(sport_place)
                }
            }
            return sport_places
        }
        catch (e: any) {
            return Promise.reject("Error in getting sport places with type sport: " + e);
        }
    }

    // TODO: Fix Neo4J query (concerning hours and sports - multiple nodes)
    public async getSportPlaceWithID(type_sport_place: string, id: string) {
        let sport_place_type = '"' + type_sport_place + '"';
        let query = "MATCH (Place_name:SportPlace) -[:LOCATE]-> (Adress_name:Adress), (Place_name) -[:OPEN]-> (Hours_name:Hours), (Place_name) -[:HAVE]-> (Sport_name:Sport)";
        query += " WHERE toLower(Place_name.type) = " + sport_place_type;
        query += " AND Place_name.id = " + id;
        query += " RETURN Adress_name.adress AS Adress, Place_name.type AS Type,"
        query += ' collect(DISTINCT Hours_name.day + ": from " + Hours_name.from + " to " + Hours_name.to) AS Open_hour,'
        query += ' collect(DISTINCT Sport_name.name + ": " + apoc.convert.toString(Sport_name.nbPlayers)) AS Sports;'
        try {
            let db_data = await this.retrieve_data_neo4j(query);
            let sport_places = []
            for (let i = 0; i < db_data.length; i++) {
                let sport_place = {
                    adress: db_data[i].get("Adress"),
                    type: db_data[i].get("Type"),
                    openHours: db_data[i].get("Open_hour"),
                    sports: db_data[i].get("Sports")
                }
                sport_places.push(sport_place)
            }
            return sport_places
        }
        catch (e: any) {
            return Promise.reject("Error in getting sport places with ID: " + e);
        }
    }

    public async addNewSportPlace(adress: string, type: string, country: string, day: string[], from: string[], to: string[], type_sport: string[]): Promise<any> {
        let open_hours_id = []
        let sport_place_id = ""
        let adress_id = ""
        let sport_fields_id = []
        let url = "http://api.positionstack.com/v1/forward?access_key="+ process.env.GEO_ACCESS_KEY + "&query="+adress;

        const response: HttpResponse<string> = await fetch(url, {
            method: 'GET',
            headers: {
            "Content-Type": "application/json"
            }
        })

        try {
            const body = await response.json()
            if (response.ok) {
                log.debug("Get longtitude and latitude response: " + JSON.stringify(response.status));
            }
            response.parsedBody = JSON.stringify(body);
        }
        catch(e) {
            log.error("Error from getting current country: " + e);    
        }
        if (!response.ok) {
            log.error("Get current country response: " + JSON.stringify(response.status) + " - " + response.statusText);
            return Promise.reject(response.status + " - " + response.statusText)
        }

        let resp_body = JSON.parse(response.parsedBody);
        let lat = resp_body.data[0].latitude
        let long = resp_body.data[0].longitude
        let query = "MATCH (a:Adress) WITH a ORDER BY a.id DESC LIMIT 1 "
            query += "CREATE (n:Adress {id: a.id+1, longtitude: " + long + ", latitude: " + lat + ', adress: "'
            query += adress + '", country: "' + country + '"}) RETURN n.id;'
        try {
            let new_adress = await this.retrieve_data_neo4j(query);
            adress_id = new_adress[0].get("n.id");
        }
        catch (e: any) {
            return Promise.reject("Error in adding new adress for sport place: " + e);
        }

        for (let i: number = 0; i < day.length; i++) {
            query = "MATCH (a:Hours) WITH a ORDER BY a.id DESC LIMIT 1 "
            query += 'CREATE (n:Hours {id: a.id+1, day: "' + day[i] + '", from: "' + from[i] + '", to: "'
            query += to[i] + '"}) RETURN n.id;'
            try {
                let new_open_hours = await this.retrieve_data_neo4j(query);
                open_hours_id.push(new_open_hours[0].get("n.id"));
            }
            catch (e: any) {
                return Promise.reject("Error in adding new adress for sport place: " + e);
            }
        }
        
        query = "MATCH (a:SportPlace) WITH a ORDER BY a.id DESC LIMIT 1 "
        query += 'CREATE (n:SportPlace {id: a.id+1, picture: "invalid", type: "' 
        query += type + '"}) RETURN n.id;'
        try {
            let new_sport_place = await this.retrieve_data_neo4j(query);
            sport_place_id = new_sport_place[0].get("n.id");
        }
        catch (e: any) {
            return Promise.reject("Error in adding new sport place: " + e);
        }

        for (let sp of type_sport) {
            query = "MATCH (a:Sport) WITH a ORDER BY a.id DESC LIMIT 1 "
            query += 'CREATE (n:Sport {id: a.id+1, name: "' + sp
            query += '", nbPlayers: 0}) RETURN n.id;'
            console.log(query)
            try {
                let new_sport = await this.retrieve_data_neo4j(query);
                sport_fields_id.push(new_sport[0].get("n.id"));
            }
            catch (e: any) {
                return Promise.reject("Error in adding new sport place: " + e);
            }
        }

        query = "MATCH (Place1:SportPlace), (Adress1:Adress) "
        query += "WHERE Place1.id=" + sport_place_id + " AND Adress1.id=" + adress_id + " CREATE (Place1) -[:LOCATE]-> (Adress1);"
        try {
            let process_query = await this.retrieve_data_neo4j(query);
        }
        catch (e: any) {
            return Promise.reject("Error in creating relationship for adress and sport place: " + e);
        }

        for (let i: number = 0; i < open_hours_id.length; i++) {
            query = "MATCH (Place1:SportPlace), (Hours1:Hours) "
            query += "WHERE Place1.id=" + sport_place_id + " AND Hours1.id=" + open_hours_id
            query += " CREATE (Place1) -[:OPEN]-> (Hours1);"
            try {
                let process_query = await this.retrieve_data_neo4j(query);
            }
            catch (e: any) {
                return Promise.reject("Error in creating relationship for opening hours and sport place: " + e);
            }
        }

        for (let i: number = 0; i < sport_fields_id.length; i++) {
            query = "MATCH (Place1:SportPlace), (Sport1:Sport) "
            query += "WHERE Place1.id=" + sport_place_id + " AND Sport1.id=" + sport_fields_id[i]
            query += " CREATE (Place1) -[:HAVE]-> (Sport1);"
            try {
                let process_query = await this.retrieve_data_neo4j(query);
            }
            catch (e: any) {
                return Promise.reject("Error in creating relationship for sport fields and sport place: " + e);
            }
        }

        return "Adding new sport place sucessfully";
    }

    public async addNewPlayer(adress: string, sport: string) {
        let query = "MATCH (Place_name:SportPlace) -[:HAVE]-> (Sport_name:Sport), (Place_name) -[:LOCATE]-> (Adress_name:Adress)"
        query += 'WHERE Adress_name.adress = "' + adress + '" AND toLower(Sport_name.name) = "' + sport + '" '
        query += "SET Sport_name.nbPlayers = Sport_name.nbPlayers + 1;"
        try {
            let db_data = await this.retrieve_data_neo4j(query);
            return "A new player is added sucessfully to field"
        }
        catch (e: any) {
            return Promise.reject("Error in adding new player to a field: " + e);
        }
    }

    public async deletePlayer(adress: string, sport: string) {
        let query = "MATCH (Place_name:SportPlace) -[:HAVE]-> (Sport_name:Sport), (Place_name) -[:LOCATE]-> (Adress_name:Adress)"
        query += 'WHERE Adress_name.adress = "' + adress + '" AND toLower(Sport_name.name) = "' + sport + '" '
        query += "SET Sport_name.nbPlayers = Sport_name.nbPlayers - 1;"
        try {
            let db_data = await this.retrieve_data_neo4j(query);
            return "A new player is removed sucessfully to field"
        }
        catch (e: any) {
            return Promise.reject("Error in removing a player to a field: " + e);
        }
    }
}