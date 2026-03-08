// src/screens/ExpiryScreen.js
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, Platform, KeyboardAvoidingView,
} from "react-native";
import { useGroceryStore, uid } from "../store/groceryStore";
import { colors, CATEGORY_ICONS, spacing, radius, font } from "../utils/theme";

// ─── Helpers ────────────────────────────────────────────────
function daysUntil(dateString) {
  const today = new Date(); today.setHours(0,0,0,0);
  const exp   = new Date(dateString); exp.setHours(0,0,0,0);
  return Math.round((exp - today) / 86400000);
}

function statusForDays(days) {
  if (days < 0)  return { label: "Expired",      color: "#7f1d1d", textColor: "#fca5a5", icon: "💀" };
  if (days === 0) return { label: "Expires today", color: "#7c2d12", textColor: "#fdba74", icon: "⚠️" };
  if (days <= 3)  return { label: `${days}d left`, color: "#713f12", textColor: "#fde68a", icon: "🔴" };
  if (days <= 7)  return { label: `${days}d left`, color: "#166534", textColor: "#86efac", icon: "🟡" };
  return            { label: `${days}d left`, color: "#164e63", textColor: "#7dd3fc", icon: "🟢" };
}

function toInputDate(date) {
  // YYYY-MM-DD
  return date.toISOString().split("T")[0];
}

// ─── Component ──────────────────────────────────────────────
export default function ExpiryScreen() {
  const { state, dispatch } = useGroceryStore();
  const { expiryItems, pantryItems } = state;
  const [modalVisible, setModalVisible]  = useState(false);
  const [itemName, setItemName]          = useState("");
  const [expiryDate, setExpiryDate]      = useState(toInputDate(new Date()));
  const [notes, setNotes]                = useState("");
  const [filter, setFilter]              = useState("all");   // all | expiring | expired

  // Recalc daysLeft daily
  const items = expiryItems
    .map((i) => ({ ...i, daysLeft: daysUntil(i.expiryDate) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const filtered = items.filter((i) => {
    if (filter === "expired")  return i.daysLeft < 0;
    if (filter === "expiring") return i.daysLeft >= 0 && i.daysLeft <= 7;
    return true;
  });

  const expiredCount  = items.filter(i => i.daysLeft < 0).length;
  const expiringCount = items.filter(i => i.daysLeft >= 0 && i.daysLeft <= 7).length;

  const addItem = () => {
    if (!itemName.trim()) return;
    dispatch({
      type: "ADD_EXPIRY_ITEM",
      payload: {
        id: uid(),
        name: itemName.trim(),
        expiryDate,
        notes: notes.trim(),
        addedAt: new Date().toISOString(),
      },
    });
    setItemName(""); setNotes("");
    setExpiryDate(toInputDate(new Date()));
    setModalVisible(false);
  };

  const removeItem = (id) => {
    Alert.alert("Remove item", "Remove this expiry tracker?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => dispatch({ type: "REMOVE_EXPIRY_ITEM", payload: id }) },
    ]);
  };

  // Quick-add from pantry items
  const quickAddFromPantry = () => {
    if (!pantryItems.length) { Alert.alert("Pantry empty", "Scan some groceries first."); return; }
    pantryItems.forEach((p) => {
      const already = expiryItems.some(e => e.name.toLowerCase() === p.name.toLowerCase());
      if (!already) {
        // Default expiry: 7 days from now
        const exp = new Date(); exp.setDate(exp.getDate() + 7);
        dispatch({
          type: "ADD_EXPIRY_ITEM",
          payload: { id: uid(), name: p.name, expiryDate: toInputDate(exp), notes: "", addedAt: new Date().toISOString() },
        });
      }
    });
    Alert.alert("Done", "Items imported with a default 7-day expiry. Tap each to edit.");
  };

  const renderItem = ({ item }) => {
    const st = statusForDays(item.daysLeft);
    return (
      <TouchableOpacity style={s.card} onLongPress={() => removeItem(item.id)} activeOpacity={0.8}>
        <View style={[s.statusBar, { backgroundColor: st.color }]} />
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <Text style={s.cardName}>{item.name}</Text>
            <View style={[s.pill, { backgroundColor: st.color + "60" }]}>
              <Text style={[s.pillText, { color: st.textColor }]}>{st.icon} {st.label}</Text>
            </View>
          </View>
          <Text style={s.cardDate}>Expires: {new Date(item.expiryDate).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}</Text>
          {item.notes ? <Text style={s.cardNotes}>{item.notes}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Expiry Tracker</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={s.addBtnText}>+ Track</Text>
        </TouchableOpacity>
      </View>

      {/* Alert banner */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <View style={s.alertBanner}>
          {expiredCount > 0 && <Text style={s.alertText}>💀 {expiredCount} expired</Text>}
          {expiringCount > 0 && <Text style={s.alertText}>⚠️ {expiringCount} expiring soon</Text>}
        </View>
      )}

      {/* Filter tabs */}
      <View style={s.filterRow}>
        {["all","expiring","expired"].map((f) => (
          <TouchableOpacity key={f} style={[s.filterTab, filter===f && s.filterTabOn]} onPress={() => setFilter(f)}>
            <Text style={[s.filterTabText, filter===f && s.filterTabTextOn]}>
              {f === "all" ? "All" : f === "expiring" ? "⚠️ Soon" : "💀 Expired"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyTitle}>{filter === "all" ? "Nothing tracked yet" : "None in this category"}</Text>
          <Text style={s.emptyText}>Track expiry dates to get notified before food goes bad</Text>
          {filter === "all" && (
            <TouchableOpacity style={s.importBtn} onPress={quickAddFromPantry}>
              <Text style={s.importBtnText}>📦 Import from Pantry</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Text style={s.hint}>Long-press an item to remove it</Text>
          }
        />
      )}

      {/* Add modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Track Expiry Date</Text>

            <Text style={s.label}>Item name</Text>
            <TextInput
              style={s.input} value={itemName} onChangeText={setItemName}
              placeholder="e.g. Yoghurt" placeholderTextColor={colors.muted} autoFocus
            />

            <Text style={s.label}>Expiry date (YYYY-MM-DD)</Text>
            <TextInput
              style={s.input} value={expiryDate} onChangeText={setExpiryDate}
              placeholder="2024-12-31" placeholderTextColor={colors.muted}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={s.label}>Notes (optional)</Text>
            <TextInput
              style={[s.input, { height: 70, textAlignVertical: "top" }]}
              value={notes} onChangeText={setNotes}
              placeholder="e.g. Opened, store in fridge" placeholderTextColor={colors.muted}
              multiline
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={addItem}>
                <Text style={s.confirmBtnText}>Add Tracker</Text>
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
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md },
  title:     { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text },
  addBtn:    { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: colors.accent },
  addBtnText:{ color: "#fff", fontSize: font.size.sm, fontWeight: font.weight.bold },

  alertBanner: { marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: spacing.sm, backgroundColor: "#7f1d1d30", borderRadius: radius.md, flexDirection: "row", gap: spacing.md, borderWidth: 1, borderColor: "#7f1d1d60" },
  alertText:   { color: "#fca5a5", fontSize: font.size.xs, fontWeight: font.weight.bold },

  filterRow:     { flexDirection: "row", paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  filterTab:     { flex: 1, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  filterTabOn:   { backgroundColor: colors.accent, borderColor: colors.accent },
  filterTabText: { color: colors.muted, fontSize: font.size.xs, fontWeight: font.weight.medium },
  filterTabTextOn:{ color: "#fff" },

  card:     { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.sm, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  statusBar:{ width: 4 },
  cardBody: { flex: 1, padding: spacing.sm + 4 },
  cardTop:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  cardName: { flex: 1, color: colors.text, fontSize: font.size.md, fontWeight: font.weight.bold },
  pill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  pillText: { fontSize: font.size.xs, fontWeight: font.weight.bold },
  cardDate: { color: colors.muted, fontSize: font.size.xs },
  cardNotes:{ color: colors.muted, fontSize: font.size.xs, marginTop: 3, fontStyle: "italic" },

  hint:    { textAlign: "center", color: colors.border, fontSize: font.size.xs, marginTop: spacing.sm },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyIcon:  { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text, marginBottom: 4 },
  emptyText:  { color: colors.muted, fontSize: font.size.sm, textAlign: "center" },
  importBtn:  { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  importBtnText:{ color: colors.text, fontSize: font.size.sm },

  modalOverlay:  { flex: 1, justifyContent: "flex-end", backgroundColor: "#00000080" },
  modalSheet:    { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  modalTitle:    { fontSize: font.size.lg, fontWeight: font.weight.black, color: colors.text, marginBottom: spacing.md },
  label:         { color: colors.muted, fontSize: font.size.xs, fontWeight: font.weight.bold, letterSpacing: 1.2, marginBottom: 4, marginTop: spacing.sm },
  input:         { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm + 4, color: colors.text, fontSize: font.size.md },
  modalActions:  { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn:     { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cancelBtnText: { color: colors.muted },
  confirmBtn:    { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: "center" },
  confirmBtnText:{ color: "#fff", fontWeight: font.weight.bold },
});
