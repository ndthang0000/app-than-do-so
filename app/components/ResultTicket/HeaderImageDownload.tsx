import { Image, View, ViewStyle, TextStyle, ImageStyle } from "react-native"
import { Text } from "../Text"
import { useAppSelector } from "@/store"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"

const logo = require("@assets/images/app-icon-android-adaptive-foreground.png")

const REGION_LABELS: Record<string, string> = {
    south: "Miền Nam",
    central: "Miền Trung",
    north: "Miền Bắc",
}

interface Props {
    activeRegion?: "south" | "central" | "north"
}

export const HeaderImageDownload = ({ activeRegion = "south" }: Props) => {
    const dateSelected = useAppSelector((state) => state.lottery.dateSelected)
    const parsedDate = parseISO(dateSelected)

    // "Thứ Hai", "Thứ Ba", ..., "Chủ Nhật"
    const thuLabel = format(parsedDate, "EEEE", { locale: vi })
        .replace(/^\w/, (c) => c.toUpperCase())
    const dateLabel = format(parsedDate, "dd/MM/yyyy")
    const regionLabel = REGION_LABELS[activeRegion] ?? "Miền Nam"

    return (
        <View style={$container}>
            {/* Left: logo + app name */}
            <View style={$leftSection}>
                <Image source={logo} style={$logo} resizeMode="contain" />
                <View style={$textColumn}>
                    <Text text="THẦN DÒ SỐ" style={$appName} />
                    <Text text="KQSX Kiến Thiết" style={$appSubtitle} />
                </View>
            </View>

            {/* Divider */}
            <View style={$divider} />

            {/* Right: region + date */}
            <View style={$rightSection}>
                <Text text={regionLabel} style={$regionText} />
                <Text text={thuLabel} style={$dateSmall} />
                <Text text={dateLabel} style={$dateSmall} />
            </View>
        </View>
    )
}

const $container: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#C00000",
    gap: 12,
}

const $leftSection: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
}

const $logo: ImageStyle = {
    width: 48,
    height: 48,
    borderRadius: 10,
}

const $textColumn: ViewStyle = {
    flexShrink: 1,
}

const $appName: TextStyle = {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
}

const $appSubtitle: TextStyle = {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "500",
}

const $divider: ViewStyle = {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.35)",
}

const $rightSection: ViewStyle = {
    alignItems: "flex-end",
    gap: 1,
}

const $regionText: TextStyle = {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
}

const $dateSmall: TextStyle = {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "500",
}
