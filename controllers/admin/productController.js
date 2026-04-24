// File controllers/admin/productController.js: điều phối handler admin cho module productController.
const legacy = require('./legacy');

// Xử lý sản phẩm, ảnh sản phẩm và biến thể trong trang quản trị.
module.exports = {
    getProducts: legacy.getProducts,
    downloadProductImportTemplate: legacy.downloadProductImportTemplate,
    exportProducts: legacy.exportProducts,
    importProducts: legacy.importProducts,
    createProduct: legacy.createProduct,
    updateProduct: legacy.updateProduct,
    deleteProduct: legacy.deleteProduct,
    deleteAllProducts: legacy.deleteAllProducts,
    getProductImages: legacy.getProductImages,
    addProductImageUrl: legacy.addProductImageUrl,
    uploadProductImage: legacy.uploadProductImage,
    deleteProductImage: legacy.deleteProductImage,
    setPrimaryImage: legacy.setPrimaryImage,
    getProductVariants: legacy.getProductVariants,
    addProductVariant: legacy.addProductVariant,
    deleteProductVariant: legacy.deleteProductVariant
};
