const express = require('express');
const router = express.Router();

exports.generateNewID = function (array) {

    // Dieser token soll auf true gesetzt werden, wenn die ID des aktuellen Produkts mit dem Zähler übereinstmmt
    // So soll eine ID gefunden werden, die noch nicht verwendet wird

    var token = false;

    for (let i = 1; i < array.length + 2; i++) {

        for (let position = 0; position < array.length; position++) {

            // Wird die aktuelle ID schon verwendet, so wird der token auf true gesetzt
            if (array[position].id == i) {
                token = true;
            }

        }
        // Ist der token = false, so wird der aktuelle Zähler zurückgegeben
        if (!token) {
            return i;
        }
        // Der token wird wieder auf false gesetzt, um alles nocheinmal mit dem nächsten Zähler machen zu können
        token = false;
    }
}

// Findet Produkt in der produktliste, anhand der angegebenen ID
exports.findProduktByID = function (liste, id) {

    for (let i = 0; i < liste.length; i++) {
        if (liste[i].id == id) {

            return liste[i];
        }
    }

    return false;
}

exports.berechneHaltbarkeit = function(date) {

    const futureDate = new Date(date);
    const now = new Date();
    const timeDiff = futureDate.getTime() - now.getTime();
    const diffDays = Math.ceil(timeDiff /(1000*60*60*24));

    return diffDays;

}

/*exports.sucheRezept = function(produkte, rezepte){

    for (let i = 0; i < rezepte.length; i++) {
        for (let j = 1; j < rezepte[i].zut)
    }
}*/
