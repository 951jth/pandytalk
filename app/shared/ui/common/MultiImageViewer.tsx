import React, {useMemo, useState} from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import FastImage from 'react-native-fast-image'
import EnhancedImageViewing from 'react-native-image-viewing'
import {Icon, Text} from 'react-native-paper'
import {downloadUrl} from '../../utils/file'

interface propTypes {
  images: string[]
  useDownload?: boolean
  maxWidth?: number
}

export default function MultiImageViewer({
  images,
  useDownload = true,
  maxWidth = 200,
}: propTypes) {
  const [visible, setVisible] = useState(false)
  const [index, setIndex] = useState(0)
  const {width: windowWidth} = useWindowDimensions()

  // useMemo를 사용하여 이미지 소스 배열의 참조값을 고정함 (깜빡임 방지 핵심)
  // 훅은 반드시 모든 리턴문보다 위에 있어야 합니다.
  const imageSources = useMemo(() => images.map(uri => ({uri})), [images])

  if (!images || images.length === 0) return null

  const handleOpen = (idx: number) => {
    setIndex(idx)
    setVisible(true)
  }

  const handleDownload = (idx: number) => {
    const fileUrl = images[idx]
    downloadUrl(fileUrl)
  }

  // 그리드 레이아웃 계산
  const renderGrid = () => {
    const count = images.length
    if (count === 1) {
      return (
        <TouchableOpacity onPress={() => handleOpen(0)} activeOpacity={0.8}>
          <FastImage
            source={{uri: images[0]}}
            style={[styles.singleImage, {width: maxWidth, height: maxWidth}]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )
    }

    const gap = 4
    const size = (maxWidth - gap) / 2

    return (
      <View style={[styles.grid, {width: maxWidth}]}>
        {images.slice(0, 4).map((uri, idx) => {
          const isLast = idx === 3 && count > 4
          return (
            <TouchableOpacity
              key={uri + idx}
              onPress={() => handleOpen(idx)}
              activeOpacity={0.8}
              style={{width: size, height: size, marginBottom: gap}}>
              <FastImage
                source={{uri}}
                style={styles.gridImage}
                resizeMode="cover"
              />
              {isLast && (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>+{count - 4}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  return (
    <>
      {renderGrid()}
      <EnhancedImageViewing
        images={imageSources}
        imageIndex={index}
        visible={visible}
        onImageIndexChange={setIndex}
        onRequestClose={() => setVisible(false)}
        HeaderComponent={({imageIndex}) => (
          <View style={styles.header}>
            {useDownload && (
              <TouchableOpacity onPress={() => handleDownload(imageIndex)}>
                <Icon source="arrow-collapse-down" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeBtn}>
              <Icon source="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        FooterComponent={
          images.length > 1
            ? () => (
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    {index + 1} / {images.length}
                  </Text>
                </View>
              )
            : undefined
        }
      />

      {/* 전체 화면 내비게이션 화살표 (고정 오버레이) */}
      {visible && images.length > 1 && (
        <View style={styles.navOverlay} pointerEvents="box-none">
          {index > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.leftButton]}
              onPress={() => setIndex(index - 1)}>
              <Icon source="chevron-left" size={40} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
          {index < images.length - 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.rightButton]}
              onPress={() => setIndex(index + 1)}>
              <Icon source="chevron-right" size={40} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  singleImage: {
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'BMDOHYEON',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    gap: 20,
  },
  closeBtn: {},
  footer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'BMDOHYEON',
  },
  navOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 9999, // 최상단 배치
  },
  navButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 30,
  },
  leftButton: {
    left: 10,
  },
  rightButton: {
    right: 10,
  },
})
