
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Wallet, Coins, ChartLine, Rocket, Plus, Minus, Calculator, Check, X, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface CryptoData {
  currency: string;
  currency_name: string;
  price: string;
  price_change_percentage: string;
  coin_icon: string;
}

interface Holding {
  currency: string;
  quantity: string;
  avg_price: string;
  timestamp: string;
}

const Index = () => {
  const [allCurrencies, setAllCurrencies] = useState<CryptoData[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTradeRow, setActiveTradeRow] = useState<string | null>(null);
  const [tradeAmounts, setTradeAmounts] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    initApp();
    const interval = setInterval(() => {
      fetchCryptoData();
      loadHoldings();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const initApp = async () => {
    await fetchCryptoData();
    await loadHoldings();
  };

  const fetchCryptoData = async () => {
    try {
      const response = await fetch("https://cs-india.coinswitch.co/api/v2/external/csk_website/currencies");
      const data = await response.json();
      const currencies = data?.data?.currencies || [];
      const validCurrencies = currencies.filter((currency: CryptoData) => {
        const price = Number(currency.price);
        return isFinite(price);
      });
      setAllCurrencies(validCurrencies);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load cryptocurrency data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const loadHoldings = async () => {
    try {
      // In a real app, this would connect to your PHP backend
      // For demo purposes, we'll use localStorage
      const savedHoldings = localStorage.getItem('cryptoHoldings');
      if (savedHoldings) {
        setHoldings(JSON.parse(savedHoldings));
      }
    } catch (error) {
      console.error('Failed to load holdings', error);
    }
  };

  const saveHoldings = (newHoldings: Holding[]) => {
    localStorage.setItem('cryptoHoldings', JSON.stringify(newHoldings));
    setHoldings(newHoldings);
  };

  const executeTrade = async (action: 'buy' | 'sell', currency: string) => {
    const amount = parseFloat(tradeAmounts[currency] || '0');
    const cryptoData = allCurrencies.find(c => c.currency === currency);
    
    if (!cryptoData || amount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(cryptoData.price);
    const total = amount * price;

    try {
      let updatedHoldings = [...holdings];
      const existingHolding = updatedHoldings.find(h => h.currency === currency);

      if (action === 'sell') {
        if (!existingHolding || parseFloat(existingHolding.quantity) < amount) {
          toast({
            title: "Insufficient Balance",
            description: "You don't have enough to sell",
            variant: "destructive",
          });
          return;
        }
        
        const newQuantity = parseFloat(existingHolding.quantity) - amount;
        if (newQuantity <= 0) {
          updatedHoldings = updatedHoldings.filter(h => h.currency !== currency);
        } else {
          existingHolding.quantity = newQuantity.toString();
        }
      } else {
        // Buy logic
        if (existingHolding) {
          const currentQty = parseFloat(existingHolding.quantity);
          const currentAvgPrice = parseFloat(existingHolding.avg_price);
          const newQty = currentQty + amount;
          const newTotalValue = (currentQty * currentAvgPrice) + (amount * price);
          const newAvgPrice = newTotalValue / newQty;
          
          existingHolding.quantity = newQty.toString();
          existingHolding.avg_price = newAvgPrice.toString();
        } else {
          updatedHoldings.push({
            currency,
            quantity: amount.toString(),
            avg_price: price.toString(),
            timestamp: new Date().toISOString()
          });
        }
      }

      saveHoldings(updatedHoldings);
      setActiveTradeRow(null);
      setTradeAmounts({ ...tradeAmounts, [currency]: '' });
      
      toast({
        title: "Trade Successful",
        description: `${action === 'buy' ? 'Bought' : 'Sold'} ${amount} ${currency}`,
      });
    } catch (error) {
      toast({
        title: "Trade Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const calculateTotal = (currency: string) => {
    const amount = parseFloat(tradeAmounts[currency] || '0');
    const cryptoData = allCurrencies.find(c => c.currency === currency);
    if (cryptoData && amount > 0) {
      return (amount * parseFloat(cryptoData.price)).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return '0.00';
  };

  const getTopGainers = () => {
    return allCurrencies
      .filter(c => parseFloat(c.price_change_percentage) > 0)
      .sort((a, b) => parseFloat(b.price_change_percentage) - parseFloat(a.price_change_percentage))
      .slice(0, 5);
  };

  const getTopLosers = () => {
    return allCurrencies
      .filter(c => parseFloat(c.price_change_percentage) < 0)
      .sort((a, b) => parseFloat(a.price_change_percentage) - parseFloat(b.price_change_percentage))
      .slice(0, 5);
  };

  const calculateProfitLoss = (holding: Holding) => {
    const currentCrypto = allCurrencies.find(c => c.currency === holding.currency);
    if (!currentCrypto) return { profit: 0, percentage: 0 };
    
    const quantity = parseFloat(holding.quantity);
    const avgPrice = parseFloat(holding.avg_price);
    const currentPrice = parseFloat(currentCrypto.price);
    
    const profit = (currentPrice - avgPrice) * quantity;
    const percentage = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
    
    return { profit, percentage };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Loading Crypto Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChartLine className="w-8 h-8 text-white" />
              <h1 className="text-2xl font-bold text-white">RR Coin</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#dashboard" className="text-white/80 hover:text-white transition-colors">Dashboard</a>
              <a href="#portfolio" className="text-white/80 hover:text-white transition-colors">Portfolio</a>
              <a href="#trading" className="text-white/80 hover:text-white transition-colors">Trading</a>
            </nav>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-16 text-center text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-4">
            <Rocket className="w-12 h-12 mr-4" />
            <h1 className="text-5xl font-bold">Paper Trading App</h1>
          </div>
          <p className="text-xl opacity-90">Practice crypto trading without real money</p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {/* Market Overview */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8" id="dashboard">
          {/* Top Gainers */}
          <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Top Gainers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                {getTopGainers().length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No gainers available
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {getTopGainers().map((crypto) => (
                      <div key={crypto.currency} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img src={crypto.coin_icon} alt={crypto.currency} className="w-8 h-8 rounded-full" />
                            <span className="font-semibold text-gray-900">{crypto.currency}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">₹{parseFloat(crypto.price).toLocaleString('en-IN')}</div>
                            <div className="text-green-600 text-sm font-medium">
                              +{parseFloat(crypto.price_change_percentage).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Losers */}
          <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <TrendingDown className="w-5 h-5 mr-2" />
                Top Losers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                {getTopLosers().length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No losers available
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {getTopLosers().map((crypto) => (
                      <div key={crypto.currency} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img src={crypto.coin_icon} alt={crypto.currency} className="w-8 h-8 rounded-full" />
                            <span className="font-semibold text-gray-900">{crypto.currency}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">₹{parseFloat(crypto.price).toLocaleString('en-IN')}</div>
                            <div className="text-red-600 text-sm font-medium">
                              {parseFloat(crypto.price_change_percentage).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Section */}
        <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl mb-8" id="portfolio">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Current Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {holdings.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No holdings found</h3>
                <p>Start trading to build your portfolio!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Price</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {holdings.map((holding) => {
                      const { profit, percentage } = calculateProfitLoss(holding);
                      return (
                        <tr key={holding.currency} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-gray-900">{holding.currency}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            {parseFloat(holding.quantity).toFixed(6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            ₹{parseFloat(holding.avg_price).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Math.abs(profit).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                profit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {profit >= 0 ? '+' : '-'}{Math.abs(percentage).toFixed(2)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trading Section */}
        <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl" id="trading">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center">
              <Coins className="w-5 h-5 mr-2" />
              All Cryptocurrencies
            </CardTitle>
            <p className="text-sm opacity-90 mt-2">Click Buy/Sell to trade any cryptocurrency</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (INR)</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">24h Change</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allCurrencies.map((crypto) => (
                    <React.Fragment key={crypto.currency}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img src={crypto.coin_icon} alt={crypto.currency} className="w-8 h-8 rounded-full" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">{crypto.currency}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {crypto.currency_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">
                            ₹{parseFloat(crypto.price).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            parseFloat(crypto.price_change_percentage) >= 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {parseFloat(crypto.price_change_percentage) >= 0 ? '+' : ''}
                            {parseFloat(crypto.price_change_percentage).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setActiveTradeRow(activeTradeRow === crypto.currency ? null : crypto.currency)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Buy
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setActiveTradeRow(activeTradeRow === crypto.currency ? null : crypto.currency)}
                            >
                              <Minus className="w-3 h-3 mr-1" />
                              Sell
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {activeTradeRow === crypto.currency && (
                        <tr className="bg-gradient-to-r from-blue-50 to-purple-50">
                          <td colSpan={6} className="px-6 py-6">
                            <div className="bg-white rounded-lg p-6 shadow-lg">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <Label htmlFor={`amount-${crypto.currency}`} className="flex items-center mb-2">
                                    <Coins className="w-4 h-4 mr-1" />
                                    Amount:
                                  </Label>
                                  <Input
                                    id={`amount-${crypto.currency}`}
                                    type="number"
                                    min="0.00000001"
                                    step="0.00000001"
                                    placeholder="Enter amount"
                                    value={tradeAmounts[crypto.currency] || ''}
                                    onChange={(e) => setTradeAmounts({
                                      ...tradeAmounts,
                                      [crypto.currency]: e.target.value
                                    })}
                                  />
                                </div>
                                <div>
                                  <Label className="flex items-center mb-2">
                                    <span className="mr-1">₹</span>
                                    Price (INR):
                                  </Label>
                                  <Input
                                    type="text"
                                    value={parseFloat(crypto.price).toFixed(2)}
                                    readOnly
                                    className="bg-gray-50"
                                  />
                                </div>
                                <div>
                                  <Label className="flex items-center mb-2">
                                    <Calculator className="w-4 h-4 mr-1" />
                                    Total (INR):
                                  </Label>
                                  <Input
                                    type="text"
                                    value={`₹${calculateTotal(crypto.currency)}`}
                                    readOnly
                                    className="bg-gray-50"
                                  />
                                </div>
                                <div className="flex items-end space-x-2">
                                  <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => executeTrade('buy', crypto.currency)}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Confirm Buy
                                  </Button>
                                  <Button
                                    className="flex-1"
                                    variant="destructive"
                                    onClick={() => executeTrade('sell', crypto.currency)}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Confirm Sell
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setActiveTradeRow(null)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
