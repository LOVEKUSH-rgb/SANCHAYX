import { getDemoMarketData } from './marketDataService';
import { MOCK_SCHEMES } from '../data/mockSchemes';

/**
 * Product Catalog Service
 * Responsible for mapping Category IDs to individual, displayable products.
 * Combines verified Gov Scheme data with Illustrative Market data.
 */

export const getProductsByCategory = async (categoryId) => {
  // If it's a specific Gov Scheme ID (e.g. 'ppf', 'scss')
  const govScheme = MOCK_SCHEMES.find(s => s.id === categoryId);
  if (govScheme) {
    return [{
      id: govScheme.id,
      title: govScheme.name,
      subtitle: 'Government Scheme',
      tags: [govScheme.category, `${govScheme.financial?.lock_in_years || 'No'} Yr Lock-in`],
      dataSource: 'Verified Official Data',
      categoryGroupId: 'gov_schemes',
      type: 'gov_scheme',
      details: govScheme
    }];
  }

  // Otherwise, it's a Market Category (e.g. 'mf_equity', 'stocks_direct')
  const demoData = await getDemoMarketData();
  
  if (categoryId.startsWith('mf_')) {
    return demoData.mutualFunds.map((mf, index) => ({
      id: `mf_${index}`,
      title: mf.name,
      subtitle: mf.category,
      tags: [mf.riskometer, mf.suitableHorizon],
      dataSource: 'Illustrative Demo Data',
      categoryGroupId: categoryId,
      type: 'mutual_fund',
      details: {
        ...mf,
        investmentMechanism: 'SIP / Lumpsum',
        diversification: 'Diversified Portfolio',
        sourceType: 'educational'
      }
    }));
  }

  if (categoryId === 'stocks_direct') {
    return demoData.stocks.map((stock, index) => ({
      id: `stock_${index}`,
      title: stock.company,
      subtitle: `Symbol: ${stock.symbol}`,
      tags: [stock.sector, `Risk: ${stock.risk}`],
      dataSource: 'Illustrative Demo Data',
      categoryGroupId: categoryId,
      type: 'stock',
      details: {
        ...stock,
        sourceType: 'educational'
      }
    }));
  }

  if (categoryId === 'etf_index') {
    return demoData.etfs.map((etf, index) => ({
      id: `etf_${index}`,
      title: etf.name,
      subtitle: etf.category,
      tags: [`Tracks: ${etf.underlying}`, `Liquidity: ${etf.liquidity}`],
      dataSource: 'Illustrative Demo Data',
      categoryGroupId: categoryId,
      type: 'etf',
      details: {
        ...etf,
        sourceType: 'educational'
      }
    }));
  }

  // Fallback for Fixed Income / Liquid Funds if not present in demo data
  if (categoryId === 'fixed_income' || categoryId === 'liquid_funds') {
    return [{
      id: `${categoryId}_demo`,
      title: 'Illustrative Example Product',
      subtitle: 'Generic Representation',
      tags: ['Low Risk', 'Predictable'],
      dataSource: 'Illustrative Demo Data',
      categoryGroupId: categoryId,
      type: 'fixed_income',
      details: {
        category: categoryId,
        riskCharacteristics: 'Low',
        returnMechanism: 'Fixed / Predictable',
        sourceType: 'educational'
      }
    }];
  }

  return [];
};
