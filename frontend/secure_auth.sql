-- secure_auth.sql

-- Create database
CREATE DATABASE IF NOT EXISTS secure_auth;
USE secure_auth;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Dummy User (password = 123456)
INSERT INTO users (username, password) VALUES
('admin', '$2b$10$UThlJf7nObS9.VVRmfFOHeayA6EMuAzSvKjvRMAy8yCF6uOQZNGfK'); -- bcrypt hash of "123456"

-- Products Table (for CRUD test)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- Dummy Products
INSERT INTO products (name, price) VALUES
('iPhone', 999.99),
('MacBook', 1999.99),
('AirPods', 199.99);
