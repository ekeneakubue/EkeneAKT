# Prisma Setup Guide

## Database Models Created

This project now includes the following Prisma models:

### 1. **Admin Model**
- `id`: Unique identifier (UUID)
- `email`: Unique email address
- `password`: Hashed password
- `name`: Admin name
- `role`: Role (defaults to "admin")
- `createdAt` & `updatedAt`: Timestamps

### 2. **Customer Model**
- `id`: Unique identifier (UUID)
- `email`: Unique email address
- `password`: Hashed password
- `name`: Customer name
- `phone`: Optional phone number
- `address`: Optional address
- `city`: Optional city
- `state`: Optional state
- `country`: Optional country (defaults to "Nigeria")
- `createdAt` & `updatedAt`: Timestamps
- `orders`: Relation to Order model

### 3. **Product Model**
- `id`: Unique identifier (UUID)
- `name`: Product name
- `description`: Optional description
- `price`: Price per carton
- `minQuantity`: Minimum pieces per carton (defaults to 1)
- `category`: Product category
- `image`: Optional image URL
- `rating`: Optional rating (defaults to 0)
- `reviews`: Number of reviews (defaults to 0)
- `featured`: Featured product flag (defaults to false)
- `inStock`: Stock availability (defaults to true)
- `stockCount`: Optional stock count
- `createdAt` & `updatedAt`: Timestamps
- `orderItems`: Relation to OrderItem model

### 4. **Order Model** (Bonus)
- `id`: Unique identifier (UUID)
- `customerId`: Foreign key to Customer
- `status`: Order status (pending, processing, shipped, delivered, cancelled)
- `subtotal`: Subtotal amount
- `shipping`: Shipping cost
- `tax`: Tax amount
- `total`: Total amount
- `shippingAddress`: Optional shipping address
- `createdAt` & `updatedAt`: Timestamps
- Relations to Customer and OrderItem

### 5. **OrderItem Model** (Bonus)
- `id`: Unique identifier (UUID)
- `orderId`: Foreign key to Order
- `productId`: Foreign key to Product
- `quantity`: Number of cartons
- `price`: Price per carton at time of order
- `minQuantity`: Pieces per carton at time of order
- `total`: Total price for this item
- `createdAt`: Timestamp
- Relations to Order and Product

## Setup Instructions

### 1. Database Configuration

The database is configured in `prisma.config.ts`:

```typescript
import { defineConfig } from '@prisma/client/config'

export default defineConfig({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
})
```

For production with PostgreSQL:

```typescript
export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db'
    }
  }
})
```

### 2. Generate Prisma Client

```bash
npm run db:generate
```

### 3. Create Database and Tables

```bash
npm run db:push
```

Or use migrations:

```bash
npm run db:migrate
```

### 4. Open Prisma Studio (Optional)

To view and manage your database:

```bash
npm run db:studio
```

## Usage

Import Prisma client in your code:

```typescript
import { prisma } from '@/lib/prisma'

// Example: Create a customer
const customer = await prisma.customer.create({
  data: {
    email: 'customer@example.com',
    password: 'hashed_password',
    name: 'John Doe',
  },
})

// Example: Get all products
const products = await prisma.product.findMany()

// Example: Create an order
const order = await prisma.order.create({
  data: {
    customerId: customer.id,
    subtotal: 1000,
    shipping: 15,
    tax: 75,
    total: 1090,
    orderItems: {
      create: {
        productId: 'product-id',
        quantity: 2,
        price: 500,
        minQuantity: 12,
        total: 12000,
      },
    },
  },
})
```

## Available Scripts

- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:migrate` - Create and run migrations (production)
- `npm run db:studio` - Open Prisma Studio GUI

