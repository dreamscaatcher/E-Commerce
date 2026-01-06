// neo4j-dashboard — Synthetic seed data
//
// Run this file in Neo4j Desktop (Browser) to generate demo data for the app:
// - (:Product), (:Customer), (:Order), (:Payment)
// - Relationships:
//     (Customer)-[:PLACED]->(Order)-[:PAID_WITH]->(Payment)
//     (Order)-[:CONTAINS {quantity, price}]->(Product)
//
// Notes:
// - This script APPENDS data using the next available numeric IDs.
// - Seeded customers are NOT loginable in the app because the app requires a PBKDF2 PasswordHash.
//   Use the /register flow to create real customers you can log in with.
//
// Optional cleanup (DANGEROUS): Uncomment to wipe your DB first.
// MATCH (n) DETACH DELETE n;

// -------------------------
// 1) Seed Products
// -------------------------
WITH
  60 AS productCount,
  ['Home', 'Clothing', 'Electronics', 'Books', 'Beauty', 'Sports'] AS categories
MATCH (p:Product)
WITH productCount, categories, coalesce(max(toInteger(p.ProductID)), 0) AS maxId
WITH productCount, categories, maxId + 1 AS startId
UNWIND range(startId, startId + productCount - 1) AS productId
WITH
  productId,
  categories[toInteger(rand() * size(categories))] AS category,
  round((rand() * 490 + 10) * 100) / 100 AS price,
  datetime() - duration({ days: toInteger(rand() * 90) }) AS createdAt
CREATE (:Product {
  ProductID: productId,
  Name: 'Product ' + productId,
  Category: category,
  Price: price,
  ImageUrl: 'https://picsum.photos/seed/product-' + productId + '/600/400',
  Description: 'Synthetic product #' + productId + ' in ' + category + '.',
  CreatedAt: createdAt
})
RETURN count(*) AS productsCreated;

// -------------------------
// 2) Seed Customers
// -------------------------
WITH
  25 AS customerCount,
  ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt'] AS cities
MATCH (c:Customer)
WITH customerCount, cities, coalesce(max(toInteger(c.CustomerID)), 0) AS maxId
WITH customerCount, cities, maxId + 1 AS startId
UNWIND range(startId, startId + customerCount - 1) AS customerId
WITH
  customerId,
  cities[toInteger(rand() * size(cities))] AS city,
  datetime() - duration({ days: toInteger(rand() * 180) }) AS createdAt
CREATE (:Customer {
  CustomerID: customerId,
  Name: 'Customer ' + customerId,
  Email: 'customer' + customerId + '@example.com',
  EmailVerified: true,
  Phone: '+49' + toString(1000000000 + toInteger(rand() * 8999999999)),
  City: city,
  ShippingAddress: toString(customerId) + ' Example Street, ' + city,
  CreatedAt: createdAt
})
RETURN count(*) AS customersCreated;

// -------------------------
// 3) Seed Orders + Payments
// -------------------------
WITH
  40 AS orderCount,
  5 AS maxItemsPerOrder,
  ['DEV_CARD', 'DEV_CASH', 'DEV_BANK'] AS paymentMethods
MATCH (o:Order)
WITH
  orderCount,
  maxItemsPerOrder,
  paymentMethods,
  coalesce(max(toInteger(o.OrderID)), 0) AS maxOrderId
WITH
  orderCount,
  maxItemsPerOrder,
  paymentMethods,
  maxOrderId + 1 AS orderStart
MATCH (p:Payment)
WITH
  orderCount,
  maxItemsPerOrder,
  paymentMethods,
  orderStart,
  coalesce(max(toInteger(p.PaymentID)), 0) AS maxPaymentId
WITH
  orderCount,
  maxItemsPerOrder,
  paymentMethods,
  orderStart,
  maxPaymentId + 1 AS paymentStart
MATCH (c:Customer)
WITH
  orderCount,
  maxItemsPerOrder,
  paymentMethods,
  orderStart,
  paymentStart,
  collect(c) AS customers
MATCH (prod:Product)
WITH
  orderCount,
  maxItemsPerOrder,
  paymentMethods,
  orderStart,
  paymentStart,
  customers,
  collect(prod) AS products
WITH
  orderCount,
  maxItemsPerOrder,
  paymentMethods,
  orderStart,
  paymentStart,
  customers,
  products,
  size(customers) AS customerCount,
  size(products) AS productCount
WHERE customerCount > 0 AND productCount > 0
UNWIND range(orderStart, orderStart + orderCount - 1) AS orderId
WITH
  orderStart,
  paymentStart,
  paymentMethods,
  customers[toInteger(rand() * customerCount)] AS customer,
  products,
  productCount,
  orderId,
  toInteger(rand() * maxItemsPerOrder) + 1 AS lineCount,
  paymentStart + (orderId - orderStart) AS paymentId,
  paymentMethods[toInteger(rand() * size(paymentMethods))] AS paymentMethod,
  datetime() - duration({ days: toInteger(rand() * 60), hours: toInteger(rand() * 24) }) AS createdAt
WITH
  customer,
  products,
  productCount,
  orderId,
  paymentId,
  paymentMethod,
  createdAt,
  [i IN range(1, lineCount) | products[toInteger(rand() * productCount)]] AS chosenProducts
WITH
  customer,
  orderId,
  paymentId,
  paymentMethod,
  createdAt,
  [p IN chosenProducts | {
    productId: toString(p.ProductID),
    name: coalesce(p.Name, ('Product ' + toString(p.ProductID))),
    price: toFloat(coalesce(p.Price, 0)),
    quantity: toInteger(rand() * 3) + 1,
    category: coalesce(p.Category, ''),
    imageUrl: coalesce(p.ImageUrl, '')
  }] AS items
WITH
  customer,
  orderId,
  paymentId,
  paymentMethod,
  createdAt,
  items,
  reduce(total = 0.0, item IN items | total + (item.price * item.quantity)) AS total,
  reduce(itemCount = 0, item IN items | itemCount + item.quantity) AS itemCount,
  '[' + reduce(json = '', item IN items |
    json +
      CASE WHEN json = '' THEN '' ELSE ',' END +
      '{"productId":"' + item.productId +
      '","name":"' + item.name +
      '","price":' + toString(item.price) +
      ',"quantity":' + toString(item.quantity) +
      ',"category":"' + item.category +
      '","imageUrl":"' + item.imageUrl + '"}'
  ) + ']' AS itemsJson
CREATE (order:Order {
  OrderID: orderId,
  CustomerID: customer.CustomerID,
  CustomerEmail: customer.Email,
  OrderDate: createdAt,
  CreatedAt: createdAt,
  Status: 'PAID',
  Total: total,
  ItemCount: itemCount,
  Currency: 'EUR',
  ShippingAddress: coalesce(customer.ShippingAddress, ''),
  ItemsJson: itemsJson,
  PaymentID: paymentId,
  PaidAt: createdAt + duration({ minutes: toInteger(rand() * 120) })
})
CREATE (customer)-[:PLACED]->(order)
WITH order, items, total, paymentId, paymentMethod
UNWIND items AS item
MATCH (prod:Product)
WHERE toString(prod.ProductID) = item.productId
CREATE (order)-[:CONTAINS { quantity: item.quantity, price: item.price }]->(prod)
WITH DISTINCT order, total, paymentId, paymentMethod
CREATE (payment:Payment {
  PaymentID: paymentId,
  OrderID: order.OrderID,
  CustomerID: order.CustomerID,
  PaymentDate: order.PaidAt,
  CreatedAt: order.PaidAt,
  Method: paymentMethod,
  Amount: total,
  Currency: 'EUR',
  Status: 'PAID'
})
CREATE (order)-[:PAID_WITH]->(payment)
RETURN count(DISTINCT order) AS ordersCreated, count(payment) AS paymentsCreated;
