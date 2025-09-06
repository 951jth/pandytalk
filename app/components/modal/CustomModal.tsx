import React, {useEffect, useRef} from 'react'
import {Animated, Modal, Pressable, StyleSheet, View} from 'react-native'
import useKeyboardFocus from '../../hooks/useKeyboardFocus'

type Props = Omit<React.ComponentProps<typeof Modal>, 'visible'> & {
  open: boolean
  setOpen: (next: boolean) => void
  children?: React.ReactNode
  containerStyle?: React.ComponentProps<typeof View>['style']
}

export default function CustomModal({
  open,
  setOpen = () => {},
  children,
  containerStyle,
  ...modalProps
}: Props) {
  // 애니메이션: 배경 페이드, 컨테이너 스케일+페이드
  const backdrop = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.95)).current
  const contentOpacity = useRef(new Animated.Value(0)).current
  const {isKeyboardVisible} = useKeyboardFocus()

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 4,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [open, backdrop, scale, contentOpacity, isKeyboardVisible])

  return (
    <Modal
      transparent
      statusBarTranslucent
      visible={open}
      onRequestClose={() => setOpen(false)}
      {...modalProps}>
      {/* 배경 */}
      <Animated.View style={[styles.backdrop, {opacity: backdrop}]}>
        {/* 바깥 터치로 닫기 */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
        />
      </Animated.View>

      {/* 가운데 컨테이너 */}
      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.container,
            {transform: [{scale}], opacity: contentOpacity},
          ]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center', // 수직 가운데
    alignItems: 'center', // 수평 가운데
    padding: 20, // 가장자리 여백
  },
  container: {
    minHeight: 300, // ✅ 최소 높이 300
    width: '100%',
    maxWidth: 520, // 태블릿/대화면 대응시 적당한 최대너비
    backgroundColor: '#FFF', // ✅ 배경 흰색
    borderRadius: 16,
    padding: 8,
    // 그림자
    // elevation: 8,
    // shadowColor: '#000',
    // shadowOpacity: 0.22,
    // shadowRadius: 12,
    // shadowOffset: {width: 0, height: 6},
  },
})
