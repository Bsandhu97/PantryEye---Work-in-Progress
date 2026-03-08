// src/screens/PantryScreen.js
import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { useGroceryStore } from "../store/groceryStore";
import { colors, CATEGORY_ICONS, CATEGORY_COLORS, spacing, radius, font } from "../utils/theme";

export default function PantryScreen() {
  const { state, dispatch } = useGroceryStore();
  const { pantryItems } = state;

  const removeItem = (id) => dispatch({ type: "REMOVE_PANTRY_ITEM", payload: id });

  const clearAll = () => {
    if (!pantryItems.length) return;
    Alert.alert("Clear pantry", "Remove all items from the pantry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear all", style: "destructive", onPress: () => dispatch({ type: "CLEAR_PANTRY" }) },
    ]);
  };

  const grouped = pantryItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const sections = Object.entries(grouped);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Pantry</Text>
        {pantryItems.length > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={s.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {pantryItems.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🏠</Text>
          <Text style={s.emptyTitle}>Pantry is empty</Text>
          <Text style={s.emptyText}>Go to the Detect tab and scan a photo of your groceries to populate your pantry.</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={([cat]) => cat}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 80 }}
          renderItem={({ item: [cat, items] }) => (
            <View style={s.group}>
              <View style={[s.groupHeader, { backgroundColor: (CATEGORY_COLORS[cat] || "#374151") + "30" }]}>
                <Text style={s.groupTitle}>{CATEGORY_ICONS[cat] || "📦"} {cat}</Text>
                <Text style={s.groupCount}>{items.length}</Text>
              </View>
              {items.map((item) => (
                <View key={item.id} style={s.row}>
                  <View style={s.rowInfo}>
                    <Text style={s.rowName}>{item.name}</Text>
                    <Text style={s.rowSub}>qty: {item.quantity}  ·  added {new Date(item.addedAt).toLocaleDateString()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
                    <Text style={s.del}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md },
  title:     { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text },
  clearText: { color: colors.danger, fontSize: font.size.sm },

  empty:     { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle:{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: 4 },
  emptyText: { color: colors.muted, textAlign: "center", fontSize: font.size.sm, lineHeight: 20 },

  group:       { marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", padding: spacing.sm + 2 },
  groupTitle:  { color: colors.text, fontWeight: font.weight.bold, fontSize: font.size.sm },
  groupCount:  { color: colors.muted, fontSize: font.size.xs },

  row:     { flexDirection: "row", alignItems: "center", padding: spacing.sm + 2, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  rowInfo: { flex: 1 },
  rowName: { color: colors.text, fontSize: font.size.sm },
  rowSub:  { color: colors.muted, fontSize: font.size.xs, marginTop: 2 },
  del:     { color: colors.muted, fontSize: 13 },
});
