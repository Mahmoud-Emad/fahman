/// <reference types="nativewind/types" />

import "react-native";

declare module "react-native" {
  interface PressableProps {
    /** Delay in ms before onPressIn is called */
    delayPressIn?: number;
    /** Delay in ms before onPressOut is called */
    delayPressOut?: number;
    /** Delay in ms before onLongPress is called */
    delayLongPress?: number;
    /** NativeWind className */
    className?: string;
  }
}
