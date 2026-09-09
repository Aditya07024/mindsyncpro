import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star, Download, Check, Sparkles, X, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import API from "@/lib/api";

const DEFAULT_CATEGORIES = [
  { id: "all", label: "All Products" },
  { id: "workbook", label: "Workbooks" },
  { id: "audio", label: "Audio Kits" },
  { id: "journal", label: "Journals & Trackers" },
  { id: "guide", label: "Guides" },
];

export const DigitalProductShopSection: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);

  const { data: configData } = useQuery({
    queryKey: ["digitalProductsConfig"],
    queryFn: () => API.digitalProducts.getConfig(),
  });

  const shopConfig = configData?.config;

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["digitalProducts"],
    queryFn: () => API.digitalProducts.list(),
  });

  const products = productsData?.products || [];

  const handleBuy = (product: any) => {
    setSelectedProduct(product);
    setIsPurchased(false);
  };

  const confirmPurchase = () => {
    setIsPurchased(true);
  };

  return (
    <section id="digital-shop" className="mt-24 relative overflow-hidden rounded-[40px] border border-teal-100 bg-gradient-to-b from-[#f4fbf9] via-white to-[#edf8f5] px-6 py-20 text-slate-900 shadow-lg sm:px-10 lg:px-16">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm">
            <ShoppingBag className="size-4 text-teal-600" />
            {shopConfig?.badgeText || "Digital E-Commerce Wellness Store"}
          </div>

          <h2 className="mt-6 font-display text-4xl font-bold leading-tight text-[#012620] sm:text-5xl">
            {shopConfig?.sectionTitle || "Digital Product Shop"}
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            {shopConfig?.sectionSubtitle ||
              "Download psychologist-curated CBT workbooks, guided meditation audio suites, emotion journals, and self-help tools instantly."}
          </p>
        </div>

        {/* Product Grid */}
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-96 rounded-3xl bg-slate-200/60 animate-pulse" />
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 font-medium">
              No digital products found in this category.
            </div>
          ) : (
            products.map((product: any, idx: number) => (
              <motion.div
                key={product._id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-teal-100/80 bg-white p-5 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-teal-300 hover:shadow-2xl"
              >
                <div>
                  {/* Image / Thumbnail Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-100">
                    <img
                      src={
                        product.imageUrl ||
                        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {product.isFeatured && (
                      <span className="absolute top-3 left-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[10px] font-bold text-white shadow-md">
                        Best Seller
                      </span>
                    )}
                    <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-teal-800 shadow-sm backdrop-blur">
                      {product.tags?.[0] || product.category?.toUpperCase() || "DIGITAL"}
                    </span>
                  </div>

                  {/* Content Details */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="size-3.5 fill-amber-400" />
                        <span>{product.rating || 5.0}</span>
                      </div>
                      <span>{product.salesCount || 100}+ Downloads</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2">
                      {product.title}
                    </h3>

                    <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Pricing & Buy CTA */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-extrabold text-[#004038]">
                      ₹{product.price}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="ml-2 text-xs text-slate-400 line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleBuy(product)}
                    className="rounded-2xl bg-[#004038] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#002f29] hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    Buy Now <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Checkout / Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="size-5" />
              </button>

              {!isPurchased ? (
                <>
                  <div className="flex gap-4 items-start">
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.title}
                      className="size-24 rounded-2xl object-cover bg-slate-100 shadow-inner"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                        {selectedProduct.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-lg">{selectedProduct.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-[#004038]">₹{selectedProduct.price}</span>
                        {selectedProduct.originalPrice > selectedProduct.price && (
                          <span className="text-xs text-slate-400 line-through">₹{selectedProduct.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description & Includes</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedProduct.description}</p>
                    <div className="space-y-2 text-xs text-slate-700 font-medium pt-2">
                      <div className="flex items-center gap-2">
                        <Check className="size-4 text-emerald-600" /> Instant PDF / MP3 Digital Download
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-teal-600" /> 100% Verified Psychologically Guided Content
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="size-4 text-indigo-600" /> Lifetime Access on All Devices
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex gap-3">
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmPurchase}
                      className="flex-1 rounded-xl bg-[#004038] py-3 text-sm font-bold text-white shadow-lg hover:bg-[#002f29] transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      Complete Checkout ₹{selectedProduct.price}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-inner">
                    ✓
                  </div>
                  <h3 className="font-bold text-2xl text-slate-900">Purchase Successful!</h3>
                  <p className="text-sm text-slate-600">
                    Thank you for buying <strong>{selectedProduct.title}</strong>. Your digital files are ready for immediate download.
                  </p>
                  <a
                    href={selectedProduct.fileUrl || "https://www.mymindtherapyfriend.com/sample-workbook.pdf"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition"
                  >
                    <Download className="size-4" /> Download Files Now
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
