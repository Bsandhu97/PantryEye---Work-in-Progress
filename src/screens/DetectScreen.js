// src/screens/DetectScreen.js
import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, ActivityIndicator, Alert, Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { detectGroceries } from "../services/anthropicService";
import { useGroceryStore, uid } from "../store/groceryStore";
import { colors, CATEGORY_COLORS, CATEGORY_ICONS, spacing, radius, font } from "../utils/theme";

export default function DetectScreen() {
  const { dispatch } = useGroceryStore();
  const [image, setImage] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState({});   // { itemIndex: true }
  const [savedMsg, setSavedMsg] = useState(false);

  // ── Pick image ──────────────────────────────────────────────
  const pickImage = async (fromCamera) => {
    const perms = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perms.granted) {
      Alert.alert("Permission needed", "Please allow access in your device settings.");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });

    if (!result.canceled) {
      setImage(result.assets[0]);
      setResults(null);
      setSelected({});
      setSavedMsg(false);
    }
  };

  // ── Analyze ─────────────────────────────────────────────────
  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const data = await detectGroceries(base64);
      setResults(data);
      // Pre-select all items
      const allSelected = {};
      data.items.forEach((_, i) => (allSelected[i] = true));
      setSelected(allSelected);
    } catch (e) {
      Alert.alert("Detection failed", e.message || "Please try another photo.");
    }
    setLoading(false);
  };

  // ── Save to pantry ──────────────────────────────────────────
  const saveToPantry = () => {
    const toAdd = results.items
      .filter((_, i) => selected[i])
      .map((item) => ({
        id: uid(),
        name: item.name,
        category: item.category,
        quantity: item.quantity || "1",
        addedAt: new Date().toISOString(),
      }));
    if (!toAdd.length) return;
    dispatch({ type: "ADD_PANTRY_ITEMS", payload: toAdd });
    setSavedMsg(true);
  };

  // ── Group items by category ─────────────────────────────────
  const grouped = results?.items?.reduce((acc, item, idx) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ ...item, idx });
    return acc;
  }, {});

  const toggleItem = (idx) =>
    setSelected((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={s.title}>Detect Groceries</Text>
        <Text style={s.subtitle}>Take a photo or upload from your gallery</Text>

        {/* Image area */}
        {image ? (
          <Image source={{ uri: image.uri }} style={s.preview} />
        ) : (
          <View style={s.placeholder}>
            <Text style={s.placeholderIcon}>📷</Text>
            <Text style={s.placeholderText}>No image selected</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={s.row}>
          <TouchableOpacity style={s.outlineBtn} onPress={() => pickImage(true)}>
            <Text style={s.outlineBtnText}>📸  Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.outlineBtn} onPress={() => pickImage(false)}>
            <Text style={s.outlineBtnText}>🖼  Gallery</Text>
          </TouchableOpacity>
        </View>

        {image && !loading && (
          <TouchableOpacity style={s.primaryBtn} onPress={analyze}>
            <Text style={s.primaryBtnText}>✦  Detect Groceries</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={s.loadingText}>Analyzing image…</Text>
          </View>
        )}

        {/* Results */}
        {results && grouped && (
          <View style={s.results}>
            {/* Summary */}
            <View style={s.summaryBox}>
              <Text style={s.summaryLabel}>SUMMARY</Text>
              <View style={s.summaryRow}>
                <Text style={s.summaryText}>{results.summary}</Text>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{results.totalItems} items</Text>
                </View>
              </View>
            </View>

            <Text style={s.sectionHint}>Tap items to select/deselect before saving</Text>

            {/* Grouped items */}
            {Object.entries(grouped).map(([cat, items]) => (
              <View key={cat} style={s.categoryBlock}>
                <View style={[s.categoryHeader, { backgroundColor: (CATEGORY_COLORS[cat] || "#374151") + "30" }]}>
                  <Text style={s.categoryTitle}>{CATEGORY_ICONS[cat] || "📦"} {cat}</Text>
                  <Text style={s.categoryCount}>{items.length}</Text>
                </View>
                {items.map(({ idx, name, quantity, confidence }) => (
                  <TouchableOpacity
                    key={idx}
                    style={[s.itemRow, selected[idx] && s.itemRowSelected]}
                    onPress={() => toggleItem(idx)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.checkbox, selected[idx] && s.checkboxOn]}>
                      {selected[idx] && <Text style={s.checkmark}>✓</Text>}
                    </View>
                    <Text style={s.itemName}>{name}</Text>
                    <Text style={s.itemMeta}>
                      {quantity ? quantity + "  " : ""}
                      <Text style={{ color: confidence === "high" ? colors.success : confidence === "medium" ? colors.warning : colors.muted }}>
                        {confidence === "high" ? "●" : confidence === "medium" ? "◑" : "○"}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Save button */}
            {savedMsg ? (
              <View style={s.savedMsg}>
                <Text style={s.savedMsgText}>✅  {selectedCount} items added to pantry!</Text>
              </View>
            ) : (
              <TouchableOpacity style={s.saveBtn} onPress={saveToPantry}>
                <Text style={s.saveBtnText}>💾  Save {selectedCount} selected to Pantry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll:    { padding: spacing.md, paddingBottom: 40 },
  title:     { fontSize: font.size.xl, fontWeight: font.weight.black, color: colors.text, marginBottom: 4 },
  subtitle:  { fontSize: font.size.sm, color: colors.muted, marginBottom: spacing.md },

  preview:   { width: "100%", height: 240, borderRadius: radius.lg, marginBottom: spacing.md, backgroundColor: colors.surface },
  placeholder: {
    width: "100%", height: 200, borderRadius: radius.lg, borderWidth: 2,
    borderColor: colors.border, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
  placeholderIcon: { fontSize: 40, marginBottom: 8 },
  placeholderText: { color: colors.muted, fontSize: font.size.sm },

  row: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  outlineBtn: {
    flex: 1, padding: spacing.sm + 4, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: "center",
  },
  outlineBtnText: { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.medium },

  primaryBtn: {
    backgroundColor: colors.accent, padding: spacing.md,
    borderRadius: radius.md, alignItems: "center", marginVertical: spacing.sm,
  },
  primaryBtnText: { color: "#fff", fontWeight: font.weight.bold, fontSize: font.size.md },

  loadingBox: { alignItems: "center", padding: spacing.xl, gap: spacing.sm },
  loadingText: { color: colors.muted },

  results:     { marginTop: spacing.md },
  summaryBox:  { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  summaryLabel:{ fontSize: font.size.xs, color: colors.muted, letterSpacing: 1.5, fontWeight: font.weight.bold, marginBottom: 6 },
  summaryRow:  { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  summaryText: { flex: 1, color: colors.text, fontSize: font.size.sm, fontStyle: "italic" },
  badge:       { backgroundColor: colors.accentSoft, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  badgeText:   { color: "#818cf8", fontSize: font.size.xs, fontWeight: font.weight.bold },

  sectionHint: { color: colors.muted, fontSize: font.size.xs, marginBottom: spacing.sm, textAlign: "center" },

  categoryBlock:  { marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.sm + 2 },
  categoryTitle:  { color: colors.text, fontSize: font.size.sm, fontWeight: font.weight.bold },
  categoryCount:  { color: colors.muted, fontSize: font.size.xs },

  itemRow:         { flexDirection: "row", alignItems: "center", padding: spacing.sm, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  itemRowSelected: { backgroundColor: colors.accentSoft },
  checkbox:        { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  checkboxOn:      { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark:       { color: "#fff", fontSize: 12, fontWeight: font.weight.bold },
  itemName:        { flex: 1, color: colors.text, fontSize: font.size.sm },
  itemMeta:        { color: colors.muted, fontSize: font.size.xs },

  saveBtn:      { backgroundColor: "#166534", padding: spacing.md, borderRadius: radius.md, alignItems: "center", marginTop: spacing.md },
  saveBtnText:  { color: "#fff", fontWeight: font.weight.bold, fontSize: font.size.md },
  savedMsg:     { backgroundColor: "#166534" + "40", padding: spacing.md, borderRadius: radius.md, alignItems: "center", marginTop: spacing.md, borderWidth: 1, borderColor: "#166534" },
  savedMsgText: { color: colors.success, fontWeight: font.weight.bold },
});
