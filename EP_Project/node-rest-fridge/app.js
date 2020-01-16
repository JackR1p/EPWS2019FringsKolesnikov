const express = require('express'); //express ist ein importiertes package
const app = express(); //lässt auf methoden etc von express zugreifen
const bodyParser = require('body-parser');

const productRoutes = require('./api/routes/products');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

/*app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); //Stern steht für alle CLients
    res.header('Access-Control-Allow-Headers','*');
    if(req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE');
        return res.status(200).json({});
    }
});*/

app.use('/products', productRoutes); //Leitet weiter an die products file

app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error:{
            message: error.message
        }
    });
});

module.exports = app;