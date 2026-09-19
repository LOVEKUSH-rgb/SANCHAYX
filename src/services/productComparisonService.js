/**
 * Product Comparison Service
 * Standardizes disparate product data (Gov Schemes, MFs, Stocks) into a single 9-row matrix for side-by-side comparison.
 */

export const buildComparisonMatrix = (products) => {
  if (!products || products.length === 0) return [];

  // Define the standard rows we want to compare
  const matrixKeys = [
    { id: 'productType', label: 'Product Type' },
    { id: 'risk', label: 'Risk Characteristics' },
    { id: 'horizon', label: 'Typical Horizon' },
    { id: 'liquidity', label: 'Liquidity & Lock-in' },
    { id: 'minimum', label: 'Minimum Investment' },
    { id: 'returnMechanism', label: 'Return Mechanism' },
    { id: 'diversification', label: 'Diversification' },
    { id: 'source', label: 'Regulator / Source' },
    { id: 'dataStatus', label: 'Data Status' }
  ];

  // Helper to extract normalized values based on product type
  const extractValue = (product, key) => {
    const { type, details, dataSource } = product;
    
    switch (key) {
      case 'productType':
        if (type === 'gov_scheme') return 'Government Scheme';
        if (type === 'mutual_fund') return 'Mutual Fund';
        if (type === 'stock') return 'Direct Equity / Stock';
        if (type === 'etf') return 'Exchange Traded Fund (ETF)';
        if (type === 'fixed_income') return 'Fixed Income';
        return 'Not available';
        
      case 'risk':
        if (type === 'gov_scheme') return 'Sovereign Guarantee / Very Low Risk';
        if (type === 'mutual_fund') return `Market-linked (${details.riskometer || 'High Risk'})`;
        if (type === 'stock') return `Market-linked (${details.expectedVolatilty || 'High'} Volatility)`;
        if (type === 'etf') return 'Market-linked (Index Volatility)';
        return 'Not available';

      case 'horizon':
        if (type === 'gov_scheme') return details.financial?.maturity_years ? `${details.financial.maturity_years} Years` : 'Not available';
        if (type === 'mutual_fund') return details.suitableHorizon || 'Not available';
        if (type === 'stock' || type === 'etf') return 'No fixed maturity (Long-term recommended)';
        return 'Not available';

      case 'liquidity':
        if (type === 'gov_scheme') {
          return details.financial?.lock_in_years 
            ? `Strict lock-in for ${details.financial.lock_in_years} years` 
            : 'Subject to scheme withdrawal rules';
        }
        if (type === 'mutual_fund') return 'Usually T+2 Days (Subject to exit load/lock-in)';
        if (type === 'stock' || type === 'etf') return 'Exchange Traded (High during market hours)';
        return 'Not available';

      case 'minimum':
        if (type === 'gov_scheme') return details.financial?.minimum_contribution ? `₹${details.financial.minimum_contribution}` : 'Not available';
        if (type === 'mutual_fund') return 'Usually ₹500 - ₹1000 for SIP';
        if (type === 'stock' || type === 'etf') return 'Price of 1 Unit/Share';
        return 'Not available';

      case 'returnMechanism':
        if (type === 'gov_scheme') return 'Fixed / Government Declared';
        if (type === 'mutual_fund') return 'Capital Appreciation & IDCW (No Guarantee)';
        if (type === 'stock') return 'Capital Appreciation & Dividends (No Guarantee)';
        if (type === 'etf') return 'Tracks Underlying Index (No Guarantee)';
        return 'Not available';

      case 'diversification':
        if (type === 'gov_scheme') return 'N/A';
        if (type === 'mutual_fund') return details.diversification || 'Fund-specific basket of securities';
        if (type === 'stock') return 'None (Single Company Exposure)';
        if (type === 'etf') return `Tracks ${details.underlying || 'Index'}`;
        return 'Not available';

      case 'source':
        if (type === 'gov_scheme') return 'Ministry of Finance / Relevant Govt Dept';
        if (type === 'mutual_fund' || type === 'stock' || type === 'etf') return 'SEBI / Exchanges';
        return 'Not available';

      case 'dataStatus':
        return dataSource;

      default:
        return 'Not available';
    }
  };

  // Build the matrix rows
  const rows = matrixKeys.map(keyDef => {
    const row = { 
      id: keyDef.id, 
      label: keyDef.label, 
      values: [] 
    };
    
    products.forEach(product => {
      row.values.push(extractValue(product, keyDef.id));
    });
    
    return row;
  });

  return {
    products, // Keep the original products for headers
    rows
  };
};
