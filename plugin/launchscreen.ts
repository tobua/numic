import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import glob from 'fast-glob'
import type { PluginLog } from '../types'

function hexToRgbColor(hex: string) {
  const cleanHex = hex.replace('#', '').trim()
  const r = Number.parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = Number.parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = Number.parseInt(cleanHex.substring(4, 6), 16) / 255
  return `red="${r}" green="${g}" blue="${b}" alpha="1" colorSpace="calibratedRGB"`
}

const templateApple = (
  backgroundColor: string,
  title: string,
  titleColor: string,
  subtitle: string,
  subtitleColor: string,
) => `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="23504" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina4_7" orientation="portrait" appearance="light"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="23506"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!--View Controller-->
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <label opaque="NO" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="${title}" textAlignment="center" lineBreakMode="middleTruncation" baselineAdjustment="alignBaselines" minimumFontSize="18" translatesAutoresizingMaskIntoConstraints="NO" id="GJd-Yh-RWb">
                                <rect key="frame" x="0.0" y="202" width="375" height="43"/>
                                <fontDescription key="fontDescription" type="boldSystem" pointSize="36"/>
                                <color key="textColor" ${titleColor}/>
                                <nil key="highlightedColor"/>
                            </label>
                            <label opaque="NO" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="${subtitle}" textAlignment="center" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" minimumFontSize="9" translatesAutoresizingMaskIntoConstraints="NO" id="MN2-I3-ftu">
                                <rect key="frame" x="0.0" y="626" width="375" height="21"/>
                                <fontDescription key="fontDescription" type="system" pointSize="17"/>
                                <color key="textColor" ${subtitleColor}/>
                                <nil key="highlightedColor"/>
                            </label>
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="Bcu-3y-fUS"/>
                        <color key="backgroundColor" ${backgroundColor}/>
                        <constraints>
                            <constraint firstItem="Bcu-3y-fUS" firstAttribute="bottom" secondItem="MN2-I3-ftu" secondAttribute="bottom" constant="20" id="OZV-Vh-mqD"/>
                            <constraint firstItem="Bcu-3y-fUS" firstAttribute="centerX" secondItem="GJd-Yh-RWb" secondAttribute="centerX" id="Q3B-4B-g5h"/>
                            <constraint firstItem="MN2-I3-ftu" firstAttribute="centerX" secondItem="Bcu-3y-fUS" secondAttribute="centerX" id="akx-eg-2ui"/>
                            <constraint firstItem="MN2-I3-ftu" firstAttribute="leading" secondItem="Bcu-3y-fUS" secondAttribute="leading" id="i1E-0Y-4RG"/>
                            <constraint firstItem="GJd-Yh-RWb" firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="bottom" multiplier="1/3" constant="1" id="moa-c2-u7t"/>
                            <constraint firstItem="GJd-Yh-RWb" firstAttribute="leading" secondItem="Bcu-3y-fUS" secondAttribute="leading" symbolic="YES" id="x7j-FC-K8j"/>
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="52.173913043478265" y="375"/>
        </scene>
    </scenes>
</document>`

interface Options {
  launchscreen?: { background?: string; title?: string; titleColor?: string; subtitle?: 'year' | string; subtitleColor?: string }
}

interface PluginInput {
  // Root project path.
  projectPath?: string
  // Location of /android or /ios folders, either root or inside /.numic.
  nativePath?: string
  log?: PluginLog
  options: Options
  // Currently installed React Native version.
  version?: string
  // App name.
  name: string
}

// biome-ignore lint/suspicious/noConsole: For plugin to print logs.
export default ({ nativePath = process.cwd(), log = console.log, options = { launchscreen: {} }, name }: PluginInput) => {
  const { launchscreen } = options
  if (typeof launchscreen !== 'object') {
    return
  }

  const launchScreenFilePath = glob.sync(join(nativePath, 'ios/*/LaunchScreen.storyboard'), {
    cwd: nativePath,
  })[0]

  if (!launchScreenFilePath) {
    log('LaunchScreen.storyboard file not found', 'warning')
    return
  }

  const currentYear = new Date().getFullYear().toString()
  const iOsLaunchScreen = templateApple(
    hexToRgbColor(launchscreen.background ?? '#FFFFFF'),
    launchscreen.title ?? name,
    hexToRgbColor(launchscreen.titleColor ?? '#000000'),
    (launchscreen.subtitle === 'year' ? currentYear : launchscreen.subtitle) ?? currentYear,
    hexToRgbColor(launchscreen.subtitleColor ?? '#000000'),
  )

  writeFileSync(launchScreenFilePath, iOsLaunchScreen, 'utf-8')
}
