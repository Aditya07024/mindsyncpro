import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Star,
  Download,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Tag,
  Lock,
  Eye,
  FileText,
  Sparkles,
  Maximize2,
  CheckCircle2,
} from "lucide-react";
import API from "@/lib/api";
import { openDigitalProductCheckout } from "@/lib/razorpay";

export const DigitalProductShopSection: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isPurchased, setIsPurchased] = useState<boolean>(false);
  const [purchaseToken, setPurchaseToken] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

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

  const handleOpenProduct = (product: any) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    setIsPurchased(false);
    setPurchaseToken(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  const handleCompleteCheckout = async () => {
    if (!selectedProduct) return;
    try {
      setIsBuying(true);
      await openDigitalProductCheckout({
        productTitle: selectedProduct.title,
        price: selectedProduct.price,
        onSuccess: async () => {
          try {
            const res = await API.digitalProducts.purchaseProduct(selectedProduct._id);
            if (res.success) {
              setPurchaseToken(res.purchaseToken);
              // Fetch secure PDF blob URL for guaranteed iframe rendering
              try {
                const secureUrl = API.digitalProducts.getSecurePdfUrl(selectedProduct._id, res.purchaseToken);
                const pdfRes = await fetch(secureUrl);
                if (pdfRes.ok) {
                  const blob = await pdfRes.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  setPdfBlobUrl(blobUrl);
                }
              } catch (e) {
                console.error("PDF blob fetch failed:", e);
              }
              setIsPurchased(true);
            }
          } catch (err: any) {
            alert(err.message || "Purchase verification failed");
          } finally {
            setIsBuying(false);
          }
        },
        onCancel: () => {
          setIsBuying(false);
        },
      });
    } catch (err: any) {
      alert(err.message || "Payment initialization failed");
      setIsBuying(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedProduct || !purchaseToken) return;
    try {
      if (pdfBlobUrl) {
        const a = document.createElement("a");
        a.href = pdfBlobUrl;
        a.download = `${selectedProduct.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      const url = API.digitalProducts.getSecurePdfUrl(selectedProduct._id, purchaseToken);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Payment verification failed or access denied.");
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${selectedProduct.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err.message || "Download failed");
    }
  };

  // Helper to extract product gallery images (NO hardcoded demo fallbacks)
  const getProductGallery = (product: any) => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    if (product.imageUrl) {
      return [product.imageUrl];
    }
    return [];
  };

  // Helper for "What's inside" bullet points (NO demo fallback list if empty)
  const getWhatsInsideList = (product: any) => {
    if (product.whatsInside && Array.isArray(product.whatsInside) && product.whatsInside.length > 0) {
      return product.whatsInside;
    }
    return [];
  };

  // Clean description helper to avoid repeating "What's inside..." prose text
  const getCleanDescription = (product: any) => {
    if (!product || !product.description) return "";
    const desc = product.description;
    const insideIdx = desc.indexOf("What's inside");
    if (insideIdx !== -1 && getWhatsInsideList(product).length > 0) {
      return desc.substring(0, insideIdx).trim();
    }
    return desc;
  };

  return (
    <section
      id="digital-shop"
      className="mt-24 relative overflow-hidden rounded-[40px] border border-teal-100 bg-gradient-to-b from-[#f4fbf9] via-white to-[#edf8f5] px-6 py-20 text-slate-900 shadow-lg sm:px-10 lg:px-16"
    >
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
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {isLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-96 rounded-3xl bg-slate-200/60 animate-pulse" />)
          ) : products.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 font-medium">
              No digital products found in this category.
            </div>
          ) : (
            products.map((product: any, idx: number) => {
              const gallery = getProductGallery(product);
              return (
                <motion.div
                  key={product._id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[36px] border border-teal-100/90 bg-white p-6 sm:p-7 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-teal-300 hover:shadow-2xl cursor-pointer"
                  onClick={() => handleOpenProduct(product)}
                >
                  <div>
                    {/* Thumbnail Display Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-100 flex items-center justify-center border border-teal-100/60">
                      {gallery.length > 0 ? (
                        <img
                          src={gallery[0]}
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center text-teal-800 space-y-1">
                          <FileText className="size-10 text-teal-600 opacity-70" />
                          <span className="text-xs font-bold text-teal-950">{product.title}</span>
                          <span className="text-[10px] text-teal-700">{product.pageCount || "Digital PDF Product"}</span>
                        </div>
                      )}
                      {product.isFeatured && (
                        <span className="absolute top-3 left-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[10px] font-bold text-white shadow-md">
                          Best Seller
                        </span>
                      )}
                      <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-teal-800 shadow-sm backdrop-blur">
                        {product.tags?.[0] || product.category?.toUpperCase() || "DIGITAL"}
                      </span>

                      {/* Multi-Photo Count Indicator */}
                      {gallery.length > 1 && (
                        <span className="absolute bottom-3 right-3 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur flex items-center gap-1">
                          <Eye className="size-3" /> {gallery.length} Photos
                        </span>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="size-3.5 fill-amber-400" />
                          <span>{product.rating || 4.9}</span>
                        </div>
                        <span>{product.salesCount || 500}+ Downloads</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2">
                        {product.title}
                      </h3>

                      <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">
                        {getCleanDescription(product)}
                      </p>
                    </div>
                  </div>

                  {/* Pricing & Buy CTA */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xl font-extrabold text-[#004038]">₹{product.price}</span>
                      {product.originalPrice > product.price && (
                        <span className="ml-2 text-xs text-slate-400 line-through">₹{product.originalPrice}</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenProduct(product)}
                      className="rounded-2xl bg-[#004038] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#002f29] hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      View & Buy <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* AMAZON-STYLE PRODUCT & CHECKOUT MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.96, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-7xl bg-white rounded-[36px] p-6 sm:p-10 lg:p-12 shadow-2xl space-y-6 relative overflow-hidden my-auto max-h-[95vh] overflow-y-auto border border-teal-100"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-20 p-2.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="size-6" />
              </button>

              {!isPurchased ? (
                /* AMAZON 3-COLUMN PRODUCT VIEW & CHECKOUT FORMAT */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pt-2">
                  {/* LEFT COLUMN: MULTI-PHOTO GALLERY (5 Cols) */}
                  <div className="lg:col-span-5 flex flex-col-reverse sm:flex-row gap-4 items-start">
                    {getProductGallery(selectedProduct).length > 0 ? (
                      <>
                        {/* Vertical Thumbnails List */}
                        {getProductGallery(selectedProduct).length > 1 && (
                          <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-96 w-full sm:w-20 shrink-0 py-1">
                            {getProductGallery(selectedProduct).map((imgUrl: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedImageIndex(idx)}
                                className={`relative aspect-square w-16 sm:w-full rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                  selectedImageIndex === idx
                                    ? "border-[#004038] ring-2 ring-[#004038]/30 scale-105"
                                    : "border-slate-200 opacity-70 hover:opacity-100"
                                }`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Preview ${idx + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Main High-Res Preview Image Box */}
                        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner group">
                          <img
                            src={
                              getProductGallery(selectedProduct)[selectedImageIndex] ||
                              getProductGallery(selectedProduct)[0]
                            }
                            alt={selectedProduct.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute top-3 left-3 bg-slate-900/80 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur">
                            {selectedProduct.pageCount || "32 Pages Printable PDF"}
                          </span>
                          <button
                            onClick={() =>
                              setZoomImage(
                                getProductGallery(selectedProduct)[selectedImageIndex] ||
                                  getProductGallery(selectedProduct)[0]
                              )
                            }
                            className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white shadow-md transition flex items-center gap-1 text-xs font-semibold backdrop-blur cursor-pointer"
                          >
                            <Maximize2 className="size-3.5" /> Expand
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Placeholder when no image is uploaded */
                      <div className="aspect-[3/4] w-full rounded-3xl bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-100 border border-teal-200 flex flex-col items-center justify-center p-8 text-center text-teal-950 shadow-inner space-y-3">
                        <FileText className="size-20 text-teal-600/80" />
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xl">{selectedProduct.title}</h4>
                          <p className="text-xs text-teal-800 font-medium">
                            {selectedProduct.pageCount || "32 Pages Printable PDF"}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-teal-700 bg-white/80 px-3 py-1 rounded-full border border-teal-200 shadow-sm">
                          Instant Digital Download
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CENTER COLUMN: PRODUCT DETAILS & INCLUDES (4 Cols) */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Category & Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/80">
                        {selectedProduct.category || "WORKBOOK"}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Star className="size-3 fill-amber-400" />
                        <span>{selectedProduct.rating || 4.9}</span>
                        <span className="text-slate-400 font-normal ml-0.5">(520+ ratings)</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                      {selectedProduct.title}
                    </h2>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-3 pt-1 border-b border-slate-100 pb-3">
                      <span className="text-3xl font-black text-[#004038]">₹{selectedProduct.price}</span>
                      {selectedProduct.originalPrice > selectedProduct.price && (
                        <>
                          <span className="text-sm text-slate-400 line-through">₹{selectedProduct.originalPrice}</span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Save 50% OFF
                          </span>
                        </>
                      )}
                    </div>

                    {/* DESCRIPTION & INCLUDES SECTION */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                        <FileText className="size-4 text-teal-600" /> DESCRIPTION & INCLUDES
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        {getCleanDescription(selectedProduct)}
                      </p>

                      {getWhatsInsideList(selectedProduct).length > 0 && (
                        <div className="rounded-2xl bg-teal-50/60 p-4 border border-teal-100 space-y-2">
                          <h5 className="text-xs font-extrabold text-teal-950">
                            What's inside ({selectedProduct.pageCount || "32 pages"}):
                          </h5>
                          <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                            {getWhatsInsideList(selectedProduct).map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-teal-600 font-bold shrink-0">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Trust Highlights */}
                    <div className="space-y-2 pt-2 text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span>Instant PDF / MP3 Digital Download</span>
                      </div>
                      <div className="flex items-center gap-2 text-teal-800">
                        <ShieldCheck className="size-4 text-teal-600 shrink-0" />
                        <span>100% Verified Psychologically Guided Content</span>
                      </div>
                      <div className="flex items-center gap-2 text-indigo-800">
                        <Tag className="size-4 text-indigo-600 shrink-0" />
                        <span>Lifetime Access on All Devices</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: AMAZON BUY BOX & CHECKOUT (3 Cols) */}
                  <div className="lg:col-span-3 bg-gradient-to-b from-slate-50 to-teal-50/30 p-6 rounded-3xl border border-teal-100 shadow-lg space-y-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase">Checkout Price</span>
                        <span className="text-2xl font-black text-[#004038]">₹{selectedProduct.price}</span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between font-medium">
                          <span>Delivery</span>
                          <span className="font-bold text-emerald-700">Instant PDF Download</span>
                        </div>
                        <div className="flex items-center justify-between font-medium">
                          <span>Format</span>
                          <span className="font-bold text-slate-800">Printable PDF / Digital</span>
                        </div>
                        <div className="flex items-center justify-between font-medium">
                          <span>Security</span>
                          <span className="font-bold text-teal-700 flex items-center gap-1">
                            <Lock className="size-3" /> SSL Encrypted
                          </span>
                        </div>
                      </div>

                      {/* Security Notice */}
                      <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                        <Lock className="size-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          PDF is encrypted & instantly delivered upon completing payment.
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={handleCompleteCheckout}
                        disabled={isBuying}
                        className="w-full rounded-2xl bg-[#004038] py-3.5 px-4 text-sm font-extrabold text-white shadow-xl hover:bg-[#002f29] hover:scale-[1.02] active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 border border-teal-600"
                      >
                        {isBuying ? (
                          <span className="animate-pulse">Opening Payment Gateway...</span>
                        ) : (
                          <>
                            Complete Checkout ₹{selectedProduct.price}
                            <ArrowRight className="size-4" />
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="w-full rounded-2xl border border-slate-300 py-3 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* POST-PAYMENT UNLOCKED VIEW WITH SECURE PDF READER & DOWNLOAD */
                <div className="py-4 space-y-6 text-center">
                  <div className="mx-auto size-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl shadow-inner border border-emerald-200 animate-bounce">
                    ✓
                  </div>

                  <div className="space-y-2 max-w-xl mx-auto">
                    <h3 className="font-black text-3xl text-slate-900">Payment Successful! 🎉</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Thank you for purchasing <strong>{selectedProduct.title}</strong>. Your psychologist-guided PDF workbook is unlocked and ready for instant viewing and download below.
                    </p>
                  </div>

                  {/* Integrated Secure PDF Reader Box */}
                  <div className="rounded-2xl border border-slate-300 bg-slate-900 overflow-hidden shadow-2xl h-[540px] relative">
                    {pdfBlobUrl ? (
                      <iframe
                        src={pdfBlobUrl}
                        title="Secure PDF Reader"
                        className="w-full h-full border-none bg-white"
                      />
                    ) : (
                      <iframe
                        src={API.digitalProducts.getSecurePdfUrl(selectedProduct._id, purchaseToken!)}
                        title="Secure PDF Reader"
                        className="w-full h-full border-none bg-white"
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={handleDownloadPdf}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-extrabold text-white shadow-xl hover:bg-emerald-700 hover:scale-105 transition cursor-pointer"
                    >
                      <Download className="size-5" /> Download PDF Now
                    </button>

                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={zoomImage}
                alt="Zoomed product page"
                className="max-h-[85vh] w-auto rounded-2xl object-contain shadow-2xl"
              />
              <button
                onClick={() => setZoomImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition cursor-pointer"
              >
                <X className="size-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
