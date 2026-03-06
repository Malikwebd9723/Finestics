import React, { useState } from "react";
import {
    ScrollView,
    Alert,
    Platform,
    View,
} from "react-native";
import Toast from "utils/Toast";
import { useThemeContext } from "context/ThemeProvider";
import { Button, Text, Card } from "react-native-paper";
import * as FileSystem from "expo-file-system/legacy";
import { PDFDocument, rgb } from "pdf-lib";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlobalDataTable from "components/GlobalDataTable";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransactionHistory() {
    const { colors } = useThemeContext();

    // Sample Data
    const [transactions] = useState([
        {
            name: "Usman",
            type: "On Time",
            amount: "$3,432.00",
            time: "03:20 PM",
            date: "13 Feb, 25 Monday",
        },
        {
            name: "Maaz",
            type: "On Time",
            amount: "$3,432.00",
            time: "03:20 PM",
            date: "13 Feb, 25 Monday",
        },
        {
            name: "Usman",
            type: "Credit",
            amount: "$3,432.00",
            time: "03:20 PM",
            date: "13 Feb, 25 Monday",
        },
        {
            name: "Maaz",
            type: "On Time",
            amount: "$3,432.00",
            time: "03:20 PM",
            date: "13 Feb, 25 Monday",
        },
        {
            name: "Usman",
            type: "Overdue",
            amount: "$3,432.00",
            time: "03:20 PM",
            date: "13 Feb, 25 Monday",
        },
    ]);

    const columns = [
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "amount", label: "Amount" },
        { key: "date", label: "Date" },
    ];

    // Toast helper
    const showToast = (msg: string) => {
        Toast.info(msg);
    };

    // PDF Download Function
    const handleDownloadStatement = async (transactions: any[]) => {
        try {
            if (!transactions || !Array.isArray(transactions)) {
                showToast("No transaction data available!");
                return;
            }

            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([595, 842]);
            const { height } = page.getSize();

            const now = new Date();
            const dateStr = `${now.getFullYear()}-${String(
                now.getMonth() + 1
            ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            const fileName = `Account_Statement_${dateStr}.pdf`;

            page.drawText(`Account Statement (${dateStr})`, {
                x: 180,
                y: height - 50,
                size: 18,
                color: rgb(0, 0, 0),
            });

            // Table headers
            page.drawText("Name", { x: 50, y: height - 90, size: 12 });
            page.drawText("Type", { x: 200, y: height - 90, size: 12 });
            page.drawText("Amount", { x: 350, y: height - 90, size: 12 });
            page.drawText("Time", { x: 470, y: height - 90, size: 12 });

            // Table rows
            let y = height - 110;
            transactions.forEach((t) => {
                page.drawText(String(t.name || "-"), { x: 50, y, size: 10 });
                page.drawText(String(t.type || "-"), { x: 200, y, size: 10 });
                page.drawText(String(t.amount || "-"), { x: 350, y, size: 10 });
                page.drawText(String(t.time || "-"), { x: 470, y, size: 10 });
                y -= 20;
            });

            const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: false });

            if (Platform.OS === "android") {
                let savedDirUri = await AsyncStorage.getItem("downloadDirUri");

                if (!savedDirUri) {
                    const permissions =
                        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

                    if (!permissions.granted) {
                        showToast("Permission denied to save file");
                        return;
                    }

                    savedDirUri = permissions.directoryUri;
                    await AsyncStorage.setItem("downloadDirUri", savedDirUri);
                    showToast("Storage permission saved!");
                }

                const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                    savedDirUri,
                    fileName,
                    "application/pdf"
                );

                await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                showToast("Statement downloaded successfully!");
                console.log("File saved at:", fileUri);
            } else {
                const fileUri = FileSystem.documentDirectory + fileName;
                await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                Alert.alert("Downloaded", `Saved to app documents:\n\n${fileUri}`);
            }
        } catch (error) {
            console.error("Error generating statement:", error);
            showToast("Failed to generate statement!");
        }
    };

    return (
        <View className="flex-1 p-2" style={{ backgroundColor: colors.background }}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Download Button */}
                <Button
                    mode="contained"
                    onPress={() => handleDownloadStatement(transactions)}
                    className="mb-4 py-1 rounded-xl"
                    icon="download-outline"
                    contentStyle={{ paddingVertical: 4 }}
                    labelStyle={{ color: "#fff", fontWeight: "600" }}
                    style={{ backgroundColor: colors.primary }}
                >
                    Download Account Statement
                </Button>

                {/* Data Table */}
                <Card
                    mode="contained"
                    className="rounded-2xl p-3"
                    style={{ backgroundColor: colors.card }}
                >
                    <GlobalDataTable pressable={true} route={""} title="Transactions" columns={columns} items={transactions} />
                </Card>
            </ScrollView>
        </View>
    );
}
