const orderSchema = require('./schema/order');
const orderItemSchema = require('./schema/orderItem');
const mongoose = require('mongoose');

const connection = mongoose.createConnection('ongodb+srv://admin:admin101@largeassignment2.vi6pu.mongodb.net/cactusHeaven', {
    useNewUrlParser: true
});

module.exports = {
    Order: connection.model('Order', orderSchema),
    OrderItem: connection.model('OrderItem', orderItemSchema)
};
