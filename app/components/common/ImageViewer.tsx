import React, {useState} from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import FastImage, {FastImageProps} from 'react-native-fast-image'
import EnhancedImageViewing from 'react-native-image-viewing'
import {Icon} from 'react-native-paper'
import COLORS from '../../constants/color'
import {useAppSelector} from '../../store/reduxHooks'
import {downloadUrl} from '../../utils/file'

interface ImageSource {
  uri: string
}

interface propTypes {
  images: ImageSource[]
  imageProps?: FastImageProps
  index?: number
  setIndex?: (number: number) => void
  useDownload?: boolean
  style?: StyleProp<ViewStyle>
}

export default function ImageViewer({
  images,
  index = 0,
  imageProps,
  setIndex,
  useDownload = true,
  style,
}: propTypes) {
  const [visible, setVisible] = useState(false)
  const {data: userInfo} = useAppSelector(state => state.user)
  if (!images?.[0]?.uri) return null

  const handleDownload = (idx: number) => {
    const fileUrl = images?.[idx]?.uri
    downloadUrl(fileUrl)
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={[style]}
        activeOpacity={0.5}>
        <FastImage
          {...imageProps}
          source={{uri: images[0].uri}}
          resizeMode={FastImage.resizeMode.cover}
        />
      </TouchableOpacity>
      <EnhancedImageViewing
        images={images}
        imageIndex={index}
        visible={visible}
        onRequestClose={() => setVisible(false)}
        HeaderComponent={({imageIndex}) => {
          return (
            <View style={styles.header}>
              {useDownload && (
                <TouchableOpacity onPress={() => handleDownload(imageIndex)}>
                  <Icon source="arrow-collapse-down" size={20} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.closeBtn}>
                <Icon source="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  downloadBtn: {
    color: COLORS.onPrimary,
    // position: 'absolute',
    // bottom: 40,
    // alignSelf: 'center',
    // paddingHorizontal: 16,
    // paddingVertical: 10,
    // borderRadius: 24,
    // backgroundColor: 'rgba(0,0,0,0.7)',
  },
  closeBtn: {},
  downloadText: {
    color: '#fff',
    fontSize: 14,
  },
})
