// screens/Vendor/Products.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';
import SearchBar from 'components/SearchBar';
import ProductsList from './components/ProductsList';
import ProductDetailModal from './components/ProductDetailModal';
import ProductFormModal from './components/ProductFormModal';

export default function Products() {
  const { colors } = useThemeContext();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Handlers
  const handleAddProduct = () => {
    setSelectedProductId(null);
    setFormModalVisible(true);
  };

  const handleViewProduct = (productId: number) => {
    setSelectedProductId(productId);
    setDetailModalVisible(true);
  };

  const handleEditProduct = (productId: number) => {
    setSelectedProductId(productId);
    setFormModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedProductId(null);
  };

  const handleCloseFormModal = () => {
    setFormModalVisible(false);
    setSelectedProductId(null);
  };

  return (
    <View className="flex-1 pt-2" style={{ backgroundColor: colors.background }}>
      {/* Search & Add Button */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddPress={handleAddProduct}
        placeholder="Search products..."
      />

      {/* Products List */}
      <ProductsList
        searchQuery={searchQuery}
        onViewProduct={handleViewProduct}
        onEditProduct={handleEditProduct}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        visible={detailModalVisible}
        productId={selectedProductId}
        onClose={handleCloseDetailModal}
        onEdit={handleEditProduct}
      />

      {/* Product Form Modal */}
      <ProductFormModal
        visible={formModalVisible}
        productId={selectedProductId}
        onClose={handleCloseFormModal}
      />
    </View>
  );
}
