// src/screens/ShoppingListScreen.js
import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useGroceryStore, uid } from "../store/groceryStore";
import { colors, CATEGORY_ICONS, spacing, radius, font } from "../utils/theme";

const CATEGORIES = ["Produce","Meat & Seafood","Dairy","Pantry","Beverages","Bakery","Frozen","Herbs & Spices","Other"];

export default function ShoppingListScreen() {
  const { state, dispatch } = useGroceryStore();
  const { shoppingList, pantryItems } = state;

  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty]   = useState("1");
  const [itemCat, setItemCat]   = useState("Other");

  const addItem = () => {
    if (!itemName.trim()) return;
    dispatch({
      type: "ADD_TO_SHOPPING_LIST",
      payload: { id: uid(), name: itemName.trim(), quantity: itemQty.trim() || "1", category: itemCat, checked: false },
    });
    setItemName(""); setItemQty("1"); setItemCat("Other");
    setModalVisible(false);
  };

  const toggle = (id) => dispatch({ type: "TOGGLE_SHOPPING_ITEM", payload: id });
  const remove = (id) => dispatch({ type: "REMOVE_SHOPPING_ITEM", payload: id });
  const clearChecked = () => {
    const count = shoppingList.filter(i => i.checked).length;
    if (!count) return;
    Alert.alert("Clear checked", `Remove ${count} checked item${count>1?"s":""}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => dispatch({ type: "CLEAR_CHECKED" }) },
    ]);
  };

  // Add all pantry items to list quickly
  const addFromPantry = () => {
    if (!pantryItems.length) { Alert.alert("Pantry is empty", "Scan groceries first to populate your pantry."); return; }
    pantryItems.forEach((item) => {
      const already = shoppingList.some(s => s.name.toLowerCase() === item.name.toLowerCase());
      if (!already) {
        dispatch({
          type: "ADD_TO_SHOPPING_LIST",
          payload: { id: uid(), name: item.name, quantity: item.quantity || "1", category: item.category, checked: false },
        });
      }
    });
  };

  const unchecked = shoppingList.filter(i => !i.checked);
  const checked   = shoppingList.filter(i => i.checked);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[s.item, item.checked && s.itemChecked]} onPress={() => toggle(item.id)} activeOpacity={0.7}>
      <View style={[s.checkbox, item.checked && s.checkboxOn]}>
        {item.checked && <Text style={s.checkmark}>✓</Text>}
      </View>
      <View style={s.itemInfo}>
        <Text style={[s.itemName, item.checked && s.strikethrough]}>{item.name}</Text>
        <Text style={s.itemSub}>{CATEGORY_ICONS[item.category] || "📦"} {item.category}  ·  {item.quantity}</Text>
      </View>
      <TouchableOpacity onPress={() => remove(item.id)} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
        <Text style={s.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      {/* Toolbar */}
      <View style={s.toolbar}>
        <Text style={s.title}>Shopping List</Text>
        <View style={s.toolbarRight}>
          {checked.length > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={clearChecked}>
              <Text style={s.clearBtnText}>Clear checked</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statChip}><Text style={s.statNum}>{shoppingList.length}</Text><Text style={s.statLabel}>total</Text></View>
        <View style={s.statChip}><Text style={s.statNum}>{unchecked.length}</Text><Text style={s.statLabel}>remaining</Text></View>
        <View style={[s.statChip, { borderColor: colors.success + "40" }]}><Text style={[s.statNum, { color: colors.success }]}>{checked.length}</Text><Text style={s.statLabel}>done</Text></View>
      </View>

      {shoppingList.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🛒</Text>
          <Text style={s.emptyTitle}>Your list is empty</Text>
          <Text style={s.emptyText}>Add items manually or import from pantry</Text>
          <TouchableOpacity style={s.importBtn} onPress={addFromPantry}>
            <Text style={s.importBtnText}>📦 Import from Pantry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[...unchecked, ...checked]}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            pantryItems.length > 0 ? (
              <TouchableOpacity style={s.importBtn} onPress={addFromPantry}>
                <Text style={s.importBtnText}>📦 Re-import from Pantry</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* Add item modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Add Item</Text>

            <Text style={s.label}>Item name</Text>
            <TextInput
              style={s.input} value={itemName} onChangeText={setItemName}
              placeholder="e.g. Whole milk" placeholderTextColor={colors.muted}
              autoFocus
            />

            <Text style={s.label}>Quantity</Text>
            <TextInput
              style={s.input} value={itemQty} onChangeText={setItemQty}
              placeholder="e.g. 2 litres" placeholderTextColor={colors.muted}
            />

            <Text style={s.label}>Category</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[s.catChip, itemCat === cat && s.catChipOn]}
                  onPress={() => setItemCat(cat)}
                >
                  <Text style={[s.catChipText, itemCat === cat && s.catChipTextOn]}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={addItem}>
                <Text style={s.confirmBtnText}>Add to List</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  toolbar:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, paddingBottom: spacing.sm },
  title:     { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text },
  toolbarRight: { flexDirection: "row", gap: spacing.sm },
  clearBtn:  { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.full, borderWidth: 1, borderColor: colors.danger + "50" },
  clearBtnText: { color: colors.danger, fontSize: font.size.xs, fontWeight: font.weight.medium },
  addBtn:    { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: colors.accent },
  addBtnText:{ color: "#fff", fontSize: font.size.sm, fontWeight: font.weight.bold },

  statsRow:  { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  statChip:  { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, alignItems: "center" },
  statNum:   { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text },
  statLabel: { fontSize: font.size.xs, color: colors.muted },

  empty:     { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle:{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: 4 },
  emptyText: { color: colors.muted, fontSize: font.size.sm, textAlign: "center" },

  importBtn: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  importBtnText: { color: colors.text, fontSize: font.size.sm },

  item:        { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm + 4, marginBottom: spacing.sm, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  itemChecked: { opacity: 0.5 },
  checkbox:    { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  checkboxOn:  { backgroundColor: colors.success, borderColor: colors.success },
  checkmark:   { color: "#fff", fontSize: 13, fontWeight: font.weight.bold },
  itemInfo:    { flex: 1 },
  itemName:    { color: colors.text, fontSize: font.size.md, fontWeight: font.weight.medium },
  strikethrough:{ textDecorationLine: "line-through", color: colors.muted },
  itemSub:     { color: colors.muted, fontSize: font.size.xs, marginTop: 2 },
  deleteIcon:  { color: colors.muted, fontSize: 14, padding: 4 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#00000080" },
  modalSheet:   { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  modalTitle:   { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text, marginBottom: spacing.md },
  label:        { color: colors.muted, fontSize: font.size.xs, fontWeight: font.weight.bold, letterSpacing: 1.2, marginBottom: 4, marginTop: spacing.sm },
  input:        { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm + 4, color: colors.text, fontSize: font.size.md },
  catGrid:      { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  catChip:      { paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
  catChipOn:    { backgroundColor: colors.accent, borderColor: colors.accent },
  catChipText:  { color: colors.muted, fontSize: font.size.xs },
  catChipTextOn:{ color: "#fff" },
  modalActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn:    { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cancelBtnText:{ color: colors.muted },
  confirmBtn:   { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: "center" },
  confirmBtnText:{ color: "#fff", fontWeight: font.weight.bold },
});
