const express = require('express');  
const router = express.Router();
const fs = require('fs');

const helpfunctions = require('./helpfunctions');
const produktliste = require('../../produktliste');
const scanliste = require('../../scanliste');
const rezeptliste = require('../../rezeptliste');

//Get Request auf alle Produkte
router.get('/', (req, res, next) => {

    if(produktliste.length === 0){
        res.status(200).json({
            message: "Die Produktliste ist leer"
        });
        return;
    }

    res.status(200).json({
        ProdukListe: produktliste
    });
});

//Post Request: erstellt neuen Produkteintrag durch Eingabe
router.post('/',(req, res, next) => {

    if (req.body.name == undefined) {
        res.status(400).json({
            message: "Missing body in this POST",
            missing: "name"
        });
        return;
    }

    if (req.body.marke == undefined) {
        res.status(400).json({
            message: "Missing body in this POST",
            missing: "marke"
        });
        return;
    }

    if (req.body.datum == undefined) {
        res.status(400).json({
            message: "Missing body in this POST",
            missing: "datum"
        });
        return;
    }

    const newId = helpfunctions.generateNewID(produktliste);
    const haltbarkeit = helpfunctions.berechneHaltbarkeit(new Date(req.body.datum)); // "mm/dd/yyyy"

    const product = {
        id: newId,
        name: req.body.name,
        marke: req.body.marke,
        haltbarkeit: haltbarkeit
    };

    produktliste.push(product);
    sortiereNachHaltbarkeit(produktliste);
    saveData();

    res.status(201).json({
        message: 'Produkt wurde der Liste hinzugefügt',
        createdProduct: product
    });
});

//Post Request: erstellt einen neuen Produkteintrag durch Scan
router.post('/:scanId', (req, res, next) => {

    const scanId = parseInt(req.params.scanId);
    const foundProduct = helpfunctions.findProduktByID(scanliste, scanId);

    if (!foundProduct) {
        res.status(404).json({
            message: "404 Not Found",
            missing: "Das Produkt mit der scanId "+ scanId +" existiert nicht"
        });
        return;
    }

    const newId = helpfunctions.generateNewID(produktliste);
    const haltbarkeit = helpfunctions.berechneHaltbarkeit(new Date(req.body.datum)); //"mm/dd/yyyy"



    const product = {
        id: newId,
        name: foundProduct.name,
        marke: foundProduct.marke,
        haltbarkeit: haltbarkeit
    };

    produktliste.push(product);
    sortiereNachHaltbarkeit(produktliste);
    saveData();

    res.status(201).json({
        message: 'Produkt wurde der Liste durch scan hinzugefügt',
        createdProduct: product
    });
});

//Get-Request: zeigt ein Produkt mit der eingegebenen ID an oder greift auf Benutzbare Rezepte zu
router.get('/:productId', (req, res, next) => {
    const id = req.params.productId;

    //Hier wird nach Rezeptvorschlägen gesucht
    if(id === 'rezepte'){

        if(produktliste.length === 0){
            res.status(404).json({
                message: "404 Not Found",
                missing: "Es wurden keine Produkte in der Liste gefunden"
            });
            return;
        }

        const rezeptvorschlag = sucheRezept();

        res.status(200).json({
            Rezepte: rezeptvorschlag,
            message: 'hier werden Rezepte abgerufen'
        });
    }

    //Hier wird ein Produkt mit einer bestimmte ID zurück gegeben
    else{
        const foundProduct = helpfunctions.findProduktByID(produktliste, id);
        
        if (!foundProduct) {
            res.status(404).json({
                message: "404 Not Found",
                problem: "Das Produkt mit der ID " + id + " existiert nicht"
            });
        } else {
            res.status(200).json({
                Produkt: foundProduct
            });
        }
    }   
});

//Bearbeitet ein Produkt mit bestimmter ID
router.put('/:productId', (req, res, next) => {

    const id = req.params.productId;
    const foundProduct = helpfunctions.findProduktByID(produktliste, id);

    //Fehler wenn kein Name angegeben wird
    if (req.body.name == undefined) {
        res.status(400).json({
            message: "Missing body in this PUT",
            missing: "name"
        });
        return;
    }

    //Fehler wenn keine Marke angegeben wurde
    if (req.body.marke == undefined) {
        res.status(400).json({
            message: "Missing body in this PUT",
            missing: "marke"
        });
        return;
    }

    //Fehler wenn kein Datum angegeben wurde
    if (req.body.datum == undefined) {
        res.status(400).json({
            message: "Missing body in this PUT",
            missing: "datum"
        });
        return;
    }

    if (!foundProduct) {
        res.status(404).json({
            message: "404Not Found",
            problem: "Das Produkt mit der ID " + id + " existiert nicht"
        });
        return;
    }

    const haltbarkeit = helpfunctions.berechneHaltbarkeit(new Date(req.body.datum)); //"mm/dd/yyyy"

    foundProduct.name = req.body.name;
    foundProduct.marke = req.body.marke;
    foundProduct.haltbarkeit = haltbarkeit;
    saveData();

    res.status(200).json({
        changedProduct: foundProduct
    });
});

//Löscht ein bestimmtes Produkt aus der Datenbank
router.delete('/:productId', (req, res, next) => {

const id = req.params.productId;
const foundProduct = helpfunctions.findProduktByID(produktliste, id);

if (!foundProduct) {
    res.status(404).json({
        message: "404 Not Found",
        problem: "Ein Produkt mit der ID " + id + " existiert nicht"
    });
    return;
}

for (let i = 0; i < produktliste.length; i++) {
    if (produktliste[i].id == id) {
        produktliste.splice(i, 1);
        saveData();
    }
}

res.send("204 Produkt " + id + " erfolgreich gelöscht").status(204);
});

//Diese Funktion sortiert die Liste nach der Haltbarkeit der Produkte
const sortiereNachHaltbarkeit = function(liste) {

    for(let h = 0; h < liste.length; h++){
        for(let i = 0; i < liste.length - 1; i++) {

            if(liste[i].haltbarkeit > liste[i + 1].haltbarkeit){
                //die Variable "halter" speichert kurz einen Listen-Eintrag damit dieser nach der Überschreibung nicht verloren geht
                const halter = liste[i];
                liste[i] = liste[i + 1];
                liste[i + 1] = halter;
            }
        }
    }
}

//Filtert Rezepte aus einer Rezeptliste heraus, die auf den Inhalt des Kühlschranks zutreffen
const sucheRezept = function(){

    //in dieses Array werden alle passenden Rezepte gespeichert und am Ende ausgegeben
    const auswahlRezepte = [];

    //In der ersten For-Schleife wird sich ein Rezept angeguckt
    for (let i = 0; i < rezeptliste.length; i++) {

        //count speichert die Anzahl an zutreffenden Zutaten und wird für jedes Rezept wieder auf 0 gesetzt
        let count = 0;

        //in der zweiten For-Schleife wird jede Zutat eines Rezepts durchgegangen 
        for (let j = 0; j < rezeptliste[i].zutaten.length; j++){
            //In der dritten For-Schleife wird die Produktliste durchgegangen
            for(let k = 0; k < produktliste.length; k++){

                //Trifft ein Produkt aus der Liste auf eine Zutat des Rezeptes zu, so wird count um 1 erhöht
                if(produktliste[k].name === rezeptliste[i].zutaten[j].name){
                    count ++;
                }
            }
        }
        //Ist mehr als ein Produkt in der Liste enthalten das zur Zubereitung eines Rezeptes genutzt werden kann,
        //so wird dieses Rezept zur Ausgabe hinzugefügt
        if(count >= 2){
            auswahlRezepte.push(rezeptliste[i]);
        }
    }
    //alle Verfügbaren Rezepte werden zurückgegeben
    return auswahlRezepte;
}

//Diese Funktion speichert neue Produkte in die lokale Datenbank
const saveData = function () {
    fs.writeFile('produktliste.json', JSON.stringify(produktliste), function (error) {
        if (error) throw error;
    });
}

module.exports = router;