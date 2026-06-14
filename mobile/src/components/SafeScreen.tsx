import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";
import { COLORS } from "../config";

export function SafeScreen({
  children,
  edges = ["top", "left", "right"],
}: {
  children: ReactNode;
  edges?: Edge[];
}) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}
