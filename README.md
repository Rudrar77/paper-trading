
# RR Coin - Crypto Trading Dashboard

A modern React-based cryptocurrency trading platform with real-time data and portfolio management.
## Images
![{8F9B4962-3631-477A-AE1E-604E83C37051}](https://github.com/user-attachments/assets/d92d3583-b33e-488d-bf0a-0cd4cdac48b2)
![{A9E8B044-3B6A-454E-B27F-3CAE9DEB5C43}](https://github.com/user-attachments/assets/d0b46659-e1a4-47ae-b710-2c03c1e50171)
![{F718F360-C491-4B02-8899-611F1A09F178}](https://github.com/user-attachments/assets/a321de13-a450-47f2-b4cd-1a7677d64044)

## Features

- 🚀 **Real-time Crypto Data**: Live cryptocurrency prices and market data
- 📊 **Portfolio Management**: Track your holdings with P&L calculations
- 💹 **Paper Trading**: Practice trading without real money
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- 📱 **Responsive Design**: Works perfectly on all devices
- ⚡ **Fast Performance**: Built with React and modern web technologies

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide React icons
- **Data Fetching**: React Query for efficient API calls
- **Backend**: MySQL with PHP (for production)
- **Styling**: Tailwind CSS with custom gradients

## MySQL Database Setup

### Database Schema

```sql
-- Create database
CREATE DATABASE crypto;
USE crypto;

-- Transactions table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    currency VARCHAR(10) NOT NULL,
    action ENUM('buy', 'sell') NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    total_value DECIMAL(20, 8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Holdings/Portfolio table
CREATE TABLE holdings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    currency VARCHAR(10) NOT NULL UNIQUE,
    quantity DECIMAL(20, 8) NOT NULL,
    avg_price DECIMAL(20, 8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### PHP Backend Files

The project includes PHP files for MySQL connectivity:

1. **trade.php** - Handles buy/sell transactions
2. **transactions.php** - Retrieves portfolio holdings

### Database Configuration

Update the database connection in your PHP files:

```php
$conn = new mysqli("localhost", "your_username", "your_password", "crypto");
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL Server
- PHP (for backend API)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd crypto-trading-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MySQL database**
   - Create the database using the schema above
   - Update PHP files with your database credentials

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open http://localhost:8080 in your browser

### Backend API Endpoints

- `POST /trade.php` - Execute buy/sell transactions
- `GET /transactions.php` - Get portfolio holdings

## Features Overview

### Dashboard
- Real-time crypto prices
- Top gainers and losers
- Market overview cards

### Portfolio
- Current holdings display
- Profit/Loss calculations
- Average price tracking

### Trading
- Interactive buy/sell interface
- Real-time total calculations
- Transaction confirmation

## Development Features

- **Hot Reload**: Instant updates during development
- **TypeScript**: Full type safety
- **Modern React**: Hooks and functional components
- **Responsive Design**: Mobile-first approach
- **Performance Optimized**: Efficient state management

## Deployment

### Frontend Deployment
```bash
npm run build
```

### Backend Setup
1. Upload PHP files to your web server
2. Configure MySQL database
3. Update CORS headers if needed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@rrcoin.com or join our Discord community.

---

**Note**: This is a demo application for educational purposes. For production use, implement proper security measures, error handling, and data validation.
