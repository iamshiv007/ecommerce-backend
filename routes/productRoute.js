const express = require('express')
const { createProduct, getAdminProducts, getAllProducts, updateProduct, deleteProduct, getProductDetails, createProductReview, getProductReviews, deleteReview } = require('../controllers/productController')
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth')
const router = express.Router()

router.route('/products').get(getAllProducts)
router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles("Admin"), getAdminProducts)
router.route('/admin/product/new').post(isAuthenticatedUser, authorizeRoles("Admin"), createProduct)
router.route('/admin/product/:id').put(isAuthenticatedUser, authorizeRoles("Admin"), updateProduct).delete(isAuthenticatedUser, authorizeRoles("Admin"), deleteProduct)
router.route('/product/:id').get(getProductDetails)
router.route('/review').put(isAuthenticatedUser, createProductReview).delete(isAuthenticatedUser, deleteReview)
router.route('/reviews').get(getProductReviews)

module.exports = router