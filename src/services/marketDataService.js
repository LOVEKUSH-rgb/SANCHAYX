/**
 * Market Data Service
 * 
 * NOTE: This is an illustrative/demo data service for the hackathon prototype.
 * It does NOT contain live market data and is for educational discovery only.
 * In the future, this can be connected to legitimate market-data providers (e.g., Yahoo Finance, NSE/BSE APIs).
 */

export const getDemoMarketData = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    stocks: [
      { symbol: 'RELIANCE', company: 'Reliance Industries', sector: 'Conglomerate', risk: 'High', expectedVolatilty: 'Moderate to High' },
      { symbol: 'HDFCBANK', company: 'HDFC Bank', sector: 'Financials', risk: 'High', expectedVolatilty: 'Moderate' },
      { symbol: 'TCS', company: 'Tata Consultancy Services', sector: 'IT', risk: 'High', expectedVolatilty: 'Moderate' }
    ],
    mutualFunds: [
      { name: 'Nifty 50 Index Fund', category: 'Equity - Large Cap', riskometer: 'Very High Risk', suitableHorizon: '5-10+ Years' },
      { name: 'Liquid Debt Fund', category: 'Debt - Liquid', riskometer: 'Low to Moderate Risk', suitableHorizon: '< 1 Year' },
      { name: 'Balanced Advantage Fund', category: 'Hybrid - Dynamic Asset Allocation', riskometer: 'High Risk', suitableHorizon: '3-5 Years' }
    ],
    etfs: [
      { name: 'NIFTYBEES', underlying: 'Nifty 50 Index', category: 'Equity ETF', liquidity: 'High' },
      { name: 'GOLDBEES', underlying: 'Physical Gold', category: 'Commodity ETF', liquidity: 'High' }
    ],
    disclaimer: 'This is illustrative demo data. Not investment advice.'
  };
};
