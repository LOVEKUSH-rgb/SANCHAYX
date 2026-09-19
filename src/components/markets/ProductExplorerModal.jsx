import React, { useEffect, useState } from 'react';
import { X, ChevronRight, AlertTriangle, Info } from 'lucide-react';
import { getProductsByCategory } from '../../services/productCatalogService';
import { MarketProductDetails } from './MarketProductDetails';
import { ProductDetailsModal } from '../common/ProductDetailsModal';
import { ProductComparisonModal } from './ProductComparisonModal';

export const ProductExplorerModal = ({ categoryId, categoryTitle, onClose }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Comparison State
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Toggle selection
  const toggleComparison = (e, product) => {
    e.stopPropagation();
    setSelectedForComparison(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert("You can compare a maximum of 3 products at once.");
        return prev;
      }
      return [...prev, product];
    });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const data = await getProductsByCategory(categoryId);
      setProducts(data);
      setLoading(false);
    };
    if (categoryId) {
      fetchProducts();
    }
  }, [categoryId]);

  if (!categoryId) return null;

  return (
    <div className="fixed inset-0 bg-sanchay-navy-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-slate-50 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-200 bg-white flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-3xl font-black text-sanchay-navy-950 mb-2">Explore {categoryTitle}</h2>
            <p className="text-slate-600">Discover specific options within this category.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-10 h-10 border-4 border-sanchay-emerald-200 border-t-sanchay-emerald-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Educational Warning */}
              {products.length > 0 && products[0].type !== 'gov_scheme' && (
                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-xl shrink-0">
                    <Info className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">Educational Category Viewer</h4>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      The products below are <strong>illustrative examples</strong> of what exists in the Indian market. SANCHAY is an educational tool and does not provide financial advice, exact market pricing, or execution services for these assets.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sanchay-emerald-300 transition-all group flex flex-col cursor-pointer"
                  >
                    <div className="mb-4">
                      {p.dataSource === 'Illustrative Demo Data' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md mb-3">
                          <AlertTriangle className="w-3 h-3 text-slate-400" />
                          Demo Data
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sanchay-emerald-50 text-sanchay-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-sanchay-emerald-200 mb-3">
                          Verified Data
                        </span>
                      )}
                      
                      <h4 className="text-xl font-bold text-sanchay-navy-950 mb-1 leading-tight group-hover:text-sanchay-emerald-600 transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium">{p.subtitle}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto mb-5">
                      {p.tags.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg border border-slate-100">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-sanchay-emerald-600">
                        View Details <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                      
                      <button
                        onClick={(e) => toggleComparison(e, p)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                          selectedForComparison.find(sel => sel.id === p.id)
                            ? 'bg-sanchay-navy-950 text-white border-sanchay-navy-950'
                            : 'bg-white text-slate-500 border-slate-300 hover:border-sanchay-navy-950 hover:text-sanchay-navy-950'
                        }`}
                      >
                        {selectedForComparison.find(sel => sel.id === p.id) ? 'Selected' : '+ Compare'}
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Floating Comparison Bar */}
        {selectedForComparison.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 rounded-b-3xl">
            <div>
              <p className="text-sm font-bold text-sanchay-navy-950">
                {selectedForComparison.length} {selectedForComparison.length === 1 ? 'Product' : 'Products'} Selected
              </p>
              <p className="text-xs text-slate-500">Select up to 3 products to compare side-by-side.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedForComparison([])}
                className="text-sm font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setShowComparisonModal(true)}
                disabled={selectedForComparison.length < 2}
                className="px-6 py-2.5 bg-sanchay-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-sanchay-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                Compare Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modals */}
      {selectedProduct && selectedProduct.type === 'gov_scheme' && (
        <ProductDetailsModal
          scheme={selectedProduct.details}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      
      {selectedProduct && selectedProduct.type !== 'gov_scheme' && (
        <MarketProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Comparison Modal */}
      {showComparisonModal && (
        <ProductComparisonModal
          products={selectedForComparison}
          onClose={() => setShowComparisonModal(false)}
        />
      )}
    </div>
  );
};
