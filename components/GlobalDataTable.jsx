import React, { useEffect, useState, useMemo } from "react";
import { View, Text, Alert } from "react-native";
import { DataTable } from "react-native-paper";
import { FontAwesome6 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeContext } from "../context/ThemeProvider";

export default function GlobalDataTable({ title, columns, items, route, pressable = false }) {
  const { colors, theme } = useThemeContext();
  const itemsPerPageList = [10, 20, 30, 40, 50];
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageList[0] || 10);
  const navigation = useNavigation();

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, items.length);

  // Force re-render table and pagination when theme or itemsPerPage change
  const themeKey = useMemo(
    () => `${theme}-${itemsPerPage}-${colors.background}`,
    [theme, itemsPerPage, colors.background]
  );

  useEffect(() => {
    setPage(0);
  }, [itemsPerPage]);

  return (
    <View
      key={themeKey}
      className="my-1 rounded-2xl p-2 shadow-sm"
      style={{ backgroundColor: colors.card }}
    >
      {/* Title & Route Icon */}
      <View className="flex-row justify-between items-center mb-3">
        <Text
          className="flex-1 text-xl font-bold"
          style={{ color: colors.text }}
        >
          {title}
        </Text>
        {route && (
          <FontAwesome6
            name="arrow-right-from-bracket"
            size={20}
            color={colors.text}
            onPress={() => navigation.navigate(route)}
          />
        )}
      </View>

      {items.length === 0 ? (
        <View className="py-8 items-center justify-center">
          <Text style={{ color: colors.textSecondary }}>No records found</Text>
        </View>
      ) : (
        <DataTable key={themeKey}>
          {/* Header */}
          <DataTable.Header
            style={{
              backgroundColor: colors.card,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            {columns.map((col) => (
              <DataTable.Title
                key={col.key}
                numeric={col.numeric}
                textStyle={{
                  color: colors.text,
                  fontWeight: "700",
                  textAlign: col.numeric ? "right" : "left",
                }}
              >
                {col.label}
              </DataTable.Title>
            ))}
          </DataTable.Header>

          {/* Rows */}
          {items.slice(from, to).map((item, index) => (
            <DataTable.Row
              key={`${index}-${theme}`}
              onPress={()=> (pressable && navigation.navigate("InvoiceScreen")) }
              style={{
                backgroundColor:
                  index % 2 === 0
                    ? colors.card
                    : colors.grey ?? "#1e293b",
                    borderBottomWidth: 0,
                    borderRadius: 8,
              }}
            >
              {columns.map((col) => (
                <DataTable.Cell
                  key={col.key}
                  textStyle={{
                    color:
                      col.key === "status" && item.status === "PAID"
                        ? colors.success
                        : col.key === "status" && item.status === "CREDIT"
                        ? colors.error
                        : colors.text,
                    textAlign: col.numeric ? "right" : "left",
                  }}
                >
                  {item[col.key]}
                </DataTable.Cell>
              ))}
            </DataTable.Row>
          ))}

          {/* Pagination */}
          <DataTable.Pagination
            key={`pagination-${themeKey}`} // ✅ re-mounts dropdown when theme or itemsPerPage changes
            page={page}
            numberOfPages={Math.ceil(items.length / itemsPerPage)}
            onPageChange={setPage}
            label={`${from + 1}-${to} of ${items.length}`}
            numberOfItemsPerPageList={itemsPerPageList}
            numberOfItemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            selectPageDropdownLabel="Rows per page"
            theme={{
              colors: {
                text: colors.text,
                primary: colors.primary,
                surface: colors.card,
                backdrop: "transparent",
              },
            }}
          />
        </DataTable>
      )}
    </View>
  );
}
