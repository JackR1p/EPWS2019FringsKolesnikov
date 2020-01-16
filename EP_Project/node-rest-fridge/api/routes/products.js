const express = require('express');  
const router = express.Router();
const fs = require('fs');

const helpfunctions = require('./helpfunctions');
const produktliste = require('../../produktliste');
const scanliste = require('../../scanliste');
const rezeptliste = require('../../rezeptliste');

//Get Request auf alle Produkte
router.get('/', (req, res, next) => {
    res.status(200).json({
        ProdukListe: produktliste
    });
});

//Post Request: erstellt neuen Produkteintrag durch Eingabe
router.post('/',(req, res, next) => {

    const newId = helpfunctions.generateNewID(produktliste);
    const haltbarkeit = helpfunctions.berechneHaltbarkeit(new Date(req.body.datum)); //"mm/dd/yyyy"

    const product = {
        id: newId,
        name: req.body.name,
        marke: req.body.marke,
        haltbarkeit: haltbarkeit
    };

    produktliste.push(product);
    sortiereNachHaltbarkeit(produktliste);
    saveData();

    res.status(200).json({
        message: 'Produkt wurde der Liste hinzugefügt',
        createdProduct: product
    });
});

//Post Request: erstellt einen neuen Produkteintrag durch Scan
router.post('/:scanId', (req, res, next) => {

    const scanId = parseInt(req.params.scanId);
    const foundProduct = helpfunctions.findProduktByID(scanliste, scanId);
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

    res.status(200).json({
        message: 'Produkt wurde der Liste durch scan hinzugefügt',
        createdProduct: product
    });
});

//Get-Request: zeigt ein Produkt mit der eingegebenen ID an
router.get('/:productId', (req, res, next) => {
    const id = req.params.productId;

    if(id === 'rezepte'){

        res.status(200).json({
            message: 'hier werden Rezepte abgerufen'
        });
    }

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

const sortiereNachHaltbarkeit = function(liste) {

    for(let h = 0; h < liste.length; h++){
        for(let i = 0; i < liste.length - 1; i++) {

            if(liste[i].haltbarkeit > liste[i + 1].haltbarkeit){
                const halter = liste[i];
                liste[i] = liste[i + 1];
                liste[i + 1] = halter;
            }
        }
    }
}

const sucheRezept = function(){

    for (let i = 0; i < rezeptliste.length; i++) {
        for (let j = 1; j < rezeptliste[i])
    }
}

const saveData = function () {
    fs.writeFile('produktliste.json', JSON.stringify(produktliste), function (error) {
        if (error) throw error;
    });
}

module.exports = router;