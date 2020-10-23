const amqp = require('amqplib/callback_api');
const Order = require('./data/db').Order;
const OrderItem = require('./data/db').OrderItem;

const messageBrokerInfo = {
    exchanges: {
        order: 'order_exchange'
    },
    queues: {
        orderQueue: 'order_queue'
    },
    routingKeys: {
        input: 'create_order',
        output: 'send_email'
    }
}

const createMessageBrokerConnection = () => new Promise((resolve, reject) => {
    amqp.connect('amqp://localhost', (err, conn) => {
        if (err) { reject(err); }
        resolve(conn);
    });
});

const configureMessageBroker = channel => {
    const { exchanges, queues, routingKeys } = messageBrokerInfo;

    channel.assertExchange(exchanges.order, 'direct', { durable: true });
    channel.assertQueue(queues.orderQueue, { durable: true });
    channel.bindQueue(queues.orderQueue, exchanges.order, routingKeys.input);
}

const createChannel = connection => new Promise((resolve, reject) => {
    connection.createChannel((err, channel) => {
        if (err) { reject(err); }
        configureMessageBroker(channel);
        resolve(channel);
    });
});

// TODO ADD TO DB
const orderToDB = async (data) => {
    const order = JSON.parse(data);
    var totalPrice = 0;

    order.items.forEach(item => {
        totalPrice += item.quantity * item.unitPrice;
    });

    const newOrder = {
        customerEmail: order.email,
        totalPrice: totalPrice,
        orderDate: new Date()
    }

    const createdOrder = await Order.create(newOrder);

    order.items.forEach(item => {
        const newOrderItem = {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            rowPrice: item.quantity * item.unitPrice,
            orderId: createdOrder._id
        }

        OrderItem.create(newOrderItem);
    });

    return createdOrder;
}

(async () => {
    const connection = await createMessageBrokerConnection();
    const channel = await createChannel(connection);

    const { order } = messageBrokerInfo.exchanges;
    const { orderQueue } = messageBrokerInfo.queues;
    const { output } = messageBrokerInfo.routingKeys;

    console.log(`[x] Taking in messages from: ${orderQueue}`);

    channel.consume(orderQueue, async data => {
        console.log(data.content.toString());
        const dataJson = data.content.toString();
        await orderToDB(dataJson);
        channel.publish(order, output, Buffer.from(dataJson));

        console.log(`[x] Recived: ${JSON.stringify(dataJson)}`);
    }, { noAck: true });
})().catch(e => console.error(e));