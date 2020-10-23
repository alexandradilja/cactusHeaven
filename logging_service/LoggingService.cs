using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System;
using System.IO;
using System.Text;

namespace logging_service
{
    class LoggingService
    {
        public static void Main(string[] args)
        {
            var factory = new ConnectionFactory() { HostName = "localhost" };
            using (var connection = factory.CreateConnection())
            using (var channel = connection.CreateModel())
            {
                Console.WriteLine("Waiting for messages in logging queue...");

                channel.QueueDeclare(
                    queue: "logging_queue",
                    durable: false,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null
                );

                channel.ExchangeDeclare(
                    exchange: "order_exchange",
                    type: ExchangeType.Direct,
                    durable: true
                );

                channel.QueueBind(
                    queue: "logging_queue",
                    exchange: "order_exchange",
                    routingKey: "create_order",
                    arguments: null
                );

                var consumer = new EventingBasicConsumer(channel);
                consumer.Received += (model, ea) => {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);

                    var pathToLogs = "./log.txt";

                    using (StreamWriter streamWriter = File.AppendText(pathToLogs))
                    {
                        streamWriter.WriteLine("Log: " + message);
                    }
                };

                channel.BasicConsume("logging_queue", true, consumer: consumer);
                Console.ReadLine();
            }
        }
    }
}
