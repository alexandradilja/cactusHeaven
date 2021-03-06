const orderSchema = require('./schema/order');
const orderItemSchema = require('./schema/orderItem');
const mongoose = require('mongoose');

const connection = mongoose.createConnection('mongodb+srv://admin:admin101@largeassignment2.vi6pu.mongodb.net/cactusHeaven', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

module.exports = {
    Order: connection.model('Order', orderSchema),
    OrderItem: connection.model('OrderItem', orderItemSchema)
};
