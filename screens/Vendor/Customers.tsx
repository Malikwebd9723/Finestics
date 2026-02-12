// screens/Vendor/Customers.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';
import SearchBar from 'components/SearchBar';
import CustomersList from './components/CustomersList';
import CustomerDetailModal from './components/CustomerDetailModal';
import CustomerFormModal from './components/CustomerFormModal';

export default function Customers() {
  const { colors } = useThemeContext();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Handlers
  const handleAddCustomer = () => {
    setSelectedCustomerId(null);
    setFormModalVisible(true);
  };

  const handleViewCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setDetailModalVisible(true);
  };

  const handleEditCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setFormModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedCustomerId(null);
  };

  const handleCloseFormModal = () => {
    setFormModalVisible(false);
    setSelectedCustomerId(null);
  };

  return (
    <View className="flex-1 pt-2" style={{ backgroundColor: colors.background }}>
      {/* Search & Add Button */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddPress={handleAddCustomer}
        placeholder="Search customers..."
      />

      {/* Customers List */}
      <CustomersList
        searchQuery={searchQuery}
        onViewCustomer={handleViewCustomer}
        onEditCustomer={handleEditCustomer}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        visible={detailModalVisible}
        customerId={selectedCustomerId}
        onClose={handleCloseDetailModal}
        onEdit={handleEditCustomer}
      />

      {/* Customer Form Modal */}
      <CustomerFormModal
        visible={formModalVisible}
        customerId={selectedCustomerId}
        onClose={handleCloseFormModal}
      />
    </View>
  );
}
